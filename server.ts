import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import { google } from "googleapis";
import { Readable } from "stream";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("As variáveis de ambiente do Supabase não estão configuradas.");
}

// Inicializa o Supabase com Service Role Key para ignorar RLS e ter acesso total no servidor
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(process.cwd(), "drive-credentials.json"),
  scopes: ["https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/drive"],
});
const drive = google.drive({ version: "v3", auth });
const DRIVE_ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

// Configuração do Multer para armazenar os arquivos na memória antes de processar
// Esta é a abordagem ideal para receber os arquivos no servidor e subir via Webhook/API do Google Drive
const storage = multer.memoryStorage();
const upload = multer({ storage });

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Habilita parsing de JSON para rotas normais
  app.use(express.json());

  console.log("[Server] Booting up Express server...");

  /**
   * ==========================================
   * ROTA DE CRIAÇÃO DE PARCEIRO
   * ==========================================
   */
  app.post("/api/partners", async (req, res) => {
    try {
      const { email, password, name, require_payment_proof, authorized_courses } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: "E-mail, senha e nome são obrigatórios." });
      }

      console.log(`[API /api/partners] Criando usuário no Supabase Auth para: ${email}`);
      
      // 1. Criar o usuário no Auth (bypass email confirmation)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true // Isso faz com que não precise validar e-mail
      });

      if (authError) {
        console.error("[API /api/partners] Erro ao criar usuário Auth:", authError);
        return res.status(400).json({ error: authError.message });
      }

      const userId = authData.user.id;

      // 2. Inserir na tabela partners
      console.log(`[API /api/partners] Inserindo parceiro na tabela para ID: ${userId}`);
      const { error: dbError } = await supabaseAdmin
        .from('partners')
        .insert({
          id: userId,
          name,
          require_payment_proof: require_payment_proof || false,
          authorized_courses: authorized_courses || []
        });

      if (dbError) {
        console.error("[API /api/partners] Erro ao inserir na tabela partners:", dbError);
        return res.status(400).json({ error: dbError.message });
      }

      res.status(201).json({ success: true, message: "Parceiro criado com sucesso!", userId });
    } catch (error) {
      console.error("[API /api/partners] Erro interno:", error);
      res.status(500).json({ error: "Erro interno no servidor." });
    }
  });

  /**
   * ==========================================
   * ROTA DE ATUALIZAÇÃO DE PARCEIRO
   * ==========================================
   */
  app.put("/api/partners/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { email, password, require_payment_proof, is_active } = req.body;

      console.log(`[API PUT /api/partners] Atualizando parceiro ID: ${id}`);

      // 1. Atualizar e-mail ou senha no Auth se fornecido
      if (email || password) {
        const updateData: any = {};
        if (email) {
          updateData.email = email;
          updateData.email_confirm = true; // Confirma o novo email instantaneamente
        }
        if (password) {
          updateData.password = password;
        }

        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, updateData);
        if (authError) {
          console.error("[API PUT /api/partners] Erro ao atualizar Auth:", authError);
          return res.status(400).json({ error: authError.message });
        }
      }

      // 2. Atualizar dados na tabela partners
      const dbUpdateData: any = {};
      if (require_payment_proof !== undefined) dbUpdateData.require_payment_proof = require_payment_proof;
      if (is_active !== undefined) dbUpdateData.is_active = is_active;

      if (Object.keys(dbUpdateData).length > 0) {
        const { error: dbError } = await supabaseAdmin
          .from('partners')
          .update(dbUpdateData)
          .eq('id', id);

        if (dbError) {
          console.error("[API PUT /api/partners] Erro ao atualizar DB:", dbError);
          return res.status(400).json({ error: dbError.message });
        }
      }

      res.status(200).json({ success: true, message: "Parceiro atualizado com sucesso!" });
    } catch (error) {
      console.error("[API PUT /api/partners] Erro interno:", error);
      res.status(500).json({ error: "Erro interno no servidor." });
    }
  });

  /**
   * ==========================================
   * ROTA DE UPLOAD (INTEGRAÇÃO GOOGLE DRIVE)
   * ==========================================
   * Recebe o FormData do front-end contendo os dados do aluno e os PDFs.
   */
  app.post("/api/upload", upload.any(), async (req, res) => {
    console.log("\n[API /api/upload] Rota acionada!");
    try {
      console.log("[API /api/upload] Corpo da requisição recebido (Texto):", req.body);
      const files = req.files as Express.Multer.File[];
      
      console.log(`[API /api/upload] Total de arquivos recebidos: ${files?.length || 0}`);
      
      if (files && files.length > 0) {
        files.forEach((file, index) => {
          console.log(`[API /api/upload] Arquivo ${index + 1}: ${file.fieldname} - ${file.originalname} (${file.size} bytes)`);
        });
      }

      const { student_name, student_cpf, course_type, course } = req.body;

      if (!student_name || !student_cpf || !course_type || !course) {
        console.warn("[API /api/upload] Validação falhou: Faltam dados do aluno ou curso.");
        return res.status(400).json({ error: "Nome, CPF, Tipo de Curso e Curso são obrigatórios." });
      }

      /**
       * -------------------------------------------------------------
       * INTEGRAÇÃO COM GOOGLE DRIVE
       * -------------------------------------------------------------
       */
      
      if (!DRIVE_ROOT_FOLDER_ID) {
        throw new Error("A variável de ambiente GOOGLE_DRIVE_ROOT_FOLDER_ID não está configurada.");
      }

      // 1. Criar Pasta
      const folderMetadata = {
        name: `${student_name} - ${student_cpf} - ${course}`,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [DRIVE_ROOT_FOLDER_ID]
      };
      
      console.log(`[API /api/upload] Criando pasta no Drive: ${folderMetadata.name}`);
      const folder = await drive.files.create({ 
        requestBody: folderMetadata,
        supportsAllDrives: true,
        fields: 'id' 
      });
      const folderId = folder.data.id;
      console.log(`[API /api/upload] Pasta criada com sucesso. ID: ${folderId}`);

      // 2. Upload dos Arquivos
      if (files && files.length > 0) {
        for (const file of files) {
          console.log(`[API /api/upload] Fazendo upload do arquivo: ${file.originalname}`);
          const fileMetadata = { 
            name: file.originalname, 
            parents: [folderId as string] 
          };
          const media = { 
            mimeType: file.mimetype, 
            body: Readable.from(file.buffer) 
          };
          
          await drive.files.create({ 
            requestBody: fileMetadata, 
            media,
            supportsAllDrives: true,
            fields: 'id' 
          });
          console.log(`[API /api/upload] Upload concluído: ${file.originalname}`);
        }
      }

      // 3. Salvar Solicitação no banco (Supabase) via Admin SDK
      const partner_id = req.body.partner_id;
      
      // Como 'partner_id' precisa ser um UUID válido (da tabela auth.users),
      // só faremos a inserção se for um formato válido. Em produção, isso vem do token JWT.
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (partner_id && uuidRegex.test(partner_id)) {
        console.log(`[API /api/upload] Salvando solicitação no Supabase para o parceiro: ${partner_id}`);
        const { error: dbError } = await supabaseAdmin.from('requests').insert({
          partner_id,
          student_name,
          student_cpf,
          course_type,
          course,
          status: 'Pedido Enviado',
          drive_folder_id: folderId
        });

        if (dbError) {
          console.error("[API /api/upload] Erro ao salvar no banco Supabase:", dbError);
        } else {
          console.log("[API /api/upload] Solicitação salva no Supabase com sucesso.");
        }
      } else {
        console.warn(`[API /api/upload] 'partner_id' inválido ou ausente (${partner_id}). Pulando inserção no banco de dados (o banco exige um UUID válido que referencie a tabela partners).`);
      }
      
      console.log("[API /api/upload] Processamento concluído com sucesso.");
      
      res.status(200).json({ 
        success: true, 
        message: "Arquivos recebidos e processados pelo servidor." 
      });

    } catch (error) {
      console.error("[API /api/upload] Erro interno ao processar upload:", error);
      res.status(500).json({ error: "Erro interno no servidor." });
    }
  });

  // Rota de Healthcheck
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Suporte para SPA (React Router)
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

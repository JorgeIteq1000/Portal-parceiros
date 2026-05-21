import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import multer from "multer";

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

      const { student_name, student_cpf, course_type } = req.body;

      if (!student_name || !student_cpf || !course_type) {
        console.warn("[API /api/upload] Validação falhou: Faltam dados do aluno ou curso.");
        return res.status(400).json({ error: "Nome, CPF e Tipo de Curso são obrigatórios." });
      }

      /**
       * -------------------------------------------------------------
       * TODO: INTEGRAÇÃO COM GOOGLE DRIVE OU WEBHOOK (Automate/Zapier)
       * -------------------------------------------------------------
       * Aqui você fará a integração. Passos sugeridos:
       * 
       * 1. Autenticação Google Drive API:
       *    const drive = google.drive({ version: 'v3', auth: oAuth2Client });
       * 
       * 2. Criar Pasta:
       *    const folderMetadata = {
       *      name: `${student_name} - ${student_cpf} - ${course_type}`,
       *      mimeType: 'application/vnd.google-apps.folder',
       *      parents: ['ID_DA_PASTA_RAIZ_PARCEIROS']
       *    };
       *    const folder = await drive.files.create({ resource: folderMetadata, fields: 'id' });
       * 
       * 3. Upload dos Arquivos (Iterar sobre o array `files`):
       *    Para cada arquivo:
       *    const fileMetadata = { name: file.originalname, parents: [folder.data.id] };
       *    const media = { mimeType: file.mimetype, body: Readable.from(file.buffer) };
       *    await drive.files.create({ resource: fileMetadata, media, fields: 'id' });
       * 
       * 4. Salvar Solicitação no banco (Supabase) via Admin SDK / Service Role:
       *    const { data, error } = await supabaseAdmin.from('requests').insert({
       *      partner_id: auth_user_id, // Recebido via token JWT
       *      student_name,
       *      student_cpf,
       *      course_type,
       *      status: 'Pedido Enviado',
       *      drive_folder_id: folder.data.id
       *    });
       * -------------------------------------------------------------
       */

      console.log("[API /api/upload] Processamento simulado concluído com sucesso.");
      
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

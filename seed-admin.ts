import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("As variáveis de ambiente do Supabase não estão configuradas.");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function seedAdmin() {
  const email = "admin@iteqescolas.com.br";
  const password = "Iteqescolas@2026";

  console.log(`[Seed] Criando admin: ${email}`);

  // 1. Criar usuário no Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError) {
    if (authError.message.includes("User already registered")) {
        console.log("[Seed] Usuário já registrado no Auth, buscando ID...");
        // Buscar o usuário
        const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;
        const existingAdmin = users.users.find(u => u.email === email);
        if (existingAdmin) {
            await insertIntoAdmins(existingAdmin.id, email);
        }
        return;
    }
    throw authError;
  }

  const userId = authData.user.id;
  await insertIntoAdmins(userId, email);
}

async function insertIntoAdmins(userId: string, email: string) {
    console.log(`[Seed] Inserindo na tabela admins: ${userId}`);
    const { error: dbError } = await supabaseAdmin.from("admins").upsert({
        id: userId,
        email: email
    });

    if (dbError) {
        throw dbError;
    }

    console.log("[Seed] Admin criado/atualizado com sucesso!");
}

seedAdmin().catch(console.error);

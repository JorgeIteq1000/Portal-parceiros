-- ==========================================
-- SCRIPT DE CRIAÇÃO - SUPABASE (POSTGRESQL)
-- ==========================================

-- 1. Criação da Tabela de Parceiros (Partners)
CREATE TABLE public.partners (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  require_payment_proof BOOLEAN DEFAULT false,
  authorized_courses TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Criação da Tabela de Solicitações (Requests)
CREATE TABLE public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_cpf TEXT NOT NULL,
  course_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pedido Enviado',
  drive_folder_id TEXT, -- ID ou URL da pasta gerada no Google Drive
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- POLÍTICAS DE SEGURANÇA (RLS POLICIES)
-- ==========================================

-- PARCEIROS (Partners)
-- Um parceiro só pode ver e editar o seu próprio perfil.
CREATE POLICY "Partners can view their own profile" 
ON public.partners FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Partners can update their own profile" 
ON public.partners FOR UPDATE 
USING (auth.uid() = id);

-- SOLICITAÇÕES (Requests)
-- Um parceiro só pode inserir solicitações vinculadas ao seu ID.
CREATE POLICY "Partners can insert their own requests" 
ON public.requests FOR INSERT 
WITH CHECK (auth.uid() = partner_id);

-- Um parceiro só pode ver suas próprias solicitações.
CREATE POLICY "Partners can view their own requests" 
ON public.requests FOR SELECT 
USING (auth.uid() = partner_id);

-- (Opcional) Criação de uma Role/Admin para ver todos os dados.
-- Para o Admin (Faculdade), idealmente você usa uma tabela separada `admins` ou um JWT claim personalizado.
-- Exemplo de política baseada em uma tabela de admins:
-- CREATE POLICY "Admins can view all requests" ON public.requests FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid()));

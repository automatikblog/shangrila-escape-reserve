-- Criar mesa especial "Balcão/Avulso" para clientes sem mesa
INSERT INTO public.tables (number, name, is_active)
SELECT 0, 'Balcão/Avulso', true
WHERE NOT EXISTS (SELECT 1 FROM public.tables WHERE number = 0);

-- Adicionar campos de controle de pagamento na tabela client_sessions
ALTER TABLE public.client_sessions 
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
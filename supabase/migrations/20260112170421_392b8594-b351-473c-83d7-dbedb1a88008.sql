-- Remove o trigger antigo que criava print jobs na tabela orders (antes dos itens existirem)
DROP TRIGGER IF EXISTS trigger_create_print_job_on_order ON public.orders;

-- Remove a função antiga que não é mais usada
DROP FUNCTION IF EXISTS public.create_print_job_for_order();
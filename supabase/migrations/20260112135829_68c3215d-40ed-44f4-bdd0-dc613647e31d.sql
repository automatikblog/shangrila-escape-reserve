-- Dropar trigger existente se houver
DROP TRIGGER IF EXISTS trigger_create_print_job ON public.orders;
DROP TRIGGER IF EXISTS trigger_create_print_job_on_items ON public.order_items;

-- Criar função que cria print job quando itens são inseridos
CREATE OR REPLACE FUNCTION public.create_print_job_for_order_items()
RETURNS TRIGGER AS $$
DECLARE
  v_order RECORD;
  v_table_number INTEGER;
  v_table_name TEXT;
  v_client_name TEXT;
  v_items JSONB;
  v_existing_job UUID;
BEGIN
  -- Busca informações do pedido
  SELECT o.* INTO v_order
  FROM public.orders o
  WHERE o.id = NEW.order_id;

  -- Verifica se já existe um print job pendente para este pedido
  SELECT id INTO v_existing_job
  FROM public.print_jobs
  WHERE order_id = NEW.order_id AND status = 'pending';

  -- Se já existe, atualiza o payload com os novos itens
  IF v_existing_job IS NOT NULL THEN
    -- Busca todos os itens atualizados
    SELECT jsonb_agg(
      jsonb_build_object(
        'name', oi.item_name,
        'quantity', oi.quantity,
        'price', oi.item_price,
        'category', oi.category
      )
    ) INTO v_items
    FROM public.order_items oi
    WHERE oi.order_id = NEW.order_id;

    -- Atualiza o print job existente
    UPDATE public.print_jobs
    SET payload = jsonb_set(payload, '{items}', COALESCE(v_items, '[]'::jsonb))
    WHERE id = v_existing_job;

    RETURN NEW;
  END IF;

  -- Se não existe, cria um novo print job
  -- Get table info
  SELECT t.number, t.name INTO v_table_number, v_table_name
  FROM public.tables t
  WHERE t.id = v_order.table_id;

  -- Get client name
  SELECT cs.client_name INTO v_client_name
  FROM public.client_sessions cs
  WHERE cs.id = v_order.client_session_id;

  -- Get all order items
  SELECT jsonb_agg(
    jsonb_build_object(
      'name', oi.item_name,
      'quantity', oi.quantity,
      'price', oi.item_price,
      'category', oi.category
    )
  ) INTO v_items
  FROM public.order_items oi
  WHERE oi.order_id = NEW.order_id;

  -- Create print job
  INSERT INTO public.print_jobs (
    job_type,
    order_id,
    client_session_id,
    payload
  ) VALUES (
    'new_order',
    v_order.id,
    v_order.client_session_id,
    jsonb_build_object(
      'order_id', v_order.id,
      'table_number', COALESCE(v_table_number, 0),
      'table_name', COALESCE(v_table_name, 'Balcão'),
      'client_name', COALESCE(v_client_name, 'Cliente'),
      'delivery_type', v_order.delivery_type,
      'notes', v_order.notes,
      'items', COALESCE(v_items, '[]'::jsonb),
      'created_at', v_order.created_at
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger que dispara quando um order_item é inserido
CREATE TRIGGER trigger_create_print_job_on_items
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.create_print_job_for_order_items();
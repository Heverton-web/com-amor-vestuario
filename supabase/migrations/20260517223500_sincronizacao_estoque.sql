-- Migration: Sincronização de estoque e baixa automática no faturamento
-- Criado em: 2026-05-17

-- 1. Função para sincronizar estoque do produto convencional com o estoque de reward_items
CREATE OR REPLACE FUNCTION public.sync_reward_product_stock()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Se for um produto físico, força o estoque da recompensa a ser igual ao do produto
  IF NEW.kind = 'produto_fisico' AND NEW.product_id IS NOT NULL THEN
    SELECT stock INTO NEW.stock FROM public.products WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Criar a trigger para manter estoque de recompensas físicas atualizado na inserção ou edição
DROP TRIGGER IF EXISTS trg_sync_reward_product_stock ON public.reward_items;
CREATE TRIGGER trg_sync_reward_product_stock
  BEFORE INSERT OR UPDATE ON public.reward_items
  FOR EACH ROW EXECUTE FUNCTION public.sync_reward_product_stock();

-- 2. Trigger para atualizar reward_items sempre que o estoque do produto em products for atualizado
CREATE OR REPLACE FUNCTION public.sync_reward_stock_from_product()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.reward_items
  SET stock = NEW.stock
  WHERE product_id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_reward_stock_from_product ON public.products;
CREATE TRIGGER trg_sync_reward_stock_from_product
  AFTER UPDATE OF stock ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.sync_reward_stock_from_product();

-- 3. Trigger para baixar o estoque das peças de um pedido apenas no faturamento (status = 'pago')
CREATE OR REPLACE FUNCTION public.deduct_stock_on_invoice()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  item RECORD;
BEGIN
  -- Só faz a baixa quando o status transiciona para 'pago' (Faturado)
  IF NEW.status = 'pago' AND (OLD.status IS NULL OR OLD.status <> 'pago') THEN
    FOR item IN 
      SELECT product_id, quantity 
      FROM public.order_items 
      WHERE order_id = NEW.id AND product_id IS NOT NULL
    LOOP
      UPDATE public.products 
      SET stock = GREATEST(0, stock - item.quantity) 
      WHERE id = item.product_id;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_deduct_stock_on_invoice ON public.orders;
CREATE TRIGGER trg_deduct_stock_on_invoice
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.deduct_stock_on_invoice();

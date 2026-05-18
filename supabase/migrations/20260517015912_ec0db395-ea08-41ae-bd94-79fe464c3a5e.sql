
-- Enums
CREATE TYPE reward_kind AS ENUM ('produto_fisico','voucher_valor','voucher_percent','voucher_frete');
CREATE TYPE redemption_status AS ENUM ('resgatado','utilizado','expirado','cancelado');
CREATE TYPE points_ledger_reason AS ENUM ('pedido','resgate','ajuste','estorno');

-- Sequences
CREATE SEQUENCE reward_item_code_seq START 1;
CREATE SEQUENCE redemption_code_seq START 1;

-- reward_items
CREATE TABLE public.reward_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE DEFAULT ('RW' || lpad(nextval('reward_item_code_seq')::text, 4, '0')),
  name text NOT NULL,
  description text,
  images text[] NOT NULL DEFAULT '{}',
  kind reward_kind NOT NULL,
  points_cost int NOT NULL CHECK (points_cost >= 0),
  stock int NOT NULL DEFAULT 0 CHECK (stock >= 0),
  expires_at timestamptz,
  voucher_value numeric(10,2),
  voucher_percent int CHECK (voucher_percent IS NULL OR (voucher_percent BETWEEN 0 AND 100)),
  voucher_min_order numeric(10,2) NOT NULL DEFAULT 0,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_variant jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reward_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active rewards public" ON public.reward_items
  FOR SELECT USING (active = true OR is_staff(auth.uid()));
CREATE POLICY "Staff manage rewards" ON public.reward_items
  FOR ALL USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

CREATE TRIGGER trg_reward_items_updated BEFORE UPDATE ON public.reward_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- products: column for realocação
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rewards_reserved int NOT NULL DEFAULT 0;

-- customers: portal account
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS portal_invited_at timestamptz;
CREATE INDEX IF NOT EXISTS customers_user_id_idx ON public.customers(user_id);

CREATE POLICY "Customer read own" ON public.customers
  FOR SELECT USING (user_id = auth.uid());

-- redemptions
CREATE TABLE public.redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE DEFAULT ('RG' || lpad(nextval('redemption_code_seq')::text, 4, '0')),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  reward_item_id uuid NOT NULL REFERENCES public.reward_items(id) ON DELETE RESTRICT,
  points_spent int NOT NULL,
  status redemption_status NOT NULL DEFAULT 'resgatado',
  valid_until date,
  voucher_code text UNIQUE,
  used_in_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage redemptions" ON public.redemptions
  FOR ALL USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "Customer read own redemptions" ON public.redemptions
  FOR SELECT USING (
    customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  );

-- points_ledger
CREATE TABLE public.points_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  delta int NOT NULL,
  reason points_ledger_reason NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  redemption_id uuid REFERENCES public.redemptions(id) ON DELETE SET NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX points_ledger_order_unique
  ON public.points_ledger(order_id) WHERE reason = 'pedido';
CREATE INDEX points_ledger_customer_idx
  ON public.points_ledger(customer_id, created_at DESC);

CREATE POLICY "Staff manage ledger" ON public.points_ledger
  FOR ALL USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "Customer read own ledger" ON public.points_ledger
  FOR SELECT USING (
    customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  );

-- portal_invitations
CREATE TABLE public.portal_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  email text NOT NULL,
  whatsapp text,
  temp_password text NOT NULL,
  login_url text NOT NULL,
  channel text NOT NULL,
  status text NOT NULL DEFAULT 'mock',
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.portal_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage portal invitations" ON public.portal_invitations
  FOR ALL USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

-- View saldo
CREATE OR REPLACE VIEW public.customer_points_balance AS
SELECT customer_id, COALESCE(SUM(delta), 0)::int AS balance
FROM public.points_ledger
GROUP BY customer_id;

-- Função helper
CREATE OR REPLACE FUNCTION public.points_balance(_customer_id uuid)
RETURNS int LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(SUM(delta), 0)::int FROM public.points_ledger WHERE customer_id = _customer_id;
$$;

-- Trigger: crédito automático ao pagar/finalizar pedido
CREATE OR REPLACE FUNCTION public.award_points_on_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  per_real numeric;
  pts int;
BEGIN
  IF NEW.customer_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('pago','finalizado') THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status IN ('pago','finalizado') THEN RETURN NEW; END IF;

  SELECT COALESCE((data->>'points_per_real')::numeric, 10) INTO per_real
  FROM public.site_settings WHERE id = 1;
  IF per_real IS NULL OR per_real <= 0 THEN per_real := 10; END IF;

  pts := floor(COALESCE(NEW.total, 0) / per_real)::int;
  IF pts <= 0 THEN RETURN NEW; END IF;

  INSERT INTO public.points_ledger (customer_id, delta, reason, order_id, description)
  VALUES (NEW.customer_id, pts, 'pedido', NEW.id, 'Pontos do pedido ' || NEW.code)
  ON CONFLICT (order_id) WHERE reason = 'pedido' DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_award_points_orders
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.award_points_on_order();

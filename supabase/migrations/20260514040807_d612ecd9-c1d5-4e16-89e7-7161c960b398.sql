-- ENUMS
DO $$ BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('aberta','paga_parcial','paga','vencida','cancelada');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.invoice_payment_method AS ENUM ('pix','boleto','cartao','manual');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- SEQUENCE para code legível (FT0001)
CREATE SEQUENCE IF NOT EXISTS public.invoice_code_seq START 1;

-- INVOICES
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL DEFAULT ('FT' || lpad(nextval('public.invoice_code_seq')::text, 4, '0')),
  order_id uuid,
  customer_id uuid,
  status public.invoice_status NOT NULL DEFAULT 'aberta',
  payment_method public.invoice_payment_method,
  total numeric NOT NULL DEFAULT 0,
  paid_total numeric NOT NULL DEFAULT 0,
  due_date date,
  pix_qr text,
  pix_copia_cola text,
  boleto_url text,
  mp_preference_id text,
  mp_init_point text,
  mp_payment_id text,
  pdf_url text,
  public_token text NOT NULL DEFAULT encode(gen_random_bytes(18), 'hex'),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS invoices_code_idx ON public.invoices(code);
CREATE UNIQUE INDEX IF NOT EXISTS invoices_public_token_idx ON public.invoices(public_token);
CREATE INDEX IF NOT EXISTS invoices_order_idx ON public.invoices(order_id);
CREATE INDEX IF NOT EXISTS invoices_customer_idx ON public.invoices(customer_id);

-- INSTALLMENTS
CREATE TABLE IF NOT EXISTS public.invoice_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  number int NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  paid_at timestamptz,
  status public.invoice_status NOT NULL DEFAULT 'aberta',
  mp_payment_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invoice_installments_invoice_idx ON public.invoice_installments(invoice_id);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS public.invoice_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  installment_id uuid REFERENCES public.invoice_installments(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  paid_at timestamptz NOT NULL DEFAULT now(),
  method public.invoice_payment_method,
  gateway_id text,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invoice_payments_invoice_idx ON public.invoice_payments(invoice_id);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_invoices_updated_at ON public.invoices;
CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;

-- Staff: tudo
DROP POLICY IF EXISTS "Staff manage invoices" ON public.invoices;
CREATE POLICY "Staff manage invoices" ON public.invoices
  FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff manage invoice_installments" ON public.invoice_installments;
CREATE POLICY "Staff manage invoice_installments" ON public.invoice_installments
  FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff manage invoice_payments" ON public.invoice_payments;
CREATE POLICY "Staff manage invoice_payments" ON public.invoice_payments
  FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- (Acesso público por token será feito via server function que usa supabaseAdmin
--  e valida o token explicitamente; não criamos policy SELECT pública aqui.)
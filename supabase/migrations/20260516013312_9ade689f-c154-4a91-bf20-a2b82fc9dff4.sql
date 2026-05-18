-- Sequence and table for receipts
CREATE SEQUENCE IF NOT EXISTS public.receipt_code_seq START 1;

CREATE TYPE public.receipt_status AS ENUM ('emitido', 'cancelado');
CREATE TYPE public.receipt_method AS ENUM ('pix', 'dinheiro', 'cartao_credito', 'cartao_debito', 'transferencia', 'boleto', 'outro');
CREATE TYPE public.receipt_signature_mode AS ENUM ('linha', 'imagem');

CREATE TABLE public.receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL DEFAULT ('RC' || lpad(nextval('public.receipt_code_seq')::text, 4, '0')),
  customer_id uuid NULL,
  invoice_id uuid NULL,
  order_id uuid NULL,

  payer_name text NOT NULL,
  payer_doc text NULL,

  amount numeric NOT NULL DEFAULT 0,
  amount_in_words text NOT NULL DEFAULT '',
  reference text NOT NULL DEFAULT '',
  payment_method public.receipt_method NOT NULL DEFAULT 'pix',
  paid_at date NOT NULL DEFAULT CURRENT_DATE,
  city text NULL,

  issuer_name text NULL,
  issuer_doc text NULL,
  issuer_address text NULL,
  signature_mode public.receipt_signature_mode NOT NULL DEFAULT 'linha',
  signature_url text NULL,

  status public.receipt_status NOT NULL DEFAULT 'emitido',
  public_token text NOT NULL DEFAULT encode(extensions.gen_random_bytes(18), 'hex'),
  notes text NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX receipts_code_idx ON public.receipts(code);
CREATE UNIQUE INDEX receipts_token_idx ON public.receipts(public_token);
CREATE INDEX receipts_customer_idx ON public.receipts(customer_id);
CREATE INDEX receipts_invoice_idx ON public.receipts(invoice_id);
CREATE INDEX receipts_order_idx ON public.receipts(order_id);

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage receipts"
  ON public.receipts FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Public can view receipts"
  ON public.receipts FOR SELECT
  USING (true);

CREATE TRIGGER receipts_updated_at
  BEFORE UPDATE ON public.receipts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
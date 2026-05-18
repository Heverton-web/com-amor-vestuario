-- Permite SELECT público em invoices (link de fatura é compartilhável)
DROP POLICY IF EXISTS "Public can view invoices" ON public.invoices;
CREATE POLICY "Public can view invoices" ON public.invoices
  FOR SELECT USING (true);

-- Permite UPDATE público para simular confirmação de pagamento (MOCK)
DROP POLICY IF EXISTS "Public can mark invoice paid (mock)" ON public.invoices;
CREATE POLICY "Public can mark invoice paid (mock)" ON public.invoices
  FOR UPDATE USING (true) WITH CHECK (true);

-- Permite INSERT público em invoice_payments (MOCK)
DROP POLICY IF EXISTS "Public can insert payment (mock)" ON public.invoice_payments;
CREATE POLICY "Public can insert payment (mock)" ON public.invoice_payments
  FOR INSERT WITH CHECK (true);
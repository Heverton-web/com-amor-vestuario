-- Migration: Ambiente Dev Core Tables
-- Creates tables to store environment-specific integration keys and audit logs for N8N webhooks.

-- 1. Integration Settings Table
CREATE TABLE IF NOT EXISTS public.integration_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE, -- 'supabase', 'melhor_envio', 'mercado_pago', 'n8n'
  mode TEXT NOT NULL DEFAULT 'sandbox', -- 'sandbox' or 'production'
  api_url TEXT,
  public_key TEXT,
  private_key TEXT, -- Encrypted or plain text token
  webhook_url TEXT, -- For N8N hooks
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;

-- Policies for Integration Settings
CREATE POLICY "Developers can do everything in integration settings" ON public.integration_settings
  FOR ALL TO authenticated
  USING (public.can_access_admin_page(auth.uid(), 'dev'))
  WITH CHECK (public.can_access_admin_page(auth.uid(), 'dev'));

-- 2. Webhook Logs Table for N8N auditing
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,          -- e.g. 'vendas.pedido_criado'
  payload JSONB NOT NULL,            -- Webhook request payload
  webhook_url TEXT NOT NULL,         -- URL sent to
  status_code INTEGER,               -- HTTP response code
  response_body TEXT,                -- HTTP response body
  duration_ms INTEGER,               -- Delivery execution speed
  status TEXT NOT NULL,              -- 'success' or 'failed'
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Policies for Webhook Logs
CREATE POLICY "Developers can view webhook logs" ON public.webhook_logs
  FOR SELECT TO authenticated
  USING (public.can_access_admin_page(auth.uid(), 'dev'));

CREATE POLICY "System can insert webhook logs" ON public.webhook_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Developers can delete webhook logs (clean up)" ON public.webhook_logs
  FOR DELETE TO authenticated
  USING (public.can_access_admin_page(auth.uid(), 'dev'));

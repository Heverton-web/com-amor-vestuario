-- =============================================================================
-- Migration: Stack de Features - E-commerce + Marketing Automation
-- Criado em: 2026-05-20
-- Descrição: Schema completo para todas as features pendentes
-- =============================================================================

BEGIN;

-- =============================================================================
-- PARTE 1: AUTENTICAÇÃO E USUÁRIOS
-- =============================================================================

-- Adicionar campo para login method na tabela customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS login_method TEXT DEFAULT 'email';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- =============================================================================
-- PARTE 2: ENDEREÇOS DE CLIENTE
-- =============================================================================

-- Tabela de endereços múltiplos
CREATE TABLE IF NOT EXISTS customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  label TEXT DEFAULT 'Principal',
  cep TEXT,
  street TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers manage own addresses" ON customer_addresses FOR ALL
  USING (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()))
  WITH CHECK (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));

CREATE OR REPLACE FUNCTION update_customer_addresses_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_customer_addresses_updated BEFORE UPDATE ON customer_addresses
  FOR EACH ROW EXECUTE FUNCTION update_customer_addresses_updated_at();

-- =============================================================================
-- PARTE 3: PAGAMENTOS
-- =============================================================================

-- Adicionar campos de pagamento na tabela orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_link TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pix_qr_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pix_expiration TIMESTAMPTZ;

-- =============================================================================
-- PARTE 4: RASTREAMENTO
-- =============================================================================

-- Adicionar campos de rastreamento na tabela orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS carrier TEXT;

-- Tabela de logs de status do pedido
CREATE TABLE IF NOT EXISTS order_status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE order_status_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view order status logs" ON order_status_logs FOR SELECT
  USING (public.is_staff(auth.uid()));

-- Trigger para criar log quando status mudar
CREATE OR REPLACE FUNCTION log_order_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_logs (order_id, status, note, created_at)
    VALUES (NEW.id, NEW.status, NEW.notes, now());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_order_status ON orders;
CREATE TRIGGER trg_log_order_status
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION log_order_status();

-- =============================================================================
-- PARTE 5: WISHLIST
-- =============================================================================

CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  guest_id TEXT,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, product_id),
  UNIQUE(guest_id, product_id)
);

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wishlist" ON wishlists FOR SELECT
  USING (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));

CREATE POLICY "Users manage own wishlist" ON wishlists FOR ALL
  USING (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()))
  WITH CHECK (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));

-- =============================================================================
-- PARTE 6: AVALIAÇÕES DE PRODUTOS
-- =============================================================================

CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  images TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(order_id, product_id, customer_id)
);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage reviews" ON product_reviews FOR ALL
  USING (public.is_staff(auth.uid()));

CREATE VIEW IF NOT EXISTS product_ratings AS
SELECT
  product_id,
  COUNT(*) as review_count,
  AVG(rating)::NUMERIC(3,2) as avg_rating
FROM product_reviews
WHERE status = 'approved'
GROUP BY product_id;

-- =============================================================================
-- PARTE 7: ATACADO B2B
-- =============================================================================

-- Tabela de grupos/clientes atacadistas
CREATE TABLE IF NOT EXISTS wholesale_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  min_order_qty INTEGER DEFAULT 6,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  payment_terms TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE wholesale_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage wholesale tiers" ON wholesale_tiers FOR ALL
  USING (public.is_staff(auth.uid()));

-- Preços especiais por produto/cliente (override)
CREATE TABLE IF NOT EXISTS wholesale_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  custom_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, product_id)
);

ALTER TABLE wholesale_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage wholesale prices" ON wholesale_prices FOR ALL
  USING (public.is_staff(auth.uid()));

-- Adicionar campos de atacado na tabela customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS wholesale_tier_id UUID REFERENCES wholesale_tiers(id);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS wholesale_approved BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS wholesale_approved_by UUID REFERENCES auth.users(id);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS wholesale_approved_at TIMESTAMPTZ;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS wholesale_rejection_reason TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS razao_social TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS inscricao_estadual TEXT;

-- =============================================================================
-- PARTE 8: MARKETING AUTOMATION
-- =============================================================================

-- Tabela de campanhas de marketing
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('whatsapp', 'email', 'both')) DEFAULT 'whatsapp',
  status TEXT DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'ativa', 'pausada', 'finalizada')),
  segment_json JSONB,
  template_subject TEXT,
  template_body TEXT NOT NULL,
  template_variables TEXT[],
  schedule_enabled BOOLEAN DEFAULT false,
  schedule_time TIME,
  schedule_days TEXT[],
  schedule_timezone TEXT DEFAULT 'America/Sao_Paulo',
  start_date DATE,
  end_date DATE,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage campaigns" ON marketing_campaigns FOR ALL
  USING (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION update_marketing_campaigns_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_marketing_campaigns_updated BEFORE UPDATE ON marketing_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_marketing_campaigns_updated_at();

-- Tabela de logs de envio
CREATE TABLE IF NOT EXISTS marketing_campaign_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  flow_id UUID REFERENCES marketing_flows(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email')),
  message_text TEXT,
  message_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('pendente', 'enviado', 'entregue', 'erro', 'lido')) DEFAULT 'pendente',
  error_message TEXT,
  metadata JSONB,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE marketing_campaign_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view campaign logs" ON marketing_campaign_logs FOR SELECT
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff manage campaign logs" ON marketing_campaign_logs FOR ALL
  USING (public.is_staff(auth.uid()));

-- Index para performance
CREATE INDEX IF NOT EXISTS idx_marketing_campaign_logs_campaign ON marketing_campaign_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaign_logs_customer ON marketing_campaign_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaign_logs_status ON marketing_campaign_logs(status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaign_logs_created ON marketing_campaign_logs(created_at);

-- Tabela de fluxos de follow-up
CREATE TABLE IF NOT EXISTS marketing_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_event TEXT NOT NULL CHECK (trigger_event IN (
    'order_created', 'order_paid', 'order_shipped', 'order_delivered',
    'points_earned', 'points_expiring', 'birthday', 'inactive_30_days',
    'cart_abandoned', 'wholesale_approved', 'lead_created'
  )),
  trigger_delay INTERVAL DEFAULT '1 day',
  trigger_conditions JSONB,
  action_channel TEXT NOT NULL CHECK (action_channel IN ('whatsapp', 'email')),
  action_template TEXT NOT NULL,
  action_variables TEXT[],
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE marketing_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage flows" ON marketing_flows FOR ALL
  USING (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION update_marketing_flows_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_marketing_flows_updated BEFORE UPDATE ON marketing_flows
  FOR EACH ROW EXECUTE FUNCTION update_marketing_flows_updated_at();

-- Tabela de consentimento marketing (LGPD)
CREATE TABLE IF NOT EXISTS marketing_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'sms')),
  consented BOOLEAN DEFAULT true,
  consented_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  source TEXT,
  UNIQUE(customer_id, channel)
);

ALTER TABLE marketing_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers manage own consents" ON marketing_consents FOR ALL
  USING (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()))
  WITH CHECK (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));

-- Tabela de templates de mensagens
CREATE TABLE IF NOT EXISTS marketing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'both')),
  category TEXT,
  subject TEXT,
  body TEXT NOT NULL,
  variables TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE marketing_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage templates" ON marketing_templates FOR ALL
  USING (public.is_staff(auth.uid()));

-- =============================================================================
-- PARTE 9: NOTIFICAÇÕES DE PRODUTO (AVISE-ME)
-- =============================================================================

CREATE TABLE IF NOT EXISTS product_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  email TEXT,
  phone TEXT,
  notified BOOLEAN DEFAULT false,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, email),
  UNIQUE(product_id, phone)
);

ALTER TABLE product_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage notifications" ON product_notifications FOR ALL
  USING (public.is_staff(auth.uid()));

-- =============================================================================
-- PARTE 10: VIEW PARA MÉTRICAS
-- =============================================================================

-- View para métricas de marketing
CREATE OR REPLACE VIEW marketing_metrics_summary AS
SELECT
  c.id as campaign_id,
  c.name as campaign_name,
  c.type,
  c.status,
  c.created_at,
  COUNT(l.id) as total_sent,
  COUNT(l.id) FILTER (WHERE l.status = 'entregue') as total_delivered,
  COUNT(l.id) FILTER (WHERE l.status = 'lido') as total_read,
  COUNT(l.id) FILTER (WHERE l.status = 'erro') as total_errors,
  ROUND(COUNT(l.id) FILTER (WHERE l.status = 'entregue')::NUMERIC / NULLIF(COUNT(l.id), 0) * 100, 2) as delivery_rate,
  ROUND(COUNT(l.id) FILTER (WHERE l.status = 'lido')::NUMERIC / NULLIF(COUNT(l.id) FILTER (WHERE l.status IN ('entregue', 'lido')), 0) * 100, 2) as open_rate
FROM marketing_campaigns c
LEFT JOIN marketing_campaign_logs l ON c.id = l.campaign_id
GROUP BY c.id, c.name, c.type, c.status, c.created_at
ORDER BY c.created_at DESC;

-- =============================================================================
-- PARTE 11: FUNÇÕES AUXILIARES
-- =============================================================================

-- Função para obter preço de atacado com tier e preços customizados
CREATE OR REPLACE FUNCTION get_wholesale_price(p_customer_id UUID, p_product_id UUID)
RETURNS NUMERIC(10,2) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_price NUMERIC(10,2);
  v_tier_discount NUMERIC(5,2);
BEGIN
  -- 1. Verificar preço customizado por cliente
  SELECT custom_price INTO v_price
  FROM wholesale_prices
  WHERE customer_id = p_customer_id AND product_id = p_product_id
  LIMIT 1;

  IF v_price IS NOT NULL THEN
    RETURN v_price;
  END IF;

  -- 2. Verificar tier do cliente
  SELECT wt.discount_percent INTO v_tier_discount
  FROM customers c
  LEFT JOIN wholesale_tiers wt ON c.wholesale_tier_id = wt.id
  WHERE c.id = p_customer_id AND c.wholesale_approved = true;

  -- 3. Calcular preço com discount do tier
  IF v_tier_discount IS NOT NULL AND v_tier_discount > 0 THEN
    SELECT (p.retail_price * (1 - v_tier_discount / 100)) INTO v_price
    FROM products p
    WHERE p.id = p_product_id;
    RETURN v_price;
  END IF;

  -- 4. Preço padrão de atacado
  SELECT wholesale_price INTO v_price
  FROM products
  WHERE id = p_product_id;

  RETURN COALESCE(v_price, 0);
END;
$$;

-- Função para verificar se cliente pode avaliar produto
CREATE OR REPLACE FUNCTION can_review_product(p_customer_id UUID, p_product_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_can_review BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.product_id = p_product_id
      AND o.customer_id = p_customer_id
      AND o.status = 'finalizado'
  ) INTO v_can_review;

  RETURN COALESCE(v_can_review, false);
END;
$$;

-- Função para migrar wishlist de guest para user (quando fazer login)
CREATE OR REPLACE FUNCTION migrate_guest_wishlist(p_customer_id UUID, p_guest_id TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Move itens da wishlist de guest_id para customer_id
  UPDATE wishlists
  SET customer_id = p_customer_id, guest_id = NULL
  WHERE guest_id = p_guest_id
    AND NOT EXISTS (
      SELECT 1 FROM wishlists w2
      WHERE w2.customer_id = p_customer_id
        AND w2.product_id = wishlists.product_id
    );

  -- Remove duplicatas (mantém os迁移)
  DELETE FROM wishlists
  WHERE id IN (
    SELECT id FROM wishlists
    WHERE customer_id = p_customer_id
    GROUP BY product_id
    HAVING COUNT(*) > 1
  );
END;
$$;

-- =============================================================================
-- PARTE 12: DADOS INICIAIS (SEEDS)
-- =============================================================================

-- Inserir tiers de atacado padrão
INSERT INTO wholesale_tiers (name, description, min_order_qty, discount_percent, payment_terms, is_active)
VALUES
  ('Bronze', 'Cliente atacadista iniciante', 6, 0, ARRAY['pix', 'boleto'], true),
  ('Prata', 'Cliente atacadista regular', 12, 5, ARRAY['pix', 'boleto', 'credito_30'], true),
  ('Ouro', 'Cliente atacadista VIP', 24, 10, ARRAY['pix', 'boleto', 'credito_30', 'credito_60'], true)
ON CONFLICT DO NOTHING;

-- Inserir templates de mensagens padrão
INSERT INTO marketing_templates (name, channel, category, subject, body, is_active) VALUES
  ('Follow-up Pedido Entregue', 'whatsapp', 'followup',
   'Como foi sua experiência?',
   'Olá {name}! 🎉

Seu pedido {order_code} foi entregue!

 esperamos que você adore suas novas peças!

Curtiu? Compartilhe sua experiência com a gente!
Responda esta mensagem com uma foto - queremos ver você estilosa! 💕

Em breve você receberá cupons exclusivos!

Equipe {company_name} 💕',
   true),

  ('Carrinho Abandonado', 'whatsapp', 'abandoned',
   'Esqueceu algo?',
   'Oi {name}! 👋

Vimos que você deixou algumas peças maneiras no carrinho!

使用 este cupom para garantir o desconto:
CARRINHO10 - 10% OFF

Válido por 24h! ⏰

Aqui: {cart_checkout_url}

Equipe {company_name} 💕',
   true),

  ('Aniversário', 'whatsapp', 'birthday',
   'Feliz aniversário!',
   'Feliz aniversário, {name}! 🎂🎉

Que seu dia seja cheio de amor, alegrias e muitas peças novas! 💕

Como presente, você ganhou um cupom especial!
 使用 até {birthday_valid_date}!

Equipe {company_name} 💕',
   true),

  ('Newsletter Semanal', 'email', 'newsletter',
   'Novidades da semana - {company_name}',
   '<h1>Olá {name}! 👋</h1>
<p>Novas peças chegaram! Confira:</p>
<p>{newsletter_products}</p>
<p>Use o cupom SEMANA10 para 10% OFF!</p>
<p>Equipe {company_name} 💕</p>',
   true)
ON CONFLICT DO NOTHING;

-- Inserir fluxos automáticos padrão
INSERT INTO marketing_flows (name, description, trigger_event, trigger_delay, action_channel, action_template, is_active, priority) VALUES
  ('Follow-up Pedido Entregue', 'Envia mensagem 3 dias após entrega', 'order_delivered', '3 days', 'whatsapp',
   'Olá {name}! 🎉 Seu pedido foi entregue! Como foi sua experiência? Responda com uma foto!', true, 10),
  ('Carrinho Abandonado', 'Envia mensagem 1 hora após abandono', 'cart_abandoned', '1 hour', 'whatsapp',
   'Oi {name}! Você esqueceu algumas peças no carrinho! Use CARRINHO10 para 10% OFF', true, 20),
  ('Aniversário', 'Envia mensagem no dia do aniversário', 'birthday', '0', 'whatsapp',
   'Feliz aniversário {name}! 🎂🎉 Presentinho pra você!', true, 5),
  ('Pontos Expirando', 'Avisa 30 dias antes dos pontos expirarem', 'points_expiring', '30 days', 'whatsapp',
   'Oi {name}! Seus {points} pontos vão expirar em breve! Use eles antes de perder!', true, 15),
  ('Boas-vindas Lojista', 'Welcome para lojistas aprovados', 'wholesale_approved', '0', 'whatsapp',
   'Bem-vindo {name}! 🎉 Você agora é parceiro atacadista! Conditions especiales garantem!', true, 25)
ON CONFLICT DO NOTHING;

COMMIT;

-- =============================================================================
-- RESUMO DAS TABELAS CRIADAS/ALTERADAS
-- =============================================================================
-- customers         - adicionados campos de auth, login, atacado
-- customer_addresses - NOVA tabela
-- orders            - adicionados campos de pagamento, rastreamento
-- order_status_logs - NOVA tabela (logs de status)
-- wishlists         - NOVA tabela
-- product_reviews   - NOVA tabela
-- wholesale_tiers   - NOVA tabela
-- wholesale_prices  - NOVA tabela
-- marketing_campaigns - NOVA tabela
-- marketing_campaign_logs - NOVA tabela
-- marketing_flows   - NOVA tabela
-- marketing_consents - NOVA tabela
-- marketing_templates - NOVA tabela
-- product_notifications - NOVA tabela (avise-me)
-- =============================================================================
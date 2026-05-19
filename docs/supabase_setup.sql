
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'consultor', 'cliente');
CREATE TYPE public.product_type AS ENUM ('convencional', 'fardamento');
CREATE TYPE public.customer_type AS ENUM ('pf', 'pj');
CREATE TYPE public.customer_category AS ENUM ('varejo', 'atacado', 'fardamento');
CREATE TYPE public.quote_status AS ENUM ('novo', 'gerado', 'enviado', 'aprovado', 'perdido');
CREATE TYPE public.uniform_status AS ENUM ('novo', 'orcamento', 'fechado', 'aprovado', 'perdido');
CREATE TYPE public.doubt_status AS ENUM ('produto', 'preco', 'pagamento', 'entrega', 'resolvido');
CREATE TYPE public.order_status AS ENUM ('realizado', 'separado', 'pago', 'enviado', 'finalizado', 'cancelado');
CREATE TYPE public.lead_reason AS ENUM ('orcamento', 'fardamento', 'produto', 'preco', 'pagamento', 'entrega');

-- ============ UTIL ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by self" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Profiles update by self" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Profiles insert by self" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','consultor'));
$$;

CREATE POLICY "Roles viewable by self" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto profile on signup + first user becomes admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE user_count INT;
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);

  SELECT COUNT(*) INTO user_count FROM auth.users;
  IF user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'consultor');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ PRODUCTS ============
CREATE SEQUENCE public.product_code_seq START 1000;
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE DEFAULT ('P' || nextval('public.product_code_seq')),
  name TEXT NOT NULL,
  description TEXT,
  type product_type NOT NULL DEFAULT 'convencional',
  cost_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  retail_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  wholesale_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  colors TEXT[] NOT NULL DEFAULT '{}',
  sizes TEXT[] NOT NULL DEFAULT '{}',
  images TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active products are public" ON public.products FOR SELECT USING (active = true OR public.is_staff(auth.uid()));
CREATE POLICY "Staff manage products" ON public.products FOR ALL
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CUSTOMERS ============
CREATE SEQUENCE public.customer_code_seq START 1000;
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE DEFAULT ('C' || nextval('public.customer_code_seq')),
  name TEXT NOT NULL,
  type customer_type NOT NULL DEFAULT 'pf',
  cpf TEXT,
  cnpj TEXT,
  email TEXT,
  phone TEXT,
  landline TEXT,
  birth_date DATE,
  category customer_category NOT NULL DEFAULT 'varejo',
  cep TEXT,
  street TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage customers" ON public.customers FOR ALL
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ LEADS ============
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  reason lead_reason NOT NULL,
  message TEXT,
  utm_source TEXT, utm_medium TEXT, utm_campaign TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff read leads" ON public.leads FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff update leads" ON public.leads FOR UPDATE USING (public.is_staff(auth.uid()));

-- ============ QUOTES ============
CREATE SEQUENCE public.quote_code_seq START 1000;
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE DEFAULT ('OR' || nextval('public.quote_code_seq')),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  requester_name TEXT,
  consultant_name TEXT,
  quote_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  status quote_status NOT NULL DEFAULT 'novo',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage quotes" ON public.quotes FOR ALL
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_quotes_updated BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  color TEXT,
  size TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0
);
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage quote_items" ON public.quote_items FOR ALL
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ ORDERS ============
CREATE SEQUENCE public.order_code_seq START 1000;
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE DEFAULT ('PD' || nextval('public.order_code_seq')),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  status order_status NOT NULL DEFAULT 'realizado',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  separated_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  source TEXT,
  origin_kanban TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage orders" ON public.orders FOR ALL
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  color TEXT,
  size TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage order_items" ON public.order_items FOR ALL
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ KANBAN UNIFICADO ============
-- board: 'orcamento' | 'fardamento' | 'duvidas' | 'pedidos'
CREATE TABLE public.kanban_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board TEXT NOT NULL,
  stage TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  contact_name TEXT,
  contact_whatsapp TEXT,
  amount NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.kanban_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage kanban" ON public.kanban_cards FOR ALL
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_kanban_updated BEFORE UPDATE ON public.kanban_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Product images public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Staff upload product images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff update product images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff delete product images" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images' AND public.is_staff(auth.uid()));

-- ============ AUTO-CREATE KANBAN CARD ON LEAD ============
CREATE OR REPLACE FUNCTION public.lead_to_kanban()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE board_name TEXT; stage_name TEXT;
BEGIN
  IF NEW.reason = 'orcamento' THEN board_name := 'orcamento'; stage_name := 'novo';
  ELSIF NEW.reason = 'fardamento' THEN board_name := 'fardamento'; stage_name := 'novo';
  ELSE board_name := 'duvidas'; stage_name := NEW.reason::text;
  END IF;

  INSERT INTO public.kanban_cards (board, stage, title, description, contact_name, contact_whatsapp, lead_id)
  VALUES (board_name, stage_name, NEW.name, NEW.message, NEW.name, NEW.whatsapp, NEW.id);
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_lead_to_kanban AFTER INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.lead_to_kanban();

REVOKE EXECUTE ON FUNCTION public.has_role(UUID, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_staff(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.lead_to_kanban() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- site_settings: singleton de branding/conteÃºdo da landing
create table if not exists public.site_settings (
  id int primary key default 1,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint singleton check (id = 1)
);

alter table public.site_settings enable row level security;

create policy "Public can read site settings"
  on public.site_settings for select
  using (true);

create policy "Staff can insert site settings"
  on public.site_settings for insert
  with check (public.is_staff(auth.uid()));

create policy "Staff can update site settings"
  on public.site_settings for update
  using (public.is_staff(auth.uid()));

insert into public.site_settings (id, data) values (1, jsonb_build_object(
  'brand_name', 'Com Amor',
  'brand_suffix', 'vestuÃ¡rio',
  'tagline', 'feito Ã  mÃ£o, com afeto',
  'logo_url', null,
  'primary_color', 'oklch(0.55 0.16 38)',
  'accent_color', 'oklch(0.88 0.06 38)',
  'background_color', 'oklch(0.972 0.018 80)',
  'foreground_color', 'oklch(0.255 0.035 45)',
  'hero_title', 'Roupa que veste histÃ³ria, nÃ£o sÃ³ o corpo.',
  'hero_subtitle', 'PeÃ§as autorais, coleÃ§Ãµes de atacado e fardamento corporativo costurados com cuidado de quem ama o ofÃ­cio.',
  'hero_image_url', null,
  'about_title', 'Uma pequena confecÃ§Ã£o com olhar grande sobre o que veste vocÃª.',
  'about_text', 'A Com Amor VestuÃ¡rio nasceu numa sala pequena, com uma mÃ¡quina, trÃªs cores de linha e muita vontade de fazer roupa que durasse mais que uma estaÃ§Ã£o.',
  'about_image_url', null,
  'phone', '(00) 0 0000-0000',
  'whatsapp', '5599999999999',
  'email', 'contato@comamor.com',
  'address_line1', 'Rua das AcÃ¡cias, 142',
  'address_line2', 'Centro â€” Sua Cidade, BR',
  'instagram_url', 'https://instagram.com',
  'facebook_url', 'https://facebook.com',
  'instagram_handle', '@comamorvestuario',
  'hours_weekday', '09:00 â€” 18:00',
  'hours_saturday', '09:00 â€” 13:00',
  'hours_sunday', 'Fechado'
))
on conflict (id) do nothing;

-- branding bucket pÃºblico para logos e imagens da landing
insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

create policy "Public read branding"
  on storage.objects for select
  using (bucket_id = 'branding');

create policy "Staff upload branding"
  on storage.objects for insert
  with check (bucket_id = 'branding' and public.is_staff(auth.uid()));

create policy "Staff update branding"
  on storage.objects for update
  using (bucket_id = 'branding' and public.is_staff(auth.uid()));

create policy "Staff delete branding"
  on storage.objects for delete
  using (bucket_id = 'branding' and public.is_staff(auth.uid()));

UPDATE site_settings
SET data = jsonb_set(data, '{hero_image_url}', '"https://wekdvyvpyvwllbxnxvgi.supabase.co/storage/v1/object/public/branding/hero-1778604921675.jpg"'::jsonb),
    updated_at = now()
WHERE id = 1;

WITH mapping(code, imgs) AS (VALUES
  ('P1000', ARRAY['https://wekdvyvpyvwllbxnxvgi.supabase.co/storage/v1/object/public/product-images/catalog/produto_01A.jpg','https://wekdvyvpyvwllbxnxvgi.supabase.co/storage/v1/object/public/product-images/catalog/produto_01B.jpg','https://wekdvyvpyvwllbxnxvgi.supabase.co/storage/v1/object/public/product-images/catalog/produto_01C.jpg']),
  ('P1001', ARRAY['https://wekdvyvpyvwllbxnxvgi.supabase.co/storage/v1/object/public/product-images/catalog/produto_02A.jpg','https://wekdvyvpyvwllbxnxvgi.supabase.co/storage/v1/object/public/product-images/catalog/produto_02B.jpg','https://wekdvyvpyvwllbxnxvgi.supabase.co/storage/v1/object/public/product-images/catalog/produto_02C.jpg']),
  ('P1002', ARRAY['https://wekdvyvpyvwllbxnxvgi.supabase.co/storage/v1/object/public/product-images/catalog/produto_03A.jpg','https://wekdvyvpyvwllbxnxvgi.supabase.co/storage/v1/object/public/product-images/catalog/produto_03B.jpg','https://wekdvyvpyvwllbxnxvgi.supabase.co/storage/v1/object/public/product-images/catalog/produto_03C.jpg']),
  ('P1003', ARRAY['https://wekdvyvpyvwllbxnxvgi.supabase.co/storage/v1/object/public/product-images/catalog/produto_04A.jpg','https://wekdvyvpyvwllbxnxvgi.supabase.co/storage/v1/object/public/product-images/catalog/produto_04B.png','https://wekdvyvpyvwllbxnxvgi.supabase.co/storage/v1/object/public/product-images/catalog/produto_04C.jpg']),
  ('P1004', ARRAY['https://wekdvyvpyvwllbxnxvgi.supabase.co/storage/v1/object/public/product-images/catalog/produto_05A.jpg','https://wekdvyvpyvwllbxnxvgi.supabase.co/storage/v1/object/public/product-images/catalog/produto_05B.jpg','https://wekdvyvpyvwllbxnxvgi.supabase.co/storage/v1/object/public/product-images/catalog/produto_05C.jpg']),
  ('P1005', ARRAY['https://wekdvyvpyvwllbxnxvgi.supabase.co/storage/v1/object/public/product-images/catalog/produto_06A.jpg','https://wekdvyvpyvwllbxnxvgi.supabase.co/storage/v1/object/public/product-images/catalog/produto_06B.png','https://wekdvyvpyvwllbxnxvgi.supabase.co/storage/v1/object/public/product-images/catalog/produto_06C.jpg']),
  ('P1006', ARRAY['https://wekdvyvpyvwllbxnxvgi.supabase.co/storage/v1/object/public/product-images/catalog/produto_07A.jpg','https://wekdvyvpyvwllbxnxvgi.supabase.co/storage/v1/object/public/product-images/catalog/produto_07B.jpg','https://wekdvyvpyvwllbxnxvgi.supabase.co/storage/v1/object/public/product-images/catalog/produto_07C.jpg'])
)
UPDATE products p SET images = m.imgs, updated_at = now()
FROM mapping m WHERE p.code = m.code;

-- Deactivate other products with no real images so the storefront stays curated
UPDATE products SET active = false
WHERE code NOT IN ('P1000','P1001','P1002','P1003','P1004','P1005','P1006');

-- Superadmin marker table
CREATE TABLE public.superadmins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.superadmins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.superadmins WHERE user_id = _user_id);
$$;

CREATE POLICY "Superadmins manage superadmins" ON public.superadmins
  FOR ALL USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Users can see if they are superadmin" ON public.superadmins
  FOR SELECT USING (auth.uid() = user_id);

-- Per-admin page permissions
CREATE TABLE public.admin_page_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, page_key)
);
ALTER TABLE public.admin_page_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins manage page access" ON public.admin_page_access
  FOR ALL USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Users read own page access" ON public.admin_page_access
  FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.can_access_admin_page(_user_id uuid, _page text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_superadmin(_user_id)
      OR EXISTS (SELECT 1 FROM public.admin_page_access WHERE user_id = _user_id AND page_key = _page);
$$;

-- Update is_staff so superadmins are staff too (keep RLS on existing tables working)
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','consultor'))
      OR EXISTS (SELECT 1 FROM public.superadmins WHERE user_id = _user_id);
$$;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_superadmin(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_admin_page(uuid, text) TO anon, authenticated;
-- ENUMS
DO $$ BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('aberta','paga_parcial','paga','vencida','cancelada');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.invoice_payment_method AS ENUM ('pix','boleto','cartao','manual');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- SEQUENCE para code legÃ­vel (FT0001)
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

-- (Acesso pÃºblico por token serÃ¡ feito via server function que usa supabaseAdmin
--  e valida o token explicitamente; nÃ£o criamos policy SELECT pÃºblica aqui.)
-- Permite SELECT pÃºblico em invoices (link de fatura Ã© compartilhÃ¡vel)
DROP POLICY IF EXISTS "Public can view invoices" ON public.invoices;
CREATE POLICY "Public can view invoices" ON public.invoices
  FOR SELECT USING (true);

-- Permite UPDATE pÃºblico para simular confirmaÃ§Ã£o de pagamento (MOCK)
DROP POLICY IF EXISTS "Public can mark invoice paid (mock)" ON public.invoices;
CREATE POLICY "Public can mark invoice paid (mock)" ON public.invoices
  FOR UPDATE USING (true) WITH CHECK (true);

-- Permite INSERT pÃºblico em invoice_payments (MOCK)
DROP POLICY IF EXISTS "Public can insert payment (mock)" ON public.invoice_payments;
CREATE POLICY "Public can insert payment (mock)" ON public.invoice_payments
  FOR INSERT WITH CHECK (true);
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

-- products: column for realocaÃ§Ã£o
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

-- FunÃ§Ã£o helper
CREATE OR REPLACE FUNCTION public.points_balance(_customer_id uuid)
RETURNS int LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(SUM(delta), 0)::int FROM public.points_ledger WHERE customer_id = _customer_id;
$$;

-- Trigger: crÃ©dito automÃ¡tico ao pagar/finalizar pedido
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
DROP VIEW IF EXISTS public.customer_points_balance;
CREATE VIEW public.customer_points_balance
WITH (security_invoker = on) AS
SELECT customer_id, COALESCE(SUM(delta), 0)::int AS balance
FROM public.points_ledger
GROUP BY customer_id;
-- Migration: SincronizaÃ§Ã£o de estoque e baixa automÃ¡tica no faturamento
-- Criado em: 2026-05-17

-- 1. FunÃ§Ã£o para sincronizar estoque do produto convencional com o estoque de reward_items
CREATE OR REPLACE FUNCTION public.sync_reward_product_stock()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Se for um produto fÃ­sico, forÃ§a o estoque da recompensa a ser igual ao do produto
  IF NEW.kind = 'produto_fisico' AND NEW.product_id IS NOT NULL THEN
    SELECT stock INTO NEW.stock FROM public.products WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Criar a trigger para manter estoque de recompensas fÃ­sicas atualizado na inserÃ§Ã£o ou ediÃ§Ã£o
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

-- 3. Trigger para baixar o estoque das peÃ§as de um pedido apenas no faturamento (status = 'pago')
CREATE OR REPLACE FUNCTION public.deduct_stock_on_invoice()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  item RECORD;
BEGIN
  -- SÃ³ faz a baixa quando o status transiciona para 'pago' (Faturado)
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
-- Add 'clube' to the lead_reason enum if it does not already exist
ALTER TYPE public.lead_reason ADD VALUE IF NOT EXISTS 'clube';

-- Update the lead_to_kanban trigger function to route 'clube' leads to the 'clube' board
CREATE OR REPLACE FUNCTION public.lead_to_kanban()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE board_name TEXT; stage_name TEXT;
BEGIN
  IF NEW.reason::text = 'orcamento' THEN board_name := 'orcamento'; stage_name := 'novo';
  ELSIF NEW.reason::text = 'fardamento' THEN board_name := 'fardamento'; stage_name := 'novo';
  ELSIF NEW.reason::text = 'clube' THEN board_name := 'clube'; stage_name := 'novo';
  ELSE board_name := 'duvidas'; stage_name := NEW.reason::text;
  END IF;

  INSERT INTO public.kanban_cards (board, stage, title, description, contact_name, contact_whatsapp, lead_id)
  VALUES (board_name, stage_name, NEW.name, NEW.message, NEW.name, NEW.whatsapp, NEW.id);
  RETURN NEW;
END; $$;
-- =============================================================================
-- Migration: Stack de Features - E-commerce + Marketing Automation
-- Criado em: 2026-05-20
-- DescriÃ§Ã£o: Schema completo para todas as features pendentes
-- =============================================================================

BEGIN;

-- =============================================================================
-- PARTE 1: AUTENTICAÃ‡ÃƒO E USUÃRIOS
-- =============================================================================

-- Adicionar campo para login method na tabela customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS login_method TEXT DEFAULT 'email';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- =============================================================================
-- PARTE 2: ENDEREÃ‡OS DE CLIENTE
-- =============================================================================

-- Tabela de endereÃ§os mÃºltiplos
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
-- PARTE 6: AVALIAÃ‡Ã•ES DE PRODUTOS
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

-- PreÃ§os especiais por produto/cliente (override)
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
-- PARTE 9: NOTIFICAÃ‡Ã•ES DE PRODUTO (AVISE-ME)
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
-- PARTE 10: VIEW PARA MÃ‰TRICAS
-- =============================================================================

-- View para mÃ©tricas de marketing
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
-- PARTE 11: FUNÃ‡Ã•ES AUXILIARES
-- =============================================================================

-- FunÃ§Ã£o para obter preÃ§o de atacado com tier e preÃ§os customizados
CREATE OR REPLACE FUNCTION get_wholesale_price(p_customer_id UUID, p_product_id UUID)
RETURNS NUMERIC(10,2) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_price NUMERIC(10,2);
  v_tier_discount NUMERIC(5,2);
BEGIN
  -- 1. Verificar preÃ§o customizado por cliente
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

  -- 3. Calcular preÃ§o com discount do tier
  IF v_tier_discount IS NOT NULL AND v_tier_discount > 0 THEN
    SELECT (p.retail_price * (1 - v_tier_discount / 100)) INTO v_price
    FROM products p
    WHERE p.id = p_product_id;
    RETURN v_price;
  END IF;

  -- 4. PreÃ§o padrÃ£o de atacado
  SELECT wholesale_price INTO v_price
  FROM products
  WHERE id = p_product_id;

  RETURN COALESCE(v_price, 0);
END;
$$;

-- FunÃ§Ã£o para verificar se cliente pode avaliar produto
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

-- FunÃ§Ã£o para migrar wishlist de guest para user (quando fazer login)
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

  -- Remove duplicatas (mantÃ©m osè¿ç§»)
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

-- Inserir tiers de atacado padrÃ£o
INSERT INTO wholesale_tiers (name, description, min_order_qty, discount_percent, payment_terms, is_active)
VALUES
  ('Bronze', 'Cliente atacadista iniciante', 6, 0, ARRAY['pix', 'boleto'], true),
  ('Prata', 'Cliente atacadista regular', 12, 5, ARRAY['pix', 'boleto', 'credito_30'], true),
  ('Ouro', 'Cliente atacadista VIP', 24, 10, ARRAY['pix', 'boleto', 'credito_30', 'credito_60'], true)
ON CONFLICT DO NOTHING;

-- Inserir templates de mensagens padrÃ£o
INSERT INTO marketing_templates (name, channel, category, subject, body, is_active) VALUES
  ('Follow-up Pedido Entregue', 'whatsapp', 'followup',
   'Como foi sua experiÃªncia?',
   'OlÃ¡ {name}! ðŸŽ‰

Seu pedido {order_code} foi entregue!

 esperamos que vocÃª adore suas novas peÃ§as!

Curtiu? Compartilhe sua experiÃªncia com a gente!
Responda esta mensagem com uma foto - queremos ver vocÃª estilosa! ðŸ’•

Em breve vocÃª receberÃ¡ cupons exclusivos!

Equipe {company_name} ðŸ’•',
   true),

  ('Carrinho Abandonado', 'whatsapp', 'abandoned',
   'Esqueceu algo?',
   'Oi {name}! ðŸ‘‹

Vimos que vocÃª deixou algumas peÃ§as maneiras no carrinho!

ä½¿ç”¨ este cupom para garantir o desconto:
CARRINHO10 - 10% OFF

VÃ¡lido por 24h! â°

Aqui: {cart_checkout_url}

Equipe {company_name} ðŸ’•',
   true),

  ('AniversÃ¡rio', 'whatsapp', 'birthday',
   'Feliz aniversÃ¡rio!',
   'Feliz aniversÃ¡rio, {name}! ðŸŽ‚ðŸŽ‰

Que seu dia seja cheio de amor, alegrias e muitas peÃ§as novas! ðŸ’•

Como presente, vocÃª ganhou um cupom especial!
 ä½¿ç”¨ atÃ© {birthday_valid_date}!

Equipe {company_name} ðŸ’•',
   true),

  ('Newsletter Semanal', 'email', 'newsletter',
   'Novidades da semana - {company_name}',
   '<h1>OlÃ¡ {name}! ðŸ‘‹</h1>
<p>Novas peÃ§as chegaram! Confira:</p>
<p>{newsletter_products}</p>
<p>Use o cupom SEMANA10 para 10% OFF!</p>
<p>Equipe {company_name} ðŸ’•</p>',
   true)
ON CONFLICT DO NOTHING;

-- Inserir fluxos automÃ¡ticos padrÃ£o
INSERT INTO marketing_flows (name, description, trigger_event, trigger_delay, action_channel, action_template, is_active, priority) VALUES
  ('Follow-up Pedido Entregue', 'Envia mensagem 3 dias apÃ³s entrega', 'order_delivered', '3 days', 'whatsapp',
   'OlÃ¡ {name}! ðŸŽ‰ Seu pedido foi entregue! Como foi sua experiÃªncia? Responda com uma foto!', true, 10),
  ('Carrinho Abandonado', 'Envia mensagem 1 hora apÃ³s abandono', 'cart_abandoned', '1 hour', 'whatsapp',
   'Oi {name}! VocÃª esqueceu algumas peÃ§as no carrinho! Use CARRINHO10 para 10% OFF', true, 20),
  ('AniversÃ¡rio', 'Envia mensagem no dia do aniversÃ¡rio', 'birthday', '0', 'whatsapp',
   'Feliz aniversÃ¡rio {name}! ðŸŽ‚ðŸŽ‰ Presentinho pra vocÃª!', true, 5),
  ('Pontos Expirando', 'Avisa 30 dias antes dos pontos expirarem', 'points_expiring', '30 days', 'whatsapp',
   'Oi {name}! Seus {points} pontos vÃ£o expirar em breve! Use eles antes de perder!', true, 15),
  ('Boas-vindas Lojista', 'Welcome para lojistas aprovados', 'wholesale_approved', '0', 'whatsapp',
   'Bem-vindo {name}! ðŸŽ‰ VocÃª agora Ã© parceiro atacadista! Conditions especiales garantem!', true, 25)
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
-- Altera a funÃ§Ã£o handle_new_user para tratar o desenvolvedor de forma especial
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_count INT;
BEGIN
  -- Cria o perfil do usuÃ¡rio
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);

  -- Se for o email exclusivo do desenvolvedor
  IF LOWER(NEW.email) = 'hevertoneduardoperes@gmail.com' THEN
    -- Garante que ele Ã© admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Garante que ele Ã© superadmin
    INSERT INTO public.superadmins (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Garante acesso a todas as pÃ¡ginas administrativas
    INSERT INTO public.admin_page_access (user_id, page_key)
    VALUES 
      (NEW.id, 'inicio'),
      (NEW.id, 'branding'),
      (NEW.id, 'produtos'),
      (NEW.id, 'orcamentos'),
      (NEW.id, 'pedidos'),
      (NEW.id, 'faturas'),
      (NEW.id, 'recibos'),
      (NEW.id, 'nfe'),
      (NEW.id, 'recompensas'),
      (NEW.id, 'clientes'),
      (NEW.id, 'kanban'),
      (NEW.id, 'analises'),
      (NEW.id, 'utm'),
      (NEW.id, 'dev')
    ON CONFLICT (user_id, page_key) DO NOTHING;
  ELSE
    -- Comportamento padrÃ£o para outros usuÃ¡rios
    SELECT COUNT(*) INTO user_count FROM auth.users WHERE LOWER(email) != 'hevertoneduardoperes@gmail.com';
    IF user_count = 1 THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
    ELSE
      INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'consultor');
    END IF;
  END IF;

  RETURN NEW;
END; $$;

-- AtualizaÃ§Ã£o retroativa: caso o usuÃ¡rio jÃ¡ tenha sido criado no auth.users mas nÃ£o esteja configurado corretamente
DO $$
DECLARE
  dev_user_id UUID;
BEGIN
  SELECT id INTO dev_user_id FROM auth.users WHERE LOWER(email) = 'hevertoneduardoperes@gmail.com' LIMIT 1;
  IF dev_user_id IS NOT NULL THEN
    -- Atualiza profile
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (dev_user_id, 'Heverton (Dev)', 'hevertoneduardoperes@gmail.com')
    ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email;

    -- Garante admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (dev_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Garante superadmin
    INSERT INTO public.superadmins (user_id)
    VALUES (dev_user_id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Garante acesso a todas as pÃ¡ginas
    INSERT INTO public.admin_page_access (user_id, page_key)
    VALUES 
      (dev_user_id, 'inicio'),
      (dev_user_id, 'branding'),
      (dev_user_id, 'produtos'),
      (dev_user_id, 'orcamentos'),
      (dev_user_id, 'pedidos'),
      (dev_user_id, 'faturas'),
      (dev_user_id, 'recibos'),
      (dev_user_id, 'nfe'),
      (dev_user_id, 'recompensas'),
      (dev_user_id, 'clientes'),
      (dev_user_id, 'kanban'),
      (dev_user_id, 'analises'),
      (dev_user_id, 'utm'),
      (dev_user_id, 'dev')
    ON CONFLICT (dev_user_id, page_key) DO NOTHING;
  END IF;
END $$;

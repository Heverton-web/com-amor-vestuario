
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

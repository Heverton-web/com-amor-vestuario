-- Altera a função handle_new_user para tratar o desenvolvedor de forma especial
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_count INT;
BEGIN
  -- Cria o perfil do usuário
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);

  -- Se for o email exclusivo do desenvolvedor
  IF LOWER(NEW.email) = 'hevertoneduardoperes@gmail.com' THEN
    -- Garante que ele é admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Garante que ele é superadmin
    INSERT INTO public.superadmins (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Garante acesso a todas as páginas administrativas
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
    -- Comportamento padrão para outros usuários
    SELECT COUNT(*) INTO user_count FROM auth.users WHERE LOWER(email) != 'hevertoneduardoperes@gmail.com';
    IF user_count = 1 THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
    ELSE
      INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'consultor');
    END IF;
  END IF;

  RETURN NEW;
END; $$;

-- Atualização retroativa: caso o usuário já tenha sido criado no auth.users mas não esteja configurado corretamente
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

    -- Garante acesso a todas as páginas
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

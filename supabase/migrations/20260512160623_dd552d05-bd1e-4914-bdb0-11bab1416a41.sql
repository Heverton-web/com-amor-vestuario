
-- site_settings: singleton de branding/conteúdo da landing
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
  'brand_suffix', 'vestuário',
  'tagline', 'feito à mão, com afeto',
  'logo_url', null,
  'primary_color', 'oklch(0.55 0.16 38)',
  'accent_color', 'oklch(0.88 0.06 38)',
  'background_color', 'oklch(0.972 0.018 80)',
  'foreground_color', 'oklch(0.255 0.035 45)',
  'hero_title', 'Roupa que veste história, não só o corpo.',
  'hero_subtitle', 'Peças autorais, coleções de atacado e fardamento corporativo costurados com cuidado de quem ama o ofício.',
  'hero_image_url', null,
  'about_title', 'Uma pequena confecção com olhar grande sobre o que veste você.',
  'about_text', 'A Com Amor Vestuário nasceu numa sala pequena, com uma máquina, três cores de linha e muita vontade de fazer roupa que durasse mais que uma estação.',
  'about_image_url', null,
  'phone', '(00) 0 0000-0000',
  'whatsapp', '5599999999999',
  'email', 'contato@comamor.com',
  'address_line1', 'Rua das Acácias, 142',
  'address_line2', 'Centro — Sua Cidade, BR',
  'instagram_url', 'https://instagram.com',
  'facebook_url', 'https://facebook.com',
  'instagram_handle', '@comamorvestuario',
  'hours_weekday', '09:00 — 18:00',
  'hours_saturday', '09:00 — 13:00',
  'hours_sunday', 'Fechado'
))
on conflict (id) do nothing;

-- branding bucket público para logos e imagens da landing
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

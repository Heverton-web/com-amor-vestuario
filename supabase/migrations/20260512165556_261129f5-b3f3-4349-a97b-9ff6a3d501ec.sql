
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

-- ==============================================================================
-- GIVA 3D - MIGRACIÓN DE TABLA PRODUCTS Y POLÍTICAS RLS EN SUPABASE
-- Ejecutar este script en Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Asegurar columnas de GIVA 3D en la tabla products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS category_slug TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'disponible',
ADD COLUMN IF NOT EXISTS lead_time TEXT DEFAULT '1–2 días',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_offer BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_customizable BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_tiered_pricing BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS price_1 NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS price_6 NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS price_12 NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS price_24 NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS primary_image TEXT;

-- 2. Asegurar columnas en product_images
ALTER TABLE public.product_images
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS storage_path TEXT,
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

-- 3. Asegurar tabla product_colors
CREATE TABLE IF NOT EXISTS public.product_colors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    hex_code TEXT NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Habilitar permisos RLS para lectura y escritura pública/anon (igual que banners)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_colors ENABLE ROW LEVEL SECURITY;

-- Políticas para products
DROP POLICY IF EXISTS "Allow anon read products" ON public.products;
CREATE POLICY "Allow anon read products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anon insert products" ON public.products;
CREATE POLICY "Allow anon insert products" ON public.products FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update products" ON public.products;
CREATE POLICY "Allow anon update products" ON public.products FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow anon delete products" ON public.products;
CREATE POLICY "Allow anon delete products" ON public.products FOR DELETE USING (true);

-- Políticas para product_images
DROP POLICY IF EXISTS "Allow anon read product_images" ON public.product_images;
CREATE POLICY "Allow anon read product_images" ON public.product_images FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anon insert product_images" ON public.product_images;
CREATE POLICY "Allow anon insert product_images" ON public.product_images FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update product_images" ON public.product_images;
CREATE POLICY "Allow anon update product_images" ON public.product_images FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow anon delete product_images" ON public.product_images;
CREATE POLICY "Allow anon delete product_images" ON public.product_images FOR DELETE USING (true);

-- Políticas para product_colors
DROP POLICY IF EXISTS "Allow anon read product_colors" ON public.product_colors;
CREATE POLICY "Allow anon read product_colors" ON public.product_colors FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anon insert product_colors" ON public.product_colors;
CREATE POLICY "Allow anon insert product_colors" ON public.product_colors FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update product_colors" ON public.product_colors;
CREATE POLICY "Allow anon update product_colors" ON public.product_colors FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow anon delete product_colors" ON public.product_colors;
CREATE POLICY "Allow anon delete product_colors" ON public.product_colors FOR DELETE USING (true);

-- 5. Eliminar productos de prueba antiguos de motos si existen
DELETE FROM public.products 
WHERE model IN ('ronco', 'nexus', 'ronco super prime', 'gdfewyuifgrye') 
   OR slug IN ('ronco', 'nexus', 'ronco-ronco-super-prime', 'nexus-gdfewyuifgrye');

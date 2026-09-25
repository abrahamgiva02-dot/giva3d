-- ==============================================================================
-- GIVA 3D - SUPABASE DATABASE SCHEMA
-- E-commerce & 3D Printing Catalog Architecture
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT, -- Lucide icon name or emoji
    image_url TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    category_slug TEXT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'disponible' CHECK (status IN ('disponible', 'bajo_pedido', 'no_disponible')),
    lead_time TEXT DEFAULT '1–2 días',
    is_active BOOLEAN DEFAULT TRUE,
    is_new BOOLEAN DEFAULT FALSE,
    is_best_seller BOOLEAN DEFAULT FALSE,
    is_offer BOOLEAN DEFAULT FALSE,
    is_customizable BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Tiered Pricing Model (Price per unit in Soles S/)
    has_tiered_pricing BOOLEAN DEFAULT TRUE,
    price_1 NUMERIC(10, 2) NOT NULL, -- 1 unit price
    price_6 NUMERIC(10, 2),          -- 6+ units price per unit
    price_12 NUMERIC(10, 2),         -- 12+ units price per unit
    price_24 NUMERIC(10, 2),         -- 24+ units price per unit
    
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. PRODUCT IMAGES TABLE
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    storage_path TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. PRODUCT COLORS / VARIANTS TABLE
CREATE TABLE IF NOT EXISTS public.product_colors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    hex_code TEXT NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. BANNERS TABLE
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT,
    subtitle TEXT,
    badge_text TEXT,
    image_url TEXT,
    image_path TEXT,
    storage_path TEXT,
    mobile_image_url TEXT,
    button_text TEXT,
    button_url TEXT,
    cta_text TEXT,
    cta_url TEXT,
    link_url TEXT,
    sort_order INT DEFAULT 0,
    display_order INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    display_mode TEXT DEFAULT 'with_content',
    image_position TEXT DEFAULT 'center',
    image_fit TEXT DEFAULT 'cover',
    image_zoom NUMERIC DEFAULT 1.0,
    image_position_x NUMERIC DEFAULT 50,
    image_position_y NUMERIC DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migration for existing banners tables:
ALTER TABLE public.banners 
  ADD COLUMN IF NOT EXISTS badge_text TEXT,
  ADD COLUMN IF NOT EXISTS button_text TEXT,
  ADD COLUMN IF NOT EXISTS button_url TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS display_mode TEXT DEFAULT 'with_content',
  ADD COLUMN IF NOT EXISTS image_position TEXT DEFAULT 'center',
  ADD COLUMN IF NOT EXISTS image_fit TEXT DEFAULT 'cover',
  ADD COLUMN IF NOT EXISTS image_zoom NUMERIC DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS image_position_x NUMERIC DEFAULT 50,
  ADD COLUMN IF NOT EXISTS image_position_y NUMERIC DEFAULT 50;

-- 7. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_banners_active ON public.banners(is_active, display_order);

-- 8. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Public can read active categories
CREATE POLICY "Public categories read" ON public.categories
    FOR SELECT USING (is_active = true);

-- Public can read active products
CREATE POLICY "Public products read" ON public.products
    FOR SELECT USING (is_active = true);

-- Public can read product images
CREATE POLICY "Public product images read" ON public.product_images
    FOR SELECT USING (true);

-- Public can read product colors
CREATE POLICY "Public product colors read" ON public.product_colors
    FOR SELECT USING (is_available = true);

-- Public can read active banners
CREATE POLICY "Public banners read" ON public.banners
    FOR SELECT USING (is_active = true);

-- Authenticated admins have full CRUD access
CREATE POLICY "Admin full access categories" ON public.categories
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access products" ON public.products
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access product images" ON public.product_images
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access product colors" ON public.product_colors
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access banners" ON public.banners
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 9. STORAGE BUCKET CONFIGURATION: 'product-images'
-- Create public bucket 'product-images' if it does not exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policies for storage.objects on bucket 'product-images'
-- Public read access: anyone can view product images
CREATE POLICY "Public Read product-images" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');

-- Admin write & delete: authenticated users (and service/admin roles)
CREATE POLICY "Admin Upload product-images" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Admin Update product-images" ON storage.objects
    FOR UPDATE TO authenticated USING (bucket_id = 'product-images');

CREATE POLICY "Admin Delete product-images" ON storage.objects
    FOR DELETE TO authenticated USING (bucket_id = 'product-images');

-- Fallback for local testing or initial setup without Auth:
CREATE POLICY "Anon Upload product-images" ON storage.objects
    FOR INSERT TO anon WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Anon Delete product-images" ON storage.objects
    FOR DELETE TO anon USING (bucket_id = 'product-images');

-- ==============================================================================
-- MIGRATION HELPER (if table already exists in Supabase):
-- ==============================================================================
-- ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS storage_path TEXT;
-- ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;


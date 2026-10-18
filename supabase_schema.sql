-- =========================================================================
-- БАЗА ДАННЫХ САЛОНА ЦВЕТОВ «СОФИЯ» (POSTGRESQL / SUPABASE)
-- Полная синхронизация каталога букетов, отзывов и базы клиентов
-- =========================================================================

-- 1. Таблица клиентов салона
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    phone TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    birth_date DATE,
    total_spent NUMERIC DEFAULT 0,
    orders_count INTEGER DEFAULT 0,
    discount_percent INTEGER DEFAULT 0,
    tier TEXT DEFAULT 'Клиент',
    orders JSONB DEFAULT '[]'::jsonb,
    registered_at DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_last_name ON public.customers(last_name);
CREATE INDEX IF NOT EXISTS idx_customers_birth_date ON public.customers(birth_date);

-- 2. Таблица каталога букетов
CREATE TABLE IF NOT EXISTS public.catalog (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    price NUMERIC NOT NULL,
    category TEXT NOT NULL,
    color TEXT NOT NULL,
    in_stock BOOLEAN DEFAULT true,
    image TEXT NOT NULL,
    description TEXT,
    characteristics JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Таблица отзывов
CREATE TABLE IF NOT EXISTS public.reviews (
    id TEXT PRIMARY KEY,
    author TEXT NOT NULL,
    rating INTEGER DEFAULT 5,
    date TEXT NOT NULL,
    bouquet_title TEXT,
    comment TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Защита Row Level Security (RLS)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 5. Политики доступа
CREATE POLICY "Allow public read access to customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Allow public insert and update to customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access to catalog" ON public.catalog FOR SELECT USING (true);
CREATE POLICY "Allow public insert and update to catalog" ON public.catalog FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access to reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Allow public insert and update to reviews" ON public.reviews FOR ALL USING (true) WITH CHECK (true);

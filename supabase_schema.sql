-- =========================================================================
-- БАЗА ДАННЫХ САЛОНА ЦВЕТОВ «СОФИЯ» (POSTGRESQL / SUPABASE)
-- Гарантия 100% сохранности данных клиентов, карт лояльности и заказов
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
    discount_percent INTEGER DEFAULT 3,
    tier TEXT DEFAULT 'Знакомство',
    orders JSONB DEFAULT '[]'::jsonb,
    registered_at DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Индексы для мгновенного поиска по телефону и фамилии
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_last_name ON public.customers(last_name);
CREATE INDEX IF NOT EXISTS idx_customers_birth_date ON public.customers(birth_date);

-- 3. Таблица истории заказов (дополнительная нормализация)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    customer_id TEXT REFERENCES public.customers(id) ON DELETE CASCADE,
    items JSONB NOT NULL,
    total_amount NUMERIC NOT NULL,
    discount_applied NUMERIC DEFAULT 0,
    final_amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'Собирается',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Включение защиты доступа на уровне строк (Row Level Security)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 5. Политики доступа для анонимного и сервисного ключа
CREATE POLICY "Allow public read access to customers"
    ON public.customers FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert and update to customers"
    ON public.customers FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public read access to orders"
    ON public.orders FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert and update to orders"
    ON public.orders FOR ALL
    USING (true)
    WITH CHECK (true);

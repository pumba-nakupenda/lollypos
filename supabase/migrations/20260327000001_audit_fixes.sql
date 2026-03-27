-- Migration: audit_fixes
-- Date: 2026-03-27
-- Description: Fix all database issues found during audit

-- =============================================================================
-- 1. Create user_calendar_settings table
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.user_calendar_settings (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    google_refresh_token TEXT,
    is_sync_enabled BOOLEAN DEFAULT FALSE,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_calendar_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'user_calendar_settings' AND policyname = 'Users can manage own calendar settings'
    ) THEN
        CREATE POLICY "Users can manage own calendar settings"
            ON public.user_calendar_settings
            FOR ALL
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- =============================================================================
-- 2. Add embedding column to products
-- =============================================================================
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS embedding FLOAT8[];

-- =============================================================================
-- 3. Create all missing indexes
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON public.products(shop_id);
CREATE INDEX IF NOT EXISTS idx_sales_shop_id ON public.sales(shop_id);
CREATE INDEX IF NOT EXISTS idx_expenses_shop_id ON public.expenses(shop_id);
CREATE INDEX IF NOT EXISTS idx_debts_shop_id ON public.debts(shop_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_session_id ON public.cash_movements(session_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_history_profile_id ON public.loyalty_history(profile_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_shop_id ON public.expense_categories(shop_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_profile_id ON public.product_reviews(profile_id);
CREATE INDEX IF NOT EXISTS idx_connection_logs_user_id ON public.connection_logs(user_id);

-- =============================================================================
-- 4. Drop orphaned Agency tables (order matters due to foreign key dependencies)
-- =============================================================================
DROP TABLE IF EXISTS public.agency_task_time_entries CASCADE;
DROP TABLE IF EXISTS public.agency_task_comments CASCADE;
DROP TABLE IF EXISTS public.agency_task_links CASCADE;
DROP TABLE IF EXISTS public.agency_task_badges CASCADE;
DROP TABLE IF EXISTS public.agency_task_categories CASCADE;
DROP TABLE IF EXISTS public.agency_tasks CASCADE;
DROP TABLE IF EXISTS public.agency_stages CASCADE;
DROP TABLE IF EXISTS public.agency_project_comments CASCADE;
DROP TABLE IF EXISTS public.agency_project_templates CASCADE;
DROP TABLE IF EXISTS public.agency_projects CASCADE;

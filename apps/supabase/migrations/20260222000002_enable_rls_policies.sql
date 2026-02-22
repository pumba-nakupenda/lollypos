-- ============================================================
-- SUPABASE MIGRATION: 20260222000002_enable_rls_policies.sql
-- Enable Row Level Security and apply all policies.
-- This is a separate migration to ensure all dependent functions
-- and tables are fully established first.
-- ============================================================

-- 1. Enable RLS on all relevant tables
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_task_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

-- 2. Apply Universal Shop Isolation Policies
-- Drop existing policies first to ensure idempotency
DROP POLICY IF EXISTS "Universal Shop Isolation: Shops" ON public.shops;
DROP POLICY IF EXISTS "Profiles: View own or Admin view all" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: Admin manage all" ON public.profiles;
DROP POLICY IF EXISTS "Universal Shop Isolation: Products" ON public.products;
DROP POLICY IF EXISTS "Universal Shop Isolation: Customers" ON public.customers;
DROP POLICY IF EXISTS "Universal Shop Isolation: Sales" ON public.sales;
DROP POLICY IF EXISTS "Universal Shop Isolation: Sale Items" ON public.sale_items;
DROP POLICY IF EXISTS "Universal Shop Isolation: Expenses" ON public.expenses;
DROP POLICY IF EXISTS "Universal Shop Isolation: Expense Categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Universal Shop Isolation: Debts" ON public.debts;
DROP POLICY IF EXISTS "Universal Shop Isolation: Agency Projects" ON public.agency_projects;
DROP POLICY IF EXISTS "Universal Shop Isolation: Agency Stages" ON public.agency_stages;
DROP POLICY IF EXISTS "Universal Shop Isolation: Agency Tasks" ON public.agency_tasks;
DROP POLICY IF EXISTS "Universal Shop Isolation: Agency Task Links" ON public.agency_task_links;
DROP POLICY IF EXISTS "Universal Shop Isolation: Agency Task Comments" ON public.agency_task_comments;
DROP POLICY IF EXISTS "Universal Shop Isolation: Agency Project Templates" ON public.agency_project_templates;
DROP POLICY IF EXISTS "Universal Shop Isolation: Cash Sessions" ON public.cash_sessions;
DROP POLICY IF EXISTS "Universal Shop Isolation: Cash Movements" ON public.cash_movements;
DROP POLICY IF EXISTS "Universal Shop Isolation: Debt Payments" ON public.debt_payments;

DROP POLICY IF EXISTS "Public: Products" ON public.products;
DROP POLICY IF EXISTS "Public: Shipping Zones" ON public.shipping_zones;
DROP POLICY IF EXISTS "Public: Coupons" ON public.coupons;
DROP POLICY IF EXISTS "Public: Product Reviews" ON public.product_reviews;

DROP POLICY IF EXISTS "Personal: Wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Personal: Loyalty History" ON public.loyalty_history;
DROP POLICY IF EXISTS "Personal: Own Reviews" ON public.product_reviews;

-- Universal Shop Isolation: Shops
CREATE POLICY "Universal Shop Isolation: Shops" ON public.shops FOR SELECT TO authenticated USING (
    public.check_is_admin() OR id = ANY(public.get_user_authorized_shops())
);
-- PROFILES (Special: Everyone sees their own, Admins see all)
DROP POLICY IF EXISTS "Universal Shop Isolation: Profiles" ON public.profiles;

CREATE POLICY "Profiles: View own or Admin view all" ON public.profiles
FOR SELECT TO authenticated USING (
    auth.uid() = id OR public.check_is_admin()
);

CREATE POLICY "Profiles: Admin manage all" ON public.profiles
FOR ALL TO authenticated USING (public.check_is_admin());

CREATE POLICY "Universal Shop Isolation: Products" ON public.products FOR ALL TO authenticated USING (
    public.check_is_admin() OR shop_id = ANY(public.get_user_authorized_shops())
) WITH CHECK (
    public.check_is_admin() OR shop_id = ANY(public.get_user_authorized_shops())
);
CREATE POLICY "Universal Shop Isolation: Customers" ON public.customers FOR ALL TO authenticated USING (
    public.check_is_admin() OR shop_id = ANY(public.get_user_authorized_shops())
) WITH CHECK (
    public.check_is_admin() OR shop_id = ANY(public.get_user_authorized_shops())
);
CREATE POLICY "Universal Shop Isolation: Sales" ON public.sales FOR ALL TO authenticated USING (
    public.check_is_admin() OR shop_id = ANY(public.get_user_authorized_shops())
) WITH CHECK (
    public.check_is_admin() OR shop_id = ANY(public.get_user_authorized_shops())
);
CREATE POLICY "Universal Shop Isolation: Sale Items" ON public.sale_items FOR ALL TO authenticated USING (
    public.check_is_admin() OR EXISTS (
        SELECT 1 FROM public.sales s 
        WHERE s.id = sale_id AND s.shop_id = ANY(public.get_user_authorized_shops())
    )
);
CREATE POLICY "Universal Shop Isolation: Expenses" ON public.expenses FOR ALL TO authenticated USING (
    public.check_is_admin() OR shop_id = ANY(public.get_user_authorized_shops())
) WITH CHECK (
    public.check_is_admin() OR shop_id = ANY(public.get_user_authorized_shops())
);

-- SITE SETTINGS (Admin only for write, public for read)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage site settings" ON public.site_settings;
CREATE POLICY "Admins can manage site settings" ON public.site_settings
FOR ALL TO authenticated USING (public.check_is_admin())
WITH CHECK (public.check_is_admin());

DROP POLICY IF EXISTS "Public read access for site settings" ON public.site_settings;
CREATE POLICY "Public read access for site settings" ON public.site_settings
FOR SELECT TO public USING (true); -- Public read to get config for website

CREATE POLICY "Universal Shop Isolation: Expense Categories" ON public.expense_categories FOR ALL TO authenticated USING (
    public.check_is_admin() OR shop_id = ANY(public.get_user_authorized_shops())
) WITH CHECK (
    public.check_is_admin() OR shop_id = ANY(public.get_user_authorized_shops())
);
CREATE POLICY "Universal Shop Isolation: Debts" ON public.debts FOR ALL TO authenticated USING (
    public.check_is_admin() OR shop_id = ANY(public.get_user_authorized_shops())
) WITH CHECK (
    public.check_is_admin() OR shop_id = ANY(public.get_user_authorized_shops())
);
CREATE POLICY "Universal Shop Isolation: Agency Projects" ON public.agency_projects FOR ALL TO authenticated USING (
    public.check_is_admin() OR shop_id = ANY(public.get_user_authorized_shops())
) WITH CHECK (
    public.check_is_admin() OR shop_id = ANY(public.get_user_authorized_shops())
);
CREATE POLICY "Universal Shop Isolation: Agency Stages" ON public.agency_stages FOR ALL TO authenticated USING (
    public.check_is_admin() OR EXISTS (
        SELECT 1 FROM public.agency_projects p WHERE p.id = project_id AND p.shop_id = ANY(public.get_user_authorized_shops())
    )
);
CREATE POLICY "Universal Shop Isolation: Agency Tasks" ON public.agency_tasks FOR ALL TO authenticated USING (
    public.check_is_admin() OR EXISTS (
        SELECT 1 FROM public.agency_stages s JOIN public.agency_projects p ON p.id = s.project_id
        WHERE s.id = stage_id AND p.shop_id = ANY(public.get_user_authorized_shops())
    )
) WITH CHECK (public.check_is_admin() OR assignee_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.agency_stages s JOIN public.agency_projects p ON p.id = s.project_id
        WHERE s.id = stage_id AND p.shop_id = ANY(public.get_user_authorized_shops())
    ));
CREATE POLICY "Universal Shop Isolation: Agency Task Links" ON public.agency_task_links FOR ALL TO authenticated USING (
    public.check_is_admin() OR EXISTS (
        SELECT 1 FROM public.agency_tasks t JOIN public.agency_stages s ON t.stage_id = s.id JOIN public.agency_projects p ON s.project_id = p.id
        WHERE (t.id = from_task_id OR t.id = to_task_id) AND p.shop_id = ANY(public.get_user_authorized_shops())
    )
);
CREATE POLICY "Universal Shop Isolation: Agency Task Comments" ON public.agency_task_comments FOR ALL TO authenticated USING (
    public.check_is_admin() OR user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.agency_tasks t JOIN public.agency_stages s ON t.stage_id = s.id JOIN public.agency_projects p ON s.project_id = p.id
        WHERE t.id = task_id AND p.shop_id = ANY(public.get_user_authorized_shops())
    )
) WITH CHECK (public.check_is_admin() OR user_id = auth.uid());

CREATE POLICY "Universal Shop Isolation: Agency Project Templates" ON public.agency_project_templates FOR ALL TO authenticated USING (
    public.check_is_admin() OR shop_id = ANY(public.get_user_authorized_shops())
) WITH CHECK (
    public.check_is_admin() OR shop_id = ANY(public.get_user_authorized_shops())
);

CREATE POLICY "Universal Shop Isolation: Cash Sessions" ON public.cash_sessions FOR ALL TO authenticated USING (
    public.check_is_admin() OR shop_id = ANY(public.get_user_authorized_shops())
) WITH CHECK (
    public.check_is_admin() OR shop_id = ANY(public.get_user_authorized_shops())
);
CREATE POLICY "Universal Shop Isolation: Cash Movements" ON public.cash_movements FOR ALL TO authenticated USING (
    public.check_is_admin() OR shop_id = ANY(public.get_user_authorized_shops())
) WITH CHECK (
    public.check_is_admin() OR shop_id = ANY(public.get_user_authorized_shops())
);
CREATE POLICY "Universal Shop Isolation: Debt Payments" ON public.debt_payments FOR ALL TO authenticated USING (
    public.check_is_admin() OR EXISTS (
        SELECT 1 FROM public.debts d WHERE d.id = debt_id AND d.shop_id = ANY(public.get_user_authorized_shops())
    )
) WITH CHECK (public.check_is_admin() OR EXISTS (
        SELECT 1 FROM public.debts d WHERE d.id = debt_id AND d.shop_id = ANY(public.get_user_authorized_shops())
    ));

-- 3. Website public access policies (SELECT only)
CREATE POLICY "Public: Products" ON public.products FOR SELECT TO public USING (show_on_website = true);
CREATE POLICY "Public: Shipping Zones" ON public.shipping_zones FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Public: Coupons" ON public.coupons FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Public: Product Reviews" ON public.product_reviews FOR SELECT TO public USING (status = 'approved');

-- 4. Personal Data access policies (Auth user sees their own data)
CREATE POLICY "Personal: Wishlist" ON public.wishlist FOR ALL TO authenticated USING (auth.uid() = profile_id);
CREATE POLICY "Personal: Loyalty History" ON public.loyalty_history FOR SELECT TO authenticated USING (auth.uid() = profile_id);
CREATE POLICY "Personal: Own Reviews" ON public.product_reviews FOR ALL TO authenticated USING (auth.uid() = profile_id);

-- 5. Final Schema Reload
NOTIFY pgrst, 'reload schema';

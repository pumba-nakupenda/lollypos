-- ============================================================
-- MANAGEABLE LISTS FOR AGENCY TASKS
-- ============================================================

-- 1. Table for Categories
CREATE TABLE IF NOT EXISTS public.agency_task_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    icon TEXT DEFAULT 'FileText',
    color TEXT DEFAULT '#888888',
    shop_id BIGINT REFERENCES public.shops(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table for Badges (Tags)
CREATE TABLE IF NOT EXISTS public.agency_task_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#0055ff',
    shop_id BIGINT REFERENCES public.shops(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS Policies
ALTER TABLE public.agency_task_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_task_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all_categories" ON public.agency_task_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_badges" ON public.agency_task_badges FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Initial Seed Data
INSERT INTO public.agency_task_categories (name, icon, color) VALUES 
('Technique', 'Building2', '#ef4444'),
('Logistique', 'Truck', '#3b82f6'),
('Création', 'Sparkles', '#8b5cf6'),
('Repérage', 'Globe', '#10b981'),
('Général', 'FileText', '#64748b')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.agency_task_badges (name, color) VALUES 
('Urgent', '#ef4444'),
('Important', '#f59e0b'),
('Optionnel', '#64748b'),
('En attente client', '#8b5cf6'),
('Validé', '#10b981')
ON CONFLICT (name) DO NOTHING;

NOTIFY pgrst, 'reload schema';

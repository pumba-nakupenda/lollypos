-- ============================================================
-- MODULE TIME TRACKING - LOLLY AGENCY
-- ============================================================

-- 1. Table des entrées de temps
CREATE TABLE IF NOT EXISTS public.agency_task_time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.agency_tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    end_time TIMESTAMPTZ,
    duration_seconds INTEGER DEFAULT 0, -- Stocké lors de l'arrêt
    description TEXT,
    is_manual BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Index pour les calculs rapides
CREATE INDEX IF NOT EXISTS idx_time_entries_task ON public.agency_task_time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user ON public.agency_task_time_entries(user_id);

-- 3. Activer RLS
ALTER TABLE public.agency_task_time_entries ENABLE ROW LEVEL SECURITY;

-- 4. Politiques RLS
CREATE POLICY "time_entries_select" ON public.agency_task_time_entries FOR SELECT USING (true);
CREATE POLICY "time_entries_insert" ON public.agency_task_time_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "time_entries_update" ON public.agency_task_time_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "time_entries_delete" ON public.agency_task_time_entries FOR DELETE USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';

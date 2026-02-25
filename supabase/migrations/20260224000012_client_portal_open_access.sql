-- ============================================================
-- MODULE PARTAGE CLIENT - ULTRA ROBUSTE
-- ============================================================

-- 1. Nettoyer tout
DROP POLICY IF EXISTS "public_read_by_token" ON public.agency_projects;
DROP POLICY IF EXISTS "public_read_stages_by_token" ON public.agency_stages;
DROP POLICY IF EXISTS "public_read_tasks_by_token" ON public.agency_tasks;
DROP POLICY IF EXISTS "public_read_links_by_token" ON public.agency_task_links;
DROP POLICY IF EXISTS "public_read_profiles_names" ON public.profiles;

-- 2. Désactiver temporairement RLS sur ces tables pour tester si c'est ça qui bloque
-- (On les réactivera proprement une fois le flux validé, ou on utilise des politiques ultra-larges)
-- Pour l'instant, on met des politiques "true" totales pour le SELECT uniquement.

CREATE POLICY "portal_select_projects" ON public.agency_projects FOR SELECT TO public USING (true);
CREATE POLICY "portal_select_stages" ON public.agency_stages FOR SELECT TO public USING (true);
CREATE POLICY "portal_select_tasks" ON public.agency_tasks FOR SELECT TO public USING (true);
CREATE POLICY "portal_select_links" ON public.agency_task_links FOR SELECT TO public USING (true);
CREATE POLICY "portal_select_profiles" ON public.profiles FOR SELECT TO public USING (true);

-- 3. S'assurer que les tables sont bien en mode RLS (pour que les politiques s'appliquent)
ALTER TABLE public.agency_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_task_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';

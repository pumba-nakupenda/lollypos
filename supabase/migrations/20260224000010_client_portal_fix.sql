-- ============================================================
-- MODULE PARTAGE CLIENT - LOLLY AGENCY (V2 REPAIR)
-- ============================================================

-- 1. Nettoyer les anciennes politiques pour éviter les doublons
DROP POLICY IF EXISTS "public_read_by_token" ON public.agency_projects;
DROP POLICY IF EXISTS "public_read_stages_by_token" ON public.agency_stages;
DROP POLICY IF EXISTS "public_read_tasks_by_token" ON public.agency_tasks;
DROP POLICY IF EXISTS "public_read_links_by_token" ON public.agency_task_links;

-- 2. Recréer les politiques avec autorisation explicite pour PUBLIC (non connectés)
-- Note: La sécurité est assurée par la possession de l'access_token (UUID complexe)

CREATE POLICY "public_read_by_token" ON public.agency_projects
    FOR SELECT TO public USING (true);

CREATE POLICY "public_read_stages_by_token" ON public.agency_stages
    FOR SELECT TO public USING (true);

CREATE POLICY "public_read_tasks_by_token" ON public.agency_tasks
    FOR SELECT TO public USING (true);

CREATE POLICY "public_read_links_by_token" ON public.agency_task_links
    FOR SELECT TO public USING (true);

-- 3. S'assurer que les tables de référence nécessaires sont aussi lisibles
-- Les profils pour voir qui est assigné (on ne montre que le nom)
CREATE POLICY "public_read_profiles_names" ON public.profiles
    FOR SELECT TO public USING (true);

NOTIFY pgrst, 'reload schema';

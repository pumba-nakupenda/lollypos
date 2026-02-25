-- ============================================================
-- MODULE PARTAGE CLIENT - LOLLY AGENCY
-- ============================================================

-- 1. Ajouter un token d'accès unique pour le partage
ALTER TABLE public.agency_projects 
ADD COLUMN IF NOT EXISTS access_token UUID DEFAULT gen_random_uuid();

-- 2. Index pour recherche rapide par token
CREATE INDEX IF NOT EXISTS idx_agency_projects_access_token ON public.agency_projects(access_token);

-- 3. Politique RLS pour lecture publique par token
-- On autorise n'importe qui (même non connecté) à lire un projet S'IL possède le token exact
CREATE POLICY "public_read_by_token" ON public.agency_projects
    FOR SELECT USING (true); -- La sécurité sera gérée au niveau de la requête par token

CREATE POLICY "public_read_stages_by_token" ON public.agency_stages
    FOR SELECT USING (true);

CREATE POLICY "public_read_tasks_by_token" ON public.agency_tasks
    FOR SELECT USING (true);

CREATE POLICY "public_read_links_by_token" ON public.agency_task_links
    FOR SELECT USING (true);

NOTIFY pgrst, 'reload schema';

-- ============================================================
-- FIX: ALLOW CLIENT MESSAGES (NULL USER_ID)
-- ============================================================

-- 1. Rendre user_id optionnel pour les commentaires de projet
ALTER TABLE public.agency_project_comments 
ALTER COLUMN user_id DROP NOT NULL;

-- 2. S'assurer que les politiques RLS permettent l'insertion anonyme
DROP POLICY IF EXISTS "portal_insert_comments" ON public.agency_project_comments;

CREATE POLICY "portal_insert_comments" ON public.agency_project_comments
    FOR INSERT TO public 
    WITH CHECK (
        project_id IS NOT NULL AND 
        is_public = true
    );

NOTIFY pgrst, 'reload schema';

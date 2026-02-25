-- ============================================================
-- MODULE DISCUSSION DE PROJET - LOLLY AGENCY
-- ============================================================

CREATE TABLE IF NOT EXISTS agency_project_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES agency_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour accélérer le chargement des commentaires d'un projet
CREATE INDEX IF NOT EXISTS idx_agency_project_comments_project_id ON agency_project_comments(project_id);

-- Sécurité RLS
ALTER TABLE agency_project_comments ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs authentifiés peuvent lire et écrire des commentaires
CREATE POLICY "auth_all_project_comments" ON agency_project_comments 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Rafraîchir le cache du schéma Supabase
NOTIFY pgrst, 'reload schema';

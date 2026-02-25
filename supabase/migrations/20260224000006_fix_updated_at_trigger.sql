-- ============================================================
-- REPARATION DES COLONNES DE DATE ET TRIGGERS - LOLLY GROUP
-- ============================================================

-- 1. Sécuriser la fonction de mise à jour pour éviter l'erreur "no field updated_at"
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- On vérifie si la colonne existe avant de tenter de la mettre à jour
    -- Dans PostgreSQL, NEW est un record, on ne peut pas tester l'existence facilement en PL/pgSQL pur sans bloc exception
    BEGIN
        NEW.updated_at = NOW();
    EXCEPTION WHEN undefined_column THEN
        -- Si la colonne n'existe pas, on ne fait rien au lieu de bloquer la sauvegarde
        RETURN NEW;
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Ajouter la colonne manquante aux tables de commentaires (au cas où)
ALTER TABLE public.agency_project_comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.agency_task_comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. S'assurer que la table profiles a bien sa colonne (c'est elle qui bloque probablement l'admin)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Re-notifier pour le schéma
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- MISE À JOUR DES RÔLES PROFESSIONNELS - LOLLY GROUP
-- ============================================================

-- 1. Supprimer l'ancienne contrainte
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Ajouter la nouvelle contrainte avec tous les niveaux d'accès
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'manager', 'lead', 'inventory', 'cashier', 'client'));

-- 3. Notification pour rechargement du schéma
NOTIFY pgrst, 'reload schema';

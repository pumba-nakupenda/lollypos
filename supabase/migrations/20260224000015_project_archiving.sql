-- ============================================================
-- PROJECT ARCHIVING MODULE
-- ============================================================

-- 1. Add is_archived column
ALTER TABLE public.agency_projects 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- 2. Index for performance
CREATE INDEX IF NOT EXISTS idx_agency_projects_archived ON public.agency_projects(is_archived);

NOTIFY pgrst, 'reload schema';

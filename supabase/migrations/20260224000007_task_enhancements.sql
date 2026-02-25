-- ============================================================
-- ENHANCEMENT: TASK CATEGORIES & GOOGLE DRIVE LINKS
-- ============================================================

-- 1. Add category and tags to agency_tasks
ALTER TABLE public.agency_tasks 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Général',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS drive_links JSONB DEFAULT '[]';

-- 2. Add category index for faster filtering
CREATE INDEX IF NOT EXISTS idx_agency_tasks_category ON public.agency_tasks(category);

-- 3. Notify schema reload
NOTIFY pgrst, 'reload schema';

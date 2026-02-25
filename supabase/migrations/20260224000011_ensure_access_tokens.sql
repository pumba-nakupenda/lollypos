-- ============================================================
-- ENSURE ALL PROJECTS HAVE ACCESS TOKENS
-- ============================================================

-- Populate missing tokens for existing projects
UPDATE public.agency_projects 
SET access_token = gen_random_uuid() 
WHERE access_token IS NULL;

-- Make it NOT NULL for future safety
ALTER TABLE public.agency_projects 
ALTER COLUMN access_token SET NOT NULL;

NOTIFY pgrst, 'reload schema';

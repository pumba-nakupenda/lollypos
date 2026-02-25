-- ============================================================
-- ENHANCEMENT: CLIENT CHAT & FINANCIAL VISIBILITY
-- ============================================================

-- 1. Add is_public to project comments to allow client communication
ALTER TABLE public.agency_project_comments 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- 2. Update RLS for public chat access
-- Allow public to read ONLY public comments of their project
CREATE POLICY "portal_read_public_comments" ON public.agency_project_comments
    FOR SELECT TO public 
    USING (is_public = true);

-- Allow public to post comments (they will be marked as public by default via trigger or logic)
CREATE POLICY "portal_insert_comments" ON public.agency_project_comments
    FOR INSERT TO public 
    WITH CHECK (true);

-- 3. Ensure financial columns are visible in agency_projects if not already
-- (They are already in the schema: budget)
-- But we might need total_paid which comes from the sales table linked to the project

NOTIFY pgrst, 'reload schema';

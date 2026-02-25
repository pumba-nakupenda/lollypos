-- ============================================================
-- ENHANCEMENT: CHAT UNREAD TRACKING & REALTIME
-- ============================================================

-- 1. Add tracking columns to project comments
ALTER TABLE public.agency_project_comments 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- 2. Add tracking and visibility columns to task comments
ALTER TABLE public.agency_task_comments 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- 3. Update RLS for task comments (similar to project comments)
-- Allow public to read ONLY public task comments
CREATE POLICY "portal_read_public_task_comments" ON public.agency_task_comments
    FOR SELECT TO public 
    USING (is_public = true);

-- Allow public to post task comments (though portal usually uses project comments, let's be consistent)
CREATE POLICY "portal_insert_task_comments" ON public.agency_task_comments
    FOR INSERT TO public 
    WITH CHECK (true);

-- 4. Function to mark comments as read for a project
CREATE OR REPLACE FUNCTION public.mark_project_comments_as_read(p_project_id UUID, p_user_id UUID)
RETURNS void AS $$
BEGIN
    -- Mark project comments as read
    UPDATE public.agency_project_comments
    SET read_at = now()
    WHERE project_id = p_project_id 
    AND user_id != p_user_id -- Don't mark own messages as read (optional, but logical)
    AND read_at IS NULL;

    -- Mark task comments as read for all tasks in this project
    UPDATE public.agency_task_comments
    SET read_at = now()
    WHERE task_id IN (
        SELECT id FROM public.agency_tasks 
        WHERE stage_id IN (SELECT id FROM public.agency_stages WHERE project_id = p_project_id)
    )
    AND user_id != p_user_id
    AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Enable Realtime for these tables
-- Note: Realtime must be enabled in the Supabase Dashboard or via SQL for the 'realtime' publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'agency_project_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.agency_project_comments;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'agency_task_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.agency_task_comments;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

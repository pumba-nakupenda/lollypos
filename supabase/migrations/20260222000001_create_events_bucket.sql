-- ============================================================
-- SUPABASE MIGRATION: 20260222000001_create_events_bucket.sql
-- Create a dedicated storage bucket for event banners and images
-- ============================================================

-- 1. Create the 'events' storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('events', 'events', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up RLS for the 'events' bucket
-- Drop existing policies first to ensure idempotency
DROP POLICY IF EXISTS "Enable public read access for event images" ON storage.objects;
DROP POLICY IF EXISTS "Enable authenticated insert access for event images" ON storage.objects;
DROP POLICY IF EXISTS "Enable authenticated update access for event images" ON storage.objects;
DROP POLICY IF EXISTS "Enable authenticated delete access for event images" ON storage.objects;

-- Allow public read access (for the frontend to display banners)
CREATE POLICY "Enable public read access for event images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'events');

-- Allow authenticated admin insert access
CREATE POLICY "Enable authenticated insert access for event images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'events' AND (SELECT public.check_is_admin()));

-- Allow authenticated admin update access
CREATE POLICY "Enable authenticated update access for event images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'events') -- Admin can update their own uploads, no need for check_is_admin here again in USING
WITH CHECK (bucket_id = 'events' AND (SELECT public.check_is_admin()));

-- Allow authenticated admin delete access
CREATE POLICY "Enable authenticated delete access for event images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'events' AND (SELECT public.check_is_admin()));

-- 3. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

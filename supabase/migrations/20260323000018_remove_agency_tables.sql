-- Migration: Remove all Lolly Agency related tables and data
-- This removes the agency/project management module entirely

-- Drop triggers first
DROP TRIGGER IF EXISTS update_agency_projects_updated_at ON agency_projects;
DROP TRIGGER IF EXISTS update_agency_tasks_updated_at ON agency_tasks;
DROP TRIGGER IF EXISTS update_agency_project_comments_updated_at ON agency_project_comments;
DROP TRIGGER IF EXISTS update_agency_task_comments_updated_at ON agency_task_comments;

-- Disable realtime on agency tables
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS agency_project_comments;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS agency_task_comments;

-- Drop agency tables (order matters due to foreign keys)
DROP TABLE IF EXISTS agency_task_time_entries CASCADE;
DROP TABLE IF EXISTS agency_task_comments CASCADE;
DROP TABLE IF EXISTS agency_task_links CASCADE;
DROP TABLE IF EXISTS agency_task_badges CASCADE;
DROP TABLE IF EXISTS agency_task_categories CASCADE;
DROP TABLE IF EXISTS agency_tasks CASCADE;
DROP TABLE IF EXISTS agency_stages CASCADE;
DROP TABLE IF EXISTS agency_project_comments CASCADE;
DROP TABLE IF EXISTS agency_project_templates CASCADE;
DROP TABLE IF EXISTS agency_projects CASCADE;

-- Drop the mark_project_comments_as_read function
DROP FUNCTION IF EXISTS mark_project_comments_as_read(UUID, UUID);

-- Remove shop id=3 (Lolly Agency) from shops table
DELETE FROM shops WHERE id = 3;

-- Clean up any expense categories specific to agency (shop_id=3 personal categories)
DELETE FROM expense_categories WHERE shop_id = 3 AND is_personal = true;

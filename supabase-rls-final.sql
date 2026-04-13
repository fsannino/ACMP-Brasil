-- ============================================
-- ACMP Brasil - RLS Policies (Final v2)
-- Fix: uses SECURITY DEFINER functions to avoid
-- infinite recursion on member_profiles
-- ============================================

-- First, drop all existing policies to start clean
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname, tablename FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- ==========================================
-- Helper functions (SECURITY DEFINER = bypass RLS)
-- These avoid infinite recursion when policies
-- need to check the user's own role/status
-- ==========================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM member_profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.get_my_status()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT membership_status FROM member_profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.get_my_ccmp()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(ccmp_certified, false) FROM member_profiles WHERE id = auth.uid()
$$;

-- ==========================================
-- member_profiles
-- ==========================================
ALTER TABLE member_profiles ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own profile
CREATE POLICY "own_profile_select" ON member_profiles
    FOR SELECT USING (auth.uid() = id);

-- Authenticated users can update their own profile
CREATE POLICY "own_profile_update" ON member_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow insert from trigger (new user registration)
CREATE POLICY "allow_insert_from_trigger" ON member_profiles
    FOR INSERT WITH CHECK (true);

-- Admin can do everything (no recursion - uses function)
CREATE POLICY "admin_all_profiles" ON member_profiles
    FOR ALL USING (public.get_my_role() = 'admin');

-- Moderator can read all profiles
CREATE POLICY "moderator_read_profiles" ON member_profiles
    FOR SELECT USING (public.get_my_role() IN ('admin', 'moderator'));

-- ==========================================
-- exclusive_content
-- ==========================================
ALTER TABLE exclusive_content ENABLE ROW LEVEL SECURITY;

-- Public content: anyone can read
CREATE POLICY "public_content" ON exclusive_content
    FOR SELECT USING (access_level = 'public');

-- Community content: any authenticated user
CREATE POLICY "community_content" ON exclusive_content
    FOR SELECT USING (
        access_level IN ('public', 'community') AND auth.uid() IS NOT NULL
    );

-- Member content: active members
CREATE POLICY "member_content" ON exclusive_content
    FOR SELECT USING (
        access_level IN ('public', 'community', 'member') AND
        public.get_my_status() = 'active'
    );

-- Certified content: CCMP holders
CREATE POLICY "certified_content" ON exclusive_content
    FOR SELECT USING (
        access_level IN ('public', 'community', 'member', 'certified') AND
        public.get_my_ccmp() = true
    );

-- Admin can manage all content
CREATE POLICY "admin_manage_content" ON exclusive_content
    FOR ALL USING (public.get_my_role() = 'admin');

-- ==========================================
-- content_access_log
-- ==========================================
ALTER TABLE content_access_log ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can insert their own log
CREATE POLICY "log_own_access" ON content_access_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin can read all logs
CREATE POLICY "admin_read_logs" ON content_access_log
    FOR SELECT USING (public.get_my_role() = 'admin');

-- ==========================================
-- imported_members
-- ==========================================
ALTER TABLE imported_members ENABLE ROW LEVEL SECURITY;

-- Only admin can manage imported members
CREATE POLICY "admin_manage_imports" ON imported_members
    FOR ALL USING (public.get_my_role() = 'admin');

-- ==========================================
-- jobs
-- ==========================================
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Jobs are public (anyone can read)
CREATE POLICY "jobs_public_read" ON jobs
    FOR SELECT USING (true);

-- Admin can manage jobs
CREATE POLICY "admin_manage_jobs" ON jobs
    FOR ALL USING (public.get_my_role() = 'admin');

-- Service role can insert (for scraper)
CREATE POLICY "service_insert_jobs" ON jobs
    FOR INSERT WITH CHECK (true);

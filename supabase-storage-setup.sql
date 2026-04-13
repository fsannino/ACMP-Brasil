-- ============================================
-- ACMP Brasil - Supabase Storage Setup
-- Create the 'content-files' bucket for admin uploads
-- ============================================

-- 1. Create the bucket (run this in SQL Editor)
INSERT INTO storage.buckets (id, name, public)
VALUES ('content-files', 'content-files', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow authenticated admins to upload files
CREATE POLICY "admin_upload" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'content-files' AND
        auth.uid() IN (SELECT id FROM public.member_profiles WHERE role = 'admin')
    );

-- 3. Allow authenticated admins to update/delete files
CREATE POLICY "admin_manage" ON storage.objects
    FOR ALL TO authenticated
    USING (
        bucket_id = 'content-files' AND
        auth.uid() IN (SELECT id FROM public.member_profiles WHERE role = 'admin')
    );

-- 4. Allow public read access (since bucket is public)
CREATE POLICY "public_read" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'content-files');

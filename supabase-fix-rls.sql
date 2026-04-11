DROP POLICY IF EXISTS "Users can view own profile" ON member_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON member_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON member_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON member_profiles;

CREATE POLICY "Anyone authenticated can read own profile" ON member_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Anyone authenticated can update own profile" ON member_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins full access" ON member_profiles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM member_profiles mp WHERE mp.id = auth.uid() AND mp.role = 'admin')
    );

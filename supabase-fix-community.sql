-- Add 'community' to membership_status options
ALTER TABLE member_profiles DROP CONSTRAINT IF EXISTS member_profiles_membership_status_check;
ALTER TABLE member_profiles ADD CONSTRAINT member_profiles_membership_status_check
    CHECK (membership_status IN ('active', 'pending', 'expired', 'rejected', 'community'));

-- Add 'moderator' to role options
ALTER TABLE member_profiles DROP CONSTRAINT IF EXISTS member_profiles_role_check;
ALTER TABLE member_profiles ADD CONSTRAINT member_profiles_role_check
    CHECK (role IN ('member', 'admin', 'moderator', 'volunteer'));

-- Add 'community' to access_level options
ALTER TABLE exclusive_content DROP CONSTRAINT IF EXISTS exclusive_content_access_level_check;
ALTER TABLE exclusive_content ADD CONSTRAINT exclusive_content_access_level_check
    CHECK (access_level IN ('public', 'community', 'member', 'certified', 'admin'));

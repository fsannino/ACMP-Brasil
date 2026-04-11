/* ===================================
   ACMP Brasil - Supabase Client
   =================================== */

// TODO: Replace with your real Supabase credentials
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

// Initialize Supabase client (loaded via CDN in HTML)
let supabase;

function initSupabase() {
    if (window.supabase && window.supabase.createClient) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return true;
    }
    return false;
}

// =================== AUTH ===================

async function signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: { full_name: fullName }
        }
    });
    return { data, error };
}

async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });
    return { data, error };
}

async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/membros/'
        }
    });
    return { data, error };
}

async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (!error) {
        window.location.href = '/membros/login.html';
    }
    return { error };
}

async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

async function getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

async function resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/membros/reset-password.html'
    });
    return { data, error };
}

// =================== MEMBER PROFILE ===================

async function getProfile() {
    const user = await getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('member_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    return data;
}

async function updateProfile(updates) {
    const user = await getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data, error } = await supabase
        .from('member_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();

    return { data, error };
}

// =================== CONTENT ===================

async function getExclusiveContent(category) {
    let query = supabase
        .from('exclusive_content')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

    if (category && category !== 'all') {
        query = query.eq('category', category);
    }

    const { data, error } = await query;
    return { data: data || [], error };
}

async function getFeaturedContent() {
    const { data, error } = await supabase
        .from('exclusive_content')
        .select('*')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(4);

    return { data: data || [], error };
}

async function logContentAccess(contentId, action) {
    const user = await getUser();
    if (!user) return;

    await supabase.from('content_access_log').insert({
        user_id: user.id,
        content_id: contentId,
        action: action
    });

    await supabase.rpc('increment_download', { content_id: contentId });
}

// =================== ADMIN ===================

async function isAdmin() {
    const profile = await getProfile();
    return profile && profile.role === 'admin';
}

async function getAllMembers() {
    const { data, error } = await supabase
        .from('member_profiles')
        .select('*')
        .order('created_at', { ascending: false });

    return { data: data || [], error };
}

async function updateMemberStatus(userId, status) {
    const { data, error } = await supabase
        .from('member_profiles')
        .update({ membership_status: status, updated_at: new Date().toISOString() })
        .eq('id', userId);

    return { data, error };
}

async function updateMemberRole(userId, role) {
    const { data, error } = await supabase
        .from('member_profiles')
        .update({ role: role, updated_at: new Date().toISOString() })
        .eq('id', userId);

    return { data, error };
}

async function importMembersCSV(csvData) {
    // Parse CSV: expected format: email,full_name,acmp_member_id,membership_type,expiry_date,ccmp_status
    var lines = csvData.split('\n').filter(function (l) { return l.trim(); });
    var header = lines[0].split(',').map(function (h) { return h.trim().toLowerCase(); });
    var records = [];

    for (var i = 1; i < lines.length; i++) {
        var values = lines[i].split(',').map(function (v) { return v.trim(); });
        var record = {};
        header.forEach(function (h, idx) { record[h] = values[idx] || ''; });
        if (record.email) records.push(record);
    }

    const { data, error } = await supabase
        .from('imported_members')
        .upsert(records, { onConflict: 'email' });

    return { count: records.length, error };
}

async function syncImportedMembers() {
    const { data, error } = await supabase.rpc('sync_imported_members');
    return { synced: data, error };
}

async function addContent(content) {
    const { data, error } = await supabase
        .from('exclusive_content')
        .insert(content)
        .select()
        .single();

    return { data, error };
}

async function deleteContent(id) {
    const { data, error } = await supabase
        .from('exclusive_content')
        .delete()
        .eq('id', id);

    return { data, error };
}

async function getContentStats() {
    const { data: logs } = await supabase
        .from('content_access_log')
        .select('content_id, action')
        .order('accessed_at', { ascending: false })
        .limit(500);

    const { count: totalMembers } = await supabase
        .from('member_profiles')
        .select('*', { count: 'exact', head: true });

    const { count: activeMembers } = await supabase
        .from('member_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('membership_status', 'active');

    return {
        totalMembers: totalMembers || 0,
        activeMembers: activeMembers || 0,
        recentAccess: logs || []
    };
}

// =================== AUTH GUARD ===================

async function requireAuth() {
    const session = await getSession();
    if (!session) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

async function requireAdmin() {
    const admin = await isAdmin();
    if (!admin) {
        window.location.href = '/membros/';
        return false;
    }
    return true;
}

// =================== HELPERS ===================

function getContentIcon(type) {
    var icons = {
        pdf: 'fas fa-file-pdf',
        video: 'fas fa-play-circle',
        article: 'fas fa-newspaper',
        webinar: 'fas fa-video',
        game: 'fas fa-gamepad',
        template: 'fas fa-file-alt',
        tool: 'fas fa-tools'
    };
    return icons[type] || 'fas fa-file';
}

function getContentColor(type) {
    var colors = {
        pdf: '#e74c3c',
        video: '#9b59b6',
        article: '#3498db',
        webinar: '#2ecc71',
        game: '#e67e22',
        template: '#1abc9c',
        tool: '#95a5a6'
    };
    return colors[type] || '#666';
}

function getCategoryLabel(cat) {
    var labels = {
        standard: 'Standard ACMP',
        certificacao: 'Certificação',
        webinars: 'Webinars',
        ferramentas: 'Ferramentas',
        jogos: 'Jogos',
        artigos: 'Artigos',
        templates: 'Templates'
    };
    return labels[cat] || cat;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR');
}

function getStatusBadge(status) {
    var badges = {
        active: '<span style="background:#dcfce7;color:#16a34a;padding:3px 10px;border-radius:50px;font-size:0.75rem;font-weight:600;">Ativo</span>',
        pending: '<span style="background:#fef3c7;color:#d97706;padding:3px 10px;border-radius:50px;font-size:0.75rem;font-weight:600;">Pendente</span>',
        expired: '<span style="background:#fee2e2;color:#dc2626;padding:3px 10px;border-radius:50px;font-size:0.75rem;font-weight:600;">Expirado</span>',
        rejected: '<span style="background:#f3f4f6;color:#6b7280;padding:3px 10px;border-radius:50px;font-size:0.75rem;font-weight:600;">Recusado</span>'
    };
    return badges[status] || status;
}

// ================================================
// assets/js/supabase.js
// ================================================
const SUPABASE_URL      = 'https://mrubbgfthrxeveahvrsu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_H-zZj7xLPNmF6NLRywYJxQ_71j5KdmQ';

const _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── AUTH ──────────────────────────────────────────

async function registerUser(username, password) {
  // Buat fake email dari username agar kompatibel dengan Supabase Auth
  const fakeEmail = username.toLowerCase().replace(/[^a-z0-9]/g, '') + '@sfs.local';

  // Cek apakah username sudah dipakai
  const { data: existing } = await _sb.from('profiles').select('id').eq('username', username).maybeSingle();
  if (existing) return { error: { message: 'Username sudah dipakai, coba yang lain.' } };

  const { data, error } = await _sb.auth.signUp({
    email: fakeEmail,
    password,
    options: { data: { username } }
  });
  return { data, error };
}

async function loginUser(username, password) {
  const fakeEmail = username.toLowerCase().replace(/[^a-z0-9]/g, '') + '@sfs.local';
  const { data, error } = await _sb.auth.signInWithPassword({ email: fakeEmail, password });
  if (error) return { error: { message: 'Username atau password salah.' } };
  return { data, error };
}

async function logoutUser() {
  return await _sb.auth.signOut();
}

async function getCurrentUser() {
  const { data: { user } } = await _sb.auth.getUser();
  return user;
}

async function getCurrentUsername() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user.user_metadata?.username || null;
}

// ── STATS ─────────────────────────────────────────

async function trackVisitor() {
  const KEY = 'sfs_visited_v3';
  let total = 0;
  if (!sessionStorage.getItem(KEY)) {
    const { data } = await _sb.rpc('increment_visitor');
    total = data || 0;
    sessionStorage.setItem(KEY, '1');
  } else {
    const { data } = await _sb.from('visitors').select('total').eq('id', 1).single();
    total = data?.total || 0;
  }
  return total;
}

async function getTotalStats() {
  const [{ count: totalBP }, { data: dlData }] = await Promise.all([
    _sb.from('blueprints').select('*', { count: 'exact', head: true }).eq('is_approved', true),
    _sb.from('blueprints').select('download_count').eq('is_approved', true)
  ]);
  const totalDownloads = (dlData || []).reduce((s, r) => s + (r.download_count || 0), 0);
  return { totalBP: totalBP || 0, totalDownloads };
}

// ── BLUEPRINTS ────────────────────────────────────

async function getBlueprints(category) {
  let q = _sb.from('blueprints').select('*').eq('is_approved', true).order('created_at', { ascending: false });
  if (category) q = q.eq('category', category);
  const { data, error } = await q;
  return { data: data || [], error };
}

async function getMyBlueprints() {
  const user = await getCurrentUser();
  if (!user) return { data: [], error: { message: 'Belum login' } };
  const { data, error } = await _sb.from('blueprints')
    .select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  return { data: data || [], error };
}

// Alias agar kompatibel dengan main.js
async function getBlueprintsByUser(userId) {
  const { data, error } = await _sb.from('blueprints')
    .select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return { data: data || [], error };
}

async function uploadBlueprint({ name, description, authorName, category, imageBase64, link }) {
  const user = await getCurrentUser();
  if (!user) return { error: { message: 'Harus login untuk upload blueprint.' } };
  const { data, error } = await _sb.from('blueprints').insert([{
    user_id: user.id,
    name,
    description,
    author_name: authorName,
    category,
    image_url: imageBase64 || null,
    link,
    download_count: 0,
    is_approved: true
  }]).select().single();
  return { data, error };
}

async function deleteBlueprint(id) {
  const { error } = await _sb.from('blueprints').delete().eq('id', id);
  return { error };
}

async function recordDownload(blueprintId) {
  await _sb.rpc('increment_download', { bp_id: blueprintId });
}

function onAuthChange(callback) {
  _sb.auth.onAuthStateChange((_event, session) => callback(session?.user || null));
}

// ── EXPORT ────────────────────────────────────────
window.SFS = {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  getCurrentUsername,
  trackVisitor,
  getTotalStats,
  getBlueprints,
  getMyBlueprints,
  getBlueprintsByUser,
  uploadBlueprint,
  deleteBlueprint,
  recordDownload,
  onAuthChange
};

(() => {
  const client = () => window.weiguangSupabase;
  const nextUrl = () => `${window.location.pathname}${window.location.search}${window.location.hash}`;

  const messages = {
    invalid_credentials: '邮箱或密码不正确。',
    email_not_confirmed: '请先完成邮箱确认。',
    user_already_exists: '这个邮箱已经注册过了。',
    weak_password: '密码至少需要 6 位。',
  };

  const errorMessage = (error) => messages[error?.code] || error?.message || '操作没有完成，请稍后再试。';

  const getSession = async () => {
    if (!client()) return null;
    const { data } = await client().auth.getSession();
    return data.session || null;
  };

  const requireUser = async () => {
    const session = await getSession();
    if (!session) {
      window.location.href = `auth.html?next=${encodeURIComponent(nextUrl())}`;
      return null;
    }
    return session.user;
  };

  const signOut = async () => {
    if (client()) await client().auth.signOut();
    window.location.href = 'index.html';
  };

  const showAuthDialog = (mode = 'login') => {
    window.location.href = `auth.html?mode=${encodeURIComponent(mode)}&next=${encodeURIComponent(nextUrl())}`;
  };

  const getProfile = async (userId) => {
    if (!client()) return { data: null, error: null };
    return client().from('profiles').select('*').eq('id', userId).maybeSingle();
  };

  const updateProfile = async (userId, values) => {
    if (!client()) return { data: null, error: new Error('Supabase 尚未配置。') };
    return client().from('profiles').update({
      display_name: values.display_name?.trim(),
      bio: values.bio?.trim(),
      public_name: Boolean(values.public_name),
    }).eq('id', userId).select().single();
  };

  const auth = { client, getSession, requireUser, signOut, showAuthDialog, getProfile, updateProfile, errorMessage };
  window.weiguangAuth = auth;

  document.addEventListener('DOMContentLoaded', async () => {
    const link = document.querySelector('[data-auth-link]');
    if (!link || !client()) return;
    const session = await getSession();
    link.textContent = session ? '我的账号' : '登录';
    link.href = session ? 'account.html' : `auth.html?next=${encodeURIComponent(nextUrl())}`;
  });
})();

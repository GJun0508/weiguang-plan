(() => {
  const button = document.querySelector('[data-follow-project]');
  const client = window.weiguangSupabase;
  const setState = (following) => { if (button) { button.textContent = following ? '已关注这个项目' : '关注这个项目'; button.dataset.following = String(following); } };
  const load = async () => {
    if (!button || !client || !button.dataset.projectId) return;
    const session = await window.weiguangAuth.getSession(); if (!session) return;
    const { data } = await client.from('project_follows').select('project_id').eq('user_id', session.user.id).eq('project_id', button.dataset.projectId).maybeSingle(); setState(Boolean(data));
  };
  button?.addEventListener('click', async () => {
    if (!client) return;
    const session = await window.weiguangAuth.getSession(); if (!session) { window.weiguangAuth.showAuthDialog('login'); return; }
    const following = button.dataset.following === 'true';
    const result = following ? await client.from('project_follows').delete().eq('user_id', session.user.id).eq('project_id', button.dataset.projectId) : await client.from('project_follows').insert({ user_id: session.user.id, project_id: button.dataset.projectId });
    if (!result.error) setState(!following);
  });
  document.addEventListener('project:loaded', (event) => { if (button) { button.dataset.projectId = event.detail.id; load(); } });
})();

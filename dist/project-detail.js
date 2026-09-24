(() => {
  const client = window.weiguangSupabase;
  const slug = new URLSearchParams(window.location.search).get('slug');
  const main = document.querySelector('[data-project-detail]');
  const status = document.querySelector('[data-project-status]');
  const show = (project, updates = []) => {
    document.title = `${project.title} / 微光计划`;
    document.querySelector('[data-project-title]').textContent = project.title;
    document.querySelector('[data-project-subtitle]').textContent = project.subtitle || [project.location, project.category].filter(Boolean).join(' · ');
    document.querySelector('[data-project-summary]').textContent = project.description || project.summary;
    document.querySelector('[data-project-cover]').src = project.cover_image || 'assets/china-community.jpg';
    document.querySelector('[data-project-cover]').alt = project.title;
    document.querySelector('[data-project-progress]').textContent = `${Math.round(project.progress || 0)}%`;
    document.querySelector('[data-project-beneficiaries]').textContent = project.beneficiaries || '在地伙伴共同确认中';
    const updateList = document.querySelector('[data-project-updates]');
    updateList.replaceChildren(...updates.map((update) => { const item = document.createElement('article'); item.innerHTML = '<p class="overline"></p><h3></h3><p></p>'; item.querySelector('.overline').textContent = update.published_at ? new Date(update.published_at).toLocaleDateString('zh-CN') : '现场更新'; item.querySelector('h3').textContent = update.title; item.querySelectorAll('p')[1].textContent = update.content; return item; }));
    main.hidden = false; status.hidden = true;
    document.dispatchEvent(new CustomEvent('project:loaded', { detail: project }));
  };
  const load = async () => {
    if (!client || !slug) { status.textContent = '项目暂时无法加载。'; return; }
    const result = await client.from('projects').select('*').eq('slug', slug).eq('published', true).single();
    if (result.error) { status.textContent = '这个项目还没有公开，或链接已经失效。'; return; }
    const updates = await client.from('project_updates').select('*').eq('project_id', result.data.id).eq('published', true).order('published_at', { ascending: false });
    show(result.data, updates.data || []);
  };
  document.addEventListener('DOMContentLoaded', load);
})();

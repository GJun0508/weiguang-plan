(() => {
  const client = window.weiguangSupabase;
  const list = document.querySelector('[data-dynamic-projects]');
  const fallback = document.querySelector('[data-static-projects]');
  const card = (project, index) => {
    const article = document.createElement('article');
    article.className = `project${index === 0 ? ' active' : ''}`;
    article.innerHTML = `<div class="project-num">${String(index + 1).padStart(2, '0')}</div><div class="project-title"><h3></h3><p></p></div><div class="project-status"><span>进度</span><b>${Math.round(project.progress || 0)}%</b></div><a class="project-open" aria-label="查看项目详情">↗</a><div class="project-detail"><img alt="" /><p></p><a class="project-detail-link">查看项目现场 →</a></div>`;
    article.querySelector('h3').textContent = String(project.title || '未命名项目');
    article.querySelector('.project-title p').textContent = [project.location, project.category].filter(Boolean).join(' · ');
    const image = article.querySelector('img'); image.src = project.cover_image || 'assets/china-community.jpg'; image.alt = project.title || '项目现场';
    article.querySelector('.project-detail p').textContent = project.summary || project.description || '';
    const href = `project.html?slug=${encodeURIComponent(project.slug)}`;
    article.querySelector('.project-open').href = href; article.querySelector('.project-detail-link').href = href;
    article.addEventListener('click', (event) => { if (event.target.closest('a')) return; list.querySelector('.project.active')?.classList.remove('active'); article.classList.add('active'); });
    return article;
  };
  const loadStats = async () => {
    if (!client) return;
    const { data } = await client.from('site_stats').select('key, value').eq('published', true);
    (data || []).forEach((stat) => { const target = document.querySelector(`[data-stat-key="${CSS.escape(stat.key)}"]`); if (target) target.textContent = Number(stat.value).toLocaleString('zh-CN'); });
  };
  const loadProjects = async () => {
    if (!client || !list) return;
    const { data, error } = await client.from('projects').select('*').eq('published', true).order('created_at', { ascending: true });
    if (error || !data?.length) return;
    list.replaceChildren(...data.map(card)); list.hidden = false; if (fallback) fallback.hidden = true;
  };
  document.addEventListener('DOMContentLoaded', () => { loadProjects(); loadStats(); });
})();

(() => {
  const isHomePage = /(?:^|\/)index\.html$/.test(window.location.pathname) || window.location.pathname.endsWith('/weiguang-plan/');
  if (!isHomePage || !window.weiguangSupabase) return;
  document.documentElement.classList.add('auth-checking');
  window.weiguangSupabase.auth.getSession().then(({ data }) => {
    if (!data.session) {
      const next = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      window.location.replace(`auth.html?next=${encodeURIComponent(next)}`);
      return;
    }
    document.documentElement.classList.remove('auth-checking');
  });
})();

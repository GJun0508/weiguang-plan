(() => {
  const config = window.WEIGUANG_SUPABASE_CONFIG || {};
  const sdk = window.supabase;
  const ready = Boolean(sdk?.createClient && config.url && config.publishableKey);

  window.weiguangConfig = config;
  window.weiguangSupabase = ready
    ? sdk.createClient(config.url, config.publishableKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      })
    : null;
})();

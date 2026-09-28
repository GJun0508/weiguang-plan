(function initSharedDonationStars() {
  const config = window.WEIGUANG_SUPABASE_CONFIG || {};
  const rowFields = 'id,client_id,amount,project,anonymous_label,x,y,created_at';
  let client = null;

  const isConfigured = () => Boolean(
    config.url
    && config.publishableKey
    && window.supabase
    && typeof window.supabase.createClient === 'function'
  );

  const getClient = () => {
    if (!isConfigured()) return null;
    if (!client) {
      client = window.supabase.createClient(config.url, config.publishableKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });
    }
    return client;
  };

  const toSharedStar = (row) => ({
    id: row.id,
    clientId: row.client_id,
    amount: Number(row.amount),
    project: row.project,
    anonymousLabel: row.anonymous_label,
    x: Number(row.x),
    y: Number(row.y),
    createdAt: row.created_at,
  });

  const toRow = (star) => ({
    client_id: star.clientId,
    amount: star.amount,
    project: star.project,
    anonymous_label: star.anonymousLabel,
    x: star.x,
    y: star.y,
  });

  async function loadLatest() {
    const activeClient = getClient();
    if (!activeClient) return [];
    const { data, error } = await activeClient
      .from('donation_stars')
      .select(rowFields)
      .order('created_at', { ascending: false })
      .limit(80);
    if (error) throw error;
    return (data || []).slice().reverse().map(toSharedStar);
  }

  async function publish(star) {
    const activeClient = getClient();
    if (!activeClient) throw new Error('Shared sky is not configured');
    const { data, error } = await activeClient
      .from('donation_stars')
      .insert([toRow(star)])
      .select(rowFields)
      .single();
    if (error) throw error;
    return toSharedStar(data);
  }

  function subscribe(onInsert, onStatus = () => {}, options = {}) {
    const activeClient = getClient();
    if (!activeClient) return () => {};

    const retryDelay = Number.isFinite(options.retryDelay) ? options.retryDelay : 2500;
    const retryableStatuses = new Set(['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED']);
    let channel = null;
    let retryTimer = null;
    let disposed = false;

    const report = (status, error) => {
      try {
        onStatus(status, error);
      } catch (callbackError) {
        console.warn('Shared sky status callback failed', callbackError);
      }
    };

    const resync = () => {
      loadLatest()
        .then((stars) => stars.forEach(onInsert))
        .catch((error) => report('SYNC_ERROR', error));
    };

    const scheduleReconnect = () => {
      if (disposed || retryTimer) return;
      retryTimer = setTimeout(() => {
        retryTimer = null;
        if (channel) activeClient.removeChannel(channel);
        channel = null;
        connect();
      }, retryDelay);
    };

    const connect = () => {
      if (disposed) return;
      report('SUBSCRIBING');
      channel = activeClient
        .channel('donation-stars')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'donation_stars',
        }, (payload) => onInsert(toSharedStar(payload.new)))
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'donation_stars',
        }, (payload) => {
          if (typeof options.onDelete === 'function' && payload.old?.id) {
            options.onDelete({ id: payload.old.id });
          }
        })
        .subscribe((status, error) => {
          report(status, error);
          if (status === 'SUBSCRIBED') resync();
          if (retryableStatuses.has(status)) scheduleReconnect();
        });
    };

    connect();

    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (channel) activeClient.removeChannel(channel);
      channel = null;
    };
  }

  window.sharedDonationStars = {
    isConfigured,
    loadLatest,
    publish,
    subscribe,
  };
}());

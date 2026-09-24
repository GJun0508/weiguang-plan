(() => {
  const client = window.weiguangSupabase; const panel = document.querySelector('[data-live-ledger]');
  const load = async () => {
    if (!client || !panel) return;
    const { data, error } = await client.from('ledger_entries').select('entry_type, amount, title, occurred_at').eq('published', true).order('occurred_at', { ascending: false }).limit(20);
    if (error || !data?.length) return;
    const total = data.reduce((sum, entry) => sum + Number(entry.amount || 0), 0); const amount = panel.querySelector('[data-ledger-total]'); if (amount) amount.textContent = `¥ ${total.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`;
    const list = panel.querySelector('[data-ledger-list]'); if (list) list.replaceChildren(...data.slice(0, 5).map((entry) => { const item = document.createElement('li'); item.textContent = `${entry.entry_type === 'income' ? '收入' : '支出'} / ${entry.title} / ¥${Number(entry.amount).toLocaleString('zh-CN')}`; return item; }));
  };
  document.addEventListener('DOMContentLoaded', load);
})();

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const adapterPath = new URL('../shared-stars.js', import.meta.url);

function loadAdapter(config, supabase) {
  assert.ok(existsSync(adapterPath), 'shared-stars.js must exist');
  const window = {
    WEIGUANG_SUPABASE_CONFIG: config,
    supabase,
  };
  vm.runInNewContext(readFileSync(adapterPath, 'utf8'), { window, console });
  return window.sharedDonationStars;
}

const row = {
  id: 'server-id',
  client_id: '11111111-1111-4111-8111-111111111111',
  amount: 100,
  project: '读到世界 · 乡村阅读',
  anonymous_label: '匿名微光',
  x: 0.4,
  y: 0.2,
  created_at: '2026-09-24T00:00:00.000Z',
};

test('unconfigured adapter keeps the local fallback available', async () => {
  let createCalls = 0;
  const adapter = loadAdapter(
    { url: '', publishableKey: '' },
    { createClient() { createCalls += 1; } },
  );

  assert.equal(adapter.isConfigured(), false);
  assert.equal((await adapter.loadLatest()).length, 0);
  await assert.rejects(adapter.publish({}), /Shared sky is not configured/);
  assert.equal(typeof adapter.subscribe(() => {}), 'function');
  assert.equal(createCalls, 0);
});

test('configured adapter maps reads, writes, and realtime inserts', async () => {
  const calls = { insert: null, filter: null, removed: null, options: null };
  let realtimeHandler;
  const channel = {
    on(type, filter, handler) {
      assert.equal(type, 'postgres_changes');
      calls.filter = filter;
      realtimeHandler = handler;
      return this;
    },
    subscribe() { return this; },
  };
  const client = {
    from(table) {
      assert.equal(table, 'donation_stars');
      return {
        select() {
          return {
            order(column, options) {
              assert.equal(column, 'created_at');
              assert.equal(options.ascending, false);
              return {
                async limit(count) {
                  assert.equal(count, 80);
                  return { data: [row], error: null };
                },
              };
            },
          };
        },
        insert(records) {
          calls.insert = records;
          return {
            select() {
              return { async single() { return { data: row, error: null }; } };
            },
          };
        },
      };
    },
    channel(name) {
      assert.equal(name, 'donation-stars');
      return channel;
    },
    removeChannel(value) { calls.removed = value; },
  };
  const supabase = {
    createClient(url, key, options) {
      assert.equal(url, 'https://example.supabase.co');
      assert.equal(key, 'sb_publishable_example');
      calls.options = options;
      return client;
    },
  };
  const adapter = loadAdapter(
    { url: 'https://example.supabase.co', publishableKey: 'sb_publishable_example' },
    supabase,
  );

  assert.equal(adapter.isConfigured(), true);
  const latest = await adapter.loadLatest();
  assert.equal(calls.options.auth.persistSession, false);
  assert.equal(calls.options.auth.autoRefreshToken, false);
  assert.equal(calls.options.auth.detectSessionInUrl, false);
  assert.equal(latest[0].clientId, row.client_id);
  assert.equal(latest[0].anonymousLabel, row.anonymous_label);

  const published = await adapter.publish({
    clientId: row.client_id,
    amount: 100,
    project: row.project,
    anonymousLabel: row.anonymous_label,
    x: 0.4,
    y: 0.2,
  });
  assert.equal(calls.insert.length, 1);
  assert.equal(calls.insert[0].client_id, row.client_id);
  assert.equal(calls.insert[0].amount, 100);
  assert.equal(calls.insert[0].project, row.project);
  assert.equal(calls.insert[0].anonymous_label, row.anonymous_label);
  assert.equal(calls.insert[0].x, 0.4);
  assert.equal(calls.insert[0].y, 0.2);
  assert.equal(published.id, row.id);

  let received;
  const unsubscribe = adapter.subscribe((star) => { received = star; });
  assert.equal(calls.filter.event, 'INSERT');
  assert.equal(calls.filter.schema, 'public');
  assert.equal(calls.filter.table, 'donation_stars');
  realtimeHandler({ new: row });
  assert.equal(received.clientId, row.client_id);
  unsubscribe();
  assert.equal(calls.removed, channel);
});

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const storePath = new URL('../star-store.js', import.meta.url);

function createStore(initialStars = [], limit = 80) {
  assert.ok(existsSync(storePath), 'star-store.js must exist');
  const window = {};
  vm.runInNewContext(readFileSync(storePath, 'utf8'), { window });
  return window.createDonationStarStore(initialStars, limit);
}

function star(clientId, createdAt, overrides = {}) {
  return {
    id: `local-${clientId}`,
    clientId,
    amount: 100,
    project: '读到世界 · 乡村阅读',
    anonymousLabel: '匿名微光',
    x: 0.4,
    y: 0.2,
    createdAt,
    ...overrides,
  };
}

test('remote copy replaces its local optimistic star without a duplicate', () => {
  const clientId = '11111111-1111-4111-8111-111111111111';
  const store = createStore([star(clientId, '2026-09-24T00:00:00.000Z')]);

  const result = store.addOrReplace(star(clientId, '2026-09-24T00:00:01.000Z', {
    id: 'server-id',
  }));

  assert.equal(result.isNew, false);
  assert.equal(store.values().length, 1);
  assert.equal(store.values()[0].id, 'server-id');
});

test('new remote stars are reported as new and sorted chronologically', () => {
  const store = createStore();
  const later = star('22222222-2222-4222-8222-222222222222', '2026-09-24T00:00:02.000Z');
  const earlier = star('11111111-1111-4111-8111-111111111111', '2026-09-24T00:00:01.000Z');

  assert.equal(store.addOrReplace(later).isNew, true);
  assert.equal(store.addOrReplace(earlier).isNew, true);
  assert.equal(store.values()[0].clientId, earlier.clientId);
  assert.equal(store.values()[1].clientId, later.clientId);
});

test('store keeps only the newest configured number of stars', () => {
  const stars = Array.from({ length: 5 }, (_, index) => star(
    `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    `2026-09-24T00:00:0${index}.000Z`,
  ));
  const store = createStore(stars, 3);

  assert.equal(store.values().length, 3);
  assert.equal(store.values()[0].clientId, stars[2].clientId);
  assert.equal(store.values()[2].clientId, stars[4].clientId);
});

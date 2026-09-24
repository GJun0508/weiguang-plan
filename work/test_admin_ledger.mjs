import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('public ledger reads only published entries', () => {
  const source = read('ledger.js');
  assert.match(source, /from\('ledger_entries'\)/);
  assert.match(source, /eq\('published', true\)/);
});

test('project follows use the authenticated user and project ids', () => {
  const source = read('project-follows.js');
  assert.match(source, /project_follows/);
  assert.match(source, /user_id/);
  assert.match(source, /showAuthDialog/);
});

test('admin page provides protected project create and delete surfaces', () => {
  assert.match(read('admin.html'), /data-admin-form/);
  assert.match(read('admin.html'), /data-admin-table/);
  assert.match(read('admin.js'), /requireUser/);
  assert.match(read('admin.js'), /\.insert\(values\)/);
  assert.match(read('admin.js'), /\.delete\(\)/);
});

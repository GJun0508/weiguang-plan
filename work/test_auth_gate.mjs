import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (file) => readFileSync(file, 'utf8');

test('home page requires an authenticated Supabase session', () => {
  const html = read('index.html');
  const gate = read('site-auth-gate.js');
  assert.match(html, /site-auth-gate\.js/);
  assert.match(gate, /getSession/);
  assert.match(gate, /auth\.html\?next=/);
  assert.match(gate, /window\.location\.replace/);
});

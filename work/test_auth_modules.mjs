import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('auth client exposes a browser-safe Supabase session client', () => {
  const source = read('supabase-client.js');
  assert.match(source, /window\.weiguangSupabase/);
  assert.match(source, /persistSession: true/);
  assert.match(source, /detectSessionInUrl: true/);
  assert.doesNotMatch(source, /service_role|SUPABASE_SERVICE_ROLE|password/i);
});

test('auth module exposes session, guard, profile and sign-out helpers', () => {
  const source = read('auth.js');
  for (const name of ['getSession', 'requireUser', 'signOut', 'showAuthDialog', 'getProfile', 'updateProfile']) assert.match(source, new RegExp(name));
});

test('auth and account pages contain accessible interaction surfaces', () => {
  const auth = read('auth.html');
  const account = read('account.html');
  assert.match(auth, /id="auth-form"/);
  assert.match(auth, /type="email"/);
  assert.match(auth, /aria-live="polite"/);
  assert.match(account, /id="profile-form"/);
  assert.match(account, /id="sign-out"/);
});

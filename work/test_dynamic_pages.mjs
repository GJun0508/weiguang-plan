import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('home page wires dynamic projects without changing donation modules', () => {
  const html = read('index.html');
  assert.match(html, /data-dynamic-projects/);
  assert.match(html, /projects\.js/);
  assert.match(html, /data-static-projects/);
  assert.match(html, /donation\.js/);
  assert.match(read('projects.js'), /from\('projects'\)/);
  assert.match(read('projects.js'), /published/);
});

test('project detail page loads published project updates by slug', () => {
  assert.match(read('project.html'), /data-project-detail/);
  assert.match(read('project-detail.js'), /project_updates/);
  assert.match(read('project-detail.js'), /eq\('slug', slug\)/);
});

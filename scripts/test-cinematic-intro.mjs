import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const intro = await readFile(new URL('../components/layout/CinematicIntro.jsx', import.meta.url), 'utf8');
const home = await readFile(new URL('../app/page.js', import.meta.url), 'utf8');
const layout = await readFile(new URL('../app/layout.js', import.meta.url), 'utf8');

assert.match(intro, /Skip Intro/);
assert.match(intro, /sessionStorage/);
assert.match(intro, /useReducedMotion/);
assert.match(intro, /clearTimeout/);
assert.match(intro, /role="dialog"/);
assert.match(intro, /\/images\/burhan_pro2_earbuds\.jpg/);
assert.match(home, /CinematicIntro/);
assert.doesNotMatch(layout, /LoadingScreen/);

console.log('Cinematic intro contract tests passed');

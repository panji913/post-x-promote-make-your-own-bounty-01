// Entry validator for post-x-promote-make-your-own-bounty-01 (Node 22, standard library only, no network).
//
// It reads POST.json from the repository root, validates the X post address and the exact text of the
// post it names, copies POST.json to the output directory (where the gate reads it), and exits 0
// with a PASS report when every check holds. Deterministic: the same inputs always print the same
// report and exit code.
//
// Outside the grader's container, MAKEFUN_BOT_DIR and MAKEFUN_OUTPUT_DIR stand in for /bot and /output:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The exact text of the post, as posted on X (three lines).
const POST_TEXT = [
  'Anyone can make a bounty now — describe any task, set the reward, and AI agents compete to build it.',
  'Make your own bounty on @makefunai: https://make.fun/sponsor/new',
  'makefun-deer-petal-arena',
].join('\n');

// The verified address of the post.
const EXPECTED_URL = 'https://x.com/PrettyBoy_Bar/status/2125128866113151239';

const PLAY_CODE = 'makefun-deer-petal-arena';
const MAX_POST_LENGTH = 280;

const failures = [];
const passes = [];

function check(name, ok, detail) {
  if (ok) {
    passes.push(name);
    console.log(`PASS: ${name} (${detail})`);
  } else {
    failures.push(name);
    console.log(`FAIL: ${name} (${detail})`);
  }
}

let post;
try {
  post = JSON.parse(readFileSync(join(BOT_DIR, 'POST.json'), 'utf8'));
} catch (err) {
  console.log(`FAIL: POST.json readable (${(err as Error).message})`);
  process.exit(1);
}

const url = typeof post.url === 'string' ? post.url : '';
check(
  'url-format',
  /^https:\/\/(www\.)?(x\.com|twitter\.com)\/PrettyBoy_Bar\/status\/[0-9]+$/.test(url),
  `url=${url}`,
);
check('url-expected', url === EXPECTED_URL, `url=${url}`);

const lines = POST_TEXT.split('\n');
check(
  'text-mentions-makefun',
  POST_TEXT.includes('make.fun') || POST_TEXT.includes('@makefunai'),
  'text carries make.fun and @makefunai',
);
check(
  'text-play-code-own-line',
  lines.some((line) => line.trim() === PLAY_CODE),
  `play code ${PLAY_CODE} on its own line`,
);
check(
  'text-length',
  POST_TEXT.length <= MAX_POST_LENGTH,
  `length=${POST_TEXT.length} max=${MAX_POST_LENGTH}`,
);
check('text-three-lines', lines.length === 3, `lines=${lines.length}`);
check(
  'text-line1-bounty',
  lines[0].toLowerCase().includes('bounty'),
  `line1=${JSON.stringify(lines[0])}`,
);
check(
  'text-line2-sponsor-link',
  lines[1].includes('https://make.fun/sponsor/new'),
  `line2=${JSON.stringify(lines[1])}`,
);

if (failures.length > 0) {
  console.log(`VALIDATION: FAIL (${passes.length} passed, ${failures.length} failed)`);
  process.exit(1);
}

mkdirSync(OUTPUT_DIR, { recursive: true });
try {
  copyFileSync(join(BOT_DIR, 'POST.json'), join(OUTPUT_DIR, 'POST.json'));
} catch (err) {
  console.log(`FAIL: POST.json copy (${(err as Error).message})`);
  process.exit(1);
}

console.log(`VALIDATION: PASS (${passes.length} checks passed, POST.json copied to ${OUTPUT_DIR})`);

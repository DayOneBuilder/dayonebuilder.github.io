#!/usr/bin/env node
// Regression guard (behavioural): the home task-picker must actually render.
//
// The ffbc4e1 syntax error had a user-visible symptom: the "Common tasks"
// chips didn't appear (nothing to click) and the breakdown panel was empty.
// This loads the page in headless Chrome, lets the JS run, and asserts the
// DOM the visitor sees: task chips exist and the default breakdown is filled.
//
// Complements check-inline-js.mjs: syntax check catches "script won't parse";
// this catches "script parses but the widget renders nothing".
//
// Needs Chrome. Auto-detects common paths / CHROME_PATH. If absent, it SKIPS
// (exit 0) with a warning — the syntax check remains the hard guard.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(process.argv[2] || '.');

function findChrome() {
  const cands = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser', '/usr/bin/chromium',
  ].filter(Boolean);
  for (const c of cands) { try { if (fs.existsSync(c)) return c; } catch {} }
  return null;
}

function dumpDom(chrome, file) {
  return execFileSync(chrome, [
    '--headless=new', '--disable-gpu', '--no-sandbox',
    '--virtual-time-budget=5000', '--dump-dom', `file://${file}`,
  ], { encoding: 'utf8', maxBuffer: 1e8, stdio: ['ignore', 'pipe', 'ignore'] });
}

// Pages that carry the task-picker widget (identified by id="chips").
const PAGES = [path.join(root, 'index.html')].filter(p => {
  try { return fs.readFileSync(p, 'utf8').includes('id="chips"'); } catch { return false; }
});

const chrome = findChrome();
if (!chrome) {
  console.warn('⚠ Chrome not found — skipping home widget DOM check. Set CHROME_PATH to enable.');
  process.exit(0);
}
if (!PAGES.length) {
  console.warn('⚠ No page with id="chips" found — nothing to check.');
  process.exit(0);
}

const MIN_CHIPS = 6; // six non-nochip TASKS in the widget
const failures = [];
for (const page of PAGES) {
  const rel = path.relative(root, page);
  const dom = dumpDom(chrome, page);
  const chipCount = (dom.match(/class="chip(?: active)?"/g) || []).length;
  const understand = (dom.match(/id="r-understand"[^>]*>([^<]*)/)?.[1] || '').trim();
  if (chipCount < MIN_CHIPS)
    failures.push(`${rel}: expected >= ${MIN_CHIPS} task chips, got ${chipCount} (JS failed to render chips)`);
  if (understand.length < 10)
    failures.push(`${rel}: breakdown panel (#r-understand) is empty (JS failed to populate default task)`);
  if (chipCount >= MIN_CHIPS && understand.length >= 10)
    console.log(`✓ ${rel} — ${chipCount} chips render, breakdown populated ("${understand.slice(0, 40)}…")`);
}

if (failures.length) {
  console.error('\n✗ Home widget DOM check FAILED:');
  for (const f of failures) console.error('  ' + f);
  process.exit(1);
}
console.log('✓ Home widget renders correctly');

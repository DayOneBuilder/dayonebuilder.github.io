#!/usr/bin/env node
// Regression guard: every inline <script> on every HTML page must parse.
//
// Why this exists: commit ffbc4e1 shipped an unescaped apostrophe inside a
// single-quoted JS string on the home page ('doesn't match', "I'll look ...").
// A single syntax error kills the ENTIRE <script> block, so the task-picker
// widget silently rendered no chips and an empty breakdown. Text checks and
// "it looks fine" miss this — only parsing the JS catches it.
//
// This walks all *.html, extracts inline (non-src, non-JSON) <script> blocks,
// and runs `node --check` on each. Exit 1 lists every file + block that fails.
// No dependencies beyond Node.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(process.argv[2] || '.');

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

// A <script> is executed as JavaScript by the browser only when its type is
// empty or one of these. Any other type (application/ld+json, importmap,
// text/template, custom bundler types like __bundler/manifest, …) is data, not
// code — parsing it as JS would be a false positive. So: allowlist, not denylist.
const JS_TYPES = new Set([
  '', 'module', 'text/javascript', 'application/javascript',
  'text/ecmascript', 'application/ecmascript', 'text/jscript',
]);
const SCRIPT_RE = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const typeOf = (a) => (a.match(/type\s*=\s*["']([^"']+)["']/i)?.[1] || '').trim().toLowerCase();
const hasSrc = (a) => /\bsrc\s*=/.test(a);
const lineOf = (html, i) => html.slice(0, i).split('\n').length; // 1-based line of block start

const files = walk(root).sort();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jscheck-'));
const failures = [];
let blocks = 0;

for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  let m, idx = 0;
  while ((m = SCRIPT_RE.exec(html))) {
    const attrs = m[1] || '', code = m[2] || '';
    idx++;
    if (hasSrc(attrs)) continue;
    const t = typeOf(attrs);
    if (!JS_TYPES.has(t)) continue;
    if (!code.trim()) continue;
    blocks++;
    const isModule = t === 'module';
    const tf = path.join(tmp, `s.${isModule ? 'mjs' : 'js'}`);
    fs.writeFileSync(tf, code);
    try {
      execFileSync(process.execPath, ['--check', tf], { stdio: ['ignore', 'ignore', 'pipe'] });
    } catch (e) {
      const err = (e.stderr ? e.stderr.toString() : e.message)
        .split('\n').map(s => s.trim()).filter(Boolean)
        .find(s => /SyntaxError|Error/.test(s)) || 'parse error';
      failures.push({ file: path.relative(root, f), block: idx, htmlLine: lineOf(html, m.index), err });
    }
  }
}
fs.rmSync(tmp, { recursive: true, force: true });

if (failures.length) {
  console.error(`\n✗ Inline JS syntax check FAILED — ${failures.length} broken script block(s):\n`);
  for (const x of failures) {
    console.error(`  ${x.file}  (<script> starting ~line ${x.htmlLine}, block #${x.block})`);
    console.error(`      ${x.err}`);
  }
  console.error('\nA syntax error kills the whole <script> — fix the quote/escape and re-run.\n');
  process.exit(1);
}
console.log(`✓ Inline JS syntax OK — ${blocks} script block(s) across ${files.length} HTML files parse cleanly`);

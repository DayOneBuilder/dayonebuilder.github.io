#!/usr/bin/env node
// Regression guard: every internal anchor link must point at an id that exists.
//
// Why this exists: commit bb43df5 repaired five cross-article links that had
// been dead in production for weeks — #triage, #text-numbers, #lookup (twice)
// and #iferror. The article builder derives heading ids by slugifying the
// heading text, but the drafts linked to short hand-picked anchors the
// generator never emits. Nothing failed, nothing 404'd: the browser just
// dropped the reader at the top of the page instead of the section, so the
// breakage was invisible to link checkers that only look at HTTP codes.
//
// This walks all *.html, collects every id on every page, then resolves each
// href that carries a #fragment and verifies the target page really has that
// id. It catches both directions of the regression: linking to an id that was
// never created, and renaming a heading so inbound links quietly rot.
// Exit 1 lists every offending file, line and href. No dependencies beyond Node.

import fs from 'node:fs';
import path from 'node:path';

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

const ID_RE = /\bid\s*=\s*["']([^"']+)["']/g;
const HREF_RE = /\bhref\s*=\s*["']([^"']+)["']/g;

const files = walk(root);
const ids = new Map();
for (const f of files) {
  const set = new Set();
  for (const m of fs.readFileSync(f, 'utf8').matchAll(ID_RE)) set.add(m[1]);
  ids.set(f, set);
}

// Link path -> the .html file that actually serves it. Returns null for
// anything we should not judge: external schemes, and non-HTML targets where a
// fragment carries no meaning anyway.
function resolveTarget(srcFile, linkPath) {
  if (!linkPath) return srcFile;                       // "#foo" — same page
  const clean = linkPath.split('?')[0];
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(clean) || clean.startsWith('//')) return null;
  let p = clean.startsWith('/')
    ? path.join(root, clean)
    : path.resolve(path.dirname(srcFile), clean);
  if (clean.endsWith('/') || (fs.existsSync(p) && fs.statSync(p).isDirectory())) {
    p = path.join(p, 'index.html');
  } else if (!path.extname(p)) {
    // Extensionless pretty URL: /blog/foo -> foo.html, or foo/index.html.
    if (fs.existsSync(`${p}.html`)) p = `${p}.html`;
    else if (fs.existsSync(path.join(p, 'index.html'))) p = path.join(p, 'index.html');
  }
  return p.endsWith('.html') ? p : null;
}

const broken = [];
let checked = 0;
for (const f of files) {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const m of line.matchAll(HREF_RE)) {
      const href = m[1];
      const hash = href.indexOf('#');
      // `continue`, never `return`: a return here would exit the whole forEach
      // callback and silently skip every remaining href on the line - and lines
      // in this site routinely carry several links.
      if (hash === -1) continue;
      const frag = href.slice(hash + 1);
      if (!frag) continue;                             // href="#" — deliberate placeholder
      const target = resolveTarget(f, href.slice(0, hash));
      if (!target) continue;
      checked++;
      const rel = path.relative(root, f);
      if (!fs.existsSync(target)) {
        broken.push(`${rel}:${i + 1}  ${href}  ->  target page does not exist`);
      } else if (!(ids.get(target) || new Set()).has(frag)) {
        broken.push(`${rel}:${i + 1}  ${href}  ->  no id="${frag}" in ${path.relative(root, target)}`);
      }
    }
  });
}

console.log(`checked ${checked} anchor links across ${files.length} html files`);
if (broken.length) {
  console.error(`\n${broken.length} broken anchor link(s):`);
  for (const b of broken) console.error(`  ${b}`);
  process.exit(1);
}
console.log('all internal anchors resolve');

#!/usr/bin/env node
/*
 * scripts/check.js — repository integrity checks (no dependencies).
 *
 *   node scripts/check.js
 *
 * Verifies:
 *   - version is consistent across plugin.json, SKILL.md frontmatter, CHANGELOG, template
 *   - SKILL.md frontmatter: name is kebab-case, description length within limits
 *   - every examples/*.json spec: valid JSON, modes referenced by nodes/flows exist,
 *     roles are template roles, node ids are unique, every step_outline line is
 *     "from → to" with known node ids (no ASCII "->"), step_outline_<suffix> names
 *     a mode, step_count matches each outline length, color vars are defined
 *   - template.html: the inline <script> parses, no unescaped </script> or raw <!-- inside it,
 *     every .flowtab has a flows entry and vice versa, every step references a node
 *     and a defined color var, every role has a --c-<role> color and a legend entry
 *   - css-tokens.css :root and light blocks match the template's :root / body.light
 *   - marketplace.json / plugin.json are valid and point at an existing skill dir
 * Exits 1 on any failure.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const SKILL = path.join(ROOT, 'skills/architecture-diagram');
const problems = [];
const fail = (m) => problems.push(m);
const read = (p) => fs.readFileSync(p, 'utf8');

// ── versions ────────────────────────────────────────────────────────────────
const plugin = JSON.parse(read(path.join(ROOT, '.claude-plugin/plugin.json')));
const version = plugin.version;
if (!/^\d+\.\d+\.\d+$/.test(version || '')) fail(`plugin.json version "${version}" is not semver`);

const skillMd = read(path.join(SKILL, 'SKILL.md'));
const fm = /^---\n([\s\S]*?)\n---/.exec(skillMd);
if (!fm) fail('SKILL.md has no frontmatter');
const front = fm ? fm[1] : '';
const fmGet = (k) => { const m = new RegExp(`^${k}:\\s*(.*)$`, 'm').exec(front); return m ? m[1].trim().replace(/^"|"$/g, '') : null; };
if (fmGet('version') !== version) fail(`SKILL.md frontmatter version "${fmGet('version')}" != plugin.json "${version}"`);
const name = fmGet('name') || '';
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) fail(`SKILL.md name "${name}" is not kebab-case`);
const desc = fmGet('description') || '';
if (desc.length === 0) fail('SKILL.md description is empty');
if (desc.length > 1024) fail(`SKILL.md description is ${desc.length} chars (> 1024)`);

const changelog = read(path.join(ROOT, 'CHANGELOG.md'));
if (!changelog.includes(`## [${version}]`)) fail(`CHANGELOG.md has no "## [${version}]" section`);

const template = read(path.join(SKILL, 'assets/template.html'));
if (!template.includes(`architecture-diagram-skill ${version}`)) fail(`template.html generator meta does not say ${version}`);

// ── marketplace ─────────────────────────────────────────────────────────────
const market = JSON.parse(read(path.join(ROOT, '.claude-plugin/marketplace.json')));
for (const p of market.plugins || []) {
  const src = path.join(ROOT, p.source || '');
  if (!fs.existsSync(path.join(src, 'SKILL.md')) && !fs.existsSync(path.join(src, 'skills'))) fail(`marketplace plugin "${p.name}" source "${p.source}" has no SKILL.md or skills/`);
  if (p.name !== plugin.name) fail(`marketplace plugin name "${p.name}" != plugin.json name "${plugin.name}"`);
}

// ── template ────────────────────────────────────────────────────────────────
// CSS custom properties of the first `<selector> {` block that ends its line.
const cssBlockVars = (src, selector) => {
  const m = new RegExp(`^[ \\t]*${selector}\\s*\\{[ \\t]*\\n([^}]*)\\}`, 'm').exec(src);
  if (!m) return null;
  const vars = new Map();
  for (const v of m[1].replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    vars.set(v[1], v[2].trim().toLowerCase().replace(/\s+/g, ' ').replace(/\s*,\s*/g, ','));
  }
  return vars;
};
const cssVarDefs = new Set([...template.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]));
const roles = new Set([...template.matchAll(/\.node\[data-role="([^"]+)"\]/g)].map(m => m[1]));
if (!roles.size) fail('template.html defines no .node[data-role="…"] roles');
const tplRoot = cssBlockVars(template, ':root');
const tplLight = cssBlockVars(template, 'body\\.light');
if (!tplRoot) fail('template.html: could not locate the :root { … } block');
if (!tplLight) fail('template.html: could not locate the body.light { … } block');
const legend = /<div class="legend"[\s\S]*?<\/div>/.exec(template);
for (const r of roles) {
  if (tplRoot && !tplRoot.has(`--c-${r}`)) fail(`template.html role "${r}" has no --c-${r} in :root`);
  if (tplLight && !tplLight.has(`--c-${r}`)) fail(`template.html role "${r}" has no --c-${r} in body.light`);
  if (!legend || !legend[0].includes(`var(--c-${r})`)) fail(`template.html role "${r}" has no legend entry`);
}
for (const m of template.matchAll(/class="node"[^>]*>/g)) {
  const r = /data-role="([^"]*)"/.exec(m[0]);
  if (r && !roles.has(r[1])) fail(`template.html node uses unknown role "${r[1]}"`);
}

const scriptMatch = /<script>([\s\S]*?)<\/script>/.exec(template);
if (!scriptMatch) fail('template.html has no <script> block');
else {
  const js = scriptMatch[1];
  try { new vm.Script(js, { filename: 'template.html <script>' }); }
  catch (e) { fail(`template.html script does not parse: ${e.message}`); }
  if (/<\/script\s*>/i.test(js)) fail('template.html script contains an unescaped </script>');
  if (/<!--/.test(js)) fail('template.html script contains a raw <!-- (write <\\!--)');

  // Evaluate just the `flows` object literal to cross-check tabs and node ids.
  const flowsSrc = /const flows = (\{[\s\S]*?\n\});/.exec(js);
  if (!flowsSrc) fail('template.html: could not locate `const flows = {...};`');
  else {
    let flows;
    try { flows = vm.runInNewContext(`(${flowsSrc[1]})`); } catch (e) { fail(`flows object does not evaluate: ${e.message}`); }
    if (flows) {
      const nav = /<nav class="flowtabs"[\s\S]*?<\/nav>/.exec(template);
      if (!nav) fail('template.html has no <nav class="flowtabs">');
      const tabKeys = nav ? [...nav[0].matchAll(/class="flowtab"[^>]*data-flow="([^"]+)"/g)].map(m => m[1]) : [];
      const nodeIds = [...template.matchAll(/class="node"[^>]*data-id="([^"]+)"/g)].map(m => m[1]);
      const dup = nodeIds.filter((id, i) => nodeIds.indexOf(id) !== i);
      if (dup.length) fail(`template.html duplicate node ids: ${dup.join(', ')}`);
      for (const k of tabKeys) if (!flows[k]) fail(`template.html flow tab "${k}" has no flows entry`);
      for (const k of Object.keys(flows)) {
        if (!tabKeys.includes(k)) fail(`template.html flow "${k}" has no .flowtab`);
        (flows[k].steps || []).forEach((s, i) => {
          for (const side of ['from', 'to']) if (!nodeIds.includes(s[side])) fail(`template.html flow "${k}" step ${i + 1}: ${side} "${s[side]}" is not a node id`);
          if (!s.color || !/^--[A-Za-z0-9_-]+$/.test(s.color)) fail(`template.html flow "${k}" step ${i + 1}: bad color "${s.color}"`);
          else if (!cssVarDefs.has(s.color)) fail(`template.html flow "${k}" step ${i + 1}: color "${s.color}" is not a defined CSS variable`);
          if (!s.title) fail(`template.html flow "${k}" step ${i + 1}: missing title`);
        });
      }
    }
  }
}

// ── examples ────────────────────────────────────────────────────────────────
const exDir = path.join(SKILL, 'examples');
for (const f of fs.readdirSync(exDir).filter(x => x.endsWith('.json')).sort()) {
  const file = path.join(exDir, f);
  let d;
  try { d = JSON.parse(read(file)); } catch (e) { fail(`${f}: invalid JSON (${e.message})`); continue; }
  const modes = new Set(d.modes || []);
  const idList = (d.nodes || []).map(n => n.id);
  const ids = new Set(idList);
  const dupIds = idList.filter((id, i) => idList.indexOf(id) !== i);
  if (dupIds.length) fail(`${f}: duplicate node ids: ${dupIds.join(', ')}`);
  for (const n of d.nodes || []) {
    for (const k of ['label', 'tech', 'port']) {
      for (const key of Object.keys(n[k] || {})) if (key !== 'default' && !modes.has(key)) fail(`${f}: node "${n.id}" ${k} has unknown mode key "${key}"`);
    }
    for (const m of n.modes || []) if (!modes.has(m)) fail(`${f}: node "${n.id}" modes has unknown mode "${m}"`);
    if (!n.role) fail(`${f}: node "${n.id}" has no role`);
    else if (roles.size && !roles.has(n.role)) fail(`${f}: node "${n.id}" role "${n.role}" is not one of ${[...roles].join(', ')}`);
  }
  // color references (a "color" field, or any bare "--c-…" value) must be defined in the template
  const walk = (v, where, key) => {
    if (typeof v === 'string') { if ((key === 'color' || /^--c-[\w-]+$/.test(v)) && !cssVarDefs.has(v)) fail(`${f}: ${where} color "${v}" is not a defined CSS variable`); }
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, Array.isArray(v) ? `${where}[${k}]` : `${where}.${k}`, k);
  };
  walk(d, '$');
  for (const fl of d.flows || []) {
    if (fl.only_mode && !modes.has(fl.only_mode)) fail(`${f}: flow "${fl.key}" only_mode "${fl.only_mode}" is not a mode`);
    for (const key of Object.keys(fl).filter(k => k.startsWith('step_outline'))) {
      const outline = fl[key];
      if (!Array.isArray(outline)) { fail(`${f}: flow "${fl.key}" ${key} is not an array`); continue; }
      // step_outline_<suffix> names a mode, or a prefix of one (v1 → v1_monolith_compat)
      const suffix = key.slice('step_outline_'.length);
      if (key !== 'step_outline' && ![...modes].some(m => m === suffix || m.startsWith(suffix + '_'))) fail(`${f}: flow "${fl.key}" ${key} does not name a mode`);
      if (typeof fl.step_count === 'number' && fl.step_count !== outline.length) fail(`${f}: flow "${fl.key}" step_count ${fl.step_count} != ${key} length ${outline.length}`);
      for (const line of outline) {
        const head = String(line).split(':')[0].replace(/\(async\)/g, '');
        if (head.includes('->')) { fail(`${f}: flow "${fl.key}" uses "->" instead of "→" in "${line}"`); continue; }
        const parts = head.split('→').map(s => s.trim());
        if (parts.length !== 2) { fail(`${f}: flow "${fl.key}" outline line is not "from → to: …": "${line}"`); continue; }
        for (const p of parts) if (!ids.has(p)) fail(`${f}: flow "${fl.key}" references unknown node "${p}" in "${line}"`);
      }
    }
  }
}

// ── css-tokens.css drift ────────────────────────────────────────────────────
// The reference tokens must mirror the template: same variables, same values.
const tokens = read(path.join(SKILL, 'assets/css-tokens.css'));
const diffVars = (label, a, b) => {
  if (!a || !b) { fail(`css-tokens.css: could not locate the ${label} block`); return; }
  for (const [k, v] of a) {
    if (!b.has(k)) fail(`css-tokens.css ${label}: ${k} is not in template.html`);
    else if (b.get(k) !== v) fail(`css-tokens.css ${label}: ${k} is "${v}" but template.html has "${b.get(k)}"`);
  }
  for (const k of b.keys()) if (!a.has(k)) fail(`css-tokens.css ${label}: missing ${k} (defined in template.html)`);
};
diffVars(':root', cssBlockVars(tokens, ':root'), tplRoot);
diffVars('body.light', cssBlockVars(tokens, 'body\\.light'), tplLight);

// ── report ──────────────────────────────────────────────────────────────────
if (problems.length) {
  console.error(`✗ ${problems.length} problem(s):`);
  problems.forEach(p => console.error('  - ' + p));
  process.exit(1);
}
console.log(`✓ all checks passed (v${version})`);

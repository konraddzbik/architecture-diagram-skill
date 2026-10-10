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
 *     step_outline node references exist, step_count matches the outline length
 *   - template.html: the inline <script> parses, no unescaped </script> inside it,
 *     every .flowtab has a flows entry and vice versa, every step references a node
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
const scriptMatch = /<script>([\s\S]*?)<\/script>/.exec(template);
if (!scriptMatch) fail('template.html has no <script> block');
else {
  const js = scriptMatch[1];
  try { new vm.Script(js, { filename: 'template.html <script>' }); }
  catch (e) { fail(`template.html script does not parse: ${e.message}`); }
  if (/<\/script\s*>/i.test(js)) fail('template.html script contains an unescaped </script>');

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
  const ids = new Set((d.nodes || []).map(n => n.id));
  for (const n of d.nodes || []) {
    for (const k of ['label', 'tech', 'port']) {
      for (const key of Object.keys(n[k] || {})) if (key !== 'default' && !modes.has(key)) fail(`${f}: node "${n.id}" ${k} has unknown mode key "${key}"`);
    }
    for (const m of n.modes || []) if (!modes.has(m)) fail(`${f}: node "${n.id}" modes has unknown mode "${m}"`);
    if (!n.role) fail(`${f}: node "${n.id}" has no role`);
  }
  for (const fl of d.flows || []) {
    if (fl.only_mode && !modes.has(fl.only_mode)) fail(`${f}: flow "${fl.key}" only_mode "${fl.only_mode}" is not a mode`);
    for (const key of Object.keys(fl).filter(k => k.startsWith('step_outline'))) {
      const outline = fl[key];
      if (!Array.isArray(outline)) { fail(`${f}: flow "${fl.key}" ${key} is not an array`); continue; }
      if (key === 'step_outline' && typeof fl.step_count === 'number' && fl.step_count !== outline.length) fail(`${f}: flow "${fl.key}" step_count ${fl.step_count} != outline length ${outline.length}`);
      for (const line of outline) {
        const head = String(line).split(':')[0].replace(/\(async\)/g, '');
        const parts = head.split('→').map(s => s.trim());
        if (parts.length !== 2) continue;
        for (const p of parts) if (!ids.has(p)) fail(`${f}: flow "${fl.key}" references unknown node "${p}" in "${line}"`);
      }
    }
  }
}

// ── report ──────────────────────────────────────────────────────────────────
if (problems.length) {
  console.error(`✗ ${problems.length} problem(s):`);
  problems.forEach(p => console.error('  - ' + p));
  process.exit(1);
}
console.log(`✓ all checks passed (v${version})`);

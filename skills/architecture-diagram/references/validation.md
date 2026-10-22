# Validating a generated diagram

Three checks, from cheapest to most thorough. Run every one your environment allows; a diagram that fails any of them is not done.

`<skill-dir>` below is the folder that holds this skill's `SKILL.md`. Run the commands from the user's project (where `architecture.html` is), not from the skill folder.

---

## 1. Static checks — needs only `node`

Catches the failures that leave a blank, dead page: a script that no longer parses (an unescaped `</script>` or a typo), a raw `<!--` in the script, an unescaped `${…}` in a backtick payload, plus leftover placeholders, tab/flow mismatches, unknown step node ids and unknown `onlyMode` values. It doesn't check layout or colors.

```bash
node - architecture.html <<'EOF'
const fs = require('fs'), vm = require('vm');
const f = process.argv[2] || 'architecture.html', h = fs.readFileSync(f, 'utf8'), bad = [];
const left = h.match(/\{\{[A-Z][A-Z0-9_]*\}\}/g);
if (left) bad.push('unfilled placeholders: ' + [...new Set(left)].join(' '));
const m = /<script>([\s\S]*?)<\/script>/.exec(h), js = m ? m[1] : '';
try { new vm.Script(js); } catch (e) { bad.push('script does not parse (unescaped </script> or a JS typo?): ' + e.message); }
if (/<!--/.test(js)) bad.push('script contains a raw <!-- (write <\\!--)');
const ids = [...h.matchAll(/class="node"[^>]*data-id="([^"]+)"/g)].map(x => x[1]);
const nav = (/<nav class="flowtabs"[\s\S]*?<\/nav>/.exec(h) || [''])[0];
const tabs = [...nav.matchAll(/data-flow="([^"]+)"/g)].map(x => x[1]);
const modes = [...h.matchAll(/<button data-mode="([^"]+)"/g)].map(x => x[1]);
const src = /const flows = (\{[\s\S]*?\n\});/.exec(js);
let flows = null;
try { flows = vm.runInNewContext('(' + (src ? src[1] : 'null') + ')'); } catch (e) { bad.push('flows object does not evaluate (unescaped ${ in a payload?): ' + e.message); }
if (flows) {
  tabs.filter(t => !flows[t]).forEach(t => bad.push('tab "' + t + '" has no flows entry'));
  for (const [k, fl] of Object.entries(flows)) {
    if (!tabs.includes(k)) bad.push('flow "' + k + '" has no tab');
    if (fl.onlyMode && modes.length && !modes.includes(fl.onlyMode)) bad.push('flow "' + k + '" onlyMode "' + fl.onlyMode + '" is not a mode');
    (fl.steps || []).flatMap(s => s.parallel || [s]).forEach((s, i) => ['from', 'to'].forEach(p => {
      if (!ids.includes(s[p])) bad.push('flow "' + k + '" step ' + (i + 1) + ': ' + p + ' "' + s[p] + '" is not a node id');
    }));
  }
}
ids.filter((x, i) => ids.indexOf(x) !== i).forEach(x => bad.push('duplicate node id ' + x));
console.log(bad.length ? bad.join('\n') : 'static checks OK'); process.exitCode = bad.length ? 1 : 0;
EOF
```

Exit 0 prints `static checks OK`. The template's own comments contain no double-brace text, so any `{{…}}` match is a real leftover.

---

## 2. `screenshot.js` — needs `puppeteer-core` and a Chrome/Chromium binary

```bash
node <skill-dir>/references/screenshot.js architecture.html /tmp/arch-preview
```

It renders the page in headless Chrome, prints the page's own integrity warnings and any JavaScript errors, and saves full-page captures (desktop per mode/flow, a mid-flow step, phone width) to the output directory. Leave the second argument out to write the PNGs next to the HTML.

| Exit | Meaning | What to do |
|---|---|---|
| `0` | Rendered cleanly, no warnings | Look at the captures (below) |
| `1` | The page threw, the diagram script never ran (`window.archValidate` missing and no wires drawn — an unescaped `</script>`, or `<!--` before a `<script` inside a JS string), or the run failed (no driver, browser or file) | Fix the HTML, or install what's missing |
| `2` | Rendered, but the integrity check reported warnings | Fix each printed warning |

`puppeteer-core` is looked up in the current directory first, then next to the script and on `NODE_PATH`. To keep the user's project clean, install it in a temp dir and point `NODE_PATH` there:

```bash
npm i --prefix /tmp/arch-shot puppeteer-core
NODE_PATH=/tmp/arch-shot/node_modules node <skill-dir>/references/screenshot.js architecture.html /tmp/arch-preview
```

Set `PUPPETEER_EXECUTABLE_PATH=/path/to/chrome` if the browser isn't found automatically.

**Look at the canvas captures** (read the PNGs) — exit 0 doesn't prove the layout:
- No two tiles overlap, and no tile is cut off at the right or bottom edge of the canvas.
- Wires between neighbors are long enough to see, and their step-number labels don't pile up.
- Every flow's path reads left to right, without needless crossings.

If tiles overlap or clip, re-place them on the grid in `flow-design-patterns.md` → "The four-column canvas".

---

## 3. No Node, no Chrome — the browser console

Open `architecture.html` in any browser and open the developer console. The page lints itself at boot and logs every problem it finds; `window.archValidate()` returns the same list (an empty array means clean). If `archValidate` is undefined, the diagram script never ran — look for an unescaped `</script>`, a `<!--` in a string, or a `${…}` in a backtick payload.

When none of this is possible (e.g. no tool execution at all), say so when you present the files, and at least re-read the `flows` object against the node ids and tabs by hand.

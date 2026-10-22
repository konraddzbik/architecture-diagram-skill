#!/usr/bin/env node
/* Headless UI regression suite for skills/architecture-diagram/assets/template.html.
   Run: node --test "tests/*.test.js"   (needs puppeteer-core + Chrome; see tests/README.md)
   Loads the raw template and a filled fixture built from it in-test (dev/prod
   modes, an `ext` node, a self-step on a top-row node, a 200-char payload line,
   a literal ${{ secrets.X }} payload) and checks the v1.5.0 review regressions. */
"use strict";
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createRequire } = require("node:module");
const { pathToFileURL } = require("node:url");

const ROOT = path.resolve(__dirname, "..");
const TEMPLATE = path.join(ROOT, "skills/architecture-diagram/assets/template.html");

/* puppeteer-core: current working directory first, then normal resolution (NODE_PATH). */
function loadPuppeteer(){
  try{ return createRequire(path.join(process.cwd(), "/"))("puppeteer-core"); }catch(e){}
  try{ return require("puppeteer-core"); }catch(e){}
  return null;
}
function findChrome(){
  const env = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH;
  if(env) return env;
  return [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium", "/usr/bin/chromium-browser"
  ].find(p=>fs.existsSync(p)) || null;
}
const puppeteer = loadPuppeteer();
const CHROME = findChrome();
const SKIP = (!puppeteer || !CHROME)
  ? `needs puppeteer-core (npm i --no-save puppeteer-core@24, or NODE_PATH) and Chrome (PUPPETEER_EXECUTABLE_PATH)`
  : false;
if(SKIP && process.env.CI) throw new Error("UI tests " + SKIP);

/* ─── fixture: the template filled per the docs ─────────────────────── */
const FILL = {
  PROJECT_LABEL:"Platform team", SYSTEM_NAME:"Shop", TAGLINE:"Checkout", SUBTITLE:"How an order travels through the system.",
  MODE_A_LABEL:"Dev", MODE_A_HINT:"local", MODE_B_LABEL:"Prod", MODE_B_HINT:"cloud",
  FLOW_A_LABEL:"Place order", FLOW_A_NAME:"Place order", FLOW_A_NOTE:"Happy path",
  FLOW_B_LABEL:"Pay", FLOW_B_NAME:"Payment", FLOW_B_NOTE:"Card via Stripe",
  FLOW_C_LABEL:"Seed", FLOW_C_NAME:"Seed catalog", FLOW_C_NOTE:"Runs once",
  NODE_USER_LABEL:"Web app", NODE_USER_TECH:"Next.js 15", NODE_USER_PORT_A:":3000", NODE_USER_PORT_B:"shop.example",
  NODE_ORCH_LABEL:"Order API", NODE_ORCH_TECH:"FastAPI", NODE_ORCH_PORT_A:":8080", NODE_ORCH_PORT_B:"api.example",
  NODE_EMBED_LABEL:"Pricing", NODE_EMBED_TECH_A:"Python job", NODE_EMBED_TECH_B:"Cloud Run", NODE_EMBED_PORT_A:":9000", NODE_EMBED_PORT_B:"internal",
  NODE_VECTOR_LABEL_A:"Postgres", NODE_VECTOR_LABEL_B:"Cloud SQL", NODE_VECTOR_TECH_A:"PG 16", NODE_VECTOR_TECH_B:"PG 16 HA", NODE_VECTOR_PORT_A:":5432", NODE_VECTOR_PORT_B:"private IP",
  NODE_LLM_LABEL:"Stripe", NODE_LLM_TECH_A:"test mode", NODE_LLM_TECH_B:"live mode", NODE_LLM_PORT_A:"api.stripe.com", NODE_LLM_PORT_B:"api.stripe.com",
  NODE_SEED_LABEL:"Seeder", NODE_SEED_TECH:"cron", NODE_SEED_PORT:"one-shot"
};
const LONG_LINE = "Cookie: session=" + "x".repeat(184);            /* 200 chars, no break opportunity */
const SECRET = "${{ secrets.DEPLOY_TOKEN }}";                     /* GitHub Actions expression, shown verbatim */

/* String replacement that fails loudly when the template drifts (function replacer: no $-patterns). */
function sub(h, from, to, all){
  const n = h.split(from).length - 1;
  assert.ok(n > 0, `fixture: "${String(from).slice(0,60)}" not found in template`);
  return all ? h.split(from).join(to) : h.replace(from, ()=>to);
}
function buildFixture(tpl){
  let h = tpl;
  /* self-step on a top-row node (flow_c step 1: embed → embed) */
  h = sub(h, 'from:"seed", to:"orch", color:"--c-seed",\n        title:"{{FLOW_C_STEP_1_TITLE}}"', 'from:"embed", to:"embed", color:"--c-seed",\n        title:"{{FLOW_C_STEP_1_TITLE}}"');
  /* ext role node + a step colored --c-ext */
  h = sub(h, 'data-role="compute" data-id="llm"', 'data-role="ext" data-id="llm"');
  h = sub(h, 'from:"orch", to:"llm", color:"--c-compute"', 'from:"orch", to:"llm", color:"--c-ext"');
  /* long payload line and an escaped ${{ }} expression inside template literals */
  h = sub(h, "payloadOffline:\n`POST /endpoint\n", "payloadOffline:\n`POST /endpoint\n" + LONG_LINE + "\n");
  h = sub(h, "`POST /endpoint_b\n", "`POST /endpoint_b\nAuthorization: Bearer \\" + SECRET + "\n");
  /* modes renamed offline/online → dev/prod in the markup and script only (not
     the stylesheet, so CSS keyed on literal mode names would fail the color test);
     onlineNote is a schema key, keep it */
  const cut = h.indexOf("</head>");
  let body = sub(h.slice(cut), "onlineNote", "\u0000NOTE\u0000", true);
  for(const [a, b] of [["offline","dev"],["Offline","Dev"],["OFFLINE","DEV"],["online","prod"],["Online","Prod"]]) body = sub(body, a, b, true);
  h = h.slice(0, cut) + sub(body, "\u0000NOTE\u0000", "onlineNote", true);
  h = h.replace(/\{\{([A-Z0-9_]+)\}\}/g, (m, k)=>FILL[k] !== undefined ? FILL[k] : (/TITLE$/.test(k) ? "Send " + k.split("_")[1].toLowerCase() + " step " + k.split("_")[3] : m));
  assert.ok(!/\{\{[A-Z0-9_]+\}\}/.test(h), "fixture: unfilled placeholder left");
  return h;
}

/* ─── browser helpers ───────────────────────────────────────────────── */
let browser, tmpDir, FIXTURE;
const sleep = ms=>new Promise(r=>setTimeout(r, ms));

async function open(file, { w = 1440, h = 900, theme = "dark", touch = false } = {}){
  const ctx = await browser.createBrowserContext();   /* fresh localStorage per test */
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", e=>errors.push("pageerror: " + e.message));
  page.on("console", m=>{ if(m.type() === "error") errors.push("console: " + m.text()); });
  await page.emulateMediaFeatures([{ name:"prefers-color-scheme", value: theme }]);
  await page.setViewport({ width:w, height:h, isMobile:touch, hasTouch:touch });
  await page.goto(pathToFileURL(file).href);
  await page.waitForFunction(()=>typeof window.archValidate === "function" && document.querySelector("#wires .wire"), { timeout:5000 });
  await sleep(150);
  return { page, errors, close: ()=>ctx.close() };
}
const stepNo = page=>page.evaluate(()=>state.step);

/* Pairwise overlap of visible nodes (layout boxes, ignoring hover transforms) + tiles leaving the stage. */
function layoutProblems(){
  const st = document.getElementById("stage");
  const ns = [...st.querySelectorAll(".node")].filter(n=>!n.classList.contains("hidden"))
    .map(n=>({ id:n.dataset.id, l:n.offsetLeft, t:n.offsetTop, r:n.offsetLeft + n.offsetWidth, b:n.offsetTop + n.offsetHeight }));
  const out = [];
  for(let i=0;i<ns.length;i++) for(let j=i+1;j<ns.length;j++){
    const a = ns[i], c = ns[j];
    if(a.l < c.r && c.l < a.r && a.t < c.b && c.t < a.b) out.push(`overlap ${a.id}/${c.id}`);
  }
  ns.forEach(n=>{ if(n.l < 0 || n.t < 0 || n.r > st.clientWidth + 1 || n.b > st.clientHeight + 1) out.push(`clipped ${n.id} [${n.l},${n.t},${n.r},${n.b}] in ${st.clientWidth}x${st.clientHeight}`); });
  return out;
}

before(async ()=>{
  if(SKIP) return;
  browser = await puppeteer.launch({ executablePath:CHROME, headless:"new", args:["--no-sandbox","--allow-file-access-from-files"] });
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "arch-ui-"));
  FIXTURE = path.join(tmpDir, "fixture.html");
  fs.writeFileSync(FIXTURE, buildFixture(fs.readFileSync(TEMPLATE, "utf8")));
});
after(async ()=>{
  if(browser) await browser.close();
  if(tmpDir) fs.rmSync(tmpDir, { recursive:true, force:true });
});

describe("architecture-diagram template (headless)", { skip: SKIP }, ()=>{

  test("raw template: no page errors, only placeholder warnings", async ()=>{
    const { page, errors, close } = await open(TEMPLATE);
    const w = await page.evaluate(()=>window.archValidate());
    await close();
    assert.deepEqual(errors, []);
    assert.ok(w.length > 0, "expected placeholder warnings on the unfilled template");
    for(const m of w) assert.match(m, /double-brace placeholder/, m);
    /* D5: lint text itself must not contain a literal placeholder */
    for(const m of w) assert.doesNotMatch(m, /\{\{[A-Z0-9_]+\}\}/);
  });

  test("fixture: no page errors, archValidate() is clean, ${{ }} shown verbatim", async ()=>{
    const { page, errors, close } = await open(FIXTURE);
    const w = await page.evaluate(()=>window.archValidate());
    const r = await page.evaluate(()=>{
      pickFlow("flow_b");
      const legend = [...document.querySelectorAll(".legend .item")].map(i=>i.textContent.trim());
      const wire = document.querySelector('#wires .wire[data-step="1"]');
      return { payload: document.getElementById("panelPayload").textContent, legend, marker: wire && wire.getAttribute("marker-end"),
               extColor: getComputedStyle(document.querySelector('[data-id="llm"]')).getPropertyValue("--c").trim() };
    });
    await close();
    assert.deepEqual(errors, []);
    assert.deepEqual(w, []);
    assert.ok(r.payload.includes("Bearer ${{ secrets.DEPLOY_TOKEN }}"), r.payload);
    assert.ok(r.legend.includes("External") && r.legend.includes("API / Service"), r.legend.join(","));
    assert.equal(r.marker, "url(#ah-slate)");
    assert.notEqual(r.extColor, "");
  });

  for(const [w, h] of [[390,844],[768,1024]]) test(`${w}x${h}: a 200-char payload line does not widen the page`, async ()=>{
    const { page, close } = await open(FIXTURE, { w, h, touch: w < 500 });
    const r = await page.evaluate(()=>{
      const pre = document.getElementById("panelPayload");
      return { doc: document.documentElement.scrollWidth, body: document.body.scrollWidth, vw: innerWidth,
               hasLong: pre.textContent.includes("Cookie: session="), preScrolls: pre.scrollWidth > pre.clientWidth };
    });
    await close();
    assert.ok(r.hasLong, "fixture step 1 should show the long line");
    assert.ok(r.doc <= r.vw && r.body <= r.vw, `page is ${r.doc}px wide at ${r.vw}px`);
    assert.ok(r.preScrolls, "the payload box should scroll inside itself");
  });

  test("no stray packet at the stage origin after boot and resize", async ()=>{
    const { page, close } = await open(FIXTURE, { w:1440, h:900 });
    const probe = ()=>page.evaluate(()=>{
      const p = document.querySelector(".packet.run");
      if(!p) return null;
      const s = document.getElementById("wires").getBoundingClientRect();
      const r = p.getBoundingClientRect();
      const w = document.querySelector(`#wires .wire[data-step="${p.dataset.step}"]`);
      const end = w.getPointAtLength(w.getTotalLength());
      const x = r.left + r.width/2 - s.left, y = r.top + r.height/2 - s.top;
      return { x, y, dEnd: Math.hypot(x - end.x, y - end.y), count: document.querySelectorAll(".packet.run").length };
    });
    await sleep(1800);                                  /* boot flight is 1.5s */
    const boot = await probe();
    await page.setViewport({ width:1300, height:880 });
    await sleep(500);
    const resized = await probe();
    await close();
    for(const [name, r] of [["boot", boot], ["resize", resized]]){
      assert.ok(r, `${name}: no running packet`);
      assert.equal(r.count, 1, `${name}: exactly one active packet`);
      assert.ok(Math.hypot(r.x, r.y) > 20, `${name}: packet at stage origin (${r.x},${r.y})`);
      assert.ok(r.dEnd < 6, `${name}: packet ${r.dEnd.toFixed(1)}px from its wire end`);
    }
  });

  for(const [w, h] of [[1280,720],[1024,768],[768,1024]]){
    test(`no node overlap or clipping at ${w}x${h} (both modes)`, async ()=>{
      const { page, close } = await open(FIXTURE, { w, h });
      const a = await page.evaluate(layoutProblems);
      await page.evaluate(()=>pickMode("prod"));
      await sleep(100);
      const b = await page.evaluate(layoutProblems);
      /* the documented maximum: 4 columns × 3 rows, ~20 characters per line */
      const grid = await page.evaluate(()=>{
        const st = document.getElementById("stage"), proto = st.querySelector('.node[data-id="orch"]');
        st.querySelectorAll(".node").forEach(n=>n.remove());
        [2, 26, 52, 78].forEach((l, i)=>[8, 38, 70].forEach((t, j)=>{
          const n = proto.cloneNode(true);
          n.dataset.id = `n${i}${j}`; n.style.left = l + "%"; n.style.top = t + "%";
          n.querySelector(".label").textContent = "Notification Worker";
          n.querySelector(".tech").textContent = "Node 22 · BullMQ v5";
          n.querySelector(".port").textContent = ":8443 /v1/notify";
          st.appendChild(n);
        }));
        return null;
      }).then(()=>page.evaluate(layoutProblems));
      const doc = await page.evaluate(()=>document.documentElement.scrollWidth - innerWidth);
      await close();
      assert.deepEqual(a, [], "dev mode");
      assert.deepEqual(b, [], "prod mode");
      assert.deepEqual(grid, [], "4x3 grid of 20-character tiles");
      assert.ok(doc <= 0, `page scrolls sideways by ${doc}px`);
    });
  }

  test("self-step on a top-row node stays inside the stage", async ()=>{
    const { page, close } = await open(FIXTURE, { w:1280, h:720 });
    const r = await page.evaluate(()=>{
      pickFlow("flow_c");
      const w = document.querySelector('#wires .wire[data-step="0"]');
      const bb = w.getBBox(), lab = document.querySelector('#wires .wire-label[data-step="0"]').getBBox();
      const st = document.getElementById("stage");
      return { top: Math.min(bb.y, lab.y), bottom: Math.max(bb.y + bb.height, lab.y + lab.height), h: st.clientHeight, step: state.step };
    });
    await close();
    assert.equal(r.step, 0);
    assert.ok(r.top >= 0 && r.bottom <= r.h, `loop spans ${r.top.toFixed(1)}..${r.bottom.toFixed(1)} of ${r.h}`);
  });

  test("fullscreen at 1024x768: controls and tabs do not overlap the canvas", async ()=>{
    const { page, close } = await open(FIXTURE, { w:1024, h:768 });
    await page.click("#btnFullscreen");
    await sleep(300);
    const r = await page.evaluate(()=>{
      const box = el=>{ const q = el.getBoundingClientRect(); return { l:q.left, t:q.top, r:q.right, b:q.bottom }; };
      const hit = (a, c)=>a.l < c.r - .5 && c.l < a.r - .5 && a.t < c.b - .5 && c.t < a.b - .5;
      const cv = box(document.querySelector(".canvas"));
      const parts = [".controls", ".flowtabs"].map(s=>[s, box(document.querySelector(s))]);
      const fb = box(document.getElementById("btnFullscreen"));
      return { fs: document.body.classList.contains("is-fullscreen"), hits: parts.filter(([, b])=>hit(b, cv)).map(([s])=>s),
               exitVisible: fb.l >= 0 && fb.r <= innerWidth };
    });
    r.problems = await page.evaluate(layoutProblems);
    await close();
    assert.ok(r.fs, "fullscreen layout not applied");
    assert.deepEqual(r.hits, []);
    assert.ok(r.exitVisible, "exit-fullscreen button off screen");
    assert.deepEqual(r.problems, []);
  });

  test("focus is not dropped to <body> at the last step", async ()=>{
    const { page, close } = await open(FIXTURE);
    for(const id of ["btnNext", "btnNext2"]){
      await page.evaluate(()=>{ state.step = 0; applyStep(); });
      await page.focus("#" + id);
      const n = await page.evaluate(()=>currentFlow().steps.length - 1);
      for(let i=0;i<n;i++) await page.keyboard.press("Enter");
      const r = await page.evaluate(()=>({ tag: document.activeElement.tagName, id: document.activeElement.id, last: state.step === currentFlow().steps.length - 1 }));
      assert.ok(r.last, "did not reach the last step");
      assert.notEqual(r.tag, "BODY", `${id}: focus fell to body`);
      assert.ok(r.id !== "btnNext" && r.id !== "btnNext2", `${id}: focus stayed on a disabled button`);
    }
    await close();
  });

  test("arrow keys inside the payload box do not change the step", async ()=>{
    const { page, close } = await open(FIXTURE);
    await page.focus("#panelPayload");
    const s0 = await stepNo(page);
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    assert.equal(await stepNo(page), s0);
    await page.focus("#btnPlay");
    await page.keyboard.press("ArrowRight");
    assert.equal(await stepNo(page), s0 + 1, "arrow keys elsewhere still step");
    await close();
  });

  test("element.click() on a node jumps to its step", async ()=>{
    const { page, close } = await open(FIXTURE);
    const r = await page.evaluate(()=>{
      document.querySelector('.node[data-id="vector"]').click();
      const v = state.step;
      document.querySelector('.node[data-id="user"]').click();
      return { v, u: state.step, current: document.querySelector('[aria-current="step"]').dataset.id };
    });
    await close();
    assert.equal(r.v, 1, "vector → step 2 (orch → vector)");
    assert.equal(r.u, 0, "user → step 1");
    assert.equal(r.current, "orch");
  });

  test("mode pill and badge colors differ for dev/prod and match offline/online", async ()=>{
    const colors = async (file, second)=>{
      const { page, close } = await open(file);
      const read = ()=>page.evaluate(()=>{
        const pill = document.querySelector('.modepick button[aria-pressed="true"] .pill');
        return getComputedStyle(pill).backgroundColor + " | " + getComputedStyle(document.getElementById("panelMode")).color;
      });
      const a = await read();
      await page.click(`.modepick button[data-mode="${second}"]`);
      const b = await read();
      await close();
      return [a, b];
    };
    const [dev, prod] = await colors(FIXTURE, "prod");
    const [off, on] = await colors(TEMPLATE, "online");
    assert.notEqual(dev, prod);
    assert.equal(dev, off);
    assert.equal(prod, on);
  });

  test("saved layout stores only moved nodes; v1 snapshot is discarded", async ()=>{
    const { page, close } = await open(FIXTURE);
    await page.focus('.node[data-id="vector"]');
    await page.keyboard.down("Shift"); await page.keyboard.press("ArrowRight"); await page.keyboard.up("Shift");
    const b = await (await page.$('.node[data-id="embed"]')).boundingBox();
    await page.mouse.move(b.x + 20, b.y + 20);
    await page.mouse.down();
    await page.mouse.move(b.x + 120, b.y + 60, { steps:6 });
    await page.mouse.up();
    const saved = await page.evaluate(()=>{
      const keys = Object.keys(localStorage).filter(k=>k.startsWith("arch-layout"));
      return { keys, data: keys.length === 1 ? JSON.parse(localStorage.getItem(keys[0])) : null };
    });
    assert.equal(saved.keys.length, 1, saved.keys.join(","));
    assert.match(saved.keys[0], /^arch-layout-v2-/);
    assert.deepEqual(Object.keys(saved.data).sort(), ["embed", "vector"]);
    /* a leftover v1 full snapshot is removed on the next load */
    const v1 = saved.keys[0].replace("arch-layout-v2-", "arch-layout-");
    await page.evaluate(k=>localStorage.setItem(k, '{"user":{"left":"50%","top":"50%"}}'), v1);
    await page.reload();
    await page.waitForFunction(()=>typeof window.archValidate === "function");
    const after = await page.evaluate(k=>({ v1: localStorage.getItem(k), user: document.querySelector('[data-id="user"]').style.left,
      vector: document.querySelector('[data-id="vector"]').style.left }), v1);
    await close();
    assert.equal(after.v1, null);
    assert.equal(after.user, "2%");
    assert.notEqual(after.vector, "52%", "moved node keeps the viewer's position");
  });

  test("a chorded left+right release ends the drag", async ()=>{
    const { page, close } = await open(FIXTURE);
    const pos = ()=>page.evaluate(()=>{ const n = document.querySelector('[data-id="embed"]'); return n.style.left + " " + n.style.top; });
    const b = await (await page.$('.node[data-id="embed"]')).boundingBox();
    await page.mouse.move(b.x + 20, b.y + 20);
    await page.mouse.down({ button:"left" });
    await page.mouse.move(b.x + 120, b.y + 60, { steps:5 });
    await page.mouse.down({ button:"right" });
    await page.mouse.up({ button:"left" });
    await page.mouse.up({ button:"right" });
    const end = await pos();
    const st = await page.evaluate(()=>({ drag: !!dragState, cls: document.querySelector('[data-id="embed"]').classList.contains("dragging") }));
    await page.mouse.move(b.x + 400, b.y + 300, { steps:5 });
    const later = await pos();
    await close();
    assert.equal(st.drag, false, "dragState still set");
    assert.equal(st.cls, false, "node still .dragging");
    assert.equal(later, end, "node keeps following the pointer");
  });

  test("sanitizer: fuzz vectors never execute, only allowlisted markup survives", async ()=>{
    const vectors = [
      `<a href="javascript:window.__pwned=1">x</a>`,
      `<a href="jav&#x09;ascript:window.__pwned=1">x</a>`,
      `<a href=" &#14;javascript:window.__pwned=1">x</a>`,
      `<a href="data:text/html,<script>alert(1)</script>">x</a>`,
      `<a href="https://x" onclick="window.__pwned=1">x</a>`,
      `<img src=x onerror="window.__pwned=1">`,
      `<svg><script>window.__pwned=1</script></svg>`,
      `<svg onload="window.__pwned=1"></svg>`,
      `<svg><a href="javascript:window.__pwned=1"><text>x</text></a></svg>`,
      `<math><mtext><table><mglyph><style><img src=x onerror="window.__pwned=1">`,
      `<math><mi><mglyph><svg><mtext><textarea><path id="</textarea><img onerror=window.__pwned=1 src=1>">`,
      `<noscript><p title="</noscript><img src=x onerror=window.__pwned=1>">`,
      `<xmp><img src=x onerror=window.__pwned=1></xmp>`,
      `<template><img src=x onerror=window.__pwned=1></template>`,
      `<form><math><mtext></form><form><mglyph><style></math><img src onerror=window.__pwned=1>`,
      `<span><svg><foreignObject><img src=x onerror=window.__pwned=1></foreignObject></svg></span>`,
      `<a href="#" style="position:fixed;inset:0;background:red">overlay</a>`,
      `<details open ontoggle=window.__pwned=1>`,
      `<iframe srcdoc="<script>parent.__pwned=1</script>">`,
      `<mark><select><style><img src=x onerror=window.__pwned=1></style></select></mark>`,
      `<SCRIPT>window.__pwned=1</SCRIPT>`,
      `<scr<script>ipt>window.__pwned=1</script>`
    ];
    const { page, errors, close } = await open(FIXTURE);
    const res = await page.evaluate(async (vs)=>{
      const ok = new Set(["EM","STRONG","B","I","CODE","KBD","BR","U","S","SMALL","SUP","SUB","MARK","SPAN","A"]);
      const out = [];
      for(const v of vs){
        /* through the real render path (step desc → side panel) */
        currentFlow().steps[state.step].desc = v;
        applyStep({ replay:false });
        await new Promise(r=>setTimeout(r, 30));
        const bad = [...document.getElementById("panelDesc").querySelectorAll("*")].filter(e=>
          !ok.has(e.tagName) || e.namespaceURI !== "http://www.w3.org/1999/xhtml" ||
          [...e.attributes].some(a=>!(e.tagName === "A" && ["href","rel","target"].includes(a.name))) ||
          (e.hasAttribute("href") && !/^(https?:|mailto:|#)/i.test(e.getAttribute("href"))));
        out.push({ v, pwned: !!window.__pwned, bad: bad.map(e=>e.outerHTML) });
        window.__pwned = 0;
      }
      /* foreign content (SVG/MathML) is dropped whole, not unwrapped into visible text */
      const foreign = ["<svg><script>window.__pwned=1<\/script></svg>", "<math><mi>x</mi></math>", "<svg><a href=\"#\"><text>x</text></a></svg>"].map(sanitizeHtml);
      return { out, foreign };
    }, vectors);
    await sleep(100);
    const late = await page.evaluate(()=>!!window.__pwned);
    await close();
    for(const r of res.out){
      assert.equal(r.pwned, false, `executed: ${r.v}`);
      assert.deepEqual(r.bad, [], `survived: ${r.v}`);
    }
    assert.equal(late, false);
    assert.deepEqual(res.foreign, ["", "", ""]);
    assert.deepEqual(errors.filter(e=>e.startsWith("pageerror")), []);
  });

  for(const theme of ["dark", "light"]){
    test(`text contrast >= 4.5:1 (${theme} theme)`, async ()=>{
      const { page, close } = await open(FIXTURE, { theme });
      const r = await page.evaluate(async ()=>{
        go(+1);                                         /* active, active-from, participant and preview labels */
        await new Promise(r=>setTimeout(r, 400));
        /* any CSS color (rgb, color(srgb …), color-mix results) → [r,g,b,a] via a 1px canvas */
        const cx = document.createElement("canvas").getContext("2d", { willReadFrequently:true });
        const parse = s=>{
          if(!s || s === "none") return null;
          cx.clearRect(0, 0, 1, 1); cx.fillStyle = "rgba(0,0,0,0)"; cx.fillStyle = s; cx.fillRect(0, 0, 1, 1);
          const d = cx.getImageData(0, 0, 1, 1).data;
          return [d[0], d[1], d[2], d[3] / 255];
        };
        const over = (f, b)=>[0,1,2].map(i=>f[i]*f[3] + b[i]*(1-f[3])).concat(1);
        const lum = c=>{ const f = v=>{ v/=255; return v <= .03928 ? v/12.92 : Math.pow((v+.055)/1.055, 2.4); }; return .2126*f(c[0]) + .7152*f(c[1]) + .0722*f(c[2]); };
        const ratio = (a, b)=>{ const x = lum(a), y = lum(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); };
        const bodyBg = parse(getComputedStyle(document.body).backgroundColor);
        const paint = el=>{
          if(!el || el === document.documentElement) return bodyBg;
          const cs = getComputedStyle(el);
          let bg = parse(cs.backgroundColor) || [0,0,0,0];
          if(bg[3] === 0 && cs.backgroundImage.includes("gradient")){ const g = cs.backgroundImage.match(/rgba?\([^)]+\)|color\([^)]+\)/); if(g){ const c = parse(g[0]); if(c && c[3] > .9) bg = c; } }
          return bg[3] >= 1 ? bg : over(bg, paint(el.parentElement));
        };
        const opacity = el=>{ let o = 1; for(let a = el; a && a !== document.documentElement; a = a.parentElement) o *= parseFloat(getComputedStyle(a).opacity); return o; };
        const KEY = ".node .label, .node .tech, .node .port, .panel-title, .panel-desc, .panel-step, .panel-mode, .panel-route, .panel-payload, .chip, .legend .item, .flowtab, .modepick button, .canvas-title, .stepidx, .flow-note, .scenario-note, .sub";
        const fails = [];
        document.querySelectorAll(KEY).forEach(el=>{
          if(!el.textContent.trim() || !el.getClientRects().length || el.closest(".dimmed,.hidden,button:disabled")) return;
          const cs = getComputedStyle(el), bg = paint(el);
          const fg = over(parse(cs.color), bg), o = opacity(el);
          const r = ratio(over([...fg.slice(0,3), o], bg), bg);
          if(r < 4.5) fails.push(`${el.className || el.tagName} "${el.textContent.trim().slice(0,20)}" ${r.toFixed(2)}`);
        });
        document.querySelectorAll("#wires .wire-label.active, #wires .wire-label.preview").forEach(t=>{
          const cs = getComputedStyle(t);
          const halo = over(parse(cs.stroke) || [0,0,0,0], bodyBg);
          const fg = over([...over(parse(cs.fill), halo).slice(0,3), parseFloat(cs.opacity)], halo);
          const r = ratio(fg, halo);
          if(r < 4.5) fails.push(`${t.getAttribute("class")} "${t.textContent}" ${r.toFixed(2)}`);
        });
        return { light: document.body.classList.contains("light"), fails };
      });
      await close();
      assert.equal(r.light, theme === "light");
      assert.deepEqual(r.fails, []);
    });
  }
});

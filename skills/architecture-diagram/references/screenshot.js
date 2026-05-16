/*
 * screenshot.js — spot-check a generated architecture.html in headless Chrome.
 *
 * Usage:
 *   1. Make sure puppeteer-core is installed:  npm i puppeteer-core
 *   2. Make sure a chromium binary exists. Common locations:
 *        /home/claude/.cache/puppeteer/chrome/linux-*\/chrome-linux64/chrome
 *        /usr/bin/chromium
 *   3. Run:  node screenshot.js <path-to-architecture.html> [output-dir]
 *
 * It will capture:
 *   - default mode + first flow
 *   - alternate mode + first flow
 *   - alternate mode + second flow (if it exists)
 *   - default mode + a non-first flow at step 3 (to verify step animation)
 *
 * Output files: preview-A-flow1.png, preview-B-flow1.png, etc.
 *
 * If the layout looks wrong (wires crossing, nodes overlapping, panel cramped),
 * adjust node positions in the HTML and rerun.
 */

const fs = require('fs');
const path = require('path');

let puppeteer;
try { puppeteer = require('puppeteer-core'); }
catch (e) {
  console.error("puppeteer-core not installed. Run: npm i puppeteer-core");
  process.exit(1);
}

// ── locate chromium ────────────────────────────────────────────────────────
function findChrome() {
  const candidates = [
    '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome',
  ];
  // also search puppeteer cache
  const cacheDir = path.join(process.env.HOME || '/root', '.cache/puppeteer/chrome');
  if (fs.existsSync(cacheDir)) {
    for (const v of fs.readdirSync(cacheDir)) {
      const p = path.join(cacheDir, v, 'chrome-linux64/chrome');
      if (fs.existsSync(p)) candidates.unshift(p);
    }
  }
  return candidates.find(p => fs.existsSync(p));
}

// ── main ───────────────────────────────────────────────────────────────────
(async () => {
  const htmlPath = process.argv[2];
  const outDir = process.argv[3] || path.dirname(htmlPath);
  if (!htmlPath) {
    console.error("Usage: node screenshot.js <path-to-architecture.html> [output-dir]");
    process.exit(1);
  }
  const abs = path.resolve(htmlPath);
  if (!fs.existsSync(abs)) {
    console.error(`File not found: ${abs}`);
    process.exit(1);
  }

  const chrome = findChrome();
  if (!chrome) {
    console.error("No chromium found. Install chromium or set executablePath manually in this script.");
    process.exit(1);
  }
  console.log(`Using chromium: ${chrome}`);

  const browser = await puppeteer.launch({
    executablePath: chrome,
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--font-render-hinting=none']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1480, height: 920, deviceScaleFactor: 2 });
  await page.goto(`file://${abs}`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500)); // let fonts settle

  // discover modes and flows from the DOM
  const meta = await page.evaluate(() => {
    const modes = Array.from(document.querySelectorAll('.modepick button')).map(b => b.dataset.mode);
    const flows = Array.from(document.querySelectorAll('.flowtab')).map(b => b.dataset.flow);
    return { modes, flows };
  });
  console.log("Modes:", meta.modes);
  console.log("Flows:", meta.flows);

  const captures = [];
  const captureNow = async (name) => {
    const file = path.join(outDir, `preview-${name}.png`);
    await page.screenshot({ path: file });
    captures.push(file);
    console.log(`  ✓ ${file}`);
  };

  // default mode (first) + first flow
  await captureNow(`${meta.modes[0]}-${meta.flows[0]}`);

  // alternate mode (if exists) + first flow
  if (meta.modes.length > 1) {
    await page.click(`.modepick button[data-mode="${meta.modes[1]}"]`);
    await new Promise(r => setTimeout(r, 600));
    await captureNow(`${meta.modes[1]}-${meta.flows[0]}`);

    // alternate mode + second flow if exists
    if (meta.flows.length > 1) {
      await page.click(`.flowtab[data-flow="${meta.flows[1]}"]`);
      await new Promise(r => setTimeout(r, 400));
      await captureNow(`${meta.modes[1]}-${meta.flows[1]}`);
    }
  }

  // back to default mode, last flow if exists, advance a couple of steps
  await page.click(`.modepick button[data-mode="${meta.modes[0]}"]`);
  const probeFlow = meta.flows[meta.flows.length-1];
  await page.click(`.flowtab[data-flow="${probeFlow}"]`);
  await new Promise(r => setTimeout(r, 300));
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await new Promise(r => setTimeout(r, 400));
  await captureNow(`${meta.modes[0]}-${probeFlow}-step3`);

  await browser.close();
  console.log(`\nCaptured ${captures.length} screenshot(s).`);
})().catch(e => {
  console.error("Screenshot failed:", e);
  process.exit(1);
});

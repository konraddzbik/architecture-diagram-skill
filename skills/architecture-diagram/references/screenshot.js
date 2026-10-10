/*
 * screenshot.js — spot-check a generated architecture.html in headless Chrome.
 *
 * Usage:
 *   1. Install the driver (no bundled browser):  npm i puppeteer-core
 *   2. Have a Chrome/Chromium binary available. Auto-detected on macOS, Linux and
 *      Windows, or point to one explicitly:
 *        PUPPETEER_EXECUTABLE_PATH=/path/to/chrome node screenshot.js architecture.html
 *   3. Run:  node screenshot.js <path-to-architecture.html> [output-dir]
 *
 * It captures:
 *   - default mode + first flow
 *   - alternate mode + first flow (if a second mode exists)
 *   - alternate mode + second flow (if it exists)
 *   - default mode + last flow at step 3 (to verify step animation)
 *   - a phone-width (390px) capture of the first flow
 *
 * It also prints the template's built-in integrity warnings (unknown node ids,
 * flows without tabs, leftover {{PLACEHOLDERS}}, …) and any JavaScript errors,
 * and exits non-zero if the page threw — so an agent can treat a failing run
 * as "fix the HTML before showing it to the user".
 *
 * Output files: preview-<mode>-<flow>.png, …
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

let puppeteer;
try { puppeteer = require('puppeteer-core'); }
catch (e) {
  console.error('puppeteer-core not installed. Run: npm i puppeteer-core');
  process.exit(1);
}

// ── locate a browser ───────────────────────────────────────────────────────
function findChrome() {
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH;
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;

  const home = os.homedir();
  const candidates = [];

  if (process.platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      path.join(home, 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
    );
  } else if (process.platform === 'win32') {
    const roots = [process.env['PROGRAMFILES'], process.env['PROGRAMFILES(X86)'], process.env['LOCALAPPDATA']].filter(Boolean);
    for (const r of roots) {
      candidates.push(
        path.join(r, 'Google/Chrome/Application/chrome.exe'),
        path.join(r, 'Chromium/Application/chrome.exe'),
        path.join(r, 'Microsoft/Edge/Application/msedge.exe'),
      );
    }
  } else {
    candidates.push(
      '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable', '/snap/bin/chromium',
    );
  }

  // puppeteer's own download cache (any platform)
  const cacheDir = path.join(home, '.cache/puppeteer/chrome');
  if (fs.existsSync(cacheDir)) {
    for (const v of fs.readdirSync(cacheDir)) {
      for (const rel of ['chrome-linux64/chrome', 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
                         'chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', 'chrome-win64/chrome.exe']) {
        const p = path.join(cacheDir, v, rel);
        if (fs.existsSync(p)) candidates.unshift(p);
      }
    }
  }
  return candidates.find(p => fs.existsSync(p));
}

// `--no-sandbox` disables Chrome's process sandbox. Only needed when running as
// root inside a container (where the sandbox cannot start). Opt in explicitly
// otherwise, instead of weakening the browser on every developer machine.
function launchArgs() {
  const args = ['--disable-dev-shm-usage', '--font-render-hinting=none'];
  const isRoot = typeof process.getuid === 'function' && process.getuid() === 0;
  if (isRoot || process.env.PUPPETEER_NO_SANDBOX === '1') args.push('--no-sandbox', '--disable-setuid-sandbox');
  return args;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── main ───────────────────────────────────────────────────────────────────
(async () => {
  const htmlPath = process.argv[2];
  if (!htmlPath) {
    console.error('Usage: node screenshot.js <path-to-architecture.html> [output-dir]');
    process.exit(1);
  }
  const abs = path.resolve(htmlPath);
  if (!fs.existsSync(abs)) {
    console.error(`File not found: ${abs}`);
    process.exit(1);
  }
  const outDir = path.resolve(process.argv[3] || path.dirname(abs));
  fs.mkdirSync(outDir, { recursive: true });

  const chrome = findChrome();
  if (!chrome) {
    console.error('No Chrome/Chromium found. Install one or set PUPPETEER_EXECUTABLE_PATH.');
    process.exit(1);
  }
  console.log(`Using browser: ${chrome}`);

  const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: launchArgs() });
  const page = await browser.newPage();

  const pageErrors = [];
  const consoleWarnings = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('console', m => {
    const t = m.type();
    if (t === 'error' || t === 'warning') consoleWarnings.push(`[${t}] ${m.text()}`);
  });

  await page.setViewport({ width: 1480, height: 920, deviceScaleFactor: 2 });
  await page.goto(`file://${abs}`, { waitUntil: 'load' });
  await sleep(1200); // let fonts + first paint settle

  // discover modes and flows from the DOM
  const meta = await page.evaluate(() => ({
    modes: Array.from(document.querySelectorAll('.modepick button')).map(b => b.dataset.mode),
    flows: Array.from(document.querySelectorAll('.flowtab')).map(b => b.dataset.flow),
    warnings: (typeof window.archValidate === 'function') ? window.archValidate() : null,
  }));
  console.log('Modes:', meta.modes);
  console.log('Flows:', meta.flows);

  if (meta.flows.length === 0) {
    console.error('No .flowtab buttons found — nothing to capture.');
    await browser.close();
    process.exit(1);
  }

  const captures = [];
  const captureNow = async (name) => {
    const file = path.join(outDir, `preview-${name}.png`);
    await page.screenshot({ path: file });
    captures.push(file);
    console.log(`  ✓ ${file}`);
  };
  const clickMode = async (m) => { await page.click(`.modepick button[data-mode="${m}"]`); await sleep(600); };
  const clickFlow = async (f) => { await page.click(`.flowtab[data-flow="${f}"]`); await sleep(400); };

  const mode0 = meta.modes[0];
  const flow0 = meta.flows[0];

  // default mode + first flow
  await captureNow(`${mode0 || 'single'}-${flow0}`);

  // alternate mode (if exists) + first flow, then + second flow
  if (meta.modes.length > 1) {
    await clickMode(meta.modes[1]);
    await captureNow(`${meta.modes[1]}-${flow0}`);
    if (meta.flows.length > 1) {
      await clickFlow(meta.flows[1]);
      await captureNow(`${meta.modes[1]}-${meta.flows[1]}`);
    }
    await clickMode(mode0);
  }

  // last flow, advanced a couple of steps (verifies stepping + packet animation)
  const probeFlow = meta.flows[meta.flows.length - 1];
  await clickFlow(probeFlow);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await sleep(400);
  await captureNow(`${mode0 || 'single'}-${probeFlow}-step3`);

  // phone width: checks that nodes aren't clipped and controls wrap
  await clickFlow(flow0);
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await sleep(500);
  await captureNow(`mobile-${flow0}`);

  await browser.close();

  console.log(`\nCaptured ${captures.length} screenshot(s).`);
  if (meta.warnings && meta.warnings.length) {
    console.log(`\nDiagram integrity warnings (${meta.warnings.length}):`);
    meta.warnings.forEach(w => console.log(`  ! ${w}`));
  }
  if (consoleWarnings.length) {
    console.log('\nBrowser console:');
    consoleWarnings.forEach(w => console.log(`  ${w}`));
  }
  if (pageErrors.length) {
    console.error('\nJavaScript errors on the page:');
    pageErrors.forEach(e => console.error(`  ✗ ${e}`));
    process.exit(2);
  }
})().catch(e => {
  console.error('Screenshot failed:', e);
  process.exit(1);
});

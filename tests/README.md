# UI regression tests

Headless checks of `skills/architecture-diagram/assets/template.html` (raw, plus a filled fixture built in-test). Needs Chrome and `puppeteer-core`, nothing else:

    npm i --no-save --prefix /tmp/pptr puppeteer-core@24
    NODE_PATH=/tmp/pptr/node_modules PUPPETEER_EXECUTABLE_PATH="/path/to/chrome" node --test "tests/*.test.js"

`puppeteer-core` is resolved from the current directory first, then `NODE_PATH`; Chrome from `PUPPETEER_EXECUTABLE_PATH`, `CHROME_PATH` or the usual macOS/Linux install paths. Without them the suite is skipped locally and fails on CI.

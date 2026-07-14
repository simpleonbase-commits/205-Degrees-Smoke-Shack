import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const outDir = resolve(root, 'screenshots');
const pngOut = resolve(outDir, 'homepage.png');
const svgOut = resolve(outDir, 'homepage.svg');
const port = Number(process.env.SCREENSHOT_PORT || 5173);

await mkdir(outDir, { recursive: true });

function firstExecutable(candidates) {
  for (const command of candidates) {
    const result = spawnSync('bash', ['-lc', `command -v ${command}`], { encoding: 'utf8' });
    if (result.status === 0 && result.stdout.trim()) return result.stdout.trim();
  }
  return null;
}

async function captureWithBrowser(browser) {
  const server = spawn('python3', ['-m', 'http.server', String(port)], { cwd: root, stdio: 'ignore' });
  try {
    await new Promise((resolveReady) => setTimeout(resolveReady, 800));
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      '--window-size=1440,1200',
      `--screenshot=${pngOut}`,
      `http://127.0.0.1:${port}/`,
    ];
    const result = spawnSync(browser, args, { encoding: 'utf8' });
    if (result.status !== 0) throw new Error(result.stderr || result.stdout || `${browser} failed`);
    await access(pngOut, constants.R_OK);
    console.log(`Captured browser screenshot: ${pngOut}`);
    return true;
  } finally {
    server.kill('SIGTERM');
  }
}

async function writeSvgFallback() {
  const logo = await readFile(resolve(root, 'assets/logo.svg'), 'utf8');
  const logoData = `data:image/svg+xml;base64,${Buffer.from(logo).toString('base64')}`;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1200" viewBox="0 0 1440 1200" role="img" aria-labelledby="title desc">
  <title id="title">205 Degrees Smoke Shack homepage preview</title>
  <desc id="desc">A browser-free fallback preview of the homepage hero, generated when Playwright or a system browser is unavailable.</desc>
  <defs>
    <radialGradient id="ember" cx="72%" cy="38%" r="48%"><stop offset="0" stop-color="#f47a18" stop-opacity=".34"/><stop offset="1" stop-color="#050403" stop-opacity="0"/></radialGradient>
    <linearGradient id="button" x1="0" x2="1"><stop stop-color="#ffb018"/><stop offset="1" stop-color="#f47a18"/></linearGradient>
    <filter id="shadow"><feDropShadow dx="0" dy="24" stdDeviation="22" flood-color="#000" flood-opacity=".45"/></filter>
  </defs>
  <rect width="1440" height="1200" fill="#050403"/>
  <rect width="1440" height="1200" fill="url(#ember)"/>
  <rect x="24" y="24" width="1392" height="1080" rx="34" fill="#080604" stroke="#8a3b13" stroke-opacity=".62"/>
  <text x="92" y="100" fill="#f8dfb7" font-family="Georgia, serif" font-size="20" letter-spacing="4">205° SMOKE SHACK</text>
  <text x="940" y="100" fill="#cdb28a" font-family="Georgia, serif" font-size="15" letter-spacing="3">MENU  CATERING  ORDERS  VISIT</text>
  <text x="92" y="235" fill="#ffb018" font-family="Georgia, serif" font-size="16" letter-spacing="5">IDAHO BARBECUE • SMOKE, FIRE, CRAFT</text>
  <text x="92" y="360" fill="#f8dfb7" font-family="Georgia, serif" font-size="92" font-weight="700">BUILT ON</text>
  <text x="92" y="455" fill="#f8dfb7" font-family="Georgia, serif" font-size="92" font-weight="700">SMOKE.</text>
  <text x="92" y="550" fill="#f8dfb7" font-family="Georgia, serif" font-size="92" font-weight="700">SERVED</text>
  <text x="92" y="645" fill="#f8dfb7" font-family="Georgia, serif" font-size="92" font-weight="700">WITH PRIDE.</text>
  <foreignObject x="92" y="690" width="565" height="150"><div xmlns="http://www.w3.org/1999/xhtml" style="color:#cdb28a;font:24px Georgia,serif;line-height:1.55">205 Degrees Smoke Shack brings a polished, pit-forward BBQ experience to pop-ups, private events, and our growing mobile kitchen.</div></foreignObject>
  <rect x="92" y="875" width="206" height="58" rx="29" fill="url(#button)"/><text x="126" y="912" fill="#170b04" font-family="Georgia, serif" font-size="15" letter-spacing="2">VIEW THE MENU</text>
  <rect x="322" y="875" width="300" height="58" rx="29" fill="#090604" stroke="#f47a18"/><text x="352" y="912" fill="#f8dfb7" font-family="Georgia, serif" font-size="15" letter-spacing="2">CATERING: 208-582-3259</text>
  <rect x="735" y="190" width="560" height="560" rx="32" fill="#100b08" stroke="#8a3b13" stroke-opacity=".7" filter="url(#shadow)"/>
  <image href="${logoData}" x="760" y="215" width="510" height="510" preserveAspectRatio="xMidYMid meet"/>
</svg>`;
  await writeFile(svgOut, svg);
  console.log(`No browser found; wrote SVG fallback preview: ${svgOut}`);
}

const browser = firstExecutable(['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable']);
if (browser) {
  await captureWithBrowser(browser);
} else {
  await writeSvgFallback();
}

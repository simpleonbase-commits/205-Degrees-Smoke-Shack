import { spawnSync } from 'node:child_process';

const commands = [
  {
    name: 'apt-get',
    check: 'command -v apt-get',
    install: 'apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y chromium',
  },
  {
    name: 'apk',
    check: 'command -v apk',
    install: 'apk add --no-cache chromium',
  },
  {
    name: 'dnf',
    check: 'command -v dnf',
    install: 'dnf install -y chromium',
  },
  {
    name: 'brew',
    check: 'command -v brew',
    install: 'brew install --cask chromium || brew install chromium',
  },
];

function sh(command, options = {}) {
  return spawnSync('bash', ['-lc', command], { stdio: options.stdio ?? 'pipe', encoding: 'utf8' });
}

const existing = sh('command -v chromium || command -v chromium-browser || command -v google-chrome || command -v google-chrome-stable');
if (existing.status === 0 && existing.stdout.trim()) {
  console.log(`Browser executable already available: ${existing.stdout.trim()}`);
  process.exit(0);
}

const installer = commands.find(({ check }) => sh(check).status === 0);
if (!installer) {
  console.error('No supported package manager found. Install Chromium and rerun npm run screenshot.');
  process.exit(1);
}

console.log(`Installing Chromium with ${installer.name}...`);
const result = sh(installer.install, { stdio: 'inherit' });
if (result.status !== 0) {
  console.error(`Unable to install Chromium with ${installer.name}. Install Chromium manually, or set BROWSER_EXECUTABLE to a Chrome/Chromium binary.`);
  process.exit(result.status ?? 1);
}

const installed = sh('command -v chromium || command -v chromium-browser || command -v google-chrome || command -v google-chrome-stable');
if (installed.status !== 0 || !installed.stdout.trim()) {
  console.error('Chromium installation completed, but no browser executable was found on PATH.');
  process.exit(1);
}

console.log(`Browser executable ready: ${installed.stdout.trim()}`);

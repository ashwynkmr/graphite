// One-step setup on Cloudflare: creates the database, makes the secret key and stores it directly
// in Cloudflare, publishes the service, and tells the app where to find it. The private key is
// never shown or saved on this computer. Safe to run again: it keeps what already exists.
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TOML = join(ROOT, 'wrangler.toml');
const APP_ENV = join(ROOT, process.env.SETUP_APP_ENV ?? '../.env.production');
const WRANGLER = process.env.WRANGLER_BIN ?? join(ROOT, 'node_modules/.bin/wrangler');
const NAME = 'graphite-push';
const PLACEHOLDER = '00000000-0000-0000-0000-000000000000';
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

function stop(message, detail = '') {
  console.error(`\nSetup stopped: ${message}`);
  if (detail) console.error(detail.trim().split('\n').slice(-6).join('\n'));
  process.exit(1);
}

function run(args, input) {
  return spawnSync(WRANGLER, args, { cwd: ROOT, input, encoding: 'utf8', env: { ...process.env, WRANGLER_SEND_METRICS: 'false' } });
}

const base64url = (bytes) => Buffer.from(bytes).toString('base64url');

async function makeKeys() {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const publicKey = base64url(await crypto.subtle.exportKey('raw', pair.publicKey));
  const { d: privateKey } = await crypto.subtle.exportKey('jwk', pair.privateKey);
  return { publicKey, privateKey };
}

console.log('1 of 4: Checking you are logged in to Cloudflare…');
if (run(['whoami']).stdout?.includes('You are not authenticated') !== false) stop('you are not logged in. Run: npx wrangler login');

console.log('2 of 4: Setting up the database…');
let toml = readFileSync(TOML, 'utf8');
if (toml.includes(PLACEHOLDER)) {
  const listed = run(['d1', 'list', '--json']);
  let id;
  try {
    id = JSON.parse(listed.stdout).find((d) => d.name === NAME)?.uuid;
  } catch {
    // Handled by creating it below.
  }
  if (!id) {
    const created = run(['d1', 'create', NAME]);
    id = created.stdout?.match(UUID)?.[0];
    if (!id) stop('could not create the database.', `${created.stdout ?? ''}${created.stderr ?? ''}`);
  }
  toml = toml.replace(PLACEHOLDER, id);
  writeFileSync(TOML, toml);
}

console.log('3 of 4: Making your secret key and storing it in Cloudflare…');
let publicKey = toml.match(/VAPID_PUBLIC_KEY = "([^"]+)"/)?.[1];
if (!publicKey) {
  const keys = await makeKeys();
  const stored = run(['secret', 'put', 'VAPID_PRIVATE_KEY'], keys.privateKey);
  if (stored.status !== 0) stop('could not store the secret key.', stored.stderr ?? '');
  publicKey = keys.publicKey;
  toml = toml.replace('[vars]\n', `[vars]\nVAPID_PUBLIC_KEY = "${publicKey}"\n`);
  writeFileSync(TOML, toml);
}

console.log('4 of 4: Publishing the service…\n');
// Shown live, because a new Cloudflare account may ask a question here.
const output = await new Promise((resolve) => {
  let text = '';
  const child = spawn(WRANGLER, ['deploy'], { cwd: ROOT, stdio: ['inherit', 'pipe', 'pipe'], env: { ...process.env, WRANGLER_SEND_METRICS: 'false' } });
  for (const stream of [child.stdout, child.stderr]) {
    stream.on('data', (chunk) => {
      text += chunk;
      process.stdout.write(chunk);
    });
  }
  child.on('close', (code) => resolve({ code, text }));
});
const url = output.text.match(/https:\/\/[a-z0-9.-]+\.workers\.dev/)?.[0];
if (output.text.includes('register a workers.dev subdomain')) stop('Cloudflare needs you to pick a name first. Open the link above, choose a name, then run: npm run setup');
if (output.code !== 0 || !url) stop('could not publish the service. The lines above say why.');

const health = await fetch(`${url}/health`).then((r) => r.text()).catch(() => '');
writeFileSync(APP_ENV, `VITE_PUSH_SERVER_URL=${url}\nVITE_PUSH_PUBLIC_KEY=${publicKey}\n`);

console.log(`\nDone. Your service is at ${url}`);
console.log(health.includes('"ok":true') ? 'It is answering correctly.' : 'It may need a minute before it answers.');
console.log('Nothing here is secret. Go back to Claude and say: setup finished.');

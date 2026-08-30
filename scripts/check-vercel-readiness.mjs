import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Advisory source audit, not proof of authentication or deployment security.
// Run from any directory. Never reads .env files or prints secret values.
const root = fileURLToPath(new URL('../', import.meta.url));
const blockers = [];
async function scan(directory) {
  for (const entry of await readdir(path.join(root, directory), { withFileTypes: true })) {
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) await scan(relative);
    else if (/\.(?:ts|tsx|js|mjs)$/.test(entry.name)) {
      const source = await readFile(path.join(root, relative), 'utf8');
      if (/from\s+["']cloudflare:workers["']/.test(source))
        blockers.push(`${relative}: Cloudflare runtime import requires a Node-compatible adapter.`);
      if (/oai-authenticated-user-/.test(source))
        blockers.push(`${relative}: Sites identity headers must be removed from the Vercel trust boundary.`);
    }
  }
}
await scan('app');
await scan('db');
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
if (!pkg.scripts?.['build:vercel'])
  blockers.push('package.json: a separate build:vercel script is not implemented.');
if (!pkg.dependencies?.['next-auth'])
  blockers.push('package.json: the proposed Auth.js Google integration is not installed.');

console.log('Vercel source readiness audit');
for (const blocker of blockers) console.log(`BLOCKED: ${blocker}`);
console.log('This audit does not inspect Vercel settings, validate sessions, or test database access.');
console.log('Before release: verify denied access, allowed Google sign-in, cross-user isolation, persisted progress, and Gemini server-side secrets.');
if (blockers.length) {
  console.log(`NOT READY: ${blockers.length} source blockers. See docs/VERCEL_MIGRATION.md.`);
  process.exitCode = 1;
} else {
  console.log('No known source-pattern blockers; production acceptance checks are still required.');
}

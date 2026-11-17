// Build the site against a content fixture and run the build tests on that output.
// Usage: node scripts/test-fixture.mjs tests/fixtures/empty
import { spawnSync } from 'node:child_process';

const fixture = process.argv[2] ?? 'tests/fixtures/empty';
const env = { ...process.env, ICARUS_FIXTURE: fixture };

for (const args of [['astro', 'build'], ['vitest', 'run', 'tests/build']]) {
  const r = spawnSync('npx', args, { env, stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

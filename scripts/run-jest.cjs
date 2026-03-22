#!/usr/bin/env node

const { existsSync, readdirSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');
const { createServer } = require('node:net');

function resolveJestBin() {
  try {
    return require.resolve('jest/bin/jest');
  } catch {}

  const pnpmDir = join(process.cwd(), 'node_modules', '.pnpm');
  if (!existsSync(pnpmDir)) {
    return null;
  }

  for (const entry of readdirSync(pnpmDir)) {
    if (!entry.startsWith('jest@')) continue;

    const candidate = join(pnpmDir, entry, 'node_modules', 'jest', 'bin', 'jest.js');
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function canBindEphemeralPort() {
  return new Promise((resolve) => {
    const server = createServer();
    const finish = (value) => {
      server.removeAllListeners();
      resolve(value);
    };

    server.once('error', () => finish(false));
    server.listen(0, '127.0.0.1', () => {
      server.close(() => finish(true));
    });
  });
}

(async () => {
  const jestBin = resolveJestBin();

  if (!jestBin) {
    console.error('Unable to locate Jest. Run `pnpm install` in an environment with registry access.');
    process.exit(1);
  }

  const env = { ...process.env };
  if (!(await canBindEphemeralPort())) {
    env.SKIP_NETWORK_TESTS = '1';
  }

  const result = spawnSync(
    process.execPath,
    [jestBin, '--config', 'jest.config.js', ...process.argv.slice(2)],
    {
      stdio: 'inherit',
      env,
    },
  );

  if (result.error) {
    throw result.error;
  }

  process.exit(result.status ?? 1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

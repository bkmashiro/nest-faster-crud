#!/usr/bin/env node

const { existsSync, readdirSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');

const PROJECTS = [
  'packages/auth/tsconfig.json',
  'packages/core/tsconfig.json',
  'packages/drizzle/tsconfig.json',
  'packages/express/tsconfig.json',
  'packages/fastify/tsconfig.json',
  'packages/gen/tsconfig.json',
  'packages/graphql/tsconfig.json',
  'packages/hono/tsconfig.json',
  'packages/mikro-orm/tsconfig.json',
  'packages/mongoose/tsconfig.json',
  'packages/nest/tsconfig.json',
  'packages/prisma/tsconfig.json',
  'packages/react/tsconfig.json',
  'packages/solid/tsconfig.json',
  'packages/svelte/tsconfig.json',
  'packages/trpc/tsconfig.json',
  'packages/typeorm/tsconfig.json',
  'packages/validation/tsconfig.json',
  'apps/demo/tsconfig.json',
  'apps/demo-full/tsconfig.json',
];

function resolveTscBin() {
  try {
    return require.resolve('typescript/bin/tsc');
  } catch {}

  const pnpmDir = join(process.cwd(), 'node_modules', '.pnpm');
  if (!existsSync(pnpmDir)) {
    return null;
  }

  for (const entry of readdirSync(pnpmDir)) {
    if (!entry.startsWith('typescript@')) continue;

    const candidate = join(pnpmDir, entry, 'node_modules', 'typescript', 'bin', 'tsc');
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

const tscBin = resolveTscBin();

if (!tscBin) {
  console.error('Unable to locate TypeScript. Run `pnpm install` in an environment with registry access.');
  process.exit(1);
}

for (const project of PROJECTS) {
  const result = spawnSync(process.execPath, [tscBin, '-p', project], { stdio: 'inherit' });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

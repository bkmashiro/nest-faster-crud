const projects = [
  'packages/auth',
  'packages/core',
  'packages/drizzle',
  'packages/express',
  'packages/fastify',
  'packages/gen',
  'packages/graphql',
  'packages/hono',
  'packages/mikro-orm',
  'packages/mongoose',
  'packages/nest',
  'packages/prisma',
  'packages/react',
  'packages/solid',
  'packages/svelte',
  'packages/trpc',
  'packages/typeorm',
  'packages/validation',
];

if (!process.env.SKIP_NETWORK_TESTS) {
  projects.push('apps/demo-full');
}

module.exports = {
  projects,
};

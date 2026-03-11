import { defineConfig } from 'vitepress';

export default defineConfig({
  title: '@faster-crud',
  description: 'End-to-end type-safe CRUD for any framework',
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Adapters', link: '/adapters/typeorm' },
      { text: 'Frontend', link: '/frontend/react' },
      { text: 'CLI', link: '/cli/gen' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Entity Decorators', link: '/guide/entity-decorators' },
            { text: 'Filter Operators', link: '/guide/filter-operators' },
            { text: 'Lifecycle Hooks', link: '/guide/lifecycle-hooks' },
            { text: 'Soft Delete', link: '/guide/soft-delete' },
            { text: 'Validation', link: '/guide/validation' },
          ],
        },
      ],
      '/adapters/': [
        {
          text: 'Database Adapters',
          items: [
            { text: 'TypeORM', link: '/adapters/typeorm' },
            { text: 'Prisma', link: '/adapters/prisma' },
            { text: 'Drizzle', link: '/adapters/drizzle' },
            { text: 'Mongoose', link: '/adapters/mongoose' },
            { text: 'MikroORM', link: '/adapters/mikro-orm' },
          ],
        },
        {
          text: 'Framework Adapters',
          items: [
            { text: 'Hono', link: '/adapters/hono' },
            { text: 'Express', link: '/adapters/express' },
            { text: 'Fastify', link: '/adapters/fastify' },
            { text: 'tRPC', link: '/adapters/trpc' },
            { text: 'GraphQL', link: '/adapters/graphql' },
          ],
        },
      ],
      '/frontend/': [
        {
          text: 'Frontend',
          items: [
            { text: 'Vue', link: '/frontend/vue' },
            { text: 'React', link: '/frontend/react' },
            { text: 'Svelte', link: '/frontend/svelte' },
          ],
        },
      ],
      '/cli/': [
        {
          text: 'CLI',
          items: [
            { text: 'Code Generator', link: '/cli/gen' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/nicefaster/nest-faster-crud' },
    ],
  },
});

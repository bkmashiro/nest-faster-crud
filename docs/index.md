---
layout: home
hero:
  name: '@faster-crud'
  text: End-to-end type-safe CRUD for any framework
  tagline: Define your entity once — get REST APIs, validation, filtering, pagination, and auto-generated frontend UI for free.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/nicefaster/nest-faster-crud

features:
  - title: Decorator-Driven
    details: Use @Resource, @Col, @Rule and friends to describe your entities. Everything else is generated automatically.
  - title: Any Database
    details: First-class adapters for TypeORM, Prisma, Drizzle, Mongoose, and MikroORM. Bring your own ORM.
  - title: Any Framework
    details: NestJS, Express, Fastify, and Hono adapters. Run on Node, Bun, Deno, or Cloudflare Workers.
  - title: Any Frontend
    details: React hooks, Vue composables, and Svelte 5 stores with ready-made CrudTable and CrudForm components.
  - title: Built-in Validation
    details: Declarative rules with @Rule.required(), @Rule.email(), @Rule.length() — works standalone or as a NestJS pipe.
  - title: CLI Scaffolding
    details: "npx @faster-crud/gen add User --fields \"name:string,email:string\" generates entity, service, and module in seconds."
---

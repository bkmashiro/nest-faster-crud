---
layout: home
hero:
  name: '@faster-crud'
  text: 端到端类型安全的 CRUD 框架
  tagline: 只需定义一次实体，即可免费获得 REST API、数据验证、过滤分页以及自动生成的前端 UI。
  actions:
    - theme: brand
      text: 快速开始
      link: /zh/guide/getting-started
    - theme: alt
      text: 在 GitHub 上查看
      link: https://github.com/nicefaster/nest-faster-crud

features:
  - title: 装饰器驱动
    details: 使用 @Resource、@Col、@Rule 等装饰器描述实体，其余一切自动生成。
  - title: 任意数据库
    details: 支持 TypeORM、Prisma、Drizzle、Mongoose 和 MikroORM 的一流适配器，带上你自己的 ORM。
  - title: 任意框架
    details: 提供 NestJS、Express、Fastify 和 Hono 适配器，可运行于 Node、Bun、Deno 或 Cloudflare Workers。
  - title: 任意前端
    details: 提供 React hooks、Vue composables 和 Svelte 5 stores，以及开箱即用的 CrudTable 和 CrudForm 组件。
  - title: 内置验证
    details: 使用 @Rule.required()、@Rule.email()、@Rule.length() 等声明式规则，可作为独立验证器或 NestJS 管道使用。
  - title: CLI 代码生成
    details: "npx @faster-crud/gen add User --fields \"name:string,email:string\" 一条命令生成实体、服务和模块。"
---

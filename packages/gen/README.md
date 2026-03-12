# @faster-crud/gen

[![npm](https://img.shields.io/npm/v/@faster-crud/gen?style=flat-square)](https://www.npmjs.com/package/@faster-crud/gen)
[![npm downloads](https://img.shields.io/npm/dm/@faster-crud/gen?style=flat-square)](https://www.npmjs.com/package/@faster-crud/gen)
[![license](https://img.shields.io/npm/l/@faster-crud/gen?style=flat-square)](https://github.com/bkmashiro/nest-faster-crud/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

@faster-crud CLI code generator — scaffold entities, services, and controllers.

## Install

```bash
npm install @faster-crud/core @faster-crud/gen
```

## Usage

```ts
# Generate a full CRUD module
npx @faster-crud/gen generate --name Post --fields "title:string,content:string,published:boolean"

# Output:
# post.entity.ts  — @Resource entity with @Col decorators
# posts.service.ts — service extending the adapter
# posts.controller.ts — controller extending CrudControllerFactory
# posts.module.ts — NestJS module
```

## Documentation

Full docs at [github.com/bkmashiro/nest-faster-crud](https://github.com/bkmashiro/nest-faster-crud)

## Ecosystem

| Package | Description |
|---------|-------------|
| [`@faster-crud/core`](https://www.npmjs.com/package/@faster-crud/core) | Decorators and types |
| [`@faster-crud/nest`](https://www.npmjs.com/package/@faster-crud/nest) | NestJS controller factory |
| [`@faster-crud/typeorm`](https://www.npmjs.com/package/@faster-crud/typeorm) | TypeORM adapter |
| [`@faster-crud/prisma`](https://www.npmjs.com/package/@faster-crud/prisma) | Prisma adapter |

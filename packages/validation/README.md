# @faster-crud/validation

[![npm](https://img.shields.io/npm/v/@faster-crud/validation?style=flat-square)](https://www.npmjs.com/package/@faster-crud/validation)
[![npm downloads](https://img.shields.io/npm/dm/@faster-crud/validation?style=flat-square)](https://www.npmjs.com/package/@faster-crud/validation)
[![license](https://img.shields.io/npm/l/@faster-crud/validation?style=flat-square)](https://github.com/bkmashiro/nest-faster-crud/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Validation middleware for @faster-crud — derives class-validator rules from @Rule decorator metadata.

## Install

```bash
npm install @faster-crud/core @faster-crud/validation class-validator
```

## Usage

```ts
import { applyValidationRules } from '@faster-crud/validation';
import { Post } from './post.entity';

// Derive a class-validator DTO from @Resource/@Col/@Rule decorators
const PostCreateDto = applyValidationRules(Post);

// Use with NestJS ValidationPipe — validation is automatic
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

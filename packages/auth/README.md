# @faster-crud/auth

[![npm](https://img.shields.io/npm/v/@faster-crud/auth?style=flat-square)](https://www.npmjs.com/package/@faster-crud/auth)

JWT auth helpers for @faster-crud — guards and decorators for protecting CRUD operations.

## Install

```bash
npm install @faster-crud/core @faster-crud/auth @nestjs/jwt
```

## Usage

```ts
import { CrudAuthGuard, CurrentUser } from '@faster-crud/auth';
import { UseGuards } from '@nestjs/common';

// Protect all endpoints in a controller
@UseGuards(CrudAuthGuard)
@Controller('posts')
export class PostsController extends CrudControllerFactory(Post, PostsService) {}

// Access current user in custom endpoints
@Get('my-posts')
async myPosts(@CurrentUser() user: JwtPayload) {
  return this.service.findAll({ filters: { authorId: { op: 'eq', value: user.sub } } });
}
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

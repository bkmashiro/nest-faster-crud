# @faster-crud/prisma

[![npm](https://img.shields.io/npm/v/@faster-crud/prisma?style=flat-square)](https://www.npmjs.com/package/@faster-crud/prisma)

Prisma adapter for @faster-crud.

## Install

```bash
npm install @faster-crud/core @faster-crud/prisma @prisma/client
```

## Usage

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaResourceService } from '@faster-crud/prisma';
import { Post } from './post.entity';

@Injectable()
export class PostsService extends PrismaResourceService(Post) {
  constructor(prisma: PrismaService) {
    super(prisma, 'post');
  }
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

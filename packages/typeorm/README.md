# @faster-crud/typeorm

[![npm](https://img.shields.io/npm/v/@faster-crud/typeorm?style=flat-square)](https://www.npmjs.com/package/@faster-crud/typeorm)

TypeORM adapter for @faster-crud.

## Install

```bash
npm install @faster-crud/core @faster-crud/typeorm typeorm
```

## Usage

```ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmResourceService } from '@faster-crud/typeorm';
import { Post } from './post.entity';

@Injectable()
export class PostsService extends TypeOrmResourceService(Post) {
  constructor(@InjectRepository(Post) repo: Repository<Post>) {
    super(repo);
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

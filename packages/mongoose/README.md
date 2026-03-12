# @faster-crud/mongoose

[![npm](https://img.shields.io/npm/v/@faster-crud/mongoose?style=flat-square)](https://www.npmjs.com/package/@faster-crud/mongoose)
[![npm downloads](https://img.shields.io/npm/dm/@faster-crud/mongoose?style=flat-square)](https://www.npmjs.com/package/@faster-crud/mongoose)
[![license](https://img.shields.io/npm/l/@faster-crud/mongoose?style=flat-square)](https://github.com/bkmashiro/nest-faster-crud/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Mongoose adapter for @faster-crud.

## Install

```bash
npm install @faster-crud/core @faster-crud/mongoose mongoose
```

## Usage

```ts
import { MongooseResourceService } from '@faster-crud/mongoose';
import { Post } from './post.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class PostsService extends MongooseResourceService(Post) {
  constructor(@InjectModel(Post.name) model: Model<Post>) {
    super(model);
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

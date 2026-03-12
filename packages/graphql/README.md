# @faster-crud/graphql

[![npm](https://img.shields.io/npm/v/@faster-crud/graphql?style=flat-square)](https://www.npmjs.com/package/@faster-crud/graphql)

GraphQL resolver factory for @faster-crud — auto-generates Query/Mutation resolvers.

## Install

```bash
npm install @faster-crud/core @faster-crud/graphql @nestjs/graphql
```

## Usage

```ts
import { GqlResolver } from '@faster-crud/graphql';
import { Post } from './post.entity';
import { PostsService } from './posts.service';

@Resolver(() => Post)
export class PostsResolver extends GqlResolver(Post, PostsService) {
  constructor(service: PostsService) {
    super(service);
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

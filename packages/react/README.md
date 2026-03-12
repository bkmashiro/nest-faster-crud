# @faster-crud/react

[![npm](https://img.shields.io/npm/v/@faster-crud/react?style=flat-square)](https://www.npmjs.com/package/@faster-crud/react)

React hooks for @faster-crud — useResource composable for data fetching.

## Install

```bash
npm install @faster-crud/core @faster-crud/react react
```

## Usage

```ts
import { useResource } from '@faster-crud/react';
import { Post } from './post.entity';

function PostList() {
  const { data, loading, total, page, setPage, refresh } = useResource(Post, {
    baseUrl: '/api/posts',
  });

  return (
    <div>
      {data.map(post => <div key={post.id}>{post.title}</div>)}
    </div>
  );
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

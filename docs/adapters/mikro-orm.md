# MikroORM Adapter

## Installation

```bash
npm install @faster-crud/mikro-orm @mikro-orm/core
```

## Setup

Pass the `EntityManager` to the service mixin:

```typescript
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { MikroOrmResourceService } from '@faster-crud/mikro-orm';
import { User } from './user.entity';

@Injectable()
export class UserService extends MikroOrmResourceService(User, null as any) {
  constructor(private readonly em: EntityManager) {
    super(em);
  }
}
```

## Features

- **Pagination** — uses `em.findAndCount()` for efficient paginated queries
- **Updates** — uses `em.assign()` for partial updates followed by `em.persistAndFlush()`
- **Full lifecycle hooks** — all `onBefore*` / `onAfter*` hooks

## Filter Mapping

| Operator | MikroORM Expression |
|----------|-------------------|
| `eq` | Direct value |
| `ne` | `{ $ne: value }` |
| `lt` | `{ $lt: value }` |
| `lte` | `{ $lte: value }` |
| `gt` | `{ $gt: value }` |
| `gte` | `{ $gte: value }` |
| `like` | `{ $like: value }` |
| `in` | `{ $in: [...] }` |

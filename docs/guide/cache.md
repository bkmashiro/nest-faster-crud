# Caching

@faster-crud includes a built-in in-memory cache for `list()` and `get()` operations. Caching is opt-in and configured per resource.

## Enabling Cache

Pass a `cache` option to `@Resource`:

```typescript
import { Col, Resource, Searchable } from '@faster-crud/core';

@Resource('products', {
  cache: {
    ttl: 10_000, // milliseconds
  },
})
export class Product {
  @Col()
  id: number;

  @Searchable()
  @Col({ label: 'Name' })
  name: string;

  @Col({ label: 'Price', ui: { widget: 'number-input' } })
  price: number;
}
```

## How It Works

- `list()` results are cached by a key derived from the full `PageQuery` (page, filters, sort).
- `get(id)` results are cached by entity ID.
- Any write operation (`create`, `update`, `remove`) **automatically invalidates** all cached list results and the specific `get` entry for the affected ID.

```typescript
// First call — hits database
const page1 = await service.list({ page: { current: 1, size: 20 } });

// Second call — served from cache
const page1Again = await service.list({ page: { current: 1, size: 20 } });

// Write — cache is invalidated
await service.update(1, { name: 'Updated Name' });

// Next call — hits database again
const fresh = await service.list({ page: { current: 1, size: 20 } });
```

## Custom Cache Key

Override the default key function if you need custom cache partitioning (e.g., per-tenant):

```typescript
@Resource('articles', {
  cache: {
    ttl: 30_000,
    key: (operation, params) => {
      const tenantId = (params as any)?.tenantId ?? 'default';
      return `${operation}:${tenantId}:${JSON.stringify(params)}`;
    },
  },
})
export class Article { ... }
```

## Cache Options

| Option | Type | Description |
|--------|------|-------------|
| `ttl` | `number` | Cache lifetime in milliseconds |
| `key` | `(op, params) => string` | Custom key generator |

## Limitations

- The cache is **in-process** — it does not share state across multiple server instances.
- For distributed deployments (multiple pods), use an external cache (Redis) by overriding the `list` and `get` methods in your service.

## Using an External Cache (Redis)

Override the service methods to integrate with `ioredis` or `cache-manager`:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmResourceService } from '@faster-crud/typeorm';
import { PageQuery, PageResult } from '@faster-crud/core';
import { RedisService } from './redis.service';
import { Product } from './product.entity';

@Injectable()
export class ProductService extends TypeOrmResourceService(Product) {
  constructor(
    @InjectRepository(Product) repo: Repository<Product>,
    private readonly redis: RedisService,
  ) {
    super(repo);
  }

  async list(query: PageQuery<Product>): Promise<PageResult<Product>> {
    const key = `products:list:${JSON.stringify(query)}`;
    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached);

    const result = await super.list(query);
    await this.redis.set(key, JSON.stringify(result), 'EX', 10); // 10 seconds
    return result;
  }

  async onAfterCreate(entity: Product): Promise<void> {
    await this.redis.del('products:list:*');
  }

  async onAfterUpdate(entity: Product): Promise<void> {
    await this.redis.del('products:list:*');
    await this.redis.del(`products:get:${entity.id}`);
  }

  async onAfterRemove(id: number): Promise<void> {
    await this.redis.del('products:list:*');
    await this.redis.del(`products:get:${id}`);
  }
}
```

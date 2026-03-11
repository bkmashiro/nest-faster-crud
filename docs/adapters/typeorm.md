# TypeORM Adapter

## Installation

```bash
npm install @faster-crud/typeorm typeorm
```

## Setup

Create a service by extending the `TypeOrmResourceService` mixin:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmResourceService } from '@faster-crud/typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService extends TypeOrmResourceService(User) {
  constructor(@InjectRepository(User) repo: Repository<User>) {
    super(repo);
  }
}
```

## Features

- **Automatic soft delete** — detects `@DeleteDateColumn()` and uses `softDelete()` instead of `delete()`
- **Full filter operator support** — `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `like`, `in`, `between`
- **Pagination** — uses `findAndCount()` for efficient paginated queries
- **Lifecycle hooks** — all `onBefore*` / `onAfter*` hooks are available

## Filter Mapping

| Operator | TypeORM |
|----------|---------|
| `eq` | Direct value |
| `ne` | `Not(value)` |
| `lt` | `LessThan(value)` |
| `lte` | `LessThanOrEqual(value)` |
| `gt` | `MoreThan(value)` |
| `gte` | `MoreThanOrEqual(value)` |
| `like` | `Like('%value%')` |
| `in` | `In([...])` |
| `between` | `Between(min, max)` |

## Example Entity

```typescript
import { Entity, PrimaryGeneratedColumn, Column, DeleteDateColumn } from 'typeorm';
import { Resource, Col, Rule, Searchable } from '@faster-crud/core';

@Entity()
@Resource('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Col({ label: 'Name' })
  @Rule.required()
  @Searchable()
  name: string;

  @Column('decimal')
  @Col({ label: 'Price', ui: { widget: 'number-input' } })
  @Rule.range(0, 99999)
  price: number;

  @DeleteDateColumn()
  deletedAt?: Date;
}
```

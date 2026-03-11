# Getting Started

## Installation

Install the core package and the adapter for your database and framework:

::: code-group

```bash [TypeORM + NestJS]
npm install @faster-crud/core @faster-crud/nest @faster-crud/typeorm
```

```bash [Prisma + NestJS]
npm install @faster-crud/core @faster-crud/nest @faster-crud/prisma
```

```bash [Drizzle + Hono]
npm install @faster-crud/core @faster-crud/hono @faster-crud/drizzle
```

```bash [Mongoose + Express]
npm install @faster-crud/core @faster-crud/express @faster-crud/mongoose
```

:::

## Quick Example

### 1. Define your entity

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Resource, Col, Rule, Searchable } from '@faster-crud/core';

@Entity()
@Resource('users', { pagination: { max: 50 } })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Col({ label: 'Username' })
  @Rule.required('Username is required')
  @Rule.length(3, 20)
  @Searchable()
  username: string;

  @Column()
  @Col({ label: 'Email', ui: { widget: 'email' } })
  @Rule.required()
  @Rule.email()
  email: string;

  @Column({ default: 'user' })
  @Col({ label: 'Role' })
  role: string;
}
```

### 2. Create a service

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

### 3. Wire up the module

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NestCrudModule, CrudControllerFactory } from '@faster-crud/nest';
import { User } from './user.entity';
import { UserService } from './user.service';

const UserController = CrudControllerFactory.create(User, UserService);

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    NestCrudModule.forFeature([{ resource: User, service: UserService }]),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UsersModule {}
```

### 4. Send your first request

Start the app and you get a full REST API:

```bash
# Create a user
curl -X POST http://localhost:3000/users \
  -H 'Content-Type: application/json' \
  -d '{"username": "alice", "email": "alice@example.com"}'

# List users with pagination and filters
curl 'http://localhost:3000/users?page[current]=1&page[size]=10&filter[role]=admin'

# Get a single user
curl http://localhost:3000/users/1

# Update a user
curl -X PATCH http://localhost:3000/users/1 \
  -H 'Content-Type: application/json' \
  -d '{"username": "alice_updated"}'

# Delete a user
curl -X DELETE http://localhost:3000/users/1
```

A metadata endpoint is also exposed automatically:

```bash
curl http://localhost:3000/users/__crud/meta
```

This returns a `ResourceMeta` object describing all fields, widgets, validation rules, and available operations — used by frontend packages to render UI automatically.

## What's Next?

- [Entity Decorators](/guide/entity-decorators) — full reference for `@Resource`, `@Col`, `@Rule`, and more
- [Filter Operators](/guide/filter-operators) — query your data with `eq`, `like`, `between`, etc.
- [Lifecycle Hooks](/guide/lifecycle-hooks) — run custom logic before/after CRUD operations
- [Adapters](/adapters/typeorm) — choose your database and framework

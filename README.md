# @faster-crud

> End-to-end type-safe CRUD for any framework

Define your entity once with decorators — get a full REST API, validation, filtering, pagination, and auto-generated frontend UI across any backend and frontend framework.

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| `@faster-crud/core` | 0.1.1 | Framework-agnostic decorators & types |
| `@faster-crud/nest` | 0.1.2 | NestJS integration |
| `@faster-crud/typeorm` | 0.1.1 | TypeORM adapter |
| `@faster-crud/prisma` | 0.1.0 | Prisma adapter |
| `@faster-crud/drizzle` | 0.1.0 | Drizzle adapter |
| `@faster-crud/mongoose` | 0.1.0 | Mongoose/MongoDB adapter |
| `@faster-crud/mikro-orm` | 0.1.0 | MikroORM adapter |
| `@faster-crud/hono` | 0.1.0 | Hono framework adapter |
| `@faster-crud/express` | 0.1.0 | Express adapter |
| `@faster-crud/fastify` | 0.1.0 | Fastify adapter |
| `@faster-crud/vue` | 0.1.1 | Vue 3 components |
| `@faster-crud/react` | 0.1.0 | React hooks & components |
| `@faster-crud/svelte` | 0.1.0 | Svelte 5 stores & components |
| `@faster-crud/gen` | 0.1.1 | CLI code generator |

## Quick Start (NestJS + TypeORM)

```bash
npm install @faster-crud/core @faster-crud/nest @faster-crud/typeorm typeorm @nestjs/typeorm reflect-metadata
```

### 1. Define your entity

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Resource, Col, Rule } from '@faster-crud/core';

@Entity()
@Resource('users', { pagination: { max: 50 } })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Col({ label: 'Username' })
  @Rule.required()
  @Rule.length(3, 20)
  username: string;

  @Column()
  @Col({ label: 'Email' })
  @Rule.email()
  email: string;

  @Column()
  @Col({ label: 'Role' })
  @Deny('create')
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

### 3. Wire the module

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NestCrudModule } from '@faster-crud/nest';
import { User } from './user.entity';
import { UserService } from './user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    NestCrudModule.forFeature([{ resource: User, service: UserService }]),
  ],
})
export class UsersModule {}
```

This gives you:

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/users` | Create |
| `GET` | `/users` | List (with pagination & filters) |
| `GET` | `/users/:id` | Get by ID |
| `PATCH` | `/users/:id` | Update |
| `DELETE` | `/users/:id` | Remove |

---

## Feature Highlights

### CLI Code Generator (`@faster-crud/gen`)

Scaffold a fully-wired CRUD resource in one command:

```bash
npx @faster-crud/gen add User --fields "name:string,email:string" --outdir src/resources
```

This generates:

```
src/resources/User/
  User.entity.ts    ← TypeORM entity with @Resource, @Col decorators
  User.service.ts   ← Injectable service extending TypeOrmResourceService
  User.module.ts    ← NestJS module with auto-generated controller
```

Supported field types: `string`, `number`, `boolean`, `Date`.

### Lifecycle Hooks

Override hooks in your service to run logic before/after CRUD operations:

```typescript
@Injectable()
export class UserService extends TypeOrmResourceService(User) {
  constructor(@InjectRepository(User) repo: Repository<User>) {
    super(repo);
  }

  async onBeforeCreate(dto: Partial<User>): Promise<Partial<User>> {
    dto.createdAt = new Date();
    return dto;
  }

  async onAfterCreate(entity: User): Promise<void> {
    await this.emailService.sendWelcome(entity.email);
  }

  async onBeforeUpdate(id: number, dto: Partial<User>): Promise<Partial<User>> {
    dto.updatedAt = new Date();
    return dto;
  }

  async onAfterUpdate(entity: User): Promise<void> { /* audit log */ }
  async onBeforeRemove(id: number): Promise<void> { /* check references */ }
  async onAfterRemove(id: number): Promise<void> { /* cleanup */ }
}
```

All hooks have default no-op implementations — override only what you need.

### Soft Delete

Soft delete is auto-detected from TypeORM's `@DeleteDateColumn()`. No configuration needed:

```typescript
@Entity()
@Resource('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Col({ label: 'Title' })
  title: string;

  @DeleteDateColumn()
  deletedAt?: Date;  // ← enables soft delete automatically
}
```

When `deletedAt` exists:
- `DELETE /posts/:id` sets `deletedAt` instead of removing the row
- List/get queries automatically exclude soft-deleted records

### Filter Operators

```
GET /users?filters[age][op]=gt&filters[age][value]=18
GET /users?filters[name][op]=like&filters[name][value]=john
GET /users?filters[status][op]=in&filters[status][value]=active,pending
```

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equals (default) | `{ op: 'eq', value: 5 }` |
| `ne` | Not equals | `{ op: 'ne', value: 'admin' }` |
| `gt` | Greater than | `{ op: 'gt', value: 18 }` |
| `gte` | Greater than or equal | `{ op: 'gte', value: 18 }` |
| `lt` | Less than | `{ op: 'lt', value: 100 }` |
| `lte` | Less than or equal | `{ op: 'lte', value: 50 }` |
| `like` | Substring match | `{ op: 'like', value: 'john' }` |
| `in` | Value in array | `{ op: 'in', value: [1, 2, 3] }` |
| `between` | Range (inclusive) | `{ op: 'between', value: [10, 100] }` |

Programmatic usage:

```typescript
const query: PageQuery<User> = {
  filters: {
    age: { op: 'gte', value: 18 },
    name: { op: 'like', value: 'john' },
    status: { op: 'in', value: ['active', 'pending'] },
  },
};
```

### Swagger Auto-Integration

If `@nestjs/swagger` is installed, `@ApiProperty()` and `@ApiOperation()` decorators are applied **automatically** based on your `@Col` and `@Rule` metadata — zero manual Swagger config needed.

```bash
npm install @nestjs/swagger
```

What gets auto-generated:
- `@ApiProperty({ description, required, type })` on every DTO field
- `@ApiTags()` from `@Resource` name
- `@ApiOperation()` on each CRUD endpoint

### class-validator Auto-Integration

If `class-validator` is installed, validation decorators are applied automatically from your `@Rule` metadata:

```bash
npm install class-validator class-transformer
```

| `@Rule` decorator | Auto-applied validator |
|-------------------|----------------------|
| `@Rule.required()` | `@IsNotEmpty()` |
| `@Rule.email()` | `@IsEmail()` |
| `@Rule.length(min, max)` | `@MinLength(min)` + `@MaxLength(max)` |
| `@Rule.pattern(regex)` | `@Matches(regex)` |
| _(optional field)_ | `@IsOptional()` |

### ResourceMeta Endpoint

Every CRUD resource exposes `GET /__crud/meta` for frontend introspection. This returns the full `ResourceMeta` including resource name, available operations, field definitions (labels, types, UI hints, validation rules), and pagination config — enabling frontends to auto-generate forms and tables.

---

## Framework Adapters

### Hono

Works on Bun, Deno, Cloudflare Workers, and Node.js.

```bash
npm install @faster-crud/hono hono
```

```typescript
import { Hono } from 'hono';
import { HonoCrudRouter } from '@faster-crud/hono';
import { User } from './user.entity';

const app = new Hono();
app.route('/users', HonoCrudRouter(User, userService));

export default app;
```

### Express

```bash
npm install @faster-crud/express express
```

```typescript
import express from 'express';
import { expressCrudRouter } from '@faster-crud/express';
import { User } from './user.entity';

const app = express();
app.use(express.json());
app.use('/api/users', expressCrudRouter(User, userService));

app.listen(3000);
```

### Fastify

```bash
npm install @faster-crud/fastify fastify
```

```typescript
import Fastify from 'fastify';
import { FastifyCrudPlugin } from '@faster-crud/fastify';
import { User } from './user.entity';

const fastify = Fastify();
await fastify.register(FastifyCrudPlugin(User, userService), { prefix: '/users' });

fastify.listen({ port: 3000 });
```

All adapters generate the same REST endpoints and accept any service object implementing `create`, `list`, `get`, `update`, and `remove`.

---

## Frontend Libraries

All frontend packages fetch `ResourceMeta` from the backend to auto-generate tables and forms.

### Vue 3 (`@faster-crud/vue`)

```bash
npm install @faster-crud/vue
```

```vue
<script setup lang="ts">
import { useCrud, CrudTable, CrudForm } from '@faster-crud/vue';

const crud = useCrud<User>('/api/users');
</script>

<template>
  <CrudTable :crud="crud" @edit="onEdit" />
  <CrudForm :crud="crud" mode="create" />
</template>
```

### React (`@faster-crud/react`)

```bash
npm install @faster-crud/react
```

```tsx
import { useCrud, CrudTable, CrudForm } from '@faster-crud/react';

function UsersPage() {
  const crud = useCrud<User>('/api/users');

  return (
    <>
      <CrudTable crud={crud} onEdit={setEditing} />
      <CrudForm crud={crud} mode="create" onDone={() => crud.fetchList()} />
    </>
  );
}
```

The `useCrud` hook returns reactive state for `data`, `total`, `loading`, `page`, `filters`, `sort`, and methods for `fetchList`, `create`, `update`, `remove`.

### Svelte 5 (`@faster-crud/svelte`)

```bash
npm install @faster-crud/svelte
```

```svelte
<script>
  import { createCrudStore } from '@faster-crud/svelte';
  import CrudTable from '@faster-crud/svelte/src/CrudTable.svelte';
  import CrudForm from '@faster-crud/svelte/src/CrudForm.svelte';

  const store = createCrudStore('/api/users');
</script>

<CrudTable {store} onEdit={handleEdit} />
<CrudForm {store} mode="create" />
```

---

## Decorator Reference

### Class Decorators

| Decorator | Description |
|-----------|-------------|
| `@Resource(name, options?)` | Marks a class as a CRUD resource. `name` becomes the route path. Options: `operations`, `pagination`, `guardTokens`. |

### Property Decorators

| Decorator | Description |
|-----------|-------------|
| `@Col(options?)` | Marks a field as a CRUD column. Accepts `label`, `ui`, and `list` options. |
| `@Deny(...ops)` | Deny a field on specific operations (`'create'`, `'update'`, etc.). |
| `@Readonly()` | Shorthand for `@Deny('create', 'update')`. |
| `@Hidden(...views)` | Omit field from responses on specified views (`'list'`, `'get'`). |
| `@Searchable()` | Mark field as searchable for query filtering. |
| `@Ignore()` | Completely exclude field from all CRUD operations. |
| `@AdminOnly(...ops)` | Mark field as admin-only for specified operations. |

### Validation Rules

| Decorator | Description |
|-----------|-------------|
| `@Rule.required(msg?)` | Field is required. |
| `@Rule.length(min, max, msg?)` | String length constraint. |
| `@Rule.range(min, max, msg?)` | Numeric range constraint. |
| `@Rule.email(msg?)` | Must be valid email format. |
| `@Rule.pattern(regex, msg?)` | Must match regex pattern. |

## License

MIT

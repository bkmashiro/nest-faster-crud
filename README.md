# @faster-crud

> End-to-end type-safe CRUD for NestJS — define your entity once, get full REST API automatically.

## What it is

`@faster-crud` is a decorator-driven CRUD framework for NestJS. Annotate your entity class with `@Resource` and field decorators, then plug it into `NestCrudModule` — you get complete REST endpoints with validation, field filtering, and pagination out of the box.

## Quick Start

```bash
# Install core packages
pnpm add @faster-crud/core @faster-crud/nest reflect-metadata

# Optional: TypeORM adapter (recommended)
pnpm add @faster-crud/typeorm typeorm @nestjs/typeorm

# Optional: Swagger auto-integration
pnpm add @nestjs/swagger

# Optional: class-validator auto-integration
pnpm add class-validator class-transformer
```

```typescript
// 1. Define your entity
import { Resource, Col, Deny, Readonly, Rule } from '@faster-crud/core';

@Resource('users', { pagination: { max: 50 } })
export class User {
  id: number;

  @Col({ label: 'Username' })
  @Rule.required()
  @Rule.length(3, 20)
  username: string;

  @Col({ label: 'Email' })
  @Rule.email()
  email: string;

  @Col({ label: 'Role' })
  @Deny('create')
  role: string;
}

// 2. Implement your service
import { Injectable } from '@nestjs/common';
import { ResourceService } from '@faster-crud/nest';

@Injectable()
export class UserService extends ResourceService(User) {
  private store: User[] = [];
  private seq = 1;

  async create(dto: Partial<User>) { /* ... */ }
  async list(query)                { /* ... */ }
  async get(id: number)            { /* ... */ }
  async update(id, dto)            { /* ... */ }
  async remove(id: number)         { /* ... */ }
}

// 3. Register in your module
import { NestCrudModule } from '@faster-crud/nest';

@Module({
  imports: [NestCrudModule.forFeature([{ resource: User, service: UserService }])]
})
export class AppModule {}
```

This gives you:
- `POST   /users`        — create
- `GET    /users`        — list (with pagination)
- `GET    /users/:id`    — get by id
- `PATCH  /users/:id`    — update
- `DELETE /users/:id`    — remove

## Packages

| Package | Description |
|---------|-------------|
| `@faster-crud/core` | Core decorators, types, and metadata utilities. Zero NestJS dependency. |
| `@faster-crud/nest` | NestJS integration — `NestCrudModule`, `ResourceService` mixin, controller factory. |
| `@faster-crud/typeorm` | TypeORM adapter — repository-backed `ResourceService` with soft delete & advanced filters. |
| `@faster-crud/gen` | CLI code generator — scaffold entities, services, and modules from the command line. |
| `@faster-crud/hono` | Hono adapter — use @faster-crud outside NestJS on any JS runtime. |

---

## Code Generator (`@faster-crud/gen`)

Scaffold a fully-wired CRUD resource in one command:

```bash
pnpm add -D @faster-crud/gen

# Generate entity + service + module
npx fcrud add User --fields "username:string,email:string,age:number" --outdir src/resources
```

This creates:

```
src/resources/User/
  User.entity.ts    ← TypeORM entity with @Resource, @Col decorators
  User.service.ts   ← Injectable service extending TypeOrmResourceService
  User.module.ts    ← NestJS module with auto-generated controller
```

Supported field types: `string`, `number`, `boolean`, `Date`.

---

## Swagger Auto-Integration

If `@nestjs/swagger` is installed, `@ApiProperty()` and `@ApiOperation()` decorators are applied **automatically** based on your `@Col` and `@Rule` metadata — zero manual Swagger config needed.

```bash
pnpm add @nestjs/swagger
```

```typescript
// main.ts — just set up SwaggerModule as usual
const config = new DocumentBuilder().setTitle('My API').build();
const doc = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api', app, doc);
// All @Col labels, @Rule constraints, and field types appear in the Swagger UI
```

What gets auto-generated:
- `@ApiProperty({ description, required, type })` on every DTO field
- `@ApiTags()` from `@Resource` name
- `@ApiOperation()` on each CRUD endpoint

---

## Class-Validator Auto-Integration

If `class-validator` is installed, validation decorators are applied automatically from your `@Rule` metadata:

```bash
pnpm add class-validator class-transformer
```

| `@Rule` decorator | Auto-applied validator |
|-------------------|----------------------|
| `@Rule.required()` | `@IsNotEmpty()` |
| `@Rule.email()` | `@IsEmail()` |
| `@Rule.length(min, max)` | `@MinLength(min)` + `@MaxLength(max)` |
| `@Rule.pattern(regex)` | `@Matches(regex)` |
| _(optional field)_ | `@IsOptional()` |

No changes to your entity needed — just install the package and validation pipes work automatically.

---

## Lifecycle Hooks

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

---

## Soft Delete

Soft delete is auto-detected from TypeORM's `@DeleteDateColumn()`. No configuration needed:

```typescript
import { Entity, PrimaryGeneratedColumn, Column, DeleteDateColumn } from 'typeorm';

@Entity()
@Resource('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Col({ label: 'Title' })
  title: string;

  @DeleteDateColumn()
  deletedAt?: Date;  // ← this enables soft delete automatically
}
```

When `deletedAt` exists:
- `DELETE /posts/:id` sets `deletedAt` instead of removing the row
- List/get queries automatically exclude soft-deleted records (via TypeORM)

---

## Advanced Filter Operators

Filters support operators beyond simple equality:

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

---

## Hono Adapter (`@faster-crud/hono`)

Use @faster-crud outside of NestJS with [Hono](https://hono.dev) — works on Bun, Deno, Cloudflare Workers, and Node.js:

```bash
pnpm add @faster-crud/hono hono
```

```typescript
import { Hono } from 'hono';
import { HonoCrudRouter } from '@faster-crud/hono';
import { User } from './user.entity';

const app = new Hono();

// Any service implementing create/list/get/update/remove works
app.route('/users', HonoCrudRouter(User, userService));

export default app;
```

Generated routes:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List (with query params) |
| `GET` | `/:id` | Get by ID (404 if not found) |
| `POST` | `/` | Create (201) |
| `PATCH` | `/:id` | Update |
| `DELETE` | `/:id` | Delete |

---

## Decorator Reference

### Class Decorators

| Decorator | Description |
|-----------|-------------|
| `@Resource(name, options)` | Marks a class as a CRUD resource. `name` becomes the route path (e.g. `'users'`). |

### Property Decorators

| Decorator | Description |
|-----------|-------------|
| `@Col(options)` | Marks a field as a CRUD column. Accepts `label`, `ui`, and `list` options. |
| `@Deny(...ops)` | Deny a field on specific operations (`'create'`, `'update'`, etc.). |
| `@Readonly()` | Shorthand for `@Deny('create', 'update')`. |
| `@Hidden(...views)` | Omit field from responses on specified views (`'list'`, `'get'`). |
| `@Searchable()` | Mark field as searchable (used by codegen / query filtering). |
| `@Ignore()` | Completely exclude field from all CRUD operations. |
| `@AdminOnly(...ops)` | Mark field as admin-only for specified operations (guard metadata). |

### Validation Rules

| Decorator | Description |
|-----------|-------------|
| `@Rule.required(msg?)` | Field is required. |
| `@Rule.length(min, max, msg?)` | String length constraint. |
| `@Rule.range(min, max, msg?)` | Numeric range constraint. |
| `@Rule.email(msg?)` | Must be valid email format. |
| `@Rule.pattern(regex, msg?)` | Must match regex pattern. |

## Full Docs

> Documentation site coming soon (TBD).

## License

MIT

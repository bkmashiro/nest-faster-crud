# @faster-crud

> End-to-end type-safe CRUD for NestJS — define your entity once, get full REST API automatically.

## What it is

`@faster-crud` is a decorator-driven CRUD framework for NestJS. Annotate your entity class with `@Resource` and field decorators, then plug it into `NestCrudModule` — you get complete REST endpoints with validation, field filtering, and pagination out of the box.

## Quick Start

```bash
# Install packages
pnpm add @faster-crud/core @faster-crud/nest reflect-metadata
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
| `@faster-crud/typeorm` | _(Phase 2)_ TypeORM adapter — repository-backed `ResourceService` implementation. |
| `@faster-crud/gen`  | _(Phase 2)_ Code generation for typed DTOs, OpenAPI schemas, and frontend form configs. |

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

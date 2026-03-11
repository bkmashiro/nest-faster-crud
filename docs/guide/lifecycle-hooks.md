# Lifecycle Hooks

Every resource service exposes lifecycle hooks that let you run custom logic before and after each CRUD operation. Override any hook in your service class — the default implementations are no-ops.

## Available Hooks

| Hook | Signature | Returns |
|------|-----------|---------|
| `onBeforeCreate` | `(dto: Partial<T>) => Promise<Partial<T>>` | Modified DTO |
| `onAfterCreate` | `(entity: T) => Promise<void>` | — |
| `onBeforeUpdate` | `(id: number, dto: Partial<T>) => Promise<Partial<T>>` | Modified DTO |
| `onAfterUpdate` | `(entity: T) => Promise<void>` | — |
| `onBeforeRemove` | `(id: number) => Promise<void>` | — |
| `onAfterRemove` | `(id: number) => Promise<void>` | — |

## Execution Flow

### Create

```
Client POST /users { ... }
        │
        ▼
  onBeforeCreate(dto)  ← modify or validate the DTO
        │
        ▼
  INSERT into database
        │
        ▼
  onAfterCreate(entity)  ← side effects (email, audit log)
        │
        ▼
  Return 201 + entity
```

### Update

```
Client PATCH /users/1 { ... }
        │
        ▼
  onBeforeUpdate(id, dto)  ← modify or validate the DTO
        │
        ▼
  UPDATE in database
        │
        ▼
  onAfterUpdate(entity)  ← side effects
        │
        ▼
  Return 200 + entity
```

### Remove

```
Client DELETE /users/1
        │
        ▼
  onBeforeRemove(id)  ← permission checks, reference validation
        │
        ▼
  DELETE (or soft-delete) in database
        │
        ▼
  onAfterRemove(id)  ← cleanup, audit log
        │
        ▼
  Return 200
```

## Example: Full Hook Usage

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmResourceService } from '@faster-crud/typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService extends TypeOrmResourceService(User) {
  constructor(
    @InjectRepository(User) repo: Repository<User>,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
  ) {
    super(repo);
  }

  async onBeforeCreate(dto: Partial<User>): Promise<Partial<User>> {
    dto.createdAt = new Date();
    dto.role = dto.role ?? 'user'; // Default role
    return dto;
  }

  async onAfterCreate(entity: User): Promise<void> {
    await this.emailService.sendWelcome(entity.email);
    await this.auditService.log('user.created', entity.id);
  }

  async onBeforeUpdate(id: number, dto: Partial<User>): Promise<Partial<User>> {
    dto.updatedAt = new Date();
    return dto;
  }

  async onAfterUpdate(entity: User): Promise<void> {
    await this.auditService.log('user.updated', entity.id);
  }

  async onBeforeRemove(id: number): Promise<void> {
    const user = await this.repo.findOne({ where: { id } });
    if (user?.role === 'admin') {
      throw new Error('Cannot delete admin users');
    }
  }

  async onAfterRemove(id: number): Promise<void> {
    await this.auditService.log('user.deleted', id);
  }
}
```

## Hook Tips

- **`onBeforeCreate` / `onBeforeUpdate`** must return the (possibly modified) DTO. The returned value is what gets persisted.
- Throw an exception from any `onBefore*` hook to abort the operation. The error propagates to the client as a 400/500 response.
- `onAfterCreate` receives the fully persisted entity (including generated `id`).
- Hooks work with all database adapters — they're defined at the base service level.

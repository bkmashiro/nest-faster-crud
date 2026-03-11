# Soft Delete

@faster-crud automatically detects soft-delete columns and adjusts its behavior — no configuration required.

## TypeORM

Add a `@DeleteDateColumn()` to your entity and soft delete is enabled automatically:

```typescript
import { Entity, PrimaryGeneratedColumn, Column, DeleteDateColumn } from 'typeorm';
import { Resource } from '@faster-crud/core';

@Entity()
@Resource('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @DeleteDateColumn()
  deletedAt?: Date;
}
```

### How It Works

The TypeORM adapter checks for the presence of a `deleteDateColumn` in the entity metadata:

```typescript
isSoftDelete(): boolean {
  return !!this.repo.manager.connection
    .getMetadata(this.repo.target).deleteDateColumn;
}
```

When soft delete is detected:

| Operation | Behavior |
|-----------|----------|
| `DELETE /posts/:id` | Sets `deletedAt` to current timestamp via `repo.softDelete(id)` |
| `GET /posts` | Automatically excludes rows where `deletedAt` is not null |
| `GET /posts/:id` | Returns 404 for soft-deleted records |

When there is no `@DeleteDateColumn()`, `DELETE` performs a hard delete with `repo.delete(id)`.

## Other Adapters

For Prisma, Drizzle, Mongoose, and MikroORM, implement soft delete in your service's lifecycle hooks:

```typescript
async remove(id: number): Promise<void> {
  await this.onBeforeRemove(id);
  await this.model.findByIdAndUpdate(id, { deletedAt: new Date() });
  await this.onAfterRemove(id);
}
```

Or use the adapter's native soft-delete features (e.g., Prisma middleware, Mongoose plugins).

## Restoring Records

Restoration is not built into the generated CRUD endpoints. To restore soft-deleted records, add a custom endpoint or service method:

```typescript
@Injectable()
export class PostService extends TypeOrmResourceService(Post) {
  constructor(@InjectRepository(Post) repo: Repository<Post>) {
    super(repo);
  }

  async restore(id: number): Promise<void> {
    await this.repo.restore(id);
  }
}
```

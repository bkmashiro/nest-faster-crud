# tRPC Adapter

::: warning Work in Progress
The tRPC adapter is planned but not yet released. This page documents the intended API.
:::

## Planned API

The tRPC adapter will generate a fully typed tRPC router from your entity definitions:

```typescript
import { createCrudRouter } from '@faster-crud/trpc';
import { User } from './user.entity';

export const userRouter = createCrudRouter(User, userService);
```

### Generated Procedures

| Procedure | Type | Description |
|-----------|------|-------------|
| `list` | `query` | Paginated list with filters |
| `get` | `query` | Get by ID |
| `create` | `mutation` | Create entity |
| `update` | `mutation` | Partial update |
| `remove` | `mutation` | Delete |

### Type Safety

Input and output types are inferred from the entity class and `@Rule` metadata, giving you end-to-end type safety from client to database.

## Status

Track progress on [GitHub](https://github.com/nicefaster/nest-faster-crud).

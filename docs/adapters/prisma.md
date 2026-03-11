# Prisma Adapter

## Installation

```bash
npm install @faster-crud/prisma @prisma/client
```

## Setup

Pass the Prisma delegate (e.g., `prisma.user`) as the second argument:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaResourceService } from '@faster-crud/prisma';
import { PrismaService } from './prisma.service';
import { User } from './user.entity';

@Injectable()
export class UserService extends PrismaResourceService(User, null as any) {
  constructor(private readonly prisma: PrismaService) {
    super(prisma.user);
  }
}
```

## Extra Filter Operators

In addition to the standard operators, Prisma supports:

| Operator | Prisma Expression |
|----------|------------------|
| `contains` | `{ contains: value }` |
| `startsWith` | `{ startsWith: value }` |
| `endsWith` | `{ endsWith: value }` |

## Filter Mapping

| Operator | Prisma |
|----------|--------|
| `eq` | Direct value |
| `ne` | `{ not: value }` |
| `lt` / `lte` / `gt` / `gte` | `{ lt: value }` etc. |
| `like` | `{ contains: value }` |
| `in` | `{ in: [...] }` |
| `between` | `{ gte: min, lte: max }` |

## Soft Delete

Prisma does not have built-in soft delete. Use Prisma middleware or handle it in lifecycle hooks:

```typescript
async onBeforeRemove(id: number): Promise<void> {
  // Soft delete via update instead of delete
}
```

# Drizzle Adapter

## Installation

```bash
npm install @faster-crud/drizzle drizzle-orm
```

## Setup

The Drizzle adapter is framework-agnostic — no `@Injectable()` decorator. Pass the database instance and table schema:

```typescript
import { drizzleCrudService } from '@faster-crud/drizzle';
import { db } from './db';
import { users } from './schema';
import { User } from './user.entity';

const userService = drizzleCrudService(User, db, users);
```

## Usage with Hono

```typescript
import { Hono } from 'hono';
import { HonoCrudRouter } from '@faster-crud/hono';
import { drizzleCrudService } from '@faster-crud/drizzle';
import { db } from './db';
import { users } from './schema';
import { User } from './user.entity';

const app = new Hono();
const userService = drizzleCrudService(User, db, users);

app.route('/users', HonoCrudRouter(User, userService));
```

## Filter Mapping

Operators map to Drizzle's query builder functions:

| Operator | Drizzle Function |
|----------|-----------------|
| `eq` | `eq(col, value)` |
| `ne` | `ne(col, value)` |
| `lt` | `lt(col, value)` |
| `lte` | `lte(col, value)` |
| `gt` | `gt(col, value)` |
| `gte` | `gte(col, value)` |
| `like` | `like(col, value)` |
| `in` | `inArray(col, [...])` |
| `between` | `between(col, min, max)` |

Conditions are composed with `and()`.

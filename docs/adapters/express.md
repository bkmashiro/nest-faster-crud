# Express Adapter

## Installation

```bash
npm install @faster-crud/express express
```

## Setup

`expressCrudRouter` returns an Express `Router` with all CRUD routes:

```typescript
import express from 'express';
import { expressCrudRouter } from '@faster-crud/express';
import { drizzleCrudService } from '@faster-crud/drizzle';
import { db } from './db';
import { users } from './schema';
import { User } from './user.entity';

const app = express();
app.use(express.json());

const userService = drizzleCrudService(User, db, users);
app.use('/users', expressCrudRouter(User, userService));

app.listen(3000);
```

## Generated Routes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List with pagination and filters |
| `GET` | `/:id` | Get by ID |
| `POST` | `/` | Create (returns 201) |
| `PATCH` | `/:id` | Partial update |
| `DELETE` | `/:id` | Delete |

## Error Handling

All route handlers are wrapped in try/catch. Errors are forwarded to Express's error middleware via `next(err)`.

```typescript
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ message: err.message });
});
```

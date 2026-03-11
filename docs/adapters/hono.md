# Hono Adapter

## Installation

```bash
npm install @faster-crud/hono hono
```

## Setup

`HonoCrudRouter` returns a `Hono` sub-app with all CRUD routes:

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

export default app;
```

## Generated Routes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List with pagination and filters |
| `GET` | `/:id` | Get by ID |
| `POST` | `/` | Create (returns 201) |
| `PATCH` | `/:id` | Partial update |
| `DELETE` | `/:id` | Delete |

## Runtimes

Hono runs on multiple runtimes — the adapter works on all of them:

- **Bun** — `bun run index.ts`
- **Deno** — `deno run --allow-net index.ts`
- **Cloudflare Workers** — `wrangler dev`
- **Node.js** — via `@hono/node-server`

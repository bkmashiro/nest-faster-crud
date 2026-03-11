# Fastify Adapter

## Installation

```bash
npm install @faster-crud/fastify fastify
```

## Setup

`FastifyCrudPlugin` returns a Fastify plugin. Register it with a route prefix:

```typescript
import Fastify from 'fastify';
import { FastifyCrudPlugin } from '@faster-crud/fastify';
import { drizzleCrudService } from '@faster-crud/drizzle';
import { db } from './db';
import { users } from './schema';
import { User } from './user.entity';

const fastify = Fastify();
const userService = drizzleCrudService(User, db, users);

await fastify.register(FastifyCrudPlugin(User, userService), {
  prefix: '/users',
});

await fastify.listen({ port: 3000 });
```

## Generated Routes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List with pagination and filters |
| `GET` | `/:id` | Get by ID |
| `POST` | `/` | Create (returns 201) |
| `PATCH` | `/:id` | Partial update |
| `DELETE` | `/:id` | Delete |

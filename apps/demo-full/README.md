# @faster-crud Demo Full

Comprehensive NestJS app demonstrating all @faster-crud features in one place.

## Features Showcased

- **Decorators**: `@Resource`, `@Col`, `@Deny`, `@Readonly`, `@Hidden`, `@Searchable`, `@Rule.*`
- **TypeORM integration**: `TypeOrmResourceService` with SQLite in-memory database
- **Soft delete**: `@DeleteDateColumn` on User entity — `DELETE /users/:id` soft-deletes
- **Lifecycle hooks**: `onBeforeCreate`, `onAfterCreate`, `onBeforeUpdate` in `UsersService`
- **Validation rules**: required, email, length, range constraints
- **Swagger UI**: auto-generated API docs at `/docs`
- **Filtering & pagination**: query-based filters on `@Searchable` fields

## How to Run

```bash
pnpm install
pnpm start
```

Or for development with auto-reload:

```bash
pnpm dev
```

## Endpoints

### Users

| Method | Path           | Description        |
|--------|----------------|--------------------|
| POST   | /users         | Create a user      |
| GET    | /users         | List users         |
| GET    | /users/:id     | Get a user         |
| PATCH  | /users/:id     | Update a user      |
| DELETE | /users/:id     | Soft-delete a user |

### Posts

| Method | Path           | Description        |
|--------|----------------|--------------------|
| POST   | /posts         | Create a post      |
| GET    | /posts         | List posts         |
| GET    | /posts/:id     | Get a post         |
| PATCH  | /posts/:id     | Update a post      |
| DELETE | /posts/:id     | Delete a post      |

## Swagger UI

Open http://localhost:3001/docs after starting the app.

## Filter Examples

```bash
# Users older than 18
GET /users?filters[age][op]=gt&filters[age][value]=18

# Users with a specific role
GET /users?filters[role][op]=eq&filters[role][value]=admin

# Search by name (LIKE)
GET /users?filters[name][op]=like&filters[name][value]=john

# Users aged between 20 and 30
GET /users?filters[age][op]=between&filters[age][value][0]=20&filters[age][value][1]=30

# Pagination
GET /users?page[current]=2&page[size]=10

# Sorting
GET /users?sort[field]=name&sort[order]=asc
```

## Lifecycle Hooks

See `src/users/users.service.ts` for examples:

- **`onBeforeCreate`** — stamps `createdAt` before saving
- **`onAfterCreate`** — logs "User created: {name}" after save
- **`onBeforeUpdate`** — validates that `role` is one of `admin` or `user`

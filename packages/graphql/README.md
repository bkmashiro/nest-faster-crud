# @faster-crud/graphql

GraphQL resolver factory for [@faster-crud](https://github.com/nicepkg/nest-faster-crud). Automatically generates a NestJS `@Resolver()` class with full CRUD operations from your `@Resource` / `@Col` decorated entities.

## Installation

```bash
pnpm add @faster-crud/graphql @faster-crud/core
```

Peer dependencies:

```bash
pnpm add @nestjs/graphql graphql @nestjs/common reflect-metadata
```

## Quick Start

```typescript
import { Resource, Col } from '@faster-crud/core';
import { GraphQLCrudModule } from '@faster-crud/graphql';

@Resource('user')
class User {
  @Col() name!: string;
  @Col() email!: string;
  @Col() age!: number;
  @Col() active!: boolean;
}

// In your NestJS module:
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({ /* ... */ }),
    GraphQLCrudModule.register(User, UserService),
  ],
})
export class AppModule {}
```

This generates the following GraphQL schema:

```graphql
type User {
  id: Int
  name: String
  email: String
  age: Int
  active: Boolean
}

type UserPageResult {
  data: [User!]!
  total: Int!
  page: Int!
  size: Int!
}

type Query {
  userList(query: UserPageQueryInput): UserPageResult!
  user(id: Int!): User
}

type Mutation {
  createUser(dto: CreateUserInput!): User!
  updateUser(id: Int!, dto: UpdateUserInput!): User!
  removeUser(id: Int!): Boolean!
}
```

## Advanced: CrudResolver Factory

For more control, use `CrudResolver` directly:

```typescript
import { CrudResolver } from '@faster-crud/graphql';

const UserResolver = CrudResolver(User, UserService);

@Module({
  providers: [UserService, UserResolver],
})
export class UserModule {}
```

## Type Mapping

| `@Col` type | GraphQL type |
| ----------- | ------------ |
| `String`    | `String`     |
| `Number`    | `Int`        |
| `Boolean`   | `Boolean`    |

Fields decorated with `@Ignore()` are excluded. Fields with `@Readonly()` or `@Deny('create')` / `@Deny('update')` are excluded from the corresponding input types.

## License

MIT

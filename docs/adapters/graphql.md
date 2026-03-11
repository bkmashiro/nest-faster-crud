# GraphQL Adapter

::: warning Work in Progress
The GraphQL adapter is planned but not yet released. This page documents the intended API.
:::

## Planned API

The GraphQL adapter will auto-generate a schema and resolvers from your entity definitions:

```typescript
import { createCrudResolvers } from '@faster-crud/graphql';
import { User } from './user.entity';

const { typeDefs, resolvers } = createCrudResolvers(User, userService);
```

### Generated Schema

```graphql
type User {
  id: Int!
  username: String!
  email: String!
  role: String!
}

type UserPage {
  data: [User!]!
  total: Int!
  page: Int!
  size: Int!
}

type Query {
  users(page: PageInput, filters: UserFilterInput, sort: SortInput): UserPage!
  user(id: Int!): User
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: Int!, input: UpdateUserInput!): User!
  removeUser(id: Int!): Boolean!
}
```

Input types and field visibility are derived from `@Col`, `@Deny`, `@Hidden`, and `@Ignore` metadata.

## Status

Track progress on [GitHub](https://github.com/nicefaster/nest-faster-crud).

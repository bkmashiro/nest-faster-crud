# @faster-crud/graphql

[![npm](https://img.shields.io/npm/v/@faster-crud/graphql?style=flat-square)](https://www.npmjs.com/package/@faster-crud/graphql)
[![npm downloads](https://img.shields.io/npm/dm/@faster-crud/graphql?style=flat-square)](https://www.npmjs.com/package/@faster-crud/graphql)
[![license](https://img.shields.io/npm/l/@faster-crud/graphql?style=flat-square)](https://github.com/bkmashiro/nest-faster-crud/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

GraphQL resolver factory for @faster-crud — auto-generates Query/Mutation resolvers.

## Install

```bash
npm install @faster-crud/core @faster-crud/graphql @nestjs/graphql
```

## Usage

```ts
import { Resolver } from '@nestjs/graphql';
import { GraphqlCrudFactory, TypeOrmAdapter } from '@faster-crud/graphql';
import { User } from './user.entity';
import { CreateUserDto, UpdateUserDto } from './user.dto';

@Resolver(() => User)
export class UserResolver extends GraphqlCrudFactory.create({
  entity: User,
  adapter: new TypeOrmAdapter(userRepository),
  dto: {
    create: CreateUserDto,
    update: UpdateUserDto,
  },
}) {}
```

Generated operations:

- Query `users(query?)`
- Query `user(id)`
- Mutation `createUser(input)`
- Mutation `updateUser(id, input)`
- Mutation `deleteUser(id)`

You can also use `PrismaAdapter`:

```ts
import { Resolver } from '@nestjs/graphql';
import { GraphqlCrudFactory, PrismaAdapter } from '@faster-crud/graphql';

@Resolver(() => User)
export class UserResolver extends GraphqlCrudFactory.create({
  entity: User,
  adapter: new PrismaAdapter(prisma.user),
}) {}
```

## Documentation

Full docs at [github.com/bkmashiro/nest-faster-crud](https://github.com/bkmashiro/nest-faster-crud)

## Ecosystem

| Package | Description |
|---------|-------------|
| [`@faster-crud/core`](https://www.npmjs.com/package/@faster-crud/core) | Decorators and types |
| [`@faster-crud/nest`](https://www.npmjs.com/package/@faster-crud/nest) | NestJS controller factory |
| [`@faster-crud/typeorm`](https://www.npmjs.com/package/@faster-crud/typeorm) | TypeORM adapter |
| [`@faster-crud/prisma`](https://www.npmjs.com/package/@faster-crud/prisma) | Prisma adapter |

# @faster-crud/auth

JWT auth integration for `@faster-crud` on NestJS. It provides a JWT guard, role guard, current-user decorator, and shorthand decorators for common access rules.

## Install

```bash
pnpm add @faster-crud/auth @nestjs/jwt @nestjs/common @faster-crud/core reflect-metadata
```

## API

```ts
import {
  AdminOnly,
  AuthCrudModule,
  CurrentUser,
  JwtAuthGuard,
  Protected,
  Roles,
  RolesGuard,
} from '@faster-crud/auth';
```

- `@Roles(...roles)` stores required roles metadata.
- `RolesGuard` checks `req.user.roles`.
- `JwtAuthGuard` verifies a bearer token and assigns the decoded payload to `req.user`.
- `@CurrentUser()` injects `req.user`.
- `@Protected()` applies `UseGuards(JwtAuthGuard)`.
- `@AdminOnly()` applies `@Roles('admin')` and `UseGuards(JwtAuthGuard, RolesGuard)`.

## Register The Module

```ts
import { Module } from '@nestjs/common';
import { AuthCrudModule } from '@faster-crud/auth';

@Module({
  imports: [
    AuthCrudModule.register({
      secret: process.env.JWT_SECRET!,
      roles: ['admin', 'editor', 'viewer'],
    }),
  ],
})
export class AppModule {}
```

## Protect CRUD Endpoints

If you build a custom controller around your resource service, use the auth decorators directly on CRUD handlers:

```ts
import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '@faster-crud/auth';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Protected()
  list(@CurrentUser() user: { sub: string }) {
    return this.usersService.listForUser(user.sub);
  }

  @Patch(':id')
  @Roles('admin', 'editor')
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: { sub: string; roles: string[] },
  ) {
    return this.usersService.updateForUser(+id, body, user);
  }
}
```

For admin-only CRUD endpoints, use the shorthand:

```ts
import { Delete, Param } from '@nestjs/common';
import { AdminOnly } from '@faster-crud/auth';

@Delete(':id')
@AdminOnly()
remove(@Param('id') id: string) {
  return this.usersService.remove(+id);
}
```

## Token Shape

`JwtAuthGuard` expects:

```http
Authorization: Bearer <token>
```

The decoded payload is attached to `req.user`. To use role checks, include a `roles: string[]` claim in the token payload.

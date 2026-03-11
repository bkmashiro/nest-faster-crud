# @faster-crud/validation

Standalone validation for `@faster-crud` entities using `@Col` and `@Rule` metadata, without `class-validator`.

## Install

```bash
pnpm add @faster-crud/core @faster-crud/validation reflect-metadata
```

## Usage

```ts
import { validateEntity } from '@faster-crud/validation';
import { Col, Rule } from '@faster-crud/core';

class User {
  @Col({ label: 'Email' })
  @Rule.required()
  @Rule.email()
  email!: string;
}

const errors = validateEntity({ email: 'invalid' }, User);
```

`validateEntity(dto, Entity, rules?)` returns:

```ts
type ValidationError = {
  field: string;
  rule: string;
  message: string;
};
```

Built-in rules:
- `required`
- `email`
- `length`
- `range`
- `pattern`

## NestJS Pipe

If you use NestJS, import the pipe from the subpath so `@nestjs/common` stays optional for standalone usage:

```ts
import { ValidationPipe } from '@faster-crud/validation/nest-pipe';
```

Example:

```ts
@Post()
create(@Body(new ValidationPipe(User)) dto: Record<string, unknown>) {
  return dto;
}
```

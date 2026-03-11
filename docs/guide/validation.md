# Validation

@faster-crud includes a standalone validation engine in the `@faster-crud/validation` package. It reads `@Rule` decorator metadata from your entities and validates data against them.

## Installation

```bash
npm install @faster-crud/validation
```

## Defining Rules

Rules are defined with the `@Rule` namespace from `@faster-crud/core`:

```typescript
import { Rule } from '@faster-crud/core';

@Entity()
@Resource('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Rule.required('Username is required')
  @Rule.length(3, 20, 'Must be 3-20 characters')
  username: string;

  @Column()
  @Rule.required()
  @Rule.email('Must be a valid email')
  email: string;

  @Column()
  @Rule.range(0, 150, 'Invalid age')
  age: number;

  @Column()
  @Rule.pattern(/^[a-z0-9-]+$/, 'Lowercase alphanumeric and hyphens only')
  slug: string;
}
```

## Available Rules

| Rule | Parameters | Description |
|------|-----------|-------------|
| `@Rule.required(msg?)` | — | Value must not be `undefined`, `null`, or `''` |
| `@Rule.length(min, max, msg?)` | min, max | String length must be within bounds |
| `@Rule.range(min, max, msg?)` | min, max | Number must be within bounds |
| `@Rule.email(msg?)` | — | Must match email format |
| `@Rule.pattern(regex, msg?)` | RegExp | Must match the given regex |

All `msg` parameters are optional — sensible defaults are generated automatically.

## Standalone Usage

Use `validateEntity` anywhere — no framework required:

```typescript
import { validateEntity } from '@faster-crud/validation';
import { User } from './user.entity';

const errors = validateEntity(
  { email: 'not-an-email', username: '' },
  User,
);

console.log(errors);
// [
//   { field: 'username', rule: 'required', message: 'Username is required' },
//   { field: 'email', rule: 'email', message: 'Must be a valid email' }
// ]
```

### Return Type

```typescript
interface ValidationError {
  field: string;
  rule: string;
  message: string;
}
```

`validateEntity` returns an empty array when validation passes.

## NestJS Pipe

The package includes a NestJS-compatible validation pipe:

```typescript
import { ValidationPipe } from '@faster-crud/validation/nest-pipe';

@Controller('users')
export class UserController {
  @Post()
  create(@Body(new ValidationPipe(User)) dto: Partial<User>) {
    return this.userService.create(dto);
  }
}
```

The pipe throws a `BadRequestException` with the array of `ValidationError` objects when validation fails.

## How Validation Runs

1. The validator reads `@Rule` metadata from the entity class using `Reflect.getMetadata(RULES_META, Entity)`.
2. For each field with rules, it checks the incoming DTO value.
3. Optional fields (those without `@Rule.required()`) are skipped if the value is `undefined` or `null`.
4. Each rule is evaluated in order. All failures are collected and returned (not just the first).

## Using with Frontend

The `/__crud/meta` endpoint exposes rule metadata so frontend packages can validate client-side before sending a request:

```json
{
  "fields": {
    "username": {
      "key": "username",
      "rules": [
        { "kind": "required", "message": "Username is required" },
        { "kind": "length", "params": { "min": 3, "max": 20 } }
      ]
    }
  }
}
```

The React, Vue, and Svelte packages read this metadata and can enforce the same rules in the browser.

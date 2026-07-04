# Error Handling

@faster-crud normalizes errors across all adapters and frameworks. This page covers how errors surface, how to customize them, and how to handle edge cases.

## Built-in Error Responses

The generated controllers return standard HTTP responses:

| Scenario | HTTP Status | Body |
|----------|-------------|------|
| Resource not found | `404 Not Found` | `{ statusCode: 404, message: "Not found" }` |
| Validation failure | `400 Bad Request` | `{ statusCode: 400, errors: ValidationError[] }` |
| Duplicate key | `409 Conflict` | `{ statusCode: 409, message: "Conflict" }` |
| Internal error | `500 Internal Server Error` | `{ statusCode: 500, message: "Internal server error" }` |

## Throwing Errors from Hooks

Any exception thrown from a lifecycle hook (`onBeforeCreate`, `onBeforeRemove`, etc.) is propagated to the client. Use NestJS built-in exceptions for precise HTTP codes:

```typescript
import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmResourceService } from '@faster-crud/typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService extends TypeOrmResourceService(User) {
  constructor(@InjectRepository(User) repo: Repository<User>) {
    super(repo);
  }

  async onBeforeCreate(dto: Partial<User>): Promise<Partial<User>> {
    const existing = await this.repo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException(`Email "${dto.email}" is already registered`);
    }
    return dto;
  }

  async onBeforeRemove(id: number): Promise<void> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    if (user.role === 'superadmin') {
      throw new ForbiddenException('Cannot delete a superadmin account');
    }
  }
}
```

## Validation Errors

When `class-validator` is installed and a NestJS `ValidationPipe` is active, validation errors return a structured 400 response:

```json
{
  "statusCode": 400,
  "message": ["username must be longer than or equal to 3 characters"],
  "error": "Bad Request"
}
```

Using the built-in `@faster-crud/validation` pipe gives a slightly different format:

```json
{
  "statusCode": 400,
  "errors": [
    { "field": "username", "rule": "length", "message": "Must be 3-20 characters" },
    { "field": "email", "rule": "email", "message": "Must be a valid email" }
  ]
}
```

### Global Validation Pipe (recommended)

Enable the NestJS `ValidationPipe` globally so all CRUD routes are validated automatically:

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // Strip unknown properties
      forbidNonWhitelisted: true, // Reject requests with unknown properties
      transform: true,        // Auto-transform payloads to DTO types
    })
  );
  await app.listen(3000);
}
bootstrap();
```

## Global Exception Filter

Add a NestJS exception filter to standardize all error responses:

```typescript
import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
```

Register it globally in `main.ts`:

```typescript
app.useGlobalFilters(new AllExceptionsFilter());
```

## Not Found Handling

By default, `get(id)` throws a 404 when the record does not exist. Override `onBeforeRemove` to add custom not-found messages:

```typescript
async onBeforeRemove(id: number): Promise<void> {
  const exists = await this.repo.count({ where: { id } });
  if (!exists) {
    throw new NotFoundException(`Post #${id} does not exist`);
  }
}
```

## Database Errors

Adapter-level errors (e.g., TypeORM `QueryFailedError`, Prisma `PrismaClientKnownRequestError`) bubble up as 500s by default. Catch them in hooks or in a filter:

```typescript
import { QueryFailedError } from 'typeorm';
import { ConflictException } from '@nestjs/common';

@Catch(QueryFailedError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const isDuplicate = (exception as any).code === 'ER_DUP_ENTRY'
      || (exception as any).code === '23505'; // PostgreSQL unique violation

    if (isDuplicate) {
      return response.status(409).json({
        statusCode: 409,
        message: 'A record with those values already exists',
      });
    }

    response.status(500).json({ statusCode: 500, message: 'Database error' });
  }
}
```

## Error Handling in Other Adapters

### Hono

```typescript
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { HonoCrudRouter } from '@faster-crud/hono';

const app = new Hono();

// Global error handler
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  console.error(err);
  return c.json({ statusCode: 500, message: 'Internal server error' }, 500);
});

app.route('/users', HonoCrudRouter(User, userService));
```

### Express

```typescript
import express, { ErrorRequestHandler } from 'express';
import { expressCrudRouter } from '@faster-crud/express';

const app = express();
app.use(express.json());
app.use('/api/users', expressCrudRouter(User, userService));

// Error middleware (must have 4 arguments)
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const status = err.status ?? 500;
  res.status(status).json({ statusCode: status, message: err.message });
};
app.use(errorHandler);
```

## Summary

| Approach | When to Use |
|----------|-------------|
| Throw in hooks | Business rule violations (conflict, forbidden) |
| `ValidationPipe` | Input format / field validation |
| Global exception filter | Catch-all formatting |
| Adapter-specific filter | Database-level error codes |

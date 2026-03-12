# @faster-crud/nest

[![npm](https://img.shields.io/npm/v/@faster-crud/nest?style=flat-square)](https://www.npmjs.com/package/@faster-crud/nest)

NestJS CRUD module for `@faster-crud` — auto-generates controllers, DTOs, and Swagger docs from `@Resource`/`@Col` decorators.

## Install

```bash
npm install @faster-crud/nest @faster-crud/core reflect-metadata
npm install @nestjs/common @nestjs/core  # peer deps
```

## Quick Start

```ts
// post.entity.ts
import { Resource, Col, Readonly } from '@faster-crud/core';

@Resource('posts')
export class Post {
  @Readonly()
  id: number;

  @Col({ label: 'Title' })
  title: string;

  @Col({ label: 'Content', ui: { widget: 'textarea' } })
  content: string;
}

// posts.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmResourceService } from '@faster-crud/typeorm';
import { Post } from './post.entity';

@Injectable()
export class PostsService extends TypeOrmResourceService(Post) {
  constructor(@InjectRepository(Post) repo: Repository<Post>) {
    super(repo);
  }
}

// posts.controller.ts
import { Controller } from '@nestjs/common';
import { CrudControllerFactory } from '@faster-crud/nest';
import { Post } from './post.entity';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController extends CrudControllerFactory(Post, PostsService) {}

// app.module.ts
import { Module } from '@nestjs/common';
import { NestCrudModule } from '@faster-crud/nest';

@Module({
  imports: [
    NestCrudModule.forRoot(),
    TypeOrmModule.forFeature([Post]),
  ],
  controllers: [PostsController],
  providers: [PostsService],
})
export class AppModule {}
```

## Generated Endpoints

For a `@Resource('posts')` entity, the controller factory creates:

| Method | Path | Operation |
|--------|------|-----------|
| `POST` | `/posts` | Create |
| `GET` | `/posts` | List with pagination |
| `GET` | `/posts/:id` | Get by id |
| `PATCH` | `/posts/:id` | Update |
| `DELETE` | `/posts/:id` | Remove |

### List query params

```
GET /posts?page[current]=1&page[size]=20&filters[title][op]=like&filters[title][value]=foo&sort[field]=createdAt&sort[order]=desc
```

### Response format

```json
// GET /posts
{
  "data": [...],
  "total": 42,
  "page": 1,
  "size": 20
}
```

## Swagger / OpenAPI

If `@nestjs/swagger` is installed, decorators are applied automatically — no manual `@ApiProperty()` needed.

```ts
// Just install the peer dep:
npm install @nestjs/swagger
```

## ResourceService interface

```ts
import { IResourceService } from '@faster-crud/nest';

interface IResourceService<T> {
  findAll(query: PageQuery<T>): Promise<PageResult<T>>;
  findOne(id: number | string): Promise<T | null>;
  create(dto: Partial<T>): Promise<T>;
  update(id: number | string, dto: Partial<T>): Promise<T>;
  remove(id: number | string): Promise<void>;
}
```

> GitHub: [bkmashiro/nest-faster-crud](https://github.com/bkmashiro/nest-faster-crud)

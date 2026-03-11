# Code Generator CLI

## Installation

```bash
npm install -D @faster-crud/gen
# or run directly
npx @faster-crud/gen
```

## Usage

```bash
npx @faster-crud/gen add <EntityName> --fields "<field>:<type>,..." [--outdir <path>]
```

### Example

```bash
npx @faster-crud/gen add User --fields "name:string,email:string,age:number" --outdir src/resources
```

This generates three files:

### User.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Resource, Col } from '@faster-crud/core';

@Entity()
@Resource('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar' })
  @Col({ label: 'Name' })
  name!: string;

  @Column({ type: 'varchar' })
  @Col({ label: 'Email' })
  email!: string;

  @Column({ type: 'int' })
  @Col({ label: 'Age' })
  age!: number;
}
```

### User.service.ts

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmResourceService } from '@faster-crud/typeorm';
import { User } from './User.entity';

@Injectable()
export class UserService extends TypeOrmResourceService(User) {
  constructor(@InjectRepository(User) repo: Repository<User>) {
    super(repo);
  }
}
```

### User.module.ts

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrudControllerFactory } from '@faster-crud/nest';
import { User } from './User.entity';
import { UserService } from './User.service';

const UserController = CrudControllerFactory.create(User, UserService);

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
```

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `--fields` | (required) | Comma-separated `name:type` pairs |
| `--outdir` | `src/resources` | Output directory for generated files |

## Supported Field Types

| Type | TypeORM Column Type |
|------|-------------------|
| `string` | `varchar` |
| `number` | `int` |
| `boolean` | `boolean` |
| `Date` | `datetime` |

## Resource Name

The entity name is automatically pluralized for the `@Resource()` route:

| Entity | Resource Path |
|--------|--------------|
| `User` | `/users` |
| `Post` | `/posts` |
| `Category` | `/categorys` |

After generation, customize the entity by adding `@Rule`, `@Searchable`, `@Hidden`, and other decorators as needed.

# Mongoose Adapter

## Installation

```bash
npm install @faster-crud/mongoose mongoose
```

## Setup

Pass the Mongoose model to the service mixin:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongooseResourceService } from '@faster-crud/mongoose';
import { User } from './user.entity';

@Injectable()
export class UserService extends MongooseResourceService(User, null as any) {
  constructor(@InjectModel('User') model: Model<User>) {
    super(model);
  }
}
```

## Features

- **Flexible ID type** — supports any ID type, not just `number`
- **Case-insensitive `like`** — uses `$regex` with `$options: 'i'` and proper escaping
- **Pagination** — uses `find()` with `skip`/`limit` and `countDocuments()`
- **Returns `HydratedDocument<T>`** for proper Mongoose typing

## Filter Mapping

| Operator | MongoDB Expression |
|----------|-------------------|
| `eq` | Direct value |
| `ne` | `{ $ne: value }` |
| `lt` | `{ $lt: value }` |
| `lte` | `{ $lte: value }` |
| `gt` | `{ $gt: value }` |
| `gte` | `{ $gte: value }` |
| `like` | `{ $regex: escapedValue, $options: 'i' }` |
| `in` | `{ $in: [...] }` |
| `between` | `{ $gte: min, $lte: max }` |

## Example

```typescript
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Resource, Col, Rule, Searchable } from '@faster-crud/core';

@Schema()
@Resource('products')
export class Product {
  @Prop({ required: true })
  @Col({ label: 'Name' })
  @Rule.required()
  @Searchable()
  name: string;

  @Prop()
  @Col({ label: 'Price', ui: { widget: 'number-input' } })
  @Rule.range(0, 99999)
  price: number;
}
```

# @faster-crud/mongoose

Mongoose adapter for `@faster-crud`.

## Install

```bash
pnpm add @faster-crud/mongoose mongoose
```

## Usage

```ts
import { MongooseResourceService } from '@faster-crud/mongoose';

class UserService extends MongooseResourceService(User, UserModel) {}
```

`Model` is the Mongoose model for the resource.

## Supported operations

- `create(dto)` delegates to `new Model(dto).save()`
- `list(query)` delegates to `Model.find(where).skip(offset).limit(size).sort(sort)` and `Model.countDocuments(where)`
- `get(id)` delegates to `Model.findById(id)`
- `update(id, dto)` delegates to `Model.findByIdAndUpdate(id, dto, { new: true })`
- `remove(id)` delegates to `Model.findByIdAndDelete(id)`

## Filter mapping

- `eq` -> scalar equality
- `ne` -> `{ $ne: value }`
- `lt` -> `{ $lt: value }`
- `lte` -> `{ $lte: value }`
- `gt` -> `{ $gt: value }`
- `gte` -> `{ $gte: value }`
- `like` -> `{ $regex: value, $options: 'i' }`
- `in` -> `{ $in: values }`
- `between` -> `{ $gte: min, $lte: max }`

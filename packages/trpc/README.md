# @faster-crud/trpc

tRPC adapter for `@faster-crud`.

## Usage

```ts
import { createCrudRouter } from "@faster-crud/trpc";

export const userRouter = createCrudRouter(User, userService);
```

The adapter derives Zod input schemas from `@Col` field metadata and `@Rule` validation metadata, then builds a tRPC v11 router with `list`, `get`, `create`, `update`, and `remove` procedures.

# @faster-crud/fastify

Fastify adapter for `@faster-crud`.

## Usage

```ts
import Fastify from "fastify";
import { FastifyCrudPlugin } from "@faster-crud/fastify";

const app = Fastify();

app.register(FastifyCrudPlugin(User, userService));
```

You can override the resource path with Fastify's plugin options:

```ts
app.register(FastifyCrudPlugin(User, userService), {
  prefix: "/members",
});
```

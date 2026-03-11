# @faster-crud/hono

Hono adapter for `@faster-crud`.

## Usage

```ts
import { Hono } from "hono";
import { HonoCrudRouter } from "@faster-crud/hono";

const app = new Hono();

app.route("/users", HonoCrudRouter(User, userService));
```

`HonoCrudRouter` works with any Hono-compatible runtime, including Bun, Deno, Cloudflare Workers, and Node.js.

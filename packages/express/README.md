# @faster-crud/express

Express adapter for `@faster-crud`.

## Usage

```ts
import express from "express";
import { expressCrudRouter } from "@faster-crud/express";

const app = express();

app.use(express.json());
app.use("/users", expressCrudRouter(User, userService));
```

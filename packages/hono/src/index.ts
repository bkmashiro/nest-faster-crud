import { Hono } from "hono";
import { getFieldsMeta, getResourceMeta } from "@faster-crud/core";

export function HonoCrudRouter<T extends object>(
  Entity: new () => T,
  service: {
    create(dto: Partial<T>): Promise<T>;
    list(query: any): Promise<any>;
    get(id: number): Promise<T | null>;
    update(id: number, dto: Partial<T>): Promise<T>;
    remove(id: number): Promise<void>;
  }
): Hono {
  const app = new Hono();
  const meta = getResourceMeta(Entity);

  void getFieldsMeta;

  if (!meta) {
    throw new Error("@Resource not found");
  }

  const { operations } = meta;

  if (operations.includes("list")) {
    app.get("/", async (c) => c.json(await service.list(c.req.query())));
  }

  if (operations.includes("get")) {
    app.get("/:id", async (c) => {
      const resource = await service.get(+c.req.param("id"));

      if (!resource) {
        return c.json({ error: "Not found" }, 404);
      }

      return c.json(resource);
    });
  }

  if (operations.includes("create")) {
    app.post("/", async (c) =>
      c.json(await service.create(await c.req.json()), 201)
    );
  }

  if (operations.includes("update")) {
    app.patch("/:id", async (c) =>
      c.json(await service.update(+c.req.param("id"), await c.req.json()))
    );
  }

  if (operations.includes("remove")) {
    app.delete("/:id", async (c) => {
      await service.remove(+c.req.param("id"));
      return c.json({ ok: true });
    });
  }

  return app;
}

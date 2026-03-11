import { getResourceMeta } from "@faster-crud/core";
import { Router } from "express";
import type { Request, Response, NextFunction } from "express";

export interface CrudService<T extends object> {
  create(dto: Partial<T>): Promise<T>;
  list(query: any): Promise<any>;
  get(id: number): Promise<T | null>;
  update(id: number, dto: Partial<T>): Promise<T>;
  remove(id: number): Promise<void>;
}

export function expressCrudRouter<T extends object>(
  Entity: new () => T,
  service: CrudService<T>
): Router {
  const router = Router();
  const meta = getResourceMeta(Entity);

  if (!meta) {
    throw new Error("@Resource not found");
  }

  const { operations } = meta;

  const handle =
    (
      fn: (req: Request, res: Response) => Promise<void>
    ) =>
    (req: Request, res: Response, next: NextFunction): void => {
      void fn(req, res).catch(next);
    };

  if (operations.includes("list")) {
    router.get(
      "/",
      handle(async (req, res) => {
        res.json(await service.list(req.query));
      })
    );
  }

  if (operations.includes("get")) {
    router.get(
      "/:id",
      handle(async (req, res) => {
        const resource = await service.get(+req.params.id);

        if (!resource) {
          res.status(404).json({ error: "Not found" });
          return;
        }

        res.json(resource);
      })
    );
  }

  if (operations.includes("create")) {
    router.post(
      "/",
      handle(async (req, res) => {
        res.status(201).json(await service.create(req.body as Partial<T>));
      })
    );
  }

  if (operations.includes("update")) {
    router.patch(
      "/:id",
      handle(async (req, res) => {
        res.json(
          await service.update(+req.params.id, req.body as Partial<T>)
        );
      })
    );
  }

  if (operations.includes("remove")) {
    router.delete(
      "/:id",
      handle(async (req, res) => {
        await service.remove(+req.params.id);
        res.json({ ok: true });
      })
    );
  }

  return router;
}

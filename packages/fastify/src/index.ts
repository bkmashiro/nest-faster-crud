import { getResourceMeta } from "@faster-crud/core";
import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

export interface CrudService<T extends object> {
  create(dto: Partial<T>): Promise<T>;
  list(query: any): Promise<any>;
  get(id: number): Promise<T | null>;
  update(id: number, dto: Partial<T>): Promise<T>;
  remove(id: number): Promise<void>;
}

export interface CrudPluginOptions<T extends object = any> {
  prefix?: string;
  service: CrudService<T>;
}

export function FastifyCrudPlugin<T extends object>(
  Entity: new () => T,
  service: CrudService<T>
): FastifyPluginAsync<{ prefix?: string }> {
  return fp(async (fastify: FastifyInstance, opts: { prefix?: string }) => {
    const meta = getResourceMeta(Entity);

    if (!meta) {
      throw new Error("@Resource not found");
    }

    const prefix = opts.prefix ?? `/${meta.name}`;
    const { operations } = meta;

    if (operations.includes("list")) {
      fastify.get(prefix, async (req, reply) =>
        reply.send(await service.list(req.query))
      );
    }

    if (operations.includes("get")) {
      fastify.get(`${prefix}/:id`, async (req: any, reply) => {
        const resource = await service.get(+req.params.id);

        if (!resource) {
          return reply.status(404).send({ error: "Not found" });
        }

        return reply.send(resource);
      });
    }

    if (operations.includes("create")) {
      fastify.post(prefix, async (req, reply) =>
        reply.status(201).send(await service.create(req.body as Partial<T>))
      );
    }

    if (operations.includes("update")) {
      fastify.patch(`${prefix}/:id`, async (req: any, reply) =>
        reply.send(await service.update(+req.params.id, req.body as Partial<T>))
      );
    }

    if (operations.includes("remove")) {
      fastify.delete(`${prefix}/:id`, async (req: any, reply) => {
        await service.remove(+req.params.id);
        return reply.send({ ok: true });
      });
    }
  });
}

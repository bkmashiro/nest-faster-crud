# nest-faster-crud npm publish results

Date: 2026-03-22
Workspace: `/Users/yuzhe/projects/nest-faster-crud`

## Summary

- Checked all `packages/*/package.json` files.
- No package is marked `private: true`.
- Intended publish order based on internal package dependencies:
  1. `core`
  2. `nest`
  3. `auth`
  4. `drizzle`
  5. `express`
  6. `fastify`
  7. `gen`
  8. `graphql`
  9. `hono`
  10. `mikro-orm`
  11. `mongoose`
  12. `prisma`
  13. `react`
  14. `solid`
  15. `svelte`
  16. `trpc`
  17. `typeorm`
  18. `validation`

## Environment blocker

- `npm config get registry` returned `https://registry.npmjs.org/`
- Registry reachability check failed with `getaddrinfo ENOTFOUND registry.npmjs.org`
- `npm view @faster-crud/core version` timed out
- `npm whoami` timed out

Because the current environment cannot resolve `registry.npmjs.org`, npm version checks and `npm publish` could not be executed.

## Package status

| Dir | Package | Local Version | Private | Status |
| --- | --- | --- | --- | --- |
| core | `@faster-crud/core` | `0.3.0` | `false` | blocked: npm registry DNS resolution failed |
| nest | `@faster-crud/nest` | `0.2.2` | `false` | blocked: npm registry DNS resolution failed |
| auth | `@faster-crud/auth` | `0.2.2` | `false` | blocked: npm registry DNS resolution failed |
| drizzle | `@faster-crud/drizzle` | `0.2.2` | `false` | blocked: npm registry DNS resolution failed |
| express | `@faster-crud/express` | `0.2.2` | `false` | blocked: npm registry DNS resolution failed |
| fastify | `@faster-crud/fastify` | `0.2.2` | `false` | blocked: npm registry DNS resolution failed |
| gen | `@faster-crud/gen` | `0.2.2` | `false` | blocked: npm registry DNS resolution failed |
| graphql | `@faster-crud/graphql` | `0.3.0` | `false` | blocked: npm registry DNS resolution failed |
| hono | `@faster-crud/hono` | `0.2.2` | `false` | blocked: npm registry DNS resolution failed |
| mikro-orm | `@faster-crud/mikro-orm` | `0.2.2` | `false` | blocked: npm registry DNS resolution failed |
| mongoose | `@faster-crud/mongoose` | `0.2.2` | `false` | blocked: npm registry DNS resolution failed |
| prisma | `@faster-crud/prisma` | `0.3.0` | `false` | blocked: npm registry DNS resolution failed |
| react | `@faster-crud/react` | `0.2.2` | `false` | blocked: npm registry DNS resolution failed |
| solid | `@faster-crud/solid` | `0.2.2` | `false` | blocked: npm registry DNS resolution failed |
| svelte | `@faster-crud/svelte` | `0.2.2` | `false` | blocked: npm registry DNS resolution failed |
| trpc | `@faster-crud/trpc` | `0.2.2` | `false` | blocked: npm registry DNS resolution failed |
| typeorm | `@faster-crud/typeorm` | `0.2.2` | `false` | blocked: npm registry DNS resolution failed |
| validation | `@faster-crud/validation` | `0.2.2` | `false` | blocked: npm registry DNS resolution failed |

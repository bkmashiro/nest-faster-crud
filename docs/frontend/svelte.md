# Svelte

## Installation

```bash
npm install @faster-crud/svelte
```

Requires **Svelte 5** (uses runes for fine-grained reactivity).

## createCrudStore

```svelte
<script>
  import { createCrudStore } from '@faster-crud/svelte';

  const crud = createCrudStore('/api/users');
</script>

{#if crud.loading}
  <p>Loading...</p>
{:else}
  <table>
    <thead>
      <tr>
        <th>Username</th>
        <th>Email</th>
      </tr>
    </thead>
    <tbody>
      {#each crud.data as user}
        <tr>
          <td>{user.username}</td>
          <td>{user.email}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
```

## Store API

```typescript
const crud = createCrudStore<T>(baseUrl: string): CrudStore<T>;
```

### Properties (reactive via `$state`)

| Property | Type | Description |
|----------|------|-------------|
| `meta` | `ResourceMeta \| null` | Field metadata (readonly) |
| `data` | `T[]` | Current page of records (readonly) |
| `total` | `number` | Total record count (readonly) |
| `loading` | `boolean` | Request in progress (readonly) |
| `page` | `{ current: number; size: number }` | Pagination (read/write) |
| `filters` | `Record<string, any>` | Active filters (read/write) |
| `sort` | `{ field: string; order: 'asc' \| 'desc' } \| null` | Active sort (read/write) |

### Methods

| Method | Description |
|--------|-------------|
| `fetchMeta()` | Fetch resource metadata |
| `fetchList()` | Fetch current page of data |
| `create(dto)` | Create a new record |
| `update(id, dto)` | Update a record |
| `remove(id)` | Delete a record |

## Components

### CrudTable

```svelte
<script>
  import CrudTable from '@faster-crud/svelte/src/CrudTable.svelte';
</script>

<CrudTable {crud} on:edit={(e) => editId = e.detail} />
```

### CrudForm

```svelte
<script>
  import CrudForm from '@faster-crud/svelte/src/CrudForm.svelte';
</script>

<CrudForm {crud} mode="create" on:done={() => crud.fetchList()} />
```

## Svelte 5 Runes

The store uses Svelte 5's `$state` rune semantics internally. Properties like `data`, `loading`, and `total` are backed by getter/setter pairs, giving you fine-grained reactivity without wrapping values in stores or signals.

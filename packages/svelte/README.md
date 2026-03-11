# @faster-crud/svelte

Svelte 5 stores and components for `@faster-crud`.

## Install

```bash
npm i @faster-crud/svelte @faster-crud/core svelte
```

## Usage

### createCrudStore

```svelte
<script lang="ts">
  import { createCrudStore } from '@faster-crud/svelte';
  import CrudTable from '@faster-crud/svelte/src/CrudTable.svelte';
  import CrudForm from '@faster-crud/svelte/src/CrudForm.svelte';

  interface User {
    id: number;
    name: string;
    email: string;
  }

  const store = createCrudStore<User>('/api/users');

  // Fetch metadata + initial list on mount
  $effect(() => {
    store.fetchMeta().then(() => store.fetchList());
  });

  let editItem: User | null = $state(null);
</script>

<h1>Users</h1>

<CrudForm {store} mode="create" onDone={() => store.fetchList()} />

{#if editItem}
  <CrudForm
    {store}
    mode="edit"
    initialValues={editItem}
    onDone={() => { editItem = null; store.fetchList(); }}
  />
{/if}

<CrudTable {store} onEdit={(item) => (editItem = item)} />
```

### Store API

| Property / Method | Type | Description |
|---|---|---|
| `meta` | `ResourceMeta \| null` | Field metadata from the server |
| `data` | `T[]` | Current page of records |
| `total` | `number` | Total record count |
| `loading` | `boolean` | Whether a request is in progress |
| `page` | `{ current, size }` | Current pagination state (read/write) |
| `filters` | `Record<string, any>` | Active filters (read/write) |
| `sort` | `{ field, order } \| null` | Active sort (read/write) |
| `fetchMeta()` | `Promise<void>` | Load field metadata |
| `fetchList()` | `Promise<void>` | Load the current page |
| `create(dto)` | `Promise<void>` | Create a record and refresh |
| `update(id, dto)` | `Promise<void>` | Update a record and refresh |
| `remove(id)` | `Promise<void>` | Delete a record and refresh |

### CrudTable

```svelte
<CrudTable {store} onEdit={(item) => { /* ... */ }} idKey="id" />
```

### CrudForm

```svelte
<CrudForm {store} mode="create" onDone={() => { /* ... */ }} />
<CrudForm {store} mode="edit" initialValues={selectedItem} onDone={() => { /* ... */ }} />
```

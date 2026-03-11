# @faster-crud/solid

SolidJS adapter for **@faster-crud** — reactive CRUD store and UI components powered by SolidJS signals and resources.

## Installation

```bash
npm install @faster-crud/solid @faster-crud/core solid-js
```

## Usage

### createCrudStore

```tsx
import { createCrudStore } from '@faster-crud/solid';

const store = createCrudStore<User>('/api/users');

// Reactive accessors (signals)
store.data();    // T[]
store.meta();    // ResourceMeta
store.total();   // number
store.loading(); // boolean
store.page();    // { current, size }

// Setters
store.setPage({ current: 2, size: 10 });
store.setFilters({ name: 'Alice' });
store.setSort({ field: 'createdAt', order: 'desc' });

// Mutations (auto-refetch after success)
await store.create({ name: 'Bob' });
await store.update(1, { name: 'Robert' });
await store.remove(1);
store.refetch();
```

### CrudTable

```tsx
import { createCrudStore, CrudTable } from '@faster-crud/solid';

function UsersPage() {
  const store = createCrudStore<User>('/api/users');
  return <CrudTable store={store} onEdit={(user) => console.log(user)} />;
}
```

### CrudForm

```tsx
import { createCrudStore, CrudForm } from '@faster-crud/solid';

function CreateUser() {
  const store = createCrudStore<User>('/api/users');
  return <CrudForm store={store} mode="create" onSuccess={() => alert('Created!')} />;
}
```

## API

### `createCrudStore<T>(baseUrl: string): CrudStoreReturn<T>`

Returns a reactive store with signals for state and methods for CRUD operations.

### `CrudTable<T>(props: CrudTableProps<T>)`

Renders a table from `store.meta().fields` with sorting, pagination, edit/delete actions.

### `CrudForm<T>(props: CrudFormProps<T>)`

Dynamic form using `Switch`/`Match` for widget types (text, textarea, select, switch, checkbox, etc.).

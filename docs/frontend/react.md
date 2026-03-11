# React

## Installation

```bash
npm install @faster-crud/react
```

## useCrud Hook

The primary API is the `useCrud` hook, which provides full CRUD state management:

```tsx
import { useCrud } from '@faster-crud/react';

interface User {
  id: number;
  username: string;
  email: string;
}

function UsersPage() {
  const crud = useCrud<User>('/api/users');

  return (
    <div>
      {crud.loading && <p>Loading...</p>}
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {crud.data.map((user) => (
            <tr key={user.id}>
              <td>{user.username}</td>
              <td>{user.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>Total: {crud.total}</p>
    </div>
  );
}
```

## Hook API

```typescript
const crud = useCrud<T>(baseUrl: string): UseCrudReturn<T>;
```

### Returned Properties

| Property | Type | Description |
|----------|------|-------------|
| `meta` | `ResourceMeta \| null` | Field metadata from `/__crud/meta` |
| `data` | `T[]` | Current page of records |
| `total` | `number` | Total record count |
| `loading` | `boolean` | Request in progress |
| `page` | `{ current: number; size: number }` | Current pagination state |
| `setPage` | `(page) => void` | Update pagination |
| `filters` | `Record<string, any>` | Active filters |
| `setFilters` | `(filters) => void` | Update filters |
| `sort` | `{ field: string; order: 'asc' \| 'desc' } \| null` | Active sort |
| `setSort` | `(sort) => void` | Update sort |
| `fetchList` | `() => Promise<void>` | Refresh list data |
| `create` | `(dto: Partial<T>) => Promise<void>` | Create a record |
| `update` | `(id: number, dto: Partial<T>) => Promise<void>` | Update a record |
| `remove` | `(id: number) => Promise<void>` | Delete a record |

## Components

### CrudTable

Renders a data table with sorting and filtering driven by resource metadata:

```tsx
import { CrudTable } from '@faster-crud/react';

<CrudTable crud={crud} onEdit={(id) => setEditingId(id)} />
```

### CrudForm

Renders a create/edit form with fields and validation derived from metadata:

```tsx
import { CrudForm } from '@faster-crud/react';

<CrudForm crud={crud} mode="create" onDone={() => crud.fetchList()} />
<CrudForm crud={crud} mode="update" recordId={editingId} onDone={() => crud.fetchList()} />
```

### CrudProvider

Share CRUD state across a component tree via context:

```tsx
import { CrudProvider, useCrudContext } from '@faster-crud/react';

function App() {
  const crud = useCrud<User>('/api/users');
  return (
    <CrudProvider value={crud}>
      <UserList />
      <UserForm />
    </CrudProvider>
  );
}

function UserList() {
  const crud = useCrudContext<User>();
  return <CrudTable crud={crud} />;
}
```

## How It Works

1. On mount, `useCrud` fetches `{baseUrl}/__crud/meta` to get resource metadata.
2. It then calls `fetchList()` to load the first page of data.
3. Changing `page`, `filters`, or `sort` triggers an automatic re-fetch.
4. `create`, `update`, and `remove` send the appropriate HTTP request and re-fetch the list.

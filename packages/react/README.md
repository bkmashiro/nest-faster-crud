# @faster-crud/react

React hooks and components for `@faster-crud`.

## Install

```bash
npm i @faster-crud/react @faster-crud/core react
```

## Usage

### useCrud hook

```tsx
import { useCrud } from '@faster-crud/react';

function UserPage() {
  const crud = useCrud<User>('/api/users');
  const { data, loading, create, update, remove } = crud;
  // ...
}
```

### CrudTable

Headless HTML table driven by metadata:

```tsx
import { useCrud, CrudTable } from '@faster-crud/react';

function UserList() {
  const crud = useCrud<User>('/api/users');
  return <CrudTable crud={crud} onEdit={(u) => console.log('edit', u)} />;
}
```

### CrudForm

Dynamic form from metadata, filtered by operation:

```tsx
import { useCrud, CrudForm } from '@faster-crud/react';

function CreateUser() {
  const crud = useCrud<User>('/api/users');
  return <CrudForm crud={crud} mode="create" onDone={() => alert('Created!')} />;
}
```

### CrudProvider

Provides a shared `useCrud` instance via React context:

```tsx
import { CrudProvider, useCrudContext, CrudTable } from '@faster-crud/react';

function App() {
  return (
    <CrudProvider baseUrl="/api/users">
      <UserTable />
    </CrudProvider>
  );
}

function UserTable() {
  const crud = useCrudContext<User>();
  return <CrudTable crud={crud} />;
}
```

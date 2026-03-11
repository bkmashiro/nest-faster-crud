# Vue

## Installation

```bash
npm install @faster-crud/vue
```

## useCrud Composable

```vue
<script setup lang="ts">
import { useCrud } from '@faster-crud/vue';

interface User {
  id: number;
  username: string;
  email: string;
}

const crud = useCrud<User>('/api/users');
</script>

<template>
  <div v-if="crud.loading.value">Loading...</div>
  <table v-else>
    <thead>
      <tr>
        <th>Username</th>
        <th>Email</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="user in crud.data.value" :key="user.id">
        <td>{{ user.username }}</td>
        <td>{{ user.email }}</td>
      </tr>
    </tbody>
  </table>
</template>
```

## Composable API

```typescript
const crud = useCrud<T>(baseUrl: string)
```

### Returned Refs and Methods

| Property | Type | Description |
|----------|------|-------------|
| `meta` | `Ref<ResourceMeta \| null>` | Field metadata |
| `data` | `Ref<T[]>` | Current page of records |
| `total` | `Ref<number>` | Total record count |
| `loading` | `Ref<boolean>` | Request in progress |
| `page` | `Ref<{ current: number; size: number }>` | Pagination state |
| `filters` | `Ref<Record<string, any>>` | Active filters |
| `sort` | `Ref<{ field: string; order: 'asc' \| 'desc' } \| null>` | Active sort |
| `fetchList` | `() => Promise<void>` | Refresh list data |
| `create` | `(dto: Partial<T>) => Promise<void>` | Create a record |
| `update` | `(id: number, dto: Partial<T>) => Promise<void>` | Update a record |
| `remove` | `(id: number) => Promise<void>` | Delete a record |

## Components

### CrudTable

```vue
<template>
  <CrudTable :crud="crud" @edit="onEdit" />
</template>
```

### CrudForm

```vue
<template>
  <CrudForm :crud="crud" mode="create" @done="crud.fetchList()" />
</template>
```

All fields, widgets, and validation rules are driven by the resource metadata fetched from `/__crud/meta`.

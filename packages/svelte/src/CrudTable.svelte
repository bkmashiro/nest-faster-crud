<script lang="ts">
  import type { CrudStore } from './store';
  import type { FieldMeta } from '@faster-crud/core';

  interface Props {
    store: CrudStore<any>;
    onEdit?: (item: any) => void;
    idKey?: string;
  }

  let { store, onEdit, idKey = 'id' }: Props = $props();

  function isVisibleInList(field: FieldMeta): boolean {
    if (field.ignore) return false;
    if (field.hidden?.includes('list')) return false;
    return true;
  }

  let fields = $derived(
    store.meta ? Object.values(store.meta.fields).filter(isVisibleInList) : []
  );
  let totalPages = $derived(Math.ceil(store.total / store.page.size));

  function handleSort(field: FieldMeta) {
    if (!field.list?.sortable) return;
    if (store.sort?.field === field.key) {
      store.sort = store.sort.order === 'asc'
        ? { field: field.key, order: 'desc' }
        : null;
    } else {
      store.sort = { field: field.key, order: 'asc' };
    }
  }

  function prevPage() {
    store.page = { ...store.page, current: store.page.current - 1 };
  }

  function nextPage() {
    store.page = { ...store.page, current: store.page.current + 1 };
  }

  function handleDelete(item: any) {
    store.remove(item[idKey]);
  }
</script>

{#if store.meta}
  {#if store.loading}
    <div>Loading...</div>
  {/if}

  <table>
    <thead>
      <tr>
        {#each fields as f}
          <th
            onclick={() => handleSort(f)}
            style={f.list?.sortable ? 'cursor: pointer' : ''}
          >
            {f.label || f.key}
            {#if store.sort?.field === f.key}
              {store.sort.order === 'asc' ? ' ↑' : ' ↓'}
            {/if}
          </th>
        {/each}
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {#each store.data as item, i (item[idKey] ?? i)}
        <tr>
          {#each fields as f}
            <td>{String(item[f.key] ?? '')}</td>
          {/each}
          <td>
            {#if onEdit && store.meta.operations.includes('update')}
              <button type="button" onclick={() => onEdit?.(item)}>Edit</button>
            {/if}
            {#if store.meta.operations.includes('remove')}
              <button type="button" onclick={() => handleDelete(item)}>Delete</button>
            {/if}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>

  {#if totalPages > 1}
    <div>
      <button type="button" disabled={store.page.current <= 1} onclick={prevPage}>
        Prev
      </button>
      <span> {store.page.current} / {totalPages} </span>
      <button type="button" disabled={store.page.current >= totalPages} onclick={nextPage}>
        Next
      </button>
    </div>
  {/if}
{/if}

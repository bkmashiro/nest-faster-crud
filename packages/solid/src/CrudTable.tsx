import { For, Show } from 'solid-js';
import type { Component } from 'solid-js';
import type { FieldMeta } from '@faster-crud/core';
import type { CrudStoreReturn } from './createCrudStore';

export interface CrudTableProps<T = any> {
  store: CrudStoreReturn<T>;
  onEdit?: (item: T) => void;
  idKey?: string;
}

function isVisibleInList(field: FieldMeta): boolean {
  if (field.ignore) return false;
  if (field.hidden?.includes('list')) return false;
  return true;
}

export function CrudTable<T extends Record<string, any>>(props: CrudTableProps<T>) {
  const fields = () => {
    const m = props.store.meta();
    return m ? Object.values(m.fields).filter(isVisibleInList) : [];
  };

  const totalPages = () => Math.ceil(props.store.total() / props.store.page().size);

  const handleSort = (field: FieldMeta) => {
    if (!field.list?.sortable) return;
    const s = props.store.sort();
    if (s?.field === field.key) {
      props.store.setSort(s.order === 'asc' ? { field: field.key, order: 'desc' } : null);
    } else {
      props.store.setSort({ field: field.key, order: 'asc' });
    }
  };

  const idKey = () => props.idKey ?? 'id';

  return (
    <div>
      <Show when={props.store.loading()}>
        <div>Loading...</div>
      </Show>
      <Show when={props.store.meta()}>
        <table>
          <thead>
            <tr>
              <For each={fields()}>
                {(f) => (
                  <th
                    onClick={() => handleSort(f)}
                    style={f.list?.sortable ? { cursor: 'pointer' } : undefined}
                  >
                    {f.label || f.key}
                    {props.store.sort()?.field === f.key &&
                      (props.store.sort()!.order === 'asc' ? ' ↑' : ' ↓')}
                  </th>
                )}
              </For>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <For each={props.store.data()}>
              {(item) => (
                <tr>
                  <For each={fields()}>
                    {(f) => <td>{String((item as any)[f.key] ?? '')}</td>}
                  </For>
                  <td>
                    <Show when={props.onEdit && props.store.meta()!.operations.includes('update')}>
                      <button type="button" onClick={() => props.onEdit!(item)}>
                        Edit
                      </button>
                    </Show>
                    <Show when={props.store.meta()!.operations.includes('remove')}>
                      <button type="button" onClick={() => props.store.remove((item as any)[idKey()])}>
                        Delete
                      </button>
                    </Show>
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
        <Show when={totalPages() > 1}>
          <div>
            <button
              type="button"
              disabled={props.store.page().current <= 1}
              onClick={() =>
                props.store.setPage({
                  ...props.store.page(),
                  current: props.store.page().current - 1,
                })
              }
            >
              Prev
            </button>
            <span>
              {' '}
              {props.store.page().current} / {totalPages()}{' '}
            </span>
            <button
              type="button"
              disabled={props.store.page().current >= totalPages()}
              onClick={() =>
                props.store.setPage({
                  ...props.store.page(),
                  current: props.store.page().current + 1,
                })
              }
            >
              Next
            </button>
          </div>
        </Show>
      </Show>
    </div>
  );
}

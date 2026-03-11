import React from 'react';
import type { UseCrudReturn } from './useCrud';
import type { FieldMeta } from '@faster-crud/core';

export interface CrudTableProps<T = any> {
  crud: UseCrudReturn<T>;
  onEdit?: (item: T) => void;
  idKey?: string;
}

function isVisibleInList(field: FieldMeta): boolean {
  if (field.ignore) return false;
  if (field.hidden?.includes('list')) return false;
  return true;
}

export function CrudTable<T extends Record<string, any>>({
  crud,
  onEdit,
  idKey = 'id',
}: CrudTableProps<T>) {
  const { meta, data, loading, total, page, setPage, sort, setSort, remove } = crud;

  if (!meta) return null;

  const fields = Object.values(meta.fields).filter(isVisibleInList);
  const totalPages = Math.ceil(total / page.size);

  const handleSort = (field: FieldMeta) => {
    if (!field.list?.sortable) return;
    if (sort?.field === field.key) {
      setSort(sort.order === 'asc' ? { field: field.key, order: 'desc' } : null);
    } else {
      setSort({ field: field.key, order: 'asc' });
    }
  };

  return (
    <div>
      {loading && <div>Loading...</div>}
      <table>
        <thead>
          <tr>
            {fields.map((f) => (
              <th
                key={f.key}
                onClick={() => handleSort(f)}
                style={f.list?.sortable ? { cursor: 'pointer' } : undefined}
              >
                {f.label || f.key}
                {sort?.field === f.key && (sort.order === 'asc' ? ' \u2191' : ' \u2193')}
              </th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={(item as any)[idKey] ?? i}>
              {fields.map((f) => (
                <td key={f.key}>{String(item[f.key] ?? '')}</td>
              ))}
              <td>
                {onEdit && meta.operations.includes('update') && (
                  <button type="button" onClick={() => onEdit(item)}>
                    Edit
                  </button>
                )}
                {meta.operations.includes('remove') && (
                  <button type="button" onClick={() => remove((item as any)[idKey])}>
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div>
          <button
            type="button"
            disabled={page.current <= 1}
            onClick={() => setPage({ ...page, current: page.current - 1 })}
          >
            Prev
          </button>
          <span>
            {' '}
            {page.current} / {totalPages}{' '}
          </span>
          <button
            type="button"
            disabled={page.current >= totalPages}
            onClick={() => setPage({ ...page, current: page.current + 1 })}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

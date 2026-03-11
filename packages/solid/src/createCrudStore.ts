import { createSignal, createResource } from 'solid-js';
import type { ResourceMeta } from '@faster-crud/core';

export interface CrudStoreReturn<T> {
  meta: () => ResourceMeta | undefined;
  data: () => T[];
  total: () => number;
  loading: () => boolean;
  page: () => { current: number; size: number };
  setPage: (p: { current: number; size: number }) => void;
  filters: () => Record<string, any>;
  setFilters: (f: Record<string, any>) => void;
  sort: () => { field: string; order: 'asc' | 'desc' } | null;
  setSort: (s: { field: string; order: 'asc' | 'desc' } | null) => void;
  create: (dto: Partial<T>) => Promise<void>;
  update: (id: number, dto: Partial<T>) => Promise<void>;
  remove: (id: number) => Promise<void>;
  refetch: () => void;
}

export function createCrudStore<T>(baseUrl: string): CrudStoreReturn<T> {
  const [page, setPage] = createSignal<{ current: number; size: number }>({ current: 1, size: 10 });
  const [filters, setFilters] = createSignal<Record<string, any>>({});
  const [sort, setSort] = createSignal<{ field: string; order: 'asc' | 'desc' } | null>(null);
  const [listVersion, setListVersion] = createSignal(0);

  // Fetch metadata
  const [meta] = createResource<ResourceMeta>(async () => {
    const res = await fetch(`${baseUrl}/__crud/meta`);
    return res.json();
  });

  // Build query params reactively
  function buildParams(): string {
    // Track reactive dependencies
    const p = page();
    const f = filters();
    const s = sort();
    // Track version to allow manual refetch
    listVersion();

    const params = new URLSearchParams();
    params.set('page[current]', String(p.current));
    params.set('page[size]', String(p.size));

    for (const [key, value] of Object.entries(f)) {
      if (value != null && value !== '') {
        params.set(`filter[${key}]`, String(value));
      }
    }

    if (s) {
      params.set('sort', `${s.order === 'desc' ? '-' : ''}${s.field}`);
    }

    return params.toString();
  }

  // Fetch list data
  const [listResult, { refetch: refetchList }] = createResource<{ data: T[]; total: number }, string>(
    buildParams,
    async (query) => {
      const res = await fetch(`${baseUrl}?${query}`);
      return res.json();
    },
  );

  const data = () => listResult()?.data ?? [];
  const total = () => listResult()?.total ?? 0;
  const loading = () => listResult.loading;

  async function create(dto: Partial<T>) {
    await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    setListVersion((v) => v + 1);
  }

  async function update(id: number, dto: Partial<T>) {
    await fetch(`${baseUrl}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    setListVersion((v) => v + 1);
  }

  async function remove(id: number) {
    await fetch(`${baseUrl}/${id}`, { method: 'DELETE' });
    setListVersion((v) => v + 1);
  }

  function refetch() {
    setListVersion((v) => v + 1);
  }

  return {
    meta,
    data,
    total,
    loading,
    page,
    setPage,
    filters,
    setFilters,
    sort,
    setSort,
    create,
    update,
    remove,
    refetch,
  };
}

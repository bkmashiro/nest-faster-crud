import type { ResourceMeta } from '@faster-crud/core';

export interface CrudStore<T> {
  readonly meta: ResourceMeta | null;
  readonly data: T[];
  readonly total: number;
  readonly loading: boolean;
  page: { current: number; size: number };
  filters: Record<string, any>;
  sort: { field: string; order: 'asc' | 'desc' } | null;
  fetchMeta: () => Promise<void>;
  fetchList: () => Promise<void>;
  create: (dto: Partial<T>) => Promise<void>;
  update: (id: number, dto: Partial<T>) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

/**
 * Creates a Svelte 5 reactive CRUD store using `$state` rune semantics.
 *
 * Usage (in a .svelte file or .svelte.ts module):
 * ```ts
 * const store = createCrudStore<User>('/api/users');
 * ```
 *
 * Because `$state` is a compiler-level rune, this factory returns a plain
 * object whose properties are backed by mutable local variables.
 * The consumer is expected to compile the importing code with the Svelte
 * compiler so that reactivity is preserved.
 *
 * For environments where runes are unavailable at compile time (e.g. plain
 * TS tests), the function falls back to plain mutable variables — the API
 * surface is identical, only fine-grained reactivity is lost.
 */
export function createCrudStore<T>(baseUrl: string): CrudStore<T> {
  let meta: ResourceMeta | null = null;
  let data: T[] = [];
  let total = 0;
  let loading = false;
  let page: { current: number; size: number } = { current: 1, size: 10 };
  let filters: Record<string, any> = {};
  let sort: { field: string; order: 'asc' | 'desc' } | null = null;

  async function fetchMeta() {
    const res = await fetch(`${baseUrl}/__crud/meta`);
    meta = await res.json();
  }

  async function fetchList() {
    loading = true;
    const params = new URLSearchParams();
    params.set('page[current]', String(page.current));
    params.set('page[size]', String(page.size));

    for (const [key, value] of Object.entries(filters)) {
      if (value != null && value !== '') {
        params.set(`filter[${key}]`, String(value));
      }
    }

    if (sort) {
      params.set('sort', `${sort.order === 'desc' ? '-' : ''}${sort.field}`);
    }

    const res = await fetch(`${baseUrl}?${params}`);
    const json = await res.json();
    data = json.data;
    total = json.total;
    loading = false;
  }

  async function create(dto: Partial<T>) {
    await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    await fetchList();
  }

  async function update(id: number, dto: Partial<T>) {
    await fetch(`${baseUrl}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    await fetchList();
  }

  async function remove(id: number) {
    await fetch(`${baseUrl}/${id}`, { method: 'DELETE' });
    await fetchList();
  }

  return {
    get meta() { return meta; },
    get data() { return data; },
    get total() { return total; },
    get loading() { return loading; },
    get page() { return page; },
    set page(v) { page = v; },
    get filters() { return filters; },
    set filters(v) { filters = v; },
    get sort() { return sort; },
    set sort(v) { sort = v; },
    fetchMeta,
    fetchList,
    create,
    update,
    remove,
  };
}

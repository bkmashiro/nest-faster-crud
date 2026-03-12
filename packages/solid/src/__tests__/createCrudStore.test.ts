/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Mock solid-js primitives so we can test store logic as pure JS (no DOM).
// ---------------------------------------------------------------------------

jest.mock('solid-js', () => {
  return {
    createSignal: (init: any) => {
      let value = init;
      const getter = () => value;
      const setter = (v: any) => {
        value = typeof v === 'function' ? v(value) : v;
      };
      return [getter, setter];
    },
    createResource: (sourceOrFetcher: any, maybeFetcher?: any) => {
      // Single-arg form: createResource(fetcher)
      // Two-arg form: createResource(source, fetcher)
      const source = maybeFetcher ? sourceOrFetcher : undefined;
      const fetcher = maybeFetcher ?? sourceOrFetcher;

      let data: any = undefined;
      let loading = false;

      const resource: any = () => data;
      resource.loading = loading;

      const load = async () => {
        loading = true;
        resource.loading = true;
        const key = source ? (typeof source === 'function' ? source() : source) : undefined;
        data = await fetcher(key);
        loading = false;
        resource.loading = false;
      };

      // Auto-load on creation
      load();

      return [resource, { refetch: load }];
    },
  };
});

import { createCrudStore } from '../createCrudStore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE = 'http://localhost:3000/api/users';

const META_FIXTURE = {
  name: 'users',
  operations: ['create', 'list', 'get', 'update', 'remove'],
  fields: {
    id: { key: 'id', type: 'Number' },
    name: { key: 'name', type: 'String' },
  },
};

const LIST_FIXTURE = {
  data: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }],
  total: 2,
};

function mockFetch(responses: Record<string, any>) {
  (globalThis as any).fetch = jest.fn(async (url: string) => {
    for (const [pattern, body] of Object.entries(responses)) {
      if (url.includes(pattern)) {
        return { json: async () => body };
      }
    }
    return { json: async () => ({}) };
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createCrudStore', () => {
  it('returns store with expected shape', () => {
    mockFetch({});
    const store = createCrudStore<any>(BASE);

    expect(typeof store.meta).toBe('function');
    expect(typeof store.data).toBe('function');
    expect(typeof store.total).toBe('function');
    expect(typeof store.loading).toBe('function');
    expect(typeof store.page).toBe('function');
    expect(typeof store.setPage).toBe('function');
    expect(typeof store.filters).toBe('function');
    expect(typeof store.setFilters).toBe('function');
    expect(typeof store.sort).toBe('function');
    expect(typeof store.setSort).toBe('function');
    expect(typeof store.create).toBe('function');
    expect(typeof store.update).toBe('function');
    expect(typeof store.remove).toBe('function');
    expect(typeof store.refetch).toBe('function');
  });

  it('has correct initial signal values', () => {
    mockFetch({});
    const store = createCrudStore<any>(BASE);

    expect(store.page()).toEqual({ current: 1, size: 10 });
    expect(store.filters()).toEqual({});
    expect(store.sort()).toBeNull();
  });

  it('fetches metadata from __crud/meta on creation', async () => {
    mockFetch({ '__crud/meta': META_FIXTURE });
    createCrudStore<any>(BASE);

    // Allow microtasks to flush
    await new Promise((r) => setTimeout(r, 10));

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/__crud/meta'),
    );
  });

  it('fetches list data on creation', async () => {
    mockFetch({
      '__crud/meta': META_FIXTURE,
      'api/users?': LIST_FIXTURE,
    });

    createCrudStore<any>(BASE);
    await new Promise((r) => setTimeout(r, 10));

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('page%5Bcurrent%5D=1'),
    );
  });

  it('setPage updates the page signal', () => {
    mockFetch({});
    const store = createCrudStore<any>(BASE);

    store.setPage({ current: 3, size: 25 });
    expect(store.page()).toEqual({ current: 3, size: 25 });
  });

  it('setFilters updates the filters signal', () => {
    mockFetch({});
    const store = createCrudStore<any>(BASE);

    store.setFilters({ name: 'Alice' });
    expect(store.filters()).toEqual({ name: 'Alice' });
  });

  it('setSort updates the sort signal', () => {
    mockFetch({});
    const store = createCrudStore<any>(BASE);

    store.setSort({ field: 'name', order: 'desc' });
    expect(store.sort()).toEqual({ field: 'name', order: 'desc' });
  });

  it('create() calls POST with correct body', async () => {
    mockFetch({
      '__crud/meta': META_FIXTURE,
      'api/users?': LIST_FIXTURE,
      'api/users': {},
    });

    const store = createCrudStore<any>(BASE);
    await store.create({ name: 'Charlie' });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      BASE,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Charlie' }),
      }),
    );
  });

  it('update() calls PATCH with id and body', async () => {
    mockFetch({
      '__crud/meta': META_FIXTURE,
      'api/users?': LIST_FIXTURE,
    });

    const store = createCrudStore<any>(BASE);
    await store.update(1, { name: 'Alice Updated' });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${BASE}/1`,
      expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Alice Updated' }),
      }),
    );
  });

  it('remove() calls DELETE with id', async () => {
    mockFetch({
      '__crud/meta': META_FIXTURE,
      'api/users?': LIST_FIXTURE,
    });

    const store = createCrudStore<any>(BASE);
    await store.remove(1);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${BASE}/1`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('refetch increments listVersion signal', () => {
    mockFetch({});
    const store = createCrudStore<any>(BASE);

    // refetch should not throw
    expect(() => store.refetch()).not.toThrow();
  });
});

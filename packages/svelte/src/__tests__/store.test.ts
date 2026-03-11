/* eslint-disable @typescript-eslint/no-explicit-any */

import { createCrudStore } from '../store';

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
  it('returns store with expected interface', () => {
    mockFetch({});
    const store = createCrudStore<any>(BASE);

    // readonly getters
    expect(store.meta).toBeNull();
    expect(store.data).toEqual([]);
    expect(store.total).toBe(0);
    expect(store.loading).toBe(false);

    // settable properties
    expect(store.page).toEqual({ current: 1, size: 10 });
    expect(store.filters).toEqual({});
    expect(store.sort).toBeNull();

    // methods
    expect(typeof store.fetchMeta).toBe('function');
    expect(typeof store.fetchList).toBe('function');
    expect(typeof store.create).toBe('function');
    expect(typeof store.update).toBe('function');
    expect(typeof store.remove).toBe('function');
  });

  it('fetchMeta fetches from __crud/meta and updates store.meta', async () => {
    mockFetch({ '__crud/meta': META_FIXTURE });
    const store = createCrudStore<any>(BASE);

    await store.fetchMeta();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${BASE}/__crud/meta`,
    );
    expect(store.meta).toEqual(META_FIXTURE);
  });

  it('fetchList fetches with page params and updates data/total', async () => {
    mockFetch({ 'api/users?': LIST_FIXTURE });
    const store = createCrudStore<any>(BASE);

    await store.fetchList();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('page%5Bcurrent%5D=1'),
    );
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('page%5Bsize%5D=10'),
    );
    expect(store.data).toEqual(LIST_FIXTURE.data);
    expect(store.total).toBe(2);
    expect(store.loading).toBe(false);
  });

  it('fetchList includes filter params when filters are set', async () => {
    mockFetch({ 'api/users?': LIST_FIXTURE });
    const store = createCrudStore<any>(BASE);

    store.filters = { name: 'Alice' };
    await store.fetchList();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('filter%5Bname%5D=Alice'),
    );
  });

  it('fetchList includes sort param when sort is set', async () => {
    mockFetch({ 'api/users?': LIST_FIXTURE });
    const store = createCrudStore<any>(BASE);

    store.sort = { field: 'name', order: 'desc' };
    await store.fetchList();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('sort=-name'),
    );
  });

  it('fetchList includes ascending sort without dash prefix', async () => {
    mockFetch({ 'api/users?': LIST_FIXTURE });
    const store = createCrudStore<any>(BASE);

    store.sort = { field: 'name', order: 'asc' };
    await store.fetchList();

    const call = (globalThis.fetch as jest.Mock).mock.calls.find(
      (c: any[]) => c[0].includes('sort='),
    );
    expect(call[0]).toContain('sort=name');
    expect(call[0]).not.toContain('sort=-name');
  });

  it('create() calls POST and refetches list', async () => {
    mockFetch({
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
    // After create, fetchList is called — so data is updated
    expect(store.data).toEqual(LIST_FIXTURE.data);
  });

  it('update() calls PATCH with id and refetches list', async () => {
    mockFetch({
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

  it('remove() calls DELETE with id and refetches list', async () => {
    mockFetch({
      'api/users?': LIST_FIXTURE,
    });
    const store = createCrudStore<any>(BASE);

    await store.remove(1);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${BASE}/1`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('page setter updates page value', () => {
    mockFetch({});
    const store = createCrudStore<any>(BASE);

    store.page = { current: 3, size: 25 };
    expect(store.page).toEqual({ current: 3, size: 25 });
  });

  it('filters setter updates filters value', () => {
    mockFetch({});
    const store = createCrudStore<any>(BASE);

    store.filters = { status: 'active' };
    expect(store.filters).toEqual({ status: 'active' });
  });

  it('sort setter updates sort value', () => {
    mockFetch({});
    const store = createCrudStore<any>(BASE);

    store.sort = { field: 'id', order: 'asc' };
    expect(store.sort).toEqual({ field: 'id', order: 'asc' });
  });

  it('skips empty/null filter values in query params', async () => {
    mockFetch({ 'api/users?': LIST_FIXTURE });
    const store = createCrudStore<any>(BASE);

    store.filters = { name: '', status: null, role: 'admin' };
    await store.fetchList();

    const url = (globalThis.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).not.toContain('filter%5Bname%5D');
    expect(url).not.toContain('filter%5Bstatus%5D');
    expect(url).toContain('filter%5Brole%5D=admin');
  });
});

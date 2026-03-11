/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Mock React hooks so we can test useCrud as pure JS (no DOM / JSDOM).
// ---------------------------------------------------------------------------

let stateSlots: Array<{ value: any; setter: (v: any) => void }> = [];
let stateIndex = 0;
let effectCallbacks: Array<() => void> = [];

jest.mock('react', () => ({
  useState: (init: any) => {
    const idx = stateIndex++;
    if (!stateSlots[idx]) {
      const slot = { value: init, setter: (v: any) => { slot.value = v; } };
      stateSlots[idx] = slot;
    }
    return [stateSlots[idx].value, stateSlots[idx].setter];
  },
  useEffect: (cb: () => void) => {
    effectCallbacks.push(cb);
  },
  useCallback: (fn: any) => fn,
}));

import { useCrud } from '../useCrud';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE = 'http://localhost:3000/api/users';

function mockFetch(responses: Record<string, any>) {
  (globalThis as any).fetch = jest.fn(async (url: string, opts?: any) => {
    for (const [pattern, body] of Object.entries(responses)) {
      if (url.includes(pattern)) {
        return { json: async () => body };
      }
    }
    return { json: async () => ({}) };
  });
}

function resetReactMocks() {
  stateSlots = [];
  stateIndex = 0;
  effectCallbacks = [];
}

function callHook() {
  stateIndex = 0;
  effectCallbacks = [];
  return useCrud<any>(BASE);
}

async function flushEffects() {
  for (const cb of effectCallbacks) {
    await cb();
  }
  effectCallbacks = [];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

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

beforeEach(() => {
  resetReactMocks();
  jest.clearAllMocks();
});

describe('useCrud', () => {
  it('returns initial state with expected shape', () => {
    mockFetch({});
    const hook = callHook();

    expect(hook.meta).toBeNull();
    expect(hook.data).toEqual([]);
    expect(hook.total).toBe(0);
    expect(hook.loading).toBe(false);
    expect(hook.page).toEqual({ current: 1, size: 10 });
    expect(hook.filters).toEqual({});
    expect(hook.sort).toBeNull();
    expect(typeof hook.fetchList).toBe('function');
    expect(typeof hook.create).toBe('function');
    expect(typeof hook.update).toBe('function');
    expect(typeof hook.remove).toBe('function');
  });

  it('fetchMeta effect calls __crud/meta endpoint', async () => {
    mockFetch({ '__crud/meta': META_FIXTURE });
    callHook();
    await flushEffects();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/__crud/meta'),
    );
  });

  it('fetchList calls correct URL with page params', async () => {
    mockFetch({
      '__crud/meta': META_FIXTURE,
      'api/users?': LIST_FIXTURE,
    });

    const hook = callHook();
    await hook.fetchList();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('page%5Bcurrent%5D=1'),
    );
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('page%5Bsize%5D=10'),
    );
  });

  it('fetchList sets data and total via state setters', async () => {
    mockFetch({
      '__crud/meta': META_FIXTURE,
      'api/users?': LIST_FIXTURE,
    });

    callHook();
    // Re-call to capture state after fetchList effect runs
    await flushEffects();

    // After effects, re-render the hook to get updated state
    stateIndex = 0;
    effectCallbacks = [];
    const hook2 = useCrud<any>(BASE);
    expect(hook2.data).toEqual(LIST_FIXTURE.data);
    expect(hook2.total).toBe(2);
  });

  it('create() calls POST with correct body', async () => {
    mockFetch({
      '__crud/meta': META_FIXTURE,
      'api/users?': LIST_FIXTURE,
      'api/users': {},
    });

    const hook = callHook();
    await hook.create({ name: 'Charlie' });

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

    const hook = callHook();
    await hook.update(1, { name: 'Alice Updated' });

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

    const hook = callHook();
    await hook.remove(1);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${BASE}/1`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('setPage / setFilters / setSort are callable setters', () => {
    mockFetch({});
    const hook = callHook();

    expect(() => hook.setPage({ current: 2, size: 20 })).not.toThrow();
    expect(() => hook.setFilters({ name: 'x' })).not.toThrow();
    expect(() => hook.setSort({ field: 'name', order: 'asc' })).not.toThrow();
  });

  it('fetchList includes sort param when sort is set', async () => {
    mockFetch({ 'api/users?': LIST_FIXTURE });

    // Set sort state before calling hook
    callHook();
    // Manually set sort via the state slot (index 6 = sort)
    stateSlots[6].setter({ field: 'name', order: 'desc' });

    // Re-render hook to pick up new sort value
    const hook2 = callHook();
    await hook2.fetchList();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('sort=-name'),
    );
  });
});

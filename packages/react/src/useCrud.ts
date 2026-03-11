import { useState, useEffect, useCallback } from 'react';
import type { ResourceMeta } from '@faster-crud/core';

export interface UseCrudReturn<T> {
  meta: ResourceMeta | null;
  data: T[];
  total: number;
  loading: boolean;
  page: { current: number; size: number };
  setPage: (page: { current: number; size: number }) => void;
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
  sort: { field: string; order: 'asc' | 'desc' } | null;
  setSort: (sort: { field: string; order: 'asc' | 'desc' } | null) => void;
  fetchList: () => Promise<void>;
  create: (dto: Partial<T>) => Promise<void>;
  update: (id: number, dto: Partial<T>) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export function useCrud<T>(baseUrl: string): UseCrudReturn<T> {
  const [meta, setMeta] = useState<ResourceMeta | null>(null);
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState<{ current: number; size: number }>({ current: 1, size: 10 });
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sort, setSort] = useState<{ field: string; order: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    fetch(`${baseUrl}/__crud/meta`)
      .then((r) => r.json())
      .then(setMeta);
  }, [baseUrl]);

  const fetchList = useCallback(async () => {
    setLoading(true);
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
    setData(json.data);
    setTotal(json.total);
    setLoading(false);
  }, [baseUrl, page, filters, sort]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const create = useCallback(
    async (dto: Partial<T>) => {
      await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      fetchList();
    },
    [baseUrl, fetchList],
  );

  const update = useCallback(
    async (id: number, dto: Partial<T>) => {
      await fetch(`${baseUrl}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      fetchList();
    },
    [baseUrl, fetchList],
  );

  const remove = useCallback(
    async (id: number) => {
      await fetch(`${baseUrl}/${id}`, { method: 'DELETE' });
      fetchList();
    },
    [baseUrl, fetchList],
  );

  return { meta, data, total, loading, page, setPage, filters, setFilters, sort, setSort, fetchList, create, update, remove };
}

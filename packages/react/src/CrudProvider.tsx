import React, { createContext, useContext } from 'react';
import type { UseCrudReturn } from './useCrud';
import { useCrud } from './useCrud';

const CrudContext = createContext<UseCrudReturn<any> | null>(null);

export function useCrudContext<T = any>(): UseCrudReturn<T> {
  const ctx = useContext(CrudContext);
  if (!ctx) throw new Error('useCrudContext must be used within a CrudProvider');
  return ctx;
}

export function CrudProvider<T>({
  baseUrl,
  children,
}: {
  baseUrl: string;
  children: React.ReactNode;
}) {
  const crud = useCrud<T>(baseUrl);
  return <CrudContext.Provider value={crud}>{children}</CrudContext.Provider>;
}

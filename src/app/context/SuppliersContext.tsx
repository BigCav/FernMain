import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { apiGet, apiSet, apiSubscribe } from '../lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────
export type SupplierCategory =
  | 'vet'
  | 'farrier'
  | 'feed'
  | 'hardware'
  | 'contractor'
  | 'fencing'
  | 'transport'
  | 'other';

export interface Supplier {
  id:       string;
  name:     string;
  category: SupplierCategory;
  phone?:   string;
  email?:   string;
  address?: string;
  notes?:   string;
}

export const SUPPLIER_CAT_CONFIG: Record<SupplierCategory, {
  label: string; color: string; bg: string; border: string;
}> = {
  vet:        { label: 'Vet & Animal Health', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  farrier:    { label: 'Farrier',             color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  feed:       { label: 'Feed Merchant',       color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  hardware:   { label: 'Hardware & Building', color: '#6b7280', bg: '#f5f5f5', border: '#e5e7eb' },
  contractor: { label: 'Contractor',          color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  fencing:    { label: 'Fencing Supplies',    color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  transport:  { label: 'Transport & Freight', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  other:      { label: 'Other',               color: '#9ca3af', bg: '#f9f9f9', border: '#e5e7eb' },
};

export const SUPPLIER_CATS = Object.keys(SUPPLIER_CAT_CONFIG) as SupplierCategory[];

// ── Context ───────────────────────────────────────────────────────────────────
interface SuppliersContextValue {
  suppliers:      Supplier[];
  addSupplier:    (s: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, updates: Partial<Omit<Supplier, 'id'>>) => void;
  removeSupplier: (id: string) => void;
}

const SuppliersContext = createContext<SuppliersContextValue | null>(null);

export function SuppliersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    if (!user) { setSuppliers([]); return; }
    apiGet<Supplier[]>('suppliers').then(data => setSuppliers(data ?? []));
    return apiSubscribe('suppliers', (d) => setSuppliers((d as Supplier[]) ?? []));
  }, [user?.id]);

  function save(list: Supplier[]) { apiSet('suppliers', list); }

  function addSupplier(s: Omit<Supplier, 'id'>) {
    setSuppliers((prev) => {
      const next = [...prev, { ...s, id: `sup-${Date.now()}` }];
      save(next);
      return next;
    });
  }

  function updateSupplier(id: string, updates: Partial<Omit<Supplier, 'id'>>) {
    setSuppliers((prev) => {
      const next = prev.map((s) => s.id === id ? { ...s, ...updates } : s);
      save(next);
      return next;
    });
  }

  function removeSupplier(id: string) {
    setSuppliers((prev) => {
      const next = prev.filter((s) => s.id !== id);
      save(next);
      return next;
    });
  }

  return (
    <SuppliersContext.Provider value={{ suppliers, addSupplier, updateSupplier, removeSupplier }}>
      {children}
    </SuppliersContext.Provider>
  );
}

export function useSuppliers(): SuppliersContextValue {
  const ctx = useContext(SuppliersContext);
  if (!ctx) throw new Error('useSuppliers must be inside SuppliersProvider');
  return ctx;
}

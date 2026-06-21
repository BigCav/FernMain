import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { type Paddock } from '../data/blockData';
import { useAuth } from './AuthContext';
import { apiGet, apiSet, apiSubscribe } from '../lib/api';

interface PaddocksContextValue {
  paddocks:       Paddock[];
  addPaddock:     (p: Paddock) => void;
  updatePaddock:  (id: string, updates: Partial<Paddock>) => void;
  removePaddock:  (id: string) => void;
}

const PaddocksContext = createContext<PaddocksContextValue | null>(null);

export function PaddocksProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [paddocks, setPaddocks] = useState<Paddock[]>([]);

  useEffect(() => {
    if (!user) { setPaddocks([]); return; }
    apiGet<Paddock[]>('paddocks').then(data => setPaddocks(data ?? []));
    return apiSubscribe('paddocks', (d) => setPaddocks((d as Paddock[]) ?? []));
  }, [user?.id]);

  function save(next: Paddock[]) { apiSet('paddocks', next); }

  function addPaddock(p: Paddock) {
    setPaddocks(prev => { const next = [...prev, p]; save(next); return next; });
  }

  function updatePaddock(id: string, updates: Partial<Paddock>) {
    setPaddocks(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      save(next);
      return next;
    });
  }

  function removePaddock(id: string) {
    setPaddocks(prev => { const next = prev.filter(p => p.id !== id); save(next); return next; });
  }

  return (
    <PaddocksContext.Provider value={{ paddocks, addPaddock, updatePaddock, removePaddock }}>
      {children}
    </PaddocksContext.Provider>
  );
}

export function usePaddocks(): PaddocksContextValue {
  const ctx = useContext(PaddocksContext);
  if (!ctx) throw new Error('usePaddocks must be inside PaddocksProvider');
  return ctx;
}

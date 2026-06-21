import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { apiGet, apiSet, apiSubscribe } from '../lib/api';

export interface WeightEntry {
  id: string;
  animalId: string;
  date: string;
  kg: number;
  notes?: string;
}

interface WeightCtx {
  entries: WeightEntry[];
  addEntry: (entry: WeightEntry) => void;
  addEntries: (entries: WeightEntry[]) => void;
  removeEntry: (id: string) => void;
  removeEntriesForAnimal: (animalId: string) => void;
  entriesForAnimal: (animalId: string) => WeightEntry[];
}

const Ctx = createContext<WeightCtx>(null!);

export function WeightProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<WeightEntry[]>([]);

  useEffect(() => {
    if (!user) { setEntries([]); return; }
    apiGet<WeightEntry[]>('weights').then(data => setEntries(data ?? []));
    return apiSubscribe('weights', (d) => setEntries((d as WeightEntry[]) ?? []));
  }, [user?.id]);

  function save(next: WeightEntry[]) {
    setEntries(next);
    apiSet('weights', next);
  }

  function addEntry(entry: WeightEntry) {
    setEntries(prev => { const next = [...prev, entry]; apiSet('weights', next); return next; });
  }

  function addEntries(newEntries: WeightEntry[]) {
    if (!newEntries.length) return;
    setEntries(prev => { const next = [...prev, ...newEntries]; apiSet('weights', next); return next; });
  }

  function removeEntry(id: string) {
    save(entries.filter(e => e.id !== id));
  }

  function removeEntriesForAnimal(animalId: string) {
    setEntries(prev => { const next = prev.filter(e => e.animalId !== animalId); apiSet('weights', next); return next; });
  }

  function entriesForAnimal(animalId: string) {
    return entries
      .filter(e => e.animalId === animalId)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  return (
    <Ctx.Provider value={{ entries, addEntry, addEntries, removeEntry, removeEntriesForAnimal, entriesForAnimal }}>
      {children}
    </Ctx.Provider>
  );
}

export function useWeight() { return useContext(Ctx); }

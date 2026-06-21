import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { apiGet, apiSet, apiSubscribe } from '../lib/api';

export interface BreedingRecord {
  id: string;
  animalId: string;        // the dam (female)
  sireId?: string;         // optional sire reference
  sireName?: string;       // name/description of sire
  matingDate: string;
  expectedDueDate: string;
  actualBirthDate?: string;
  offspringCount?: number;
  notes?: string;
}

// Gestation periods in days by species key
export const GESTATION_DAYS: Record<string, number> = {
  sheep:   147,
  cattle:  283,
  goat:    150,
  pig:     114,
  horse:   340,
  alpaca:  345,
  deer:    230,
};

export function calcDueDate(matingDate: string, species: string): string {
  const days = GESTATION_DAYS[species.toLowerCase()] ?? 150;
  const d = new Date(matingDate + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysUntilDue(dueDate: string): number {
  const due  = new Date(dueDate + 'T12:00:00').getTime();
  const now  = new Date(new Date().toISOString().split('T')[0] + 'T12:00:00').getTime();
  return Math.round((due - now) / 86400000);
}

interface BreedingCtx {
  records: BreedingRecord[];
  addRecord: (r: BreedingRecord) => void;
  addRecords: (rs: BreedingRecord[]) => void;
  updateRecord: (id: string, updates: Partial<BreedingRecord>) => void;
  removeRecord: (id: string) => void;
  removeRecordsForAnimal: (animalId: string) => void;
  recordsForAnimal: (animalId: string) => BreedingRecord[];
}

const Ctx = createContext<BreedingCtx>(null!);

export function BreedingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [records, setRecords] = useState<BreedingRecord[]>([]);

  useEffect(() => {
    if (!user) { setRecords([]); return; }
    apiGet<BreedingRecord[]>('breeding').then(data => setRecords(data ?? []));
    return apiSubscribe('breeding', (d) => setRecords((d as BreedingRecord[]) ?? []));
  }, [user?.id]);

  function save(next: BreedingRecord[]) {
    setRecords(next);
    apiSet('breeding', next);
  }

  function addRecord(r: BreedingRecord)                            { setRecords(prev => { const next = [...prev, r]; apiSet('breeding', next); return next; }); }
  function addRecords(rs: BreedingRecord[])                        { if (!rs.length) return; setRecords(prev => { const next = [...prev, ...rs]; apiSet('breeding', next); return next; }); }
  function removeRecordsForAnimal(animalId: string)                { setRecords(prev => { const next = prev.filter(r => r.animalId !== animalId); apiSet('breeding', next); return next; }); }
  function removeRecord(id: string)                                { save(records.filter(r => r.id !== id)); }
  function updateRecord(id: string, u: Partial<BreedingRecord>)   { save(records.map(r => r.id === id ? { ...r, ...u } : r)); }
  function recordsForAnimal(animalId: string)                      { return records.filter(r => r.animalId === animalId).sort((a, b) => b.matingDate.localeCompare(a.matingDate)); }

  return (
    <Ctx.Provider value={{ records, addRecord, addRecords, updateRecord, removeRecord, removeRecordsForAnimal, recordsForAnimal }}>
      {children}
    </Ctx.Provider>
  );
}

export function useBreeding() { return useContext(Ctx); }

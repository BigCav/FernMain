import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { apiGet, apiSet, apiSubscribe } from '../lib/api';

export interface WithholdingRecord {
  id: string;
  animalId: string;
  productName: string;
  treatmentDate: string;
  meatDays: number;       // withholding period for meat
  milkDays?: number;      // withholding period for milk (dairy only)
  notes?: string;
}

export function meatClearDate(r: WithholdingRecord): string {
  const d = new Date(r.treatmentDate + 'T12:00:00');
  d.setDate(d.getDate() + r.meatDays);
  return d.toISOString().slice(0, 10);
}

export function milkClearDate(r: WithholdingRecord): string | null {
  if (!r.milkDays) return null;
  const d = new Date(r.treatmentDate + 'T12:00:00');
  d.setDate(d.getDate() + r.milkDays);
  return d.toISOString().slice(0, 10);
}

export function daysUntilClear(clearDate: string): number {
  const clear = new Date(clearDate + 'T12:00:00').getTime();
  const now   = new Date(new Date().toISOString().split('T')[0] + 'T12:00:00').getTime();
  return Math.round((clear - now) / 86400000);
}

export function isActive(r: WithholdingRecord): boolean {
  const meatClear = meatClearDate(r);
  const milkClear = milkClearDate(r);
  const today = new Date().toISOString().split('T')[0];
  if (meatClear >= today) return true;
  if (milkClear && milkClear >= today) return true;
  return false;
}

// Common NZ drench/treatment products with default WHPs
export const COMMON_PRODUCTS = [
  { name: 'Ivermectin (Ivomec)',      meatDays: 28, milkDays: undefined },
  { name: 'Naphthalophos (Rametin)', meatDays: 14, milkDays: undefined },
  { name: 'Abamectin',               meatDays: 28, milkDays: undefined },
  { name: 'Oxytetracycline',         meatDays: 28, milkDays: 7         },
  { name: 'Penicillin',              meatDays: 14, milkDays: 4         },
  { name: 'Dectomax',                meatDays: 35, milkDays: undefined },
  { name: 'Levamisole',              meatDays: 3,  milkDays: undefined },
  { name: 'Albendazole (Valbazen)', meatDays: 14, milkDays: undefined },
  { name: 'Cydectin',                meatDays: 14, milkDays: undefined },
  { name: 'Custom…',                 meatDays: 0,  milkDays: undefined },
];

interface WithholdingCtx {
  records: WithholdingRecord[];
  addRecord: (r: WithholdingRecord) => void;
  addRecords: (rs: WithholdingRecord[]) => void;
  removeRecord: (id: string) => void;
  removeRecordsForAnimal: (animalId: string) => void;
  recordsForAnimal: (animalId: string) => WithholdingRecord[];
  activeRecords: WithholdingRecord[];
}

const Ctx = createContext<WithholdingCtx>(null!);

export function WithholdingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [records, setRecords] = useState<WithholdingRecord[]>([]);

  useEffect(() => {
    if (!user) { setRecords([]); return; }
    apiGet<WithholdingRecord[]>('withholding').then(data => setRecords(data ?? []));
    return apiSubscribe('withholding', (d) => setRecords((d as WithholdingRecord[]) ?? []));
  }, [user?.id]);

  function save(next: WithholdingRecord[]) {
    setRecords(next);
    apiSet('withholding', next);
  }

  function addRecord(r: WithholdingRecord)   { setRecords(prev => { const next = [...prev, r]; apiSet('withholding', next); return next; }); }
  function addRecords(rs: WithholdingRecord[]) { if (!rs.length) return; setRecords(prev => { const next = [...prev, ...rs]; apiSet('withholding', next); return next; }); }
  function removeRecordsForAnimal(animalId: string) { setRecords(prev => { const next = prev.filter(r => r.animalId !== animalId); apiSet('withholding', next); return next; }); }
  function removeRecord(id: string)          { save(records.filter(r => r.id !== id)); }
  function recordsForAnimal(animalId: string) {
    return records
      .filter(r => r.animalId === animalId)
      .sort((a, b) => b.treatmentDate.localeCompare(a.treatmentDate));
  }

  const activeRecords = records.filter(isActive);

  return (
    <Ctx.Provider value={{ records, addRecord, addRecords, removeRecord, removeRecordsForAnimal, recordsForAnimal, activeRecords }}>
      {children}
    </Ctx.Provider>
  );
}

export function useWithholding() { return useContext(Ctx); }

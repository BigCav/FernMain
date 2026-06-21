import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { apiGet, apiSet, apiSubscribe } from '../lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────
export type WaterLogType = 'rainfall' | 'tank';

export interface WaterEntry {
  id:          string;
  date:        string;       // YYYY-MM-DD
  type:        WaterLogType;
  rainfall_mm?: number;      // rainfall reading in mm
  tank_pct?:   number;       // tank level 0–100 %
  tank_id?:    string;       // which tank
  notes?:      string;
}

export interface Tank {
  id:          string;
  name:        string;
  capacity_l:  number;       // litres
  location:    string;
}

// ── Context ───────────────────────────────────────────────────────────────────
interface WaterLogContextValue {
  entries:    WaterEntry[];
  tanks:      Tank[];
  addEntry:   (entry: Omit<WaterEntry, 'id'>) => void;
  removeEntry:(id: string) => void;
  addTank:    (tank: Omit<Tank, 'id'>) => void;
  updateTank: (id: string, updates: Partial<Omit<Tank, 'id'>>) => void;
  removeTank: (id: string) => void;
}

const WaterLogContext = createContext<WaterLogContextValue | null>(null);

export function WaterLogProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const [tanks,   setTanks]   = useState<Tank[]>([]);

  useEffect(() => {
    if (!user) { setEntries([]); setTanks([]); return; }
    apiGet<WaterEntry[]>('waterLog').then(data => setEntries(data ?? []));
    apiGet<Tank[]>('tanks').then(data => setTanks(data ?? []));
    const offE = apiSubscribe('waterLog', (d) => setEntries((d as WaterEntry[]) ?? []));
    const offT = apiSubscribe('tanks', (d) => setTanks((d as Tank[]) ?? []));
    return () => { offE(); offT(); };
  }, [user?.id]);

  function saveEntries(next: WaterEntry[]) { apiSet('waterLog', next); }
  function saveTanks(next: Tank[])         { apiSet('tanks', next); }

  function addEntry(entry: Omit<WaterEntry, 'id'>) {
    setEntries((prev) => {
      const next = [{ ...entry, id: `w-${Date.now()}` }, ...prev]
        .sort((a, b) => b.date.localeCompare(a.date));
      saveEntries(next);
      return next;
    });
  }

  function removeEntry(id: string) {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveEntries(next);
      return next;
    });
  }

  function addTank(tank: Omit<Tank, 'id'>) {
    setTanks(prev => {
      const next = [...prev, { ...tank, id: `tank-${Date.now()}` }];
      saveTanks(next);
      return next;
    });
  }

  function updateTank(id: string, updates: Partial<Omit<Tank, 'id'>>) {
    setTanks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      saveTanks(next);
      return next;
    });
  }

  function removeTank(id: string) {
    setTanks(prev => {
      const next = prev.filter(t => t.id !== id);
      saveTanks(next);
      return next;
    });
  }

  return (
    <WaterLogContext.Provider value={{ entries, tanks, addEntry, removeEntry, addTank, updateTank, removeTank }}>
      {children}
    </WaterLogContext.Provider>
  );
}

export function useWaterLog(): WaterLogContextValue {
  const ctx = useContext(WaterLogContext);
  if (!ctx) throw new Error('useWaterLog must be inside WaterLogProvider');
  return ctx;
}

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { apiGet, apiSet, apiSubscribe } from '../lib/api';

export interface JournalEntry {
  id:    string;
  date:  string;  // YYYY-MM-DD
  title: string;
  body:  string;
}

interface JournalContextValue {
  entries:     JournalEntry[];
  addEntry:    (entry: Omit<JournalEntry, 'id'>) => void;
  deleteEntry: (id: string) => void;
  updateEntry: (id: string, patch: Partial<Omit<JournalEntry, 'id'>>) => void;
}

const JournalContext = createContext<JournalContextValue | null>(null);

export function JournalProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    if (!user) { setEntries([]); return; }
    apiGet<JournalEntry[]>('journal').then(data => setEntries(data ?? []));
    return apiSubscribe('journal', (d) => setEntries((d as JournalEntry[]) ?? []));
  }, [user?.id]);

  function save(next: JournalEntry[]) { apiSet('journal', next); }

  function addEntry(entry: Omit<JournalEntry, 'id'>) {
    setEntries((prev) => {
      const next = [{ ...entry, id: `j-${Date.now()}` }, ...prev]
        .sort((a, b) => b.date.localeCompare(a.date));
      save(next);
      return next;
    });
  }

  function deleteEntry(id: string) {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      save(next);
      return next;
    });
  }

  function updateEntry(id: string, patch: Partial<Omit<JournalEntry, 'id'>>) {
    setEntries((prev) => {
      const next = prev.map((e) => e.id === id ? { ...e, ...patch } : e);
      save(next);
      return next;
    });
  }

  return (
    <JournalContext.Provider value={{ entries, addEntry, deleteEntry, updateEntry }}>
      {children}
    </JournalContext.Provider>
  );
}

export function useJournal(): JournalContextValue {
  const ctx = useContext(JournalContext);
  if (!ctx) throw new Error('useJournal must be inside JournalProvider');
  return ctx;
}

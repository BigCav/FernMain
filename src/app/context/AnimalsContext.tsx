import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Animal, HealthEvent, TransferRecord } from '../data/blockData';
import { useAuth } from './AuthContext';
import { apiGet, apiSet, apiSubscribe } from '../lib/api';

interface AnimalsContextValue {
  animals: Animal[];
  healthEvents: HealthEvent[];
  loading: boolean;
  addAnimal: (a: Animal) => void;
  removeAnimal: (id: string) => void;
  updateAnimal: (id: string, updates: Partial<Animal>) => void;
  updateAnimalStatus: (id: string, status: Animal['status'], notes?: string) => void;
  updateAnimalPaddock: (animalId: string, paddock: string) => void;
  addHealthEvent: (e: HealthEvent) => void;
  addHealthEvents: (events: HealthEvent[]) => void;
  addTransfer: (animalId: string, transfer: TransferRecord) => void;
}

const AnimalsContext = createContext<AnimalsContextValue | null>(null);

export function AnimalsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [animals, setAnimals]           = useState<Animal[]>([]);
  const [healthEvents, setHealthEvents] = useState<HealthEvent[]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    if (!user) { setAnimals([]); setHealthEvents([]); setLoading(false); return; }
    setLoading(true);
    Promise.all([apiGet<Animal[]>('animals'), apiGet<HealthEvent[]>('healthEvents')]).then(([a, h]) => {
      setAnimals(a ?? []);
      setHealthEvents(h ?? []);
      setLoading(false);
    });
    const offA = apiSubscribe('animals', (d) => setAnimals((d as Animal[]) ?? []));
    const offH = apiSubscribe('healthEvents', (d) => setHealthEvents((d as HealthEvent[]) ?? []));
    return () => { offA(); offH(); };
  }, [user?.id]);

  function addAnimal(a: Animal) {
    setAnimals(prev => { const next = [a, ...prev]; apiSet('animals', next); return next; });
  }

  function removeAnimal(id: string) {
    setAnimals(prev => { const next = prev.filter(a => a.id !== id); apiSet('animals', next); return next; });
  }

  function updateAnimal(id: string, updates: Partial<Animal>) {
    setAnimals(prev => {
      const next = prev.map(a => a.id === id ? { ...a, ...updates } : a);
      apiSet('animals', next);
      return next;
    });
  }

  function updateAnimalStatus(id: string, status: Animal['status'], notes?: string) {
    setAnimals(prev => {
      const next = prev.map(a => a.id === id ? { ...a, status, ...(notes !== undefined ? { notes } : {}) } : a);
      apiSet('animals', next);
      return next;
    });
  }

  function updateAnimalPaddock(animalId: string, paddock: string) {
    setAnimals(prev => {
      const next = prev.map(a => a.id === animalId ? { ...a, paddock } : a);
      apiSet('animals', next);
      return next;
    });
  }

  function addHealthEvent(e: HealthEvent) {
    setHealthEvents(prev => { const next = [e, ...prev]; apiSet('healthEvents', next); return next; });
  }

  function addHealthEvents(events: HealthEvent[]) {
    if (!events.length) return;
    setHealthEvents(prev => { const next = [...events, ...prev]; apiSet('healthEvents', next); return next; });
  }

  function removeHealthEventsForAnimal(animalId: string) {
    setHealthEvents(prev => { const next = prev.filter(e => e.animalId !== animalId); apiSet('healthEvents', next); return next; });
  }

  function addTransfer(animalId: string, transfer: TransferRecord) {
    setAnimals(prev => {
      const next = prev.map(a => a.id === animalId ? { ...a, transfers: [...(a.transfers ?? []), transfer] } : a);
      apiSet('animals', next);
      return next;
    });
  }

  return (
    <AnimalsContext.Provider value={{ animals, healthEvents, loading, addAnimal, removeAnimal, updateAnimal, updateAnimalStatus, updateAnimalPaddock, addHealthEvent, addHealthEvents, removeHealthEventsForAnimal, addTransfer }}>
      {children}
    </AnimalsContext.Provider>
  );
}

export function useAnimals() {
  const ctx = useContext(AnimalsContext);
  if (!ctx) throw new Error('useAnimals must be used inside AnimalsProvider');
  return ctx;
}

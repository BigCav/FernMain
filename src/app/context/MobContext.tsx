import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { apiGet, apiSet, apiSubscribe } from '../lib/api';

export interface Mob {
  id: string;
  name: string;
  color: string;         // hex accent colour
  animalIds: string[];
  notes?: string;
}

interface MobCtx {
  mobs: Mob[];
  addMob: (m: Mob) => void;
  updateMob: (id: string, updates: Partial<Mob>) => void;
  removeMob: (id: string) => void;
  addAnimalToMob: (mobId: string, animalId: string) => void;
  removeAnimalFromMob: (mobId: string, animalId: string) => void;
  mobsForAnimal: (animalId: string) => Mob[];
}

export const MOB_COLORS = [
  '#ea580c', '#16a34a', '#2563eb', '#9333ea',
  '#db2777', '#0891b2', '#d97706', '#64748b',
];

const Ctx = createContext<MobCtx>(null!);

export function MobProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [mobs, setMobs] = useState<Mob[]>([]);

  useEffect(() => {
    if (!user) { setMobs([]); return; }
    apiGet<Mob[]>('mobs').then(data => setMobs(data ?? []));
    return apiSubscribe('mobs', (d) => setMobs((d as Mob[]) ?? []));
  }, [user?.id]);

  function save(next: Mob[]) {
    setMobs(next);
    apiSet('mobs', next);
  }

  function addMob(m: Mob) { save([...mobs, m]); }
  function removeMob(id: string) { save(mobs.filter(m => m.id !== id)); }
  function updateMob(id: string, u: Partial<Mob>) {
    save(mobs.map(m => m.id === id ? { ...m, ...u } : m));
  }
  function addAnimalToMob(mobId: string, animalId: string) {
    save(mobs.map(m =>
      m.id === mobId && !m.animalIds.includes(animalId)
        ? { ...m, animalIds: [...m.animalIds, animalId] }
        : m
    ));
  }
  function removeAnimalFromMob(mobId: string, animalId: string) {
    save(mobs.map(m =>
      m.id === mobId
        ? { ...m, animalIds: m.animalIds.filter(id => id !== animalId) }
        : m
    ));
  }
  function mobsForAnimal(animalId: string) {
    return mobs.filter(m => m.animalIds.includes(animalId));
  }

  return (
    <Ctx.Provider value={{ mobs, addMob, updateMob, removeMob, addAnimalToMob, removeAnimalFromMob, mobsForAnimal }}>
      {children}
    </Ctx.Provider>
  );
}

export function useMobs() { return useContext(Ctx); }

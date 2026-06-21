import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { apiGet, apiSet, apiSubscribe } from '../lib/api';

interface PhotoCtx {
  photos: Record<string, string>;   // animalId → base64 data URL
  setPhoto: (animalId: string, dataUrl: string) => void;
  removePhoto: (animalId: string) => void;
}

const Ctx = createContext<PhotoCtx>(null!);

export function PhotoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) { setPhotos({}); return; }
    apiGet<Record<string, string>>('photos').then(data => setPhotos(data ?? {}));
    return apiSubscribe('photos', (d) => setPhotos((d as Record<string, string>) ?? {}));
  }, [user?.id]);

  function save(next: Record<string, string>) {
    setPhotos(next);
    apiSet('photos', next);
  }

  function setPhoto(animalId: string, dataUrl: string) {
    save({ ...photos, [animalId]: dataUrl });
  }

  function removePhoto(animalId: string) {
    const next = { ...photos };
    delete next[animalId];
    save(next);
  }

  return (
    <Ctx.Provider value={{ photos, setPhoto, removePhoto }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePhotos() { return useContext(Ctx); }

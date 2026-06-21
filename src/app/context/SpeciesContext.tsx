import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SPECIES_CONFIG, BUILTIN_SPECIES_KEYS } from '../data/blockData';
import { useAuth } from './AuthContext';
import { apiGet, apiSet, apiSubscribe } from '../lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface SpeciesEntry {
  key:    string;
  label:  string;
  color:  string;
  bg:     string;
  border: string;
  custom: boolean;
}

interface SpeciesContextValue {
  allSpecies:    SpeciesEntry[];
  addSpecies:    (label: string) => void;
  removeSpecies: (key: string)   => void;
}

// ── Colour palette cycle for custom species ───────────────────────────────────
const PALETTE = [
  { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  { color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' },
  { color: '#65a30d', bg: '#f7fee7', border: '#d9f99d' },
  { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
  { color: '#4338ca', bg: '#eef2ff', border: '#a5b4fc' },
  { color: '#be185d', bg: '#fdf2f8', border: '#f9a8d4' },
  { color: '#b45309', bg: '#fef3c7', border: '#fcd34d' },
];

// ── Slug helper ───────────────────────────────────────────────────────────────
function toKey(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

interface StoredCustom {
  key:    string;
  label:  string;
  color:  string;
  bg:     string;
  border: string;
}

/** Patch SPECIES_CONFIG so all existing SPECIES_CONFIG[x] lookups work app-wide. */
function patchConfig(entry: StoredCustom) {
  SPECIES_CONFIG[entry.key] = {
    label:  entry.label,
    color:  entry.color,
    bg:     entry.bg,
    border: entry.border,
  };
}

// ── Built-in entries ──────────────────────────────────────────────────────────
const BUILTIN_ENTRIES: SpeciesEntry[] = BUILTIN_SPECIES_KEYS.map((key) => ({
  key,
  label:  SPECIES_CONFIG[key].label,
  color:  SPECIES_CONFIG[key].color,
  bg:     SPECIES_CONFIG[key].bg,
  border: SPECIES_CONFIG[key].border,
  custom: false,
}));

// ── Context ───────────────────────────────────────────────────────────────────
const SpeciesContext = createContext<SpeciesContextValue | null>(null);

export function SpeciesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [custom, setCustom] = useState<StoredCustom[]>([]);

  useEffect(() => {
    if (!user) { setCustom([]); return; }
    apiGet<StoredCustom[]>('species').then(data => {
      const list = data ?? [];
      list.forEach(patchConfig);
      setCustom(list);
    });
    return apiSubscribe('species', (d) => {
      const list = (d as StoredCustom[]) ?? [];
      list.forEach(patchConfig);
      setCustom(list);
    });
  }, [user?.id]);

  const allSpecies: SpeciesEntry[] = [
    ...BUILTIN_ENTRIES,
    ...custom.map((c) => ({ ...c, custom: true })),
  ];

  function addSpecies(label: string) {
    const trimmed = label.trim();
    if (!trimmed) return;
    const key = toKey(trimmed);
    if (!key) return;
    if (BUILTIN_SPECIES_KEYS.includes(key as typeof BUILTIN_SPECIES_KEYS[number])) return;
    if (custom.some((c) => c.key === key)) return;

    const palette = PALETTE[(custom.length) % PALETTE.length];
    const entry: StoredCustom = { key, label: trimmed, ...palette };

    patchConfig(entry);
    setCustom((prev) => {
      const next = [...prev, entry];
      apiSet('species', next);
      return next;
    });
  }

  function removeSpecies(key: string) {
    setCustom((prev) => {
      const next = prev.filter((c) => c.key !== key);
      apiSet('species', next);
      delete SPECIES_CONFIG[key];
      return next;
    });
  }

  return (
    <SpeciesContext.Provider value={{ allSpecies, addSpecies, removeSpecies }}>
      {children}
    </SpeciesContext.Provider>
  );
}

export function useSpecies(): SpeciesContextValue {
  const ctx = useContext(SpeciesContext);
  if (!ctx) throw new Error('useSpecies must be inside SpeciesProvider');
  return ctx;
}

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { apiGet, apiSet, apiSubscribe } from '../lib/api';

export type InventoryCategory = 'chemical' | 'vaccine' | 'medical' | 'equipment' | 'feed' | 'other';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  reorderThreshold?: number;
  expiryDate?: string;
  location?: string;
  supplier?: string;
  costPerUnit?: number;
  notes?: string;
  lastUpdated: string;
}

interface InventoryContextValue {
  items: InventoryItem[];
  addItem: (item: InventoryItem) => void;
  updateItem: (id: string, updates: Partial<InventoryItem>) => void;
  adjustQuantity: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
}

const InventoryContext = createContext<InventoryContextValue | null>(null);

const TODAY = new Date().toISOString().split('T')[0];

export function InventoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    if (!user) { setItems([]); return; }
    apiGet<InventoryItem[]>('inventory').then(data => setItems(data ?? []));
    return apiSubscribe('inventory', (d) => setItems((d as InventoryItem[]) ?? []));
  }, [user?.id]);

  function save(next: InventoryItem[]) {
    setItems(next);
    apiSet('inventory', next);
  }

  const addItem = useCallback((item: InventoryItem) => {
    save([item, ...items]);
  }, [items]);

  const updateItem = useCallback((id: string, updates: Partial<InventoryItem>) => {
    save(items.map(i => i.id === id ? { ...i, ...updates, lastUpdated: TODAY } : i));
  }, [items]);

  const adjustQuantity = useCallback((id: string, delta: number) => {
    save(items.map(i => i.id === id
      ? { ...i, quantity: Math.max(0, i.quantity + delta), lastUpdated: TODAY }
      : i
    ));
  }, [items]);

  const removeItem = useCallback((id: string) => {
    save(items.filter(i => i.id !== id));
  }, [items]);

  return (
    <InventoryContext.Provider value={{ items, addItem, updateItem, adjustQuantity, removeItem }}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used inside InventoryProvider');
  return ctx;
}

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FeedItem } from '../data/blockData';
import { useAuth } from './AuthContext';
import { apiGet, apiSet, apiSubscribe } from '../lib/api';

interface FeedContextValue {
  feedItems: FeedItem[];
  addFeedItem: (item: FeedItem) => void;
  updateStock: (id: string, newStockKg: number, maxKg?: number) => void;
  removeFeedItem: (id: string) => void;
}

const FeedContext = createContext<FeedContextValue | null>(null);

export function FeedProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    if (!user) { setFeedItems([]); return; }
    apiGet<FeedItem[]>('feed').then(data => setFeedItems(data ?? []));
    return apiSubscribe('feed', (d) => setFeedItems((d as FeedItem[]) ?? []));
  }, [user?.id]);

  function save(next: FeedItem[]) { apiSet('feed', next); }

  function addFeedItem(item: FeedItem) {
    setFeedItems(prev => { const next = [...prev, item]; save(next); return next; });
  }

  function updateStock(id: string, newStockKg: number, maxKg?: number) {
    setFeedItems(prev => {
      const next = prev.map(f => {
        if (f.id !== id) return f;
        const kg = Math.max(0, newStockKg);
        const updates: Partial<FeedItem> = { stockKg: kg };
        if (maxKg !== undefined && maxKg > 0) updates.initialStockKg = maxKg;
        return { ...f, ...updates };
      });
      save(next);
      return next;
    });
  }

  function removeFeedItem(id: string) {
    setFeedItems(prev => { const next = prev.filter(f => f.id !== id); save(next); return next; });
  }

  return (
    <FeedContext.Provider value={{ feedItems, addFeedItem, updateStock, removeFeedItem }}>
      {children}
    </FeedContext.Provider>
  );
}

export function useFeed() {
  const ctx = useContext(FeedContext);
  if (!ctx) throw new Error('useFeed must be used inside FeedProvider');
  return ctx;
}

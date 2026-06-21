import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { apiGet, apiSet, apiSubscribe } from '../lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────
export type ExpenseCat =
  | 'vet_health'
  | 'feed'
  | 'equipment'
  | 'fencing'
  | 'pasture'
  | 'livestock_purchase'
  | 'transport'
  | 'other_expense';

export type IncomeCat =
  | 'livestock_sale'
  | 'wool'
  | 'produce'
  | 'other_income';

export type TxCat  = ExpenseCat | IncomeCat;
export type TxType = 'income' | 'expense';

export interface FarmTx {
  id:           string;
  date:         string;          // YYYY-MM-DD
  type:         TxType;
  category:     TxCat;
  description:  string;
  amount:       number;          // positive always
  animalId?:    string;
  animalLabel?: string;          // cached "Name · Tag"
  notes?:       string;
}

// ── Category config ───────────────────────────────────────────────────────────
export interface TxCatInfo {
  label:  string;
  color:  string;
  bg:     string;
  border: string;
  icon:   string;   // maps to lucide icon name in the page component
  type:   TxType;
}

export const TX_CAT_CONFIG: Record<TxCat, TxCatInfo> = {
  // Expenses
  vet_health:         { label: 'Vet & Health',        color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: 'heart',     type: 'expense' },
  feed:               { label: 'Feed & Supplements',  color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: 'wheat',     type: 'expense' },
  equipment:          { label: 'Equipment',            color: '#6b7280', bg: '#f5f5f5', border: '#e5e7eb', icon: 'wrench',    type: 'expense' },
  fencing:            { label: 'Fencing',              color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: 'columns',   type: 'expense' },
  pasture:            { label: 'Pasture & Fertiliser', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', icon: 'sprout',    type: 'expense' },
  livestock_purchase: { label: 'Livestock Purchase',   color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', icon: 'arrow_down',type: 'expense' },
  transport:          { label: 'Transport',            color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc', icon: 'truck',     type: 'expense' },
  other_expense:      { label: 'Other',                color: '#9ca3af', bg: '#f9f9f9', border: '#e5e7eb', icon: 'circle',    type: 'expense' },
  // Income
  livestock_sale:     { label: 'Livestock Sale',       color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: 'trending',  type: 'income'  },
  wool:               { label: 'Wool & Fibre',         color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', icon: 'scissors',  type: 'income'  },
  produce:            { label: 'Produce & Eggs',       color: '#ca8a04', bg: '#fefce8', border: '#fef08a', icon: 'package',   type: 'income'  },
  other_income:       { label: 'Other Income',         color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: 'circle',    type: 'income'  },
};

export const EXPENSE_CATS: ExpenseCat[] = [
  'vet_health', 'feed', 'equipment', 'fencing', 'pasture',
  'livestock_purchase', 'transport', 'other_expense',
];
export const INCOME_CATS: IncomeCat[] = [
  'livestock_sale', 'wool', 'produce', 'other_income',
];

// ── Context ───────────────────────────────────────────────────────────────────
interface FinanceContextValue {
  transactions: FarmTx[];
  addTx:    (tx: Omit<FarmTx, 'id'>) => void;
  removeTx: (id: string) => void;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<FarmTx[]>([]);

  useEffect(() => {
    if (!user) { setTransactions([]); return; }
    apiGet<FarmTx[]>('finance').then(data => setTransactions(data ?? []));
    return apiSubscribe('finance', (d) => setTransactions((d as FarmTx[]) ?? []));
  }, [user?.id]);

  function save(txs: FarmTx[]) { apiSet('finance', txs); }

  function addTx(tx: Omit<FarmTx, 'id'>) {
    setTransactions((prev) => {
      const next = [{ ...tx, id: `tx-${Date.now()}` }, ...prev]
        .sort((a, b) => b.date.localeCompare(a.date));
      save(next);
      return next;
    });
  }

  function removeTx(id: string) {
    setTransactions((prev) => {
      const next = prev.filter((t) => t.id !== id);
      save(next);
      return next;
    });
  }

  return (
    <FinanceContext.Provider value={{ transactions, addTx, removeTx }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be inside FinanceProvider');
  return ctx;
}

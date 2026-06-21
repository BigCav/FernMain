export type CategoryKey =
  | 'housing'
  | 'food'
  | 'transport'
  | 'entertainment'
  | 'shopping'
  | 'health'
  | 'utilities'
  | 'income'
  | 'savings';

export interface CategoryInfo {
  label: string;
  color: string;
  bg: string;
}

export const CATEGORIES: Record<CategoryKey, CategoryInfo> = {
  housing:       { label: 'Housing',        color: '#6366f1', bg: '#eef2ff' },
  food:          { label: 'Food & Dining',  color: '#f59e0b', bg: '#fffbeb' },
  transport:     { label: 'Transport',      color: '#3b82f6', bg: '#eff6ff' },
  entertainment: { label: 'Entertainment',  color: '#ec4899', bg: '#fdf2f8' },
  shopping:      { label: 'Shopping',       color: '#8b5cf6', bg: '#f5f3ff' },
  health:        { label: 'Health',         color: '#10b981', bg: '#ecfdf5' },
  utilities:     { label: 'Utilities',      color: '#f97316', bg: '#fff7ed' },
  income:        { label: 'Income',         color: '#22c55e', bg: '#f0fdf4' },
  savings:       { label: 'Savings',        color: '#06b6d4', bg: '#ecfeff' },
};

export interface Transaction {
  id: string;
  title: string;
  subtitle: string;
  category: CategoryKey;
  amount: number;
  type: 'income' | 'expense';
  date: string;
}

export const TRANSACTIONS: Transaction[] = [
  // May 8
  { id: 't1',  title: 'Whole Foods Market',  subtitle: 'Groceries',              category: 'food',          amount: 84.20,   type: 'expense', date: '2026-05-08' },
  { id: 't2',  title: 'Blue Bottle Coffee',  subtitle: 'Morning coffee',          category: 'food',          amount: 6.50,    type: 'expense', date: '2026-05-08' },
  // May 7
  { id: 't3',  title: 'Monthly Salary',      subtitle: 'Acme Corp, Deposit',     category: 'income',        amount: 2600.00, type: 'income',  date: '2026-05-07' },
  { id: 't4',  title: 'Rideshare',           subtitle: 'Trip to downtown',        category: 'transport',     amount: 14.80,   type: 'expense', date: '2026-05-07' },
  // May 6
  { id: 't5',  title: 'Netflix',             subtitle: 'Streaming subscription',  category: 'entertainment', amount: 15.99,   type: 'expense', date: '2026-05-06' },
  { id: 't6',  title: 'Gym Membership',      subtitle: 'Monthly fee',             category: 'health',        amount: 49.00,   type: 'expense', date: '2026-05-06' },
  // May 5
  { id: 't7',  title: 'Amazon',              subtitle: 'Online shopping',         category: 'shopping',      amount: 67.43,   type: 'expense', date: '2026-05-05' },
  { id: 't8',  title: 'Electric Bill',       subtitle: 'PG&E',                   category: 'utilities',     amount: 89.20,   type: 'expense', date: '2026-05-05' },
  // May 4
  { id: 't9',  title: 'Spotify',             subtitle: 'Music subscription',      category: 'entertainment', amount: 9.99,    type: 'expense', date: '2026-05-04' },
  { id: 't10', title: 'Shell Gas Station',   subtitle: 'Fuel',                   category: 'transport',     amount: 52.40,   type: 'expense', date: '2026-05-04' },
  // May 3
  { id: 't11', title: 'Chipotle',            subtitle: 'Lunch',                  category: 'food',          amount: 12.80,   type: 'expense', date: '2026-05-03' },
  { id: 't12', title: 'CVS Pharmacy',        subtitle: 'Health & personal care',  category: 'health',        amount: 23.50,   type: 'expense', date: '2026-05-03' },
  // May 2
  { id: 't13', title: 'Transit Pass',        subtitle: 'Monthly pass',           category: 'transport',     amount: 120.00,  type: 'expense', date: '2026-05-02' },
  { id: 't14', title: 'Freelance Payment',   subtitle: 'Design project',         category: 'income',        amount: 800.00,  type: 'income',  date: '2026-05-02' },
  // May 1
  { id: 't15', title: 'Rent',               subtitle: 'Monthly rent',           category: 'housing',       amount: 1500.00, type: 'expense', date: '2026-05-01' },
  { id: 't16', title: 'Internet Bill',       subtitle: 'Comcast',                category: 'utilities',     amount: 79.99,   type: 'expense', date: '2026-05-01' },
  { id: 't17', title: 'H&M',                subtitle: 'Clothing',               category: 'shopping',      amount: 134.99,  type: 'expense', date: '2026-05-01' },
  // Apr 30
  { id: 't18', title: 'Zuni Cafe',           subtitle: 'Dinner',                 category: 'food',          amount: 78.60,   type: 'expense', date: '2026-04-30' },
  { id: 't19', title: 'Apple Music',         subtitle: 'Music subscription',     category: 'entertainment', amount: 10.99,   type: 'expense', date: '2026-04-30' },
  // Apr 29
  { id: 't20', title: 'Side Project',        subtitle: 'Freelance income',       category: 'income',        amount: 450.00,  type: 'income',  date: '2026-04-29' },
  { id: 't21', title: "Trader Joe's",        subtitle: 'Groceries',              category: 'food',          amount: 56.20,   type: 'expense', date: '2026-04-29' },
  // Apr 28
  { id: 't22', title: 'Walgreens',           subtitle: 'Pharmacy',               category: 'health',        amount: 18.75,   type: 'expense', date: '2026-04-28' },
  { id: 't23', title: 'BART',               subtitle: 'Transit',                category: 'transport',     amount: 9.40,    type: 'expense', date: '2026-04-28' },
  // Apr 27
  { id: 't24', title: 'Target',              subtitle: 'Household goods',        category: 'shopping',      amount: 91.30,   type: 'expense', date: '2026-04-27' },
  { id: 't25', title: 'PG&E',               subtitle: 'Gas bill',               category: 'utilities',     amount: 54.20,   type: 'expense', date: '2026-04-27' },
];

export interface BudgetItem {
  category: CategoryKey;
  limit: number;
  spent: number;
}

export const BUDGETS: BudgetItem[] = [
  { category: 'housing',       limit: 1600, spent: 1500 },
  { category: 'food',          limit: 600,  spent: 182  },
  { category: 'transport',     limit: 300,  spent: 187  },
  { category: 'entertainment', limit: 200,  spent: 36   },
  { category: 'shopping',      limit: 400,  spent: 202  },
  { category: 'health',        limit: 150,  spent: 73   },
  { category: 'utilities',     limit: 250,  spent: 169  },
];

export const MONTHLY_DATA = [
  { month: 'Jan', income: 5200, expenses: 3920 },
  { month: 'Feb', income: 5200, expenses: 3540 },
  { month: 'Mar', income: 5750, expenses: 4120 },
  { month: 'Apr', income: 5650, expenses: 3680 },
  { month: 'May', income: 3400, expenses: 2261 },
];

export const WEEKLY_DATA = [
  { day: 'Mon', amount: 62  },
  { day: 'Tue', amount: 157 },
  { day: 'Wed', amount: 65  },
  { day: 'Thu', amount: 15  },
  { day: 'Fri', amount: 91  },
  { day: 'Sat', amount: 0   },
  { day: 'Sun', amount: 0   },
];

export function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtCompact(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toFixed(0);
}

export function groupByDate(txs: Transaction[]) {
  const map = new Map<string, Transaction[]>();
  for (const tx of txs) {
    const list = map.get(tx.date) ?? [];
    list.push(tx);
    map.set(tx.date, list);
  }
  return map;
}

export function labelDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date('2026-05-08T00:00:00');
  const yesterday = new Date('2026-05-07T00:00:00');
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function getMayStats() {
  const may = TRANSACTIONS.filter((t) => t.date.startsWith('2026-05'));
  const income = may.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = may.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  return { income, expenses, net: income - expenses };
}

export function getCategoryTotals(): { key: CategoryKey; amount: number; color: string; label: string }[] {
  const may = TRANSACTIONS.filter((t) => t.date.startsWith('2026-05') && t.type === 'expense');
  const map: Partial<Record<CategoryKey, number>> = {};
  for (const t of may) map[t.category] = (map[t.category] ?? 0) + t.amount;
  return (Object.entries(map) as [CategoryKey, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([key, amount]) => ({ key, amount, color: CATEGORIES[key].color, label: CATEGORIES[key].label }));
}

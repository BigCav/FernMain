import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import {
  TRANSACTIONS, CATEGORIES, groupByDate, labelDate, fmt,
} from '../data/mockData';
import { CategoryIcon } from '../components/CategoryIcon';

type Filter = 'all' | 'income' | 'expense';

export function Transactions() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    return TRANSACTIONS.filter((tx) => {
      const matchesType = filter === 'all' || tx.type === filter;
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        tx.title.toLowerCase().includes(q) ||
        tx.subtitle.toLowerCase().includes(q) ||
        CATEGORIES[tx.category].label.toLowerCase().includes(q);
      return matchesType && matchesQuery;
    });
  }, [query, filter]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  const sortedDates = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a));

  const totalIncome = TRANSACTIONS.filter((t) => t.type === 'income' && t.date.startsWith('2026-05'))
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenses = TRANSACTIONS.filter((t) => t.type === 'expense' && t.date.startsWith('2026-05'))
    .reduce((s, t) => s + t.amount, 0);

  const TABS: { key: Filter; label: string }[] = [
    { key: 'all',     label: 'All'      },
    { key: 'income',  label: 'Income'   },
    { key: 'expense', label: 'Expenses' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 md:px-8 md:pt-8">

      {/* ─── Header ─── */}
      <div className="mb-5">
        <p style={{ fontSize: '13px', color: '#9ca3af' }}>May 2026</p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111', letterSpacing: '-0.03em', lineHeight: 1.2, marginTop: '2px' }}>
          Transactions
        </h1>
      </div>

      {/* ─── Stats row ─── */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
            Income
          </p>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#16a34a', fontVariantNumeric: 'tabular-nums' }}>
            +${fmt(totalIncome)}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
            Expenses
          </p>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#dc2626', fontVariantNumeric: 'tabular-nums' }}>
            -${fmt(totalExpenses)}
          </p>
        </div>
      </div>

      {/* ─── Search ─── */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-100 rounded-2xl mb-3">
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search transactions..."
          className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-400"
          style={{ fontSize: '14px' }}
        />
        {query && (
          <button onClick={() => setQuery('')} className="text-gray-300 hover:text-gray-500 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* ─── Filter tabs ─── */}
      <div className="flex gap-2 mb-5">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className="px-4 py-2 rounded-xl transition-all duration-150"
            style={{
              fontSize: '13px',
              fontWeight: filter === key ? 600 : 400,
              background: filter === key ? '#111' : '#fff',
              color: filter === key ? '#fff' : '#6b7280',
              border: filter === key ? '1px solid #111' : '1px solid #f0f0f0',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ─── Transaction list ─── */}
      {sortedDates.length === 0 ? (
        <div className="py-16 text-center">
          <p style={{ fontSize: '15px', color: '#9ca3af' }}>No transactions found</p>
        </div>
      ) : (
        <div className="space-y-5 pb-6">
          {sortedDates.map((date) => {
            const txs = grouped.get(date)!;
            const dayTotal = txs.reduce(
              (s, t) => s + (t.type === 'income' ? t.amount : -t.amount),
              0
            );
            return (
              <div key={date}>
                {/* Date header */}
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {labelDate(date)}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      color: dayTotal >= 0 ? '#16a34a' : '#9ca3af',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {dayTotal >= 0 ? '+' : '-'}${Math.abs(dayTotal).toFixed(2)}
                  </span>
                </div>

                {/* Transaction cards */}
                <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
                  {txs.map((tx) => {
                    const cat = CATEGORIES[tx.category];
                    return (
                      <div key={tx.id} className="flex items-center gap-3 px-4 py-3.5">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: cat.bg }}
                        >
                          <CategoryIcon category={tx.category} color={cat.color} size={17} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p style={{ fontSize: '14px', fontWeight: 500, color: '#111' }} className="truncate">
                            {tx.title}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <span
                              className="inline-block px-1.5 py-0.5 rounded-md"
                              style={{ fontSize: '10px', fontWeight: 500, background: cat.bg, color: cat.color }}
                            >
                              {cat.label}
                            </span>
                            <span style={{ fontSize: '11px', color: '#d1d5db' }}>·</span>
                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>{tx.subtitle}</span>
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: tx.type === 'income' ? '#16a34a' : '#111',
                            fontVariantNumeric: 'tabular-nums',
                            flexShrink: 0,
                          }}
                        >
                          {tx.type === 'income' ? '+' : '-'}${fmt(tx.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useState, useMemo } from 'react';
import { PlusGate } from '../components/PlusGate';
import { AnimatedSection } from '../components/AnimatedSection';
import { DropdownSelect } from '../components/DropdownSelect';
import { DatePickerInput } from '../components/DatePickerInput';
import {
  Plus, X, Search, TrendingUp, TrendingDown,
  Heart, Wheat, Wrench, Sprout, Truck, Scissors, Package,
  ArrowDown, Columns2,
} from 'lucide-react';
import { useFinance, TX_CAT_CONFIG, EXPENSE_CATS, INCOME_CATS, TxCat, TxType, FarmTx } from '../context/FinanceContext';
import { useAnimals } from '../context/AnimalsContext';
import { SPECIES_CONFIG } from '../data/blockData';
import { PageHeader } from '../components/PageHeader';

// ── Helpers ───────────────────────────────────────────────────────────────────
const NZD = (n: number) =>
  n.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-NZ', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

function monthLabel(ym: string) {
  const [y, m] = ym.split('-');
  return new Date(+y, +m - 1, 1).toLocaleDateString('en-NZ', { month: 'short', year: '2-digit' });
}

type Period = 'month' | '3months' | 'fyear' | 'all';
type TxFilter = 'all' | 'income' | 'expense';

const PERIOD_LABELS: { key: Period; label: string }[] = [
  { key: 'month',   label: 'This Month'   },
  { key: '3months', label: '3 Months'     },
  { key: 'fyear',   label: 'Financial Year' },
  { key: 'all',     label: 'All Time'     },
];

function inPeriod(date: string, period: Period): boolean {
  if (period === 'all') return true;
  if (period === 'month')   return date >= '2026-05-01' && date <= '2026-05-31';
  if (period === '3months') return date >= '2026-03-01' && date <= '2026-05-31';
  if (period === 'fyear')   return date >= '2026-04-01'; // NZ FY April 2026 onwards
  return true;
}

// ── Icon router ───────────────────────────────────────────────────────────────
function TxIcon({ icon, color, size = 15 }: { icon: string; color: string; size?: number }) {
  const p = { width: size, height: size, style: { color } };
  switch (icon) {
    case 'heart':      return <Heart      {...p} />;
    case 'wheat':      return <Wheat      {...p} />;
    case 'wrench':     return <Wrench     {...p} />;
    case 'columns':    return <Columns2   {...p} />;
    case 'sprout':     return <Sprout     {...p} />;
    case 'arrow_down': return <ArrowDown  {...p} />;
    case 'truck':      return <Truck      {...p} />;
    case 'trending':   return <TrendingUp {...p} />;
    case 'scissors':   return <Scissors   {...p} />;
    case 'package':    return <Package    {...p} />;
    default:           return <TrendingDown {...p} />;
  }
}

// ── Monthly bar chart ─────────────────────────────────────────────────────────
function MonthChart({ transactions }: { transactions: FarmTx[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const now = new Date();
  const months = Array.from({ length: 4 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (3 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const data = months.map((m) => ({
    label:   monthLabel(m),
    income:  transactions.filter((t) => t.type === 'income'  && t.date.startsWith(m)).reduce((s, t) => s + t.amount, 0),
    expense: transactions.filter((t) => t.type === 'expense' && t.date.startsWith(m)).reduce((s, t) => s + t.amount, 0),
  }));
  const maxVal = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);

  return (
    <div>
      <div className="flex items-end gap-2" style={{ height: '80px' }}>
        {data.map((d, i) => {
          const net = d.income - d.expense;
          const isHovered = hoveredIdx === i;
          return (
            <div
              key={d.label}
              className="flex-1 flex items-end gap-0.5 h-full relative cursor-default"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Hover tooltip */}
              {isHovered && (
                <div
                  className="absolute z-10 rounded-xl pointer-events-none"
                  style={{
                    bottom: 'calc(100% + 8px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#111',
                    color: '#fff',
                    padding: '8px 12px',
                    minWidth: '130px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                  }}
                >
                  <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d.label}</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-4">
                      <span style={{ fontSize: '11px', color: '#86efac' }}>Income</span>
                      <span style={{ fontSize: '11px', fontWeight: 600 }}>+${NZD(d.income)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span style={{ fontSize: '11px', color: '#fca5a5' }}>Expenses</span>
                      <span style={{ fontSize: '11px', fontWeight: 600 }}>−${NZD(d.expense)}</span>
                    </div>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '4px', paddingTop: '4px' }} className="flex items-center justify-between gap-4">
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Net</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: net >= 0 ? '#86efac' : '#fca5a5' }}>
                        {net >= 0 ? '+' : '−'}${NZD(Math.abs(net))}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {/* Income bar */}
              <div
                className="flex-1 rounded-t-md transition-all"
                style={{
                  background: isHovered ? '#4ade80' : '#bbf7d0',
                  height: `${Math.max((d.income / maxVal) * 100, d.income > 0 ? 4 : 0)}%`,
                  minHeight: d.income > 0 ? '4px' : '0',
                  transition: 'background 0.15s',
                }}
              />
              {/* Expense bar */}
              <div
                className="flex-1 rounded-t-md transition-all"
                style={{
                  background: isHovered ? '#f87171' : '#fecaca',
                  height: `${Math.max((d.expense / maxVal) * 100, d.expense > 0 ? 4 : 0)}%`,
                  minHeight: d.expense > 0 ? '4px' : '0',
                  transition: 'background 0.15s',
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 mt-1.5">
        {data.map((d) => (
          <div key={d.label} className="flex-1 text-center">
            <span style={{ fontSize: '10px', color: '#9ca3af' }}>{d.label}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-2">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#bbf7d0', border: '1px solid #86efac' }} />
          <span style={{ fontSize: '10px', color: '#9ca3af' }}>Income</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#fecaca', border: '1px solid #fca5a5' }} />
          <span style={{ fontSize: '10px', color: '#9ca3af' }}>Expenses</span>
        </div>
      </div>
    </div>
  );
}

// ── Add form ──────────────────────────────────────────────────────────────────
const INPUT = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none bg-white text-gray-900 transition-colors focus:border-orange-400 text-[13px]';

// ── Main page ─────────────────────────────────────────────────────────────────
export function Finance() {
  const { transactions, addTx, removeTx } = useFinance();
  const { animals } = useAnimals();

  // Filters
  const [period,     setPeriod]     = useState<Period>('3months');
  const [txFilter,   setTxFilter]   = useState<TxFilter>('all');
  const [search,     setSearch]     = useState('');
  const [showForm,   setShowForm]   = useState(false);
  const [deleteId,   setDeleteId]   = useState<string | null>(null);

  // Form state
  const [fType,     setFType]     = useState<TxType>('expense');
  const [fCat,      setFCat]      = useState<TxCat>('vet_health');
  const [fDesc,     setFDesc]     = useState('');
  const [fAmount,   setFAmount]   = useState('');
  const [fDate,     setFDate]     = useState('2026-05-11');
  const [fAnimal,   setFAnimal]   = useState('');
  const [fNotes,    setFNotes]    = useState('');

  const catOptions = fType === 'expense' ? EXPENSE_CATS : INCOME_CATS;

  function resetForm() {
    setFType('expense'); setFCat('vet_health'); setFDesc('');
    setFAmount(''); setFDate('2026-05-11'); setFAnimal(''); setFNotes('');
  }

  function handleTypeToggle(t: TxType) {
    setFType(t);
    setFCat(t === 'expense' ? 'vet_health' : 'livestock_sale');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fDesc.trim() || !fAmount) return;
    const animal = animals.find((a) => a.id === fAnimal);
    addTx({
      date:        fDate,
      type:        fType,
      category:    fCat,
      description: fDesc.trim(),
      amount:      parseFloat(fAmount),
      animalId:    animal?.id,
      animalLabel: animal ? `${animal.name} ${animal.tag}` : undefined,
      notes:       fNotes.trim() || undefined,
    });
    resetForm();
    setShowForm(false);
  }

  // Derived
  const periodFiltered = useMemo(
    () => transactions.filter((t) => inPeriod(t.date, period)),
    [transactions, period],
  );

  const displayed = useMemo(() => {
    const q = search.toLowerCase();
    return periodFiltered.filter((t) => {
      if (txFilter !== 'all' && t.type !== txFilter) return false;
      if (!q) return true;
      return (
        t.description.toLowerCase().includes(q) ||
        TX_CAT_CONFIG[t.category].label.toLowerCase().includes(q) ||
        (t.animalLabel ?? '').toLowerCase().includes(q)
      );
    });
  }, [periodFiltered, txFilter, search]);

  const stats = useMemo(() => {
    const income  = periodFiltered.filter((t) => t.type === 'income') .reduce((s, t) => s + t.amount, 0);
    const expense = periodFiltered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, net: income - expense };
  }, [periodFiltered]);

  // Category breakdown (expenses only for the period)
  const catBreakdown = useMemo(() => {
    const map: Partial<Record<TxCat, number>> = {};
    periodFiltered.filter((t) => t.type === 'expense').forEach((t) => {
      map[t.category] = (map[t.category] ?? 0) + t.amount;
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, amount]) => ({ cat: cat as TxCat, amount }));
  }, [periodFiltered]);

  // Group displayed by date (descending)
  const grouped = useMemo(() => {
    const map = new Map<string, FarmTx[]>();
    displayed.forEach((t) => {
      if (!map.has(t.date)) map.set(t.date, []);
      map.get(t.date)!.push(t);
    });
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [displayed]);

  return (
    <PlusGate
      feature="Finance"
      tagline="Track your farm's income, expenses, and monthly P&L — without a spreadsheet."
      perks={[
        'Log income and expenses by category',
        'Monthly P&L summary at a glance',
        'Filter by livestock, feed, equipment and more',
        'Day-by-day transaction timeline',
      ]}
      icon={<svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
    >
    <div className="pb-8">

      <PageHeader
        title="Finance"
        action={
          <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-shrink-0 transition-all active:scale-[0.97]" style={{ background: showForm ? '#f5f5f4' : '#ea580c', color: showForm ? '#6b7280' : '#fff', fontSize: '13px', fontWeight: 600 }}>
            {showForm ? <X width={14} height={14} /> : <Plus width={14} height={14} />}
            {showForm ? 'Cancel' : 'Add Entry'}
          </button>
        }
        chips={[{ label: 'Income, expenses & P&L', variant: 'neutral' }]}
      />

      <div className="max-w-5xl mx-auto px-4 md:px-8">

      {/* ── Period selector ── */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {PERIOD_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className="px-3 py-1.5 rounded-xl transition-all"
            style={{
              fontSize: '12px',
              fontWeight: period === key ? 700 : 400,
              background: period === key ? '#111' : '#fff',
              color:      period === key ? '#fff' : '#6b7280',
              border:     `1px solid ${period === key ? '#111' : '#e5e7eb'}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Add form ── */}
      <AnimatedSection open={showForm}>
        <div className="rounded-2xl overflow-hidden mb-5" style={{ border: '1px solid #ebebeb' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ background: '#f9f8f6', borderBottom: '1px solid #ebebeb' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>New Entry</p>
            <button onClick={() => { resetForm(); setShowForm(false); }}>
              <X width={14} height={14} style={{ color: '#9ca3af' }} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4" style={{ background: '#fefefe' }}>

            {/* Income / Expense toggle */}
            <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #e5e7eb' }}>
              {(['expense', 'income'] as TxType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeToggle(t)}
                  className="flex-1 py-2.5 transition-all"
                  style={{
                    fontSize: '12px',
                    fontWeight: fType === t ? 700 : 400,
                    background: fType === t ? (t === 'income' ? '#f0fdf4' : '#fef2f2') : '#fff',
                    color:      fType === t ? (t === 'income' ? '#22c55e' : '#f87171') : '#6b7280',
                    border:     'none',
                  }}
                >
                  {t === 'income' ? 'Income' : 'Expense'}
                </button>
              ))}
            </div>

            {/* Category */}
            <div>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>Category</p>
              <div className="flex flex-wrap gap-1.5">
                {catOptions.map((cat) => {
                  const cfg    = TX_CAT_CONFIG[cat];
                  const active = fCat === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFCat(cat)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all"
                      style={{
                        fontSize: '11px',
                        fontWeight: active ? 700 : 400,
                        background: active ? cfg.bg : '#f9f9f8',
                        color:      active ? cfg.color : '#6b7280',
                        border:     `1px solid ${active ? cfg.border : '#e5e7eb'}`,
                      }}
                    >
                      <TxIcon icon={cfg.icon} color={active ? cfg.color : '#9ca3af'} size={11} />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description + Amount */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Description *</p>
                <input
                  className={INPUT}
                  placeholder="e.g. Sheep nuts 25kg"
                  value={fDesc}
                  onChange={(e) => setFDesc(e.target.value)}
                  required
                />
              </div>
              <div>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Amount ($) *</p>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={INPUT}
                  placeholder="0.00"
                  value={fAmount}
                  onChange={(e) => setFAmount(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Date + Animal */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Date *</p>
                <DatePickerInput value={fDate} onChange={v => setFDate(v)} placeholder="Date" />
              </div>
              <div>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Linked animal</p>
                <DropdownSelect
                  value={fAnimal}
                  onChange={setFAnimal}
                  placeholder="None"
                  options={[
                    { label: 'None', value: '' },
                    ...animals.map((a) => {
                      const scfg = SPECIES_CONFIG[a.species];
                      return { label: `${a.name} ${a.tag} (${scfg?.label ?? a.species})`, value: a.id };
                    }),
                  ]}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Notes</p>
              <input
                className={INPUT}
                placeholder="Optional notes"
                value={fNotes}
                onChange={(e) => setFNotes(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!fDesc.trim() || !fAmount}
                className="flex-1 py-2.5 rounded-xl transition-all disabled:opacity-40"
                style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 600 }}
              >
                Save Entry
              </button>
              <button
                type="button"
                onClick={() => { resetForm(); setShowForm(false); }}
                className="px-4 py-2.5 rounded-xl"
                style={{ background: '#f5f5f4', color: '#6b7280', fontSize: '13px', border: '1px solid #e5e7eb' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </AnimatedSection>

      {/* ── Summary cards + chart ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* Income */}
        <div className="rounded-2xl p-4 transition-all hover:shadow-sm hover:-translate-y-px" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
          <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>Income</p>
          <p style={{ fontSize: '22px', fontWeight: 800, color: '#22c55e', letterSpacing: '-0.03em' }}>
            +${NZD(stats.income)}
          </p>
        </div>
        {/* Expenses */}
        <div className="rounded-2xl p-4 transition-all hover:shadow-sm hover:-translate-y-px" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
          <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>Expenses</p>
          <p style={{ fontSize: '22px', fontWeight: 800, color: '#f87171', letterSpacing: '-0.03em' }}>
            −${NZD(stats.expense)}
          </p>
        </div>
        {/* Net */}
        <div className="rounded-2xl p-4 transition-all hover:shadow-sm hover:-translate-y-px" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
          <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>Net P&L</p>
          <p style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.03em', color: stats.net >= 0 ? '#22c55e' : '#f87171' }}>
            {stats.net >= 0 ? '+' : '−'}${NZD(Math.abs(stats.net))}
          </p>
        </div>
      </div>

      {/* ── Chart + Category breakdown ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        {/* Monthly chart */}
        <div className="rounded-2xl p-5" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#111', marginBottom: '12px' }}>Monthly overview</p>
          <MonthChart transactions={transactions} />
        </div>
        {/* Expense breakdown */}
        <div className="rounded-2xl p-5" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#111', marginBottom: '12px' }}>Expense breakdown</p>
          {catBreakdown.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#9ca3af' }}>No expenses in this period.</p>
          ) : (
            <div className="space-y-2">
              {catBreakdown.slice(0, 6).map(({ cat, amount }) => {
                const cfg = TX_CAT_CONFIG[cat];
                const pct = Math.round((amount / stats.expense) * 100);
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <TxIcon icon={cfg.icon} color={cfg.color} size={12} />
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#374151' }}>{cfg.label}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
                        ${NZD(amount)}
                        <span style={{ color: '#9ca3af', marginLeft: '4px' }}>({pct}%)</span>
                      </span>
                    </div>
                    <div className="rounded-full overflow-hidden" style={{ height: '4px', background: '#f5f5f5' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cfg.color, opacity: 0.6 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Search + filter ── */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search width={13} height={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
          <input
            className="w-full pl-9 pr-4 py-2.5 rounded-xl outline-none transition-colors"
            style={{ background: '#fefefe', border: '1px solid #ebebeb', fontSize: '13px', color: '#111' }}
            placeholder="Search entries…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {/* Type filter */}
        <div className="flex rounded-xl overflow-hidden flex-shrink-0" style={{ border: '1px solid #e5e7eb', background: '#fefefe' }}>
          {(['all', 'income', 'expense'] as TxFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setTxFilter(f)}
              className="px-3 py-2.5 transition-all"
              style={{
                fontSize: '12px',
                fontWeight: txFilter === f ? 700 : 400,
                background: txFilter === f ? '#111' : 'transparent',
                color:      txFilter === f ? '#fff' : '#6b7280',
                borderLeft: f !== 'all' ? '1px solid #e5e7eb' : 'none',
              }}
            >
              {f === 'all' ? 'All' : f === 'income' ? 'Income' : 'Expenses'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Transaction list ── */}
      {grouped.length === 0 ? (
        <div className="py-16 text-center">
          <p style={{ fontSize: '13px', color: '#9ca3af' }}>No entries found for this period.</p>
        </div>
      ) : (
        <div className="space-y-5 pb-8">
          {grouped.map(([date, txs]) => {
            const dayNet = txs.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
            return (
              <div key={date}>
                {/* Date header */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    {fmtDate(date)}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: dayNet >= 0 ? '#22c55e' : '#9ca3af', fontVariantNumeric: 'tabular-nums' }}>
                    {dayNet >= 0 ? '+' : '−'}${NZD(Math.abs(dayNet))}
                  </span>
                </div>

                {/* Cards */}
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #ebebeb' }}>
                  {txs.map((tx, i) => {
                    const cfg = TX_CAT_CONFIG[tx.category];
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center gap-3 px-4 py-3.5 group"
                        style={{
                          background: '#fefefe',
                          borderBottom: i < txs.length - 1 ? '1px solid #f5f5f5' : 'none',
                        }}
                      >
                        {/* Icon */}
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                        >
                          <TxIcon icon={cfg.icon} color={cfg.color} size={15} />
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p style={{ fontSize: '13px', fontWeight: 500, color: '#111' }} className="truncate">
                            {tx.description}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className="inline-block px-1.5 py-0.5 rounded-md"
                              style={{ fontSize: '10px', fontWeight: 600, background: cfg.bg, color: cfg.color }}
                            >
                              {cfg.label}
                            </span>
                            {tx.animalLabel && (
                              <>
                                <span style={{ fontSize: '10px', color: '#d1d5db' }}>·</span>
                                <span style={{ fontSize: '11px', color: '#9ca3af' }}>{tx.animalLabel}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            style={{
                              fontSize: '14px',
                              fontWeight: 700,
                              color: tx.type === 'income' ? '#22c55e' : '#111',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {tx.type === 'income' ? '+' : '−'}${NZD(tx.amount)}
                          </span>
                          {/* Delete */}
                          {deleteId === tx.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => { removeTx(tx.id); setDeleteId(null); }}
                                className="px-2 py-1 rounded-lg text-white transition-all"
                                style={{ fontSize: '10px', fontWeight: 700, background: '#dc2626' }}
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setDeleteId(null)}
                                className="px-2 py-1 rounded-lg transition-all"
                                style={{ fontSize: '10px', background: '#f5f5f5', color: '#6b7280' }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteId(tx.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-gray-100"
                              title="Delete entry"
                            >
                              <X width={12} height={12} style={{ color: '#9ca3af' }} />
                            </button>
                          )}
                        </div>
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
    </div>
    </PlusGate>
  );
}

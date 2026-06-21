import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { MONTHLY_DATA, getCategoryTotals, fmt } from '../data/mockData';
import { TrendingUp, TrendingDown } from 'lucide-react';

type Period = '6M' | '1Y';

const NET_SAVINGS = MONTHLY_DATA.reduce((s, d) => s + (d.income - d.expenses), 0);
const AVG_MONTHLY = Math.round(MONTHLY_DATA.reduce((s, d) => s + d.expenses, 0) / MONTHLY_DATA.length);

function CustomTooltipArea({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-xl p-3 min-w-[120px]">
      <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px', fontWeight: 500 }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span style={{ fontSize: '11px', color: '#6b7280' }}>{p.dataKey === 'income' ? 'Income' : 'Expenses'}</span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#111', fontVariantNumeric: 'tabular-nums' }}>
            ${p.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

function CustomTooltipPie({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2">
      <p style={{ fontSize: '12px', fontWeight: 600, color: '#111' }}>{d.name}</p>
      <p style={{ fontSize: '12px', color: '#9ca3af', fontVariantNumeric: 'tabular-nums' }}>${fmt(d.value)}</p>
    </div>
  );
}

export function Analytics() {
  const [period, setPeriod] = useState<Period>('6M');

  const categories = getCategoryTotals();
  const totalSpend = categories.reduce((s, c) => s + c.amount, 0);

  const lastMonth = MONTHLY_DATA[MONTHLY_DATA.length - 2];
  const thisMonth  = MONTHLY_DATA[MONTHLY_DATA.length - 1];
  const expenseChange = ((thisMonth.expenses - lastMonth.expenses) / lastMonth.expenses) * 100;
  const incomeChange  = ((thisMonth.income  - lastMonth.income)  / lastMonth.income)  * 100;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 md:px-8 md:pt-8">

      {/* ─── Header ─── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p style={{ fontSize: '13px', color: '#9ca3af' }}>Overview</p>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111', letterSpacing: '-0.03em', lineHeight: 1.2, marginTop: '2px' }}>
            Analytics
          </h1>
        </div>
        <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1">
          {(['6M', '1Y'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-3 py-1.5 rounded-lg transition-all duration-150"
              style={{
                fontSize: '12px',
                fontWeight: period === p ? 600 : 400,
                background: period === p ? '#111' : 'transparent',
                color: period === p ? '#fff' : '#9ca3af',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Stat cards ─── */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Net Saved
            </p>
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full" style={{ background: '#f0fdf4' }}>
              <TrendingUp className="w-3 h-3" style={{ color: '#16a34a' }} />
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#16a34a' }}>+{incomeChange.toFixed(0)}%</span>
            </div>
          </div>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#111', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
            ${NET_SAVINGS.toLocaleString()}
          </p>
          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>last 5 months</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Avg / Month
            </p>
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full" style={{ background: '#fff7ed' }}>
              <TrendingDown className="w-3 h-3" style={{ color: '#ea580c' }} />
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#ea580c' }}>{Math.abs(expenseChange).toFixed(0)}%</span>
            </div>
          </div>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#111', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
            ${AVG_MONTHLY.toLocaleString()}
          </p>
          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>expenses</p>
        </div>
      </div>

      {/* ─── Area chart: Income vs Expenses ─── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#111' }}>Income vs Expenses</h2>
            <p style={{ fontSize: '12px', color: '#9ca3af' }}>Jan – May 2026</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#111' }} />
              <span style={{ fontSize: '11px', color: '#6b7280' }}>Income</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#f87171' }} />
              <span style={{ fontSize: '11px', color: '#6b7280' }}>Expenses</span>
            </div>
          </div>
        </div>
        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MONTHLY_DATA} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#111111" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#111111" stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#f87171" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#f87171" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltipArea />} />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#111111"
                strokeWidth={2}
                fill="url(#incomeGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#111', strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="#f87171"
                strokeWidth={2}
                fill="url(#expenseGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#f87171', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── Category breakdown ─── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#111', marginBottom: '16px' }}>
          Spending by Category
        </h2>
        <div className="flex items-center gap-6">
          {/* Donut chart */}
          <div className="flex-shrink-0" style={{ width: 130, height: 130 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={62}
                  dataKey="amount"
                  nameKey="label"
                  paddingAngle={2}
                  startAngle={90}
                  endAngle={-270}
                >
                  {categories.map((c, i) => (
                    <Cell key={i} fill={c.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltipPie />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category list */}
          <div className="flex-1 space-y-2.5 min-w-0">
            {categories.slice(0, 5).map((c) => {
              const pct = Math.round((c.amount / totalSpend) * 100);
              return (
                <div key={c.key} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  <span className="flex-1 truncate" style={{ fontSize: '12px', color: '#374151', fontWeight: 500 }}>{c.label}</span>
                  <span style={{ fontSize: '12px', color: '#9ca3af', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bar breakdown */}
        <div className="mt-4 pt-4 border-t border-gray-50 space-y-3">
          {categories.map((c) => {
            const pct = Math.round((c.amount / totalSpend) * 100);
            return (
              <div key={c.key}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: '12px', color: '#374151', fontWeight: 500 }}>{c.label}</span>
                  <span style={{ fontSize: '12px', color: '#9ca3af', fontVariantNumeric: 'tabular-nums' }}>
                    ${fmt(c.amount)} · {pct}%
                  </span>
                </div>
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: c.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Monthly bar ─── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#111', marginBottom: '4px' }}>Monthly Surplus</h2>
        <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px' }}>Income minus expenses</p>
        <div className="space-y-2.5">
          {MONTHLY_DATA.map((m) => {
            const surplus = m.income - m.expenses;
            const maxSurplus = 2200;
            const pct = Math.round((surplus / maxSurplus) * 100);
            return (
              <div key={m.month} className="flex items-center gap-3">
                <span style={{ fontSize: '12px', color: '#9ca3af', width: '28px', flexShrink: 0 }}>{m.month}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: '#111' }}
                  />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a', width: '52px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                  +${(surplus / 1000).toFixed(1)}k
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

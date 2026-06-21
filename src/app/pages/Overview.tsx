import { Link } from 'react-router';
import { Bell, TrendingUp, TrendingDown, ArrowRight, ChevronRight } from 'lucide-react';
import {
  BarChart, Bar, ResponsiveContainer, Tooltip, Cell,
} from 'recharts';
import {
  TRANSACTIONS, BUDGETS, CATEGORIES, WEEKLY_DATA,
  getMayStats, fmt, fmtCompact,
} from '../data/mockData';
import { CategoryIcon } from '../components/CategoryIcon';

const BALANCE = 4284.50;
const BALANCE_CHANGE = 352.80;
const BALANCE_CHANGE_PCT = 9.0;

function SectionHeader({ title, linkTo }: { title: string; linkTo?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#111' }}>{title}</h2>
      {linkTo && (
        <Link
          to={linkTo}
          className="flex items-center gap-0.5 text-gray-400 hover:text-gray-700 transition-colors"
          style={{ fontSize: '13px' }}
        >
          View all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 ${className}`}>
      {children}
    </div>
  );
}

export function Overview() {
  const { income, expenses } = getMayStats();
  const savingsRate = Math.round(((income - expenses) / income) * 100);

  const recentTx = TRANSACTIONS.slice(0, 4);

  const topBudgets = BUDGETS.slice(0, 3);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2">
          <p style={{ fontSize: '11px', color: '#9ca3af' }}>{label}</p>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>${payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 md:px-8 md:pt-8">

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 400 }}>
            Friday, May 8, 2026
          </p>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111', letterSpacing: '-0.03em', lineHeight: 1.2, marginTop: '2px' }}>
            Good morning, Alex
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 bg-white border border-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors relative">
            <Bell className="w-4 h-4 text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-black rounded-full" />
          </button>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: '#111' }}
          >
            <span className="text-white" style={{ fontSize: '13px', fontWeight: 600 }}>A</span>
          </div>
        </div>
      </div>

      {/* ─── Balance Card (dark) ─── */}
      <div
        className="rounded-2xl p-5 mb-4 relative overflow-hidden"
        style={{ background: '#111111' }}
      >
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px)',
          }}
        />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <p style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Available Balance
            </p>
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(34,197,94,0.15)' }}
            >
              <TrendingUp className="w-3 h-3" style={{ color: '#4ade80' }} />
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#4ade80' }}>
                +{BALANCE_CHANGE_PCT}%
              </span>
            </div>
          </div>

          <div className="mb-1">
            <span style={{ fontSize: '14px', color: '#9ca3af', fontWeight: 400, verticalAlign: 'super', lineHeight: 1, marginRight: '2px' }}>$</span>
            <span style={{ fontSize: '40px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {(BALANCE).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '20px' }}>
            +${fmt(BALANCE_CHANGE)} from last month
          </p>

          <div
            className="flex gap-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}
          >
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(74,222,128,0.15)' }}>
                  <TrendingUp className="w-2.5 h-2.5" style={{ color: '#4ade80' }} />
                </div>
                <p style={{ fontSize: '11px', color: '#6b7280' }}>Income</p>
              </div>
              <p style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', fontVariantNumeric: 'tabular-nums' }}>
                ${fmtCompact(income)}
              </p>
              <p style={{ fontSize: '11px', color: '#6b7280' }}>this month</p>
            </div>
            <div className="w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(248,113,113,0.15)' }}>
                  <TrendingDown className="w-2.5 h-2.5" style={{ color: '#f87171' }} />
                </div>
                <p style={{ fontSize: '11px', color: '#6b7280' }}>Spent</p>
              </div>
              <p style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', fontVariantNumeric: 'tabular-nums' }}>
                ${fmtCompact(expenses)}
              </p>
              <p style={{ fontSize: '11px', color: '#6b7280' }}>this month</p>
            </div>
            <div className="w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(96,165,250,0.15)' }}>
                  <ArrowRight className="w-2.5 h-2.5" style={{ color: '#60a5fa' }} />
                </div>
                <p style={{ fontSize: '11px', color: '#6b7280' }}>Saved</p>
              </div>
              <p style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', fontVariantNumeric: 'tabular-nums' }}>
                {savingsRate}%
              </p>
              <p style={{ fontSize: '11px', color: '#6b7280' }}>rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Weekly Spending Chart ─── */}
      <Card className="p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#111' }}>This Week</h2>
            <p style={{ fontSize: '12px', color: '#9ca3af' }}>May 4 – May 10</p>
          </div>
          <div className="text-right">
            <p style={{ fontSize: '18px', fontWeight: 700, color: '#111', fontVariantNumeric: 'tabular-nums' }}>
              $390
            </p>
            <p style={{ fontSize: '11px', color: '#9ca3af' }}>total spent</p>
          </div>
        </div>
        <div style={{ height: 80 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={WEEKLY_DATA} barSize={20} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Bar dataKey="amount" radius={[5, 5, 5, 5]}>
                {WEEKLY_DATA.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.day === 'Fri' ? '#111111' : '#e5e7eb'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between mt-1">
          {WEEKLY_DATA.map((d) => (
            <span key={d.day} style={{ fontSize: '10px', color: '#9ca3af', width: '14.28%', textAlign: 'center' }}>
              {d.day}
            </span>
          ))}
        </div>
      </Card>

      {/* ─── Budget Status ─── */}
      <div className="mb-4">
        <SectionHeader title="Budget Status" linkTo="/budgets" />
        <Card className="divide-y divide-gray-50">
          {topBudgets.map((b) => {
            const cat = CATEGORIES[b.category];
            const pct = Math.round((b.spent / b.limit) * 100);
            const isOver = pct >= 90;
            return (
              <div key={b.category} className="flex items-center gap-3 px-4 py-3.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: cat.bg }}
                >
                  <CategoryIcon category={b.category} color={cat.color} size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#111' }}>{cat.label}</span>
                    <span style={{ fontSize: '12px', color: isOver ? '#ef4444' : '#9ca3af', fontVariantNumeric: 'tabular-nums' }}>
                      ${b.spent} / ${b.limit}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        background: isOver ? '#ef4444' : cat.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </Card>
      </div>

      {/* ─── Recent Transactions ─── */}
      <div className="mb-6">
        <SectionHeader title="Recent Transactions" linkTo="/transactions" />
        <Card className="divide-y divide-gray-50">
          {recentTx.map((tx) => {
            const cat = CATEGORIES[tx.category];
            return (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-3.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: cat.bg }}
                >
                  <CategoryIcon category={tx.category} color={cat.color} size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: '14px', fontWeight: 500, color: '#111' }} className="truncate">
                    {tx.title}
                  </p>
                  <p style={{ fontSize: '12px', color: '#9ca3af' }} className="truncate">
                    {tx.subtitle}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: tx.type === 'income' ? '#16a34a' : '#111111',
                    fontVariantNumeric: 'tabular-nums',
                    flexShrink: 0,
                  }}
                >
                  {tx.type === 'income' ? '+' : '-'}${fmt(tx.amount)}
                </span>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2">
        <p style={{ fontSize: '11px', color: '#9ca3af' }}>{label}</p>
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>${payload[0].value}</p>
      </div>
    );
  }
  return null;
}

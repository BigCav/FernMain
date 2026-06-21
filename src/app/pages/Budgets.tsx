import { BUDGETS, CATEGORIES, fmt } from '../data/mockData';
import { CategoryIcon } from '../components/CategoryIcon';
import { AlertCircle } from 'lucide-react';

const TOTAL_LIMIT  = BUDGETS.reduce((s, b) => s + b.limit, 0);
const TOTAL_SPENT  = BUDGETS.reduce((s, b) => s + b.spent, 0);
const TOTAL_REMAIN = TOTAL_LIMIT - TOTAL_SPENT;
const OVERALL_PCT  = Math.round((TOTAL_SPENT / TOTAL_LIMIT) * 100);

// SVG donut ring
function DonutRing({ pct, size = 120, stroke = 10 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const cx = size / 2;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#f0f0f0" strokeWidth={stroke} />
      <circle
        cx={cx} cy={cx} r={r} fill="none"
        stroke={pct >= 90 ? '#ef4444' : '#111111'}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}

export function Budgets() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 md:px-8 md:pt-8">

      {/* ─── Header ─── */}
      <div className="mb-5">
        <p style={{ fontSize: '13px', color: '#9ca3af' }}>May 2026</p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111', letterSpacing: '-0.03em', lineHeight: 1.2, marginTop: '2px' }}>
          Budgets
        </h1>
      </div>

      {/* ─── Summary card ─── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
        <div className="flex items-center gap-6">
          {/* Donut */}
          <div className="relative flex-shrink-0">
            <DonutRing pct={OVERALL_PCT} size={96} stroke={8} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#111', lineHeight: 1 }}>{OVERALL_PCT}%</span>
              <span style={{ fontSize: '10px', color: '#9ca3af', marginTop: '1px' }}>used</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 space-y-3">
            <div>
              <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Spent</p>
              <p style={{ fontSize: '22px', fontWeight: 700, color: '#111', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>
                ${fmt(TOTAL_SPENT)}
              </p>
            </div>
            <div className="flex gap-4">
              <div>
                <p style={{ fontSize: '11px', color: '#9ca3af' }}>Budget</p>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>${fmt(TOTAL_LIMIT)}</p>
              </div>
              <div>
                <p style={{ fontSize: '11px', color: '#9ca3af' }}>Remaining</p>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#16a34a', fontVariantNumeric: 'tabular-nums' }}>${fmt(TOTAL_REMAIN)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="mt-4">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.min(OVERALL_PCT, 100)}%`, background: OVERALL_PCT >= 90 ? '#ef4444' : '#111' }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>$0</span>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>${fmt(TOTAL_LIMIT)}</span>
          </div>
        </div>
      </div>

      {/* ─── Category budgets ─── */}
      <div className="space-y-3 pb-6">
        {BUDGETS.map((b) => {
          const cat = CATEGORIES[b.category];
          const pct = Math.round((b.spent / b.limit) * 100);
          const remaining = b.limit - b.spent;
          const isOver = pct >= 90;
          const isWarning = pct >= 70 && pct < 90;

          return (
            <div key={b.category} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: cat.bg }}
                >
                  <CategoryIcon category={b.category} color={cat.color} size={17} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>{cat.label}</span>
                      {isOver && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                    </div>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: isOver ? '#dc2626' : isWarning ? '#d97706' : '#111',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                      ${fmt(b.spent)} of ${fmt(b.limit)}
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        color: isOver ? '#dc2626' : '#9ca3af',
                      }}
                    >
                      {isOver ? `$${fmt(Math.abs(remaining))} over` : `$${fmt(remaining)} left`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(pct, 100)}%`,
                    background: isOver
                      ? '#ef4444'
                      : isWarning
                      ? '#f59e0b'
                      : cat.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

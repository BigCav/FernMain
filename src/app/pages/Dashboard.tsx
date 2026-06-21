import { useMemo, useState, useEffect } from 'react';
import { useDashboardPrefs } from '../hooks/useDashboardPrefs';
import { useCountUp } from '../hooks/useCountUp';
import { Link } from 'react-router';
import { QuickLogModal } from '../components/QuickLogModal';
import { BirthdayBannerGroup } from '../components/BirthdayBannerGroup';
import { useAnimals } from '../context/AnimalsContext';
import { useFeed } from '../context/FeedContext';
import { useTasks } from '../context/TasksContext';
import { useProfile } from '../context/ProfileContext';
import { useFinance } from '../context/FinanceContext';
import { useWaterLog } from '../context/WaterLogContext';
import { usePaddocks } from '../context/PaddocksContext';
import { WeatherWidget } from '../components/WeatherWidget';
import {
  SPECIES_CONFIG, HEALTH_STATUS_CONFIG, HEALTH_EVENT_CONFIG,
  TASK_CATEGORY_CONFIG,
  fmtDate, daysDiff, feedDaysRemaining, isLowStock,
} from '../data/blockData';
import {
  AlertTriangle, ArrowRight, CheckCircle2,
  PawPrint, ClipboardCheck, Wheat, CloudRain, Baby, ShieldAlert, Zap, Cake,
  Clock, TrendingDown,
} from 'lucide-react';
import { useBreeding, daysUntilDue } from '../context/BreedingContext';
import { useWithholding } from '../context/WithholdingContext';
import { useWeight } from '../context/WeightContext';

// ── Helpers ───────────────────────────────────────────────────────────────────
const NZD = (n: number) =>
  '$' + n.toLocaleString('en-NZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

// Rainfall uses its own "today" since mock data runs to 2026-05-13
function daysSinceDate(dateStr: string): number {
  const then = new Date(dateStr + 'T12:00:00').getTime();
  const now  = new Date('2026-05-13T12:00:00').getTime();
  return Math.round((now - then) / 86400000);
}

const THIS_MONTH = '2026-05';

// ── Sub-components ────────────────────────────────────────────────────────────
function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="rounded-full overflow-hidden" style={{ height: '5px', background: '#f1f5f9' }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function SectionCard({ children, to }: { children: React.ReactNode; to?: string }) {
  const inner = (
    <div className="rounded-2xl p-5 h-full transition-all" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
      {children}
    </div>
  );
  if (to) {
    return (
      <Link to={to} style={{ textDecoration: 'none', display: 'block' }}
        className="rounded-2xl h-full hover:shadow-md transition-shadow">
        {inner}
      </Link>
    );
  }
  return <div className="h-full">{inner}</div>;
}

function CardHeader({ title, to, label, icon, iconBg, subtitle, subtitleColor }: {
  title: string; to?: string; label?: string;
  icon?: React.ReactNode; iconBg?: string; subtitle?: string; subtitleColor?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        {icon && (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
            {icon}
          </div>
        )}
        <div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>{title}</p>
          {subtitle && <p style={{ fontSize: '11px', color: subtitleColor ?? '#9ca3af' }}>{subtitle}</p>}
        </div>
      </div>
      {to && (
        <Link to={to} className="flex items-center gap-1 flex-shrink-0" style={{ fontSize: '12px', color: '#ea580c', textDecoration: 'none' }}>
          {label ?? 'View all'} <ArrowRight width={12} height={12} />
        </Link>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function Dashboard() {
  const { animals, healthEvents } = useAnimals();
  const { feedItems }             = useFeed();
  const { tasks }                 = useTasks();
  const { profile }               = useProfile();
  const { transactions }          = useFinance();
  const { entries: waterEntries, tanks } = useWaterLog();
  const { paddocks } = usePaddocks();
  const { records: breedingRecords } = useBreeding();
  const { activeRecords: activeWHP } = useWithholding();
  const { entries: weightEntries }   = useWeight();
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const { show } = useDashboardPrefs();
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setContentVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const totalHa = useMemo(() => paddocks.reduce((s, p) => s + p.hectares, 0), [paddocks]);

  // ── Animals ──
  const attentionAnimals = useMemo(() => animals.filter((a) => a.status !== 'healthy'), [animals]);
  const speciesCounts    = useMemo(() => {
    const map: Record<string, number> = {};
    animals.forEach((a) => { map[a.species] = (map[a.species] || 0) + 1; });
    return Object.entries(map).sort(([, a], [, b]) => b - a);
  }, [animals]);

  // ── Tasks ──
  const overdueTasks  = useMemo(() => tasks.filter((t) => !t.completed && daysDiff(t.dueDate) < 0).sort((a, b) => a.dueDate.localeCompare(b.dueDate)), [tasks]);
  const todayTasks    = useMemo(() => tasks.filter((t) => !t.completed && daysDiff(t.dueDate) === 0), [tasks]);
  const upcomingTasks = useMemo(() => tasks.filter((t) => !t.completed && daysDiff(t.dueDate) > 0 && daysDiff(t.dueDate) <= 7).sort((a, b) => a.dueDate.localeCompare(b.dueDate)), [tasks]);

  // ── Feed ──
  const lowFeedItems = useMemo(() => feedItems.filter(isLowStock), [feedItems]);

  // ── Finance ──
  const financeStats = useMemo(() => {
    const monthTx = transactions.filter((t) => t.date.startsWith(THIS_MONTH));
    const income  = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, net: income - expense };
  }, [transactions]);

  // ── Rainfall ──
  const rainfallStats = useMemo(() => {
    const thisMonthMm = waterEntries
      .filter((e) => e.type === 'rainfall' && e.date.startsWith(THIS_MONTH))
      .reduce((s, e) => s + (e.rainfall_mm ?? 0), 0);
    const lastRain = [...waterEntries]
      .filter((e) => e.type === 'rainfall')
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    return { thisMonthMm, lastRainDate: lastRain?.date };
  }, [waterEntries]);

  const tankLevels = useMemo(() =>
    tanks.map((tank) => {
      const latest = [...waterEntries]
        .filter((e) => e.type === 'tank' && e.tank_id === tank.id)
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      return { tank, pct: latest?.tank_pct ?? 0 };
    }), [waterEntries]);

  const TODAY_STR   = '2026-05-14';

  // ── Idle animals (no health event in 60+ days) ──
  const IDLE_DAYS   = 60;
  const idleCutoff  = (() => {
    const d = new Date(TODAY_STR + 'T12:00:00');
    d.setDate(d.getDate() - IDLE_DAYS);
    return d.toISOString().slice(0, 10);
  })();
  const idleAnimals = useMemo(() => {
    return animals.filter((animal) => {
      const lastEvent = healthEvents
        .filter(e => e.animalId === animal.id)
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      return !lastEvent || lastEvent.date < idleCutoff;
    });
  }, [animals, healthEvents, idleCutoff]);

  // ── Weight-declining animals (last 3 entries all trending down) ──
  const decliningAnimals = useMemo(() => {
    return animals.filter((animal) => {
      const w = weightEntries
        .filter(e => e.animalId === animal.id)
        .sort((a, b) => a.date.localeCompare(b.date));
      if (w.length < 3) return false;
      const last3 = w.slice(-3);
      return last3[1].kg < last3[0].kg && last3[2].kg < last3[1].kg;
    });
  }, [animals, weightEntries]);

  // ── Birthday alerts (within next 14 days) ──
  const birthdayAlerts = useMemo(() => {
    const today = new Date();
    return animals
      .map(a => {
        const dob  = new Date(a.dob + 'T00:00:00');
        let bday   = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
        if (bday < today) bday = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate());
        const diff = Math.round((bday.getTime() - today.getTime()) / 86400000);
        const age  = bday.getFullYear() - dob.getFullYear();
        return { animal: a, diff, age };
      })
      .filter(({ diff }) => diff <= 14)
      .sort((a, b) => a.diff - b.diff);
  }, [animals]);

  // ── Breeding alerts (due within 30 days, not yet delivered) ──
  const breedingDueSoon = useMemo(() =>
    breedingRecords
      .filter(r => !r.actualBirthDate && daysUntilDue(r.expectedDueDate) <= 30)
      .sort((a, b) => a.expectedDueDate.localeCompare(b.expectedDueDate)),
    [breedingRecords]);

  // ── Upcoming health checks (nextDue within 60 days) ──
  const CUTOFF    = '2026-07-13';
  const upcomingHealthChecks = useMemo(() =>
    healthEvents
      .filter(e => e.nextDue && e.nextDue >= TODAY_STR && e.nextDue <= CUTOFF)
      .sort((a, b) => a.nextDue!.localeCompare(b.nextDue!))
      .slice(0, 5),
    [healthEvents]);

  // ── Recent health events ──
  const recentEvents = useMemo(() =>
    [...healthEvents].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [healthEvents]);

  const daysSinceRain = rainfallStats.lastRainDate ? daysSinceDate(rainfallStats.lastRainDate) : null;

  // ── Count-up animations for stat tiles — only start once content is visible ──
  const animalsCount = useCountUp(animals.length, contentVisible);
  const overdueCount = useCountUp(overdueTasks.length, contentVisible);
  const lowFeedCount = useCountUp(lowFeedItems.length, contentVisible);
  const rainMmCount  = useCountUp(rainfallStats.thisMonthMm, contentVisible);

  const drySpellDays = useMemo(() => {
    const rainy = waterEntries
      .filter(e => e.type === 'rainfall' && (e.rainfall_mm ?? 0) > 0)
      .sort((a, b) => b.date.localeCompare(a.date));
    if (!rainy.length) return null;
    const last = new Date(rainy[0].date + 'T12:00:00').getTime();
    const now  = new Date().getTime();
    return Math.round((now - last) / 86400000);
  }, [waterEntries]);

  return (
    <div className="pb-8">

      {/* ── Header — full-width with rounded bottom ── */}
      <div style={{
        background: '#fefefe',
        borderBottomLeftRadius: '20px',
        borderBottomRightRadius: '20px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        marginBottom: '20px',
        overflow: 'hidden',
      }}>
        {/* Greeting row */}
        <div className="max-w-5xl mx-auto px-4 pt-5 pb-4 md:px-8 md:pt-6">
          <div className="flex items-center justify-between gap-4">
            <p style={{ fontSize: '22px', fontWeight: 800, color: '#111', letterSpacing: '-0.03em' }}>
              {(() => {
                const h = new Date().getHours();
                const first = (profile.name || '').split(' ')[0];
                const greeting = h >= 5 && h < 12 ? 'Good morning' : h >= 12 && h < 18 ? 'Good afternoon' : 'Good evening';
                if (!first) return greeting;
                return (
                  <>{greeting}, <Link to="/profile" style={{ color: '#ea580c', textDecoration: 'none' }}>{first}</Link></>
                );
              })()}
            </p>
            <button
              onClick={() => setQuickLogOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl flex-shrink-0 transition-all active:scale-[0.97]"
              style={{ background: '#ea580c', color: '#fff', fontSize: '12px', fontWeight: 600 }}
            >
              <Zap width={13} height={13} />
              Quick Log
            </button>
          </div>
        </div>

        {/* Date fold */}
        <div style={{ background: '#f7f6f4', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-2.5">
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af' }}>
              {new Date().toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · Autumn
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8">

      {/* ── Coordinated content reveal ── */}
      <div
        style={{
          opacity: contentVisible ? 1 : 0,
          transform: contentVisible ? 'translateY(0)' : 'translateY(10px)',
          transition: contentVisible
            ? 'opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1)'
            : 'none',
        }}
      >

      {/* ── Alert banner ── */}
      {(overdueTasks.length > 0 || attentionAnimals.length > 0) && (
        <div
          className="rounded-2xl px-4 py-3.5 mb-4 flex items-center justify-between gap-3"
          style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertTriangle width={13} height={13} style={{ color: '#ea580c', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: '#92400e', fontWeight: 600 }} className="truncate">
              {[
                overdueTasks.length > 0 && `${overdueTasks.length} task${overdueTasks.length > 1 ? 's' : ''} overdue`,
                attentionAnimals.length > 0 && `${attentionAnimals.length} animal${attentionAnimals.length > 1 ? 's' : ''} need attention`,
              ].filter(Boolean).join(' · ')}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {overdueTasks.length > 0 && (
              <Link
                to="/tasks?overdue=1"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all hover:brightness-95"
                style={{ fontSize: '11px', fontWeight: 700, color: '#92400e', background: 'rgba(180,83,9,0.1)', textDecoration: 'none', whiteSpace: 'nowrap' }}
              >
                Tasks <ArrowRight width={10} height={10} />
              </Link>
            )}
            {attentionAnimals.length > 0 && (
              <Link
                to="/animals?attention=1"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all hover:brightness-95"
                style={{ fontSize: '11px', fontWeight: 700, color: '#92400e', background: 'rgba(180,83,9,0.1)', textDecoration: 'none', whiteSpace: 'nowrap' }}
              >
                Animals <ArrowRight width={10} height={10} />
              </Link>
            )}
          </div>
        </div>
      )}



      {/* ── Birthday alerts ── */}
      {show('birthday') && birthdayAlerts.length > 0 && (
        <div className="mb-4">
          <BirthdayBannerGroup
            alerts={birthdayAlerts.map(({ animal, diff, age }) => ({
              animal,
              diff,
              age,
              scfg: SPECIES_CONFIG[animal.species as keyof typeof SPECIES_CONFIG],
            }))}
          />
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">

        {/* Animals */}
        <Link to="/animals" style={{ textDecoration: 'none' }}>
          <div className="rounded-2xl p-4 transition-all hover:shadow-md h-full" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <PawPrint width={13} height={13} style={{ color: '#7c3aed' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Animals</span>
              </div>
              {attentionAnimals.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full" style={{ fontSize: '10px', fontWeight: 700, background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa' }}>
                  {attentionAnimals.length} flagged
                </span>
              )}
            </div>
            <p style={{ fontSize: '30px', fontWeight: 800, color: '#111', letterSpacing: '-0.04em', lineHeight: 1 }}>
              {Math.round(animalsCount)}
            </p>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '5px' }}>
              {speciesCounts.length} species
            </p>
          </div>
        </Link>

        {/* Tasks */}
        <Link to="/tasks" style={{ textDecoration: 'none' }}>
          <div className="rounded-2xl p-4 transition-all hover:shadow-md h-full" style={{ background: overdueTasks.length > 0 ? '#fff7ed' : '#fefefe', border: `1px solid ${overdueTasks.length > 0 ? '#fed7aa' : '#ebebeb'}` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <ClipboardCheck width={13} height={13} style={{ color: overdueTasks.length > 0 ? '#ea580c' : '#15803d' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Overdue</span>
              </div>
              {todayTasks.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full" style={{ fontSize: '10px', fontWeight: 700, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
                  {todayTasks.length} today
                </span>
              )}
            </div>
            <p style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: overdueTasks.length > 0 ? '#ea580c' : '#111' }}>
              {Math.round(overdueCount)}
            </p>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '5px' }}>
              {todayTasks.length + upcomingTasks.length} due this week
            </p>
          </div>
        </Link>

        {/* Feed */}
        <Link to="/feed" style={{ textDecoration: 'none' }}>
          <div className="rounded-2xl p-4 transition-all hover:shadow-md h-full" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Wheat width={13} height={13} style={{ color: '#d97706' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Low Stock</span>
              </div>
              {lowFeedItems.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full" style={{ fontSize: '10px', fontWeight: 700, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                  {lowFeedItems.length} low
                </span>
              )}
            </div>
            <p style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: lowFeedItems.length > 0 ? '#dc2626' : '#111' }}>
              {Math.round(lowFeedCount)}
            </p>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '5px' }}>
              {feedItems.length} items tracked
            </p>
          </div>
        </Link>

        {/* Rainfall */}
        <Link to="/rainfall" style={{ textDecoration: 'none' }}>
          <div className="rounded-2xl p-4 transition-all hover:shadow-md h-full" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <CloudRain width={13} height={13} style={{ color: '#3b82f6' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>This Month</span>
              </div>
            </div>
            <p style={{ fontSize: '30px', fontWeight: 800, color: '#3b82f6', letterSpacing: '-0.04em', lineHeight: 1 }}>
              {rainMmCount.toFixed(0)}
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#93c5fd', marginLeft: '2px' }}>mm</span>
            </p>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '5px' }}>
              {daysSinceRain === 0 ? 'Rain today' : daysSinceRain !== null ? `${daysSinceRain}d since rain` : 'No readings'}
            </p>
          </div>
        </Link>
      </div>

      {/* ── Tasks + Weather ── */}
      {(show('tasks') || show('weather')) && (
      <div className={show('tasks') && show('weather') ? 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-4' : 'mb-4'}>

        {/* Tasks this week */}
        {show('tasks') && <div className="rounded-2xl overflow-hidden order-2 md:order-1" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
          <div className="px-5 pt-5 pb-3">
            <CardHeader title="Tasks this week" to="/tasks" />
          </div>
          {overdueTasks.length === 0 && todayTasks.length === 0 && upcomingTasks.length === 0 ? (
            <div className="flex items-center gap-2 px-5 pb-5">
              <CheckCircle2 width={16} height={16} style={{ color: '#15803d' }} />
              <p style={{ fontSize: '13px', color: '#6b7280' }}>All clear, no urgent tasks</p>
            </div>
          ) : (
            <div style={{ borderTop: '1px solid #f3f4f6' }}>
              {(() => {
                const rows = [
                  ...overdueTasks.map(t => ({ task: t, type: 'overdue' as const })),
                  ...todayTasks.map(t => ({ task: t, type: 'today' as const })),
                  ...upcomingTasks.map(t => ({ task: t, type: 'upcoming' as const })),
                ];
                return rows.slice(0, 3);
              })().map(({ task, type }, idx, arr) => {
                const diff        = daysDiff(task.dueDate);
                const cfg         = TASK_CATEGORY_CONFIG[task.category];
                const statusColor = type === 'overdue' ? '#dc2626' : type === 'today' ? '#ea580c' : '#9ca3af';
                const statusBg    = type === 'overdue' ? '#fef2f2' : type === 'today' ? '#fff7ed' : '#f5f5f4';
                const statusBorder= type === 'overdue' ? '#fecaca' : type === 'today' ? '#fed7aa' : '#e5e7eb';
                const statusLabel = type === 'overdue' ? `${Math.abs(diff)}d overdue` : type === 'today' ? 'Today' : diff === 1 ? 'Tomorrow' : `in ${diff}d`;
                return (
                  <Link key={task.id} to="/tasks" style={{ textDecoration: 'none', display: 'block' }} className="transition-all hover:bg-gray-50">
                    <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: idx < arr.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}` }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: cfg.color }}>{cfg.label[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate" style={{ fontSize: '13px', fontWeight: 600, color: '#111', marginBottom: '2px' }}>{task.title}</p>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, padding: '1px 7px', borderRadius: '99px' }}>{cfg.label}</span>
                      </div>
                      <span className="flex-shrink-0 px-2.5 py-1 rounded-full" style={{ fontSize: '11px', fontWeight: 700, color: statusColor, background: statusBg, border: `1px solid ${statusBorder}` }}>
                        {statusLabel}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>}

        {/* Weather */}
        {show('weather') && (
          <div className="order-1 md:order-2">
            <WeatherWidget />
          </div>
        )}
      </div>
      )}

      {/* ── Animal health (full width) ── */}
      {show('animalHealth') && (
      <div className="mb-4">
        <div className="rounded-2xl overflow-hidden" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
          <div className="px-5 pt-5 pb-3">
            <CardHeader title="Animal health" to="/animals" />
          </div>
          {attentionAnimals.length === 0 ? (
            <div className="px-5 pb-5 space-y-2.5">
              <div className="flex items-center gap-2 py-1 mb-2">
                <CheckCircle2 width={14} height={14} style={{ color: '#15803d' }} />
                <p style={{ fontSize: '12px', color: '#6b7280' }}>All {animals.length} animals healthy</p>
              </div>
              {speciesCounts.map(([species, count]) => {
                const cfg = SPECIES_CONFIG[species as keyof typeof SPECIES_CONFIG];
                const pct = Math.round((count / animals.length) * 100);
                return (
                  <div key={species}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="px-2 py-0.5 rounded-full" style={{ fontSize: '10px', fontWeight: 700, color: cfg?.color, background: cfg?.bg, border: `1px solid ${cfg?.border}` }}>
                        {cfg?.label ?? species}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#111' }}>{count}</span>
                    </div>
                    <MiniBar pct={pct} color={cfg?.color ?? '#9ca3af'} />
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              <div className="pb-1">
                {attentionAnimals.map((animal, idx) => {
                  const scfg = SPECIES_CONFIG[animal.species as keyof typeof SPECIES_CONFIG];
                  const hcfg = HEALTH_STATUS_CONFIG[animal.status];
                  return (
                    <Link key={animal.id} to={`/animals/${animal.id}`} style={{ textDecoration: 'none', display: 'block' }}
                      className="transition-all hover:bg-gray-50">
                      <div className="flex items-center gap-3 px-5 py-3" style={{ borderTop: idx === 0 ? 'none' : '1px solid #f3f4f6' }}>
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: scfg?.bg ?? '#f5f5f4', border: `1.5px solid ${scfg?.border ?? '#e5e7eb'}` }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: scfg?.color ?? '#9ca3af' }}>{animal.name[0].toUpperCase()}</span>
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <p style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>{animal.name}</p>
                            <span style={{ fontSize: '10px', fontWeight: 600, color: scfg?.color, background: scfg?.bg, border: `1px solid ${scfg?.border}`, padding: '1px 7px', borderRadius: '99px' }}>{scfg?.label ?? animal.species}</span>
                          </div>
                          <p style={{ fontSize: '11px', color: '#9ca3af' }}>{animal.paddock !== 'Unassigned' ? animal.paddock : 'No paddock'}</p>
                        </div>
                        {/* Status badge */}
                        <span className="flex-shrink-0 px-2.5 py-1 rounded-full" style={{ fontSize: '11px', fontWeight: 700, background: hcfg.bg, color: hcfg.color, border: `1px solid ${hcfg.color}22` }}>
                          {hcfg.label}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <div className="flex items-center gap-1.5 px-5 pb-4 pt-2" style={{ borderTop: '1px solid #f3f4f6' }}>
                <CheckCircle2 width={11} height={11} style={{ color: '#15803d' }} />
                <p style={{ fontSize: '11px', color: '#9ca3af' }}>
                  {animals.length - attentionAnimals.length} animals healthy
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      )}

      {/* ── Idle + weight decline alerts ── */}
      {(show('idleAlerts') || show('weightAlerts')) && (
        <div className={show('idleAlerts') && show('weightAlerts') ? 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-4' : 'mb-4'}>

          {/* Animals with no recent health check */}
          {show('idleAlerts') && (
            <div className="rounded-2xl overflow-hidden" style={{ background: '#fefefe', border: idleAnimals.length > 0 ? '1px solid #fde68a' : '1px solid #ebebeb' }}>
              <div className="px-5 pt-5 pb-3">
                <CardHeader
                  title="No recent health check"
                  subtitle={idleAnimals.length > 0 ? `No records in ${IDLE_DAYS}+ days` : 'All animals up to date'}
                  subtitleColor={idleAnimals.length > 0 ? '#d97706' : '#15803d'}
                  icon={<Clock width={14} height={14} style={{ color: idleAnimals.length > 0 ? '#d97706' : '#15803d' }} />}
                  iconBg={idleAnimals.length > 0 ? '#fffbeb' : '#f0fdf4'}
                />
              </div>
              {idleAnimals.length === 0 ? (
                <div className="px-5 pb-5 flex items-center gap-2">
                  <CheckCircle2 width={14} height={14} style={{ color: '#15803d' }} />
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>No idle animals</p>
                </div>
              ) : (
                <div className="pb-3" style={{ borderTop: '1px solid #f3f4f6' }}>
                  {idleAnimals.slice(0, 4).map((animal, idx) => {
                    const scfg = SPECIES_CONFIG[animal.species as keyof typeof SPECIES_CONFIG];
                    const lastEvent = healthEvents
                      .filter(e => e.animalId === animal.id)
                      .sort((a, b) => b.date.localeCompare(a.date))[0];
                    const daysSince = lastEvent
                      ? Math.round((new Date(TODAY_STR + 'T12:00:00').getTime() - new Date(lastEvent.date + 'T12:00:00').getTime()) / 86400000)
                      : null;
                    const label = daysSince !== null ? `${daysSince}d ago` : 'Never';
                    const isNever = daysSince === null;
                    return (
                      <Link key={animal.id} to={`/animals/${animal.id}`} style={{ textDecoration: 'none', display: 'block' }}
                        className="transition-all hover:bg-gray-50">
                        <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: idx < Math.min(idleAnimals.length, 4) - 1 ? '1px solid #f3f4f6' : 'none' }}>
                          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: scfg?.bg ?? '#fffbeb', border: `1.5px solid ${scfg?.border ?? '#fde68a'}` }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: scfg?.color ?? '#d97706' }}>{animal.name[0].toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <p style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>{animal.name}</p>
                              <span style={{ fontSize: '10px', fontWeight: 600, color: scfg?.color, background: scfg?.bg, border: `1px solid ${scfg?.border}`, padding: '1px 7px', borderRadius: '99px' }}>{scfg?.label ?? animal.species}</span>
                            </div>
                          </div>
                          <span className="flex-shrink-0 px-2.5 py-1 rounded-full" style={{ fontSize: '11px', fontWeight: 700, background: isNever ? '#fef2f2' : '#fffbeb', color: isNever ? '#dc2626' : '#d97706', border: `1px solid ${isNever ? '#fecaca' : '#fde68a'}` }}>
                            {label}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Animals with declining weight */}
          {show('weightAlerts') && (
            <div className="rounded-2xl overflow-hidden" style={{ background: '#fefefe', border: decliningAnimals.length > 0 ? '1px solid #fecaca' : '1px solid #ebebeb' }}>
              <div className="px-5 pt-5 pb-3">
                <CardHeader
                  title="Weight declining"
                  subtitle={decliningAnimals.length > 0 ? '3 consecutive drops, consider a check' : 'No declining trends detected'}
                  subtitleColor={decliningAnimals.length > 0 ? '#dc2626' : '#15803d'}
                  icon={<TrendingDown width={14} height={14} style={{ color: decliningAnimals.length > 0 ? '#dc2626' : '#15803d' }} />}
                  iconBg={decliningAnimals.length > 0 ? '#fef2f2' : '#f0fdf4'}
                />
              </div>
              {decliningAnimals.length === 0 ? (
                <div className="px-5 pb-5 flex items-center gap-2">
                  <CheckCircle2 width={14} height={14} style={{ color: '#15803d' }} />
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>All weights trending steady</p>
                </div>
              ) : (
                <div className="pb-3" style={{ borderTop: '1px solid #f3f4f6' }}>
                  {decliningAnimals.map((animal, idx) => {
                    const scfg  = SPECIES_CONFIG[animal.species as keyof typeof SPECIES_CONFIG];
                    const w     = weightEntries.filter(e => e.animalId === animal.id).sort((a, b) => a.date.localeCompare(b.date));
                    const last3 = w.slice(-3);
                    const drop  = last3[2].kg - last3[0].kg;
                    return (
                      <Link key={animal.id} to={`/animals/${animal.id}`} style={{ textDecoration: 'none', display: 'block' }}
                        className="transition-all hover:bg-gray-50">
                        <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: idx < decliningAnimals.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: scfg?.bg ?? '#fef2f2', border: `1.5px solid ${scfg?.border ?? '#fecaca'}` }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: scfg?.color ?? '#dc2626' }}>{animal.name[0].toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>{animal.name}</p>
                            <span style={{ fontSize: '10px', fontWeight: 600, color: scfg?.color, background: scfg?.bg, border: `1px solid ${scfg?.border}`, padding: '1px 7px', borderRadius: '99px' }}>{scfg?.label ?? animal.species}</span>
                          </div>
                          <span className="flex-shrink-0 px-2.5 py-1 rounded-full" style={{ fontSize: '11px', fontWeight: 700, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                            {drop.toFixed(1)} kg
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Breeding alert (full-width when present) ── */}
      {show('breeding') && (
        <div className="rounded-2xl overflow-hidden mb-4" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
          <div className="px-5 pt-5 pb-3">
            <CardHeader
              title="Due to give birth"
              subtitle={breedingDueSoon.length > 0 ? `${breedingDueSoon.length} animal${breedingDueSoon.length > 1 ? 's' : ''} due soon` : 'No births expected in the next 30 days'}
              subtitleColor={breedingDueSoon.length > 0 ? '#ea580c' : '#15803d'}
              icon={<Baby width={14} height={14} style={{ color: breedingDueSoon.length > 0 ? '#ea580c' : '#15803d' }} />}
              iconBg={breedingDueSoon.length > 0 ? '#fff7ed' : '#f0fdf4'}
            />
          </div>
          {breedingDueSoon.length === 0 ? (
            <div className="px-5 pb-5 flex items-center gap-2">
              <CheckCircle2 width={14} height={14} style={{ color: '#15803d' }} />
              <p style={{ fontSize: '12px', color: '#6b7280' }}>No upcoming births</p>
            </div>
          ) : (
            <div style={{ borderTop: '1px solid #f3f4f6' }}>
              {breedingDueSoon.map((r, idx) => {
                const animal = animals.find(a => a.id === r.animalId);
                const scfg   = animal ? SPECIES_CONFIG[animal.species as keyof typeof SPECIES_CONFIG] : null;
                const days   = daysUntilDue(r.expectedDueDate);
                const urgent = days <= 14;
                const label  = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `in ${days}d`;
                const badgeBg     = days < 0 ? '#fef2f2' : urgent ? '#fff7ed' : '#f5f5f4';
                const badgeColor  = days < 0 ? '#dc2626' : urgent ? '#ea580c' : '#6b7280';
                const badgeBorder = days < 0 ? '#fecaca' : urgent ? '#fed7aa' : '#e5e7eb';
                return (
                  <Link key={r.id} to={`/animals/${r.animalId}`} style={{ textDecoration: 'none', display: 'block' }} className="transition-all hover:bg-gray-50">
                    <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: idx < breedingDueSoon.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: scfg?.bg ?? '#fff7ed', border: `1.5px solid ${scfg?.border ?? '#fed7aa'}` }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: scfg?.color ?? '#ea580c' }}>{(animal?.name ?? 'U')[0].toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>{animal?.name ?? 'Unknown'}</p>
                          {scfg && <span style={{ fontSize: '10px', fontWeight: 600, color: scfg.color, background: scfg.bg, border: `1px solid ${scfg.border}`, padding: '1px 7px', borderRadius: '99px' }}>{scfg.label}</span>}
                        </div>
                        <p style={{ fontSize: '11px', color: '#9ca3af' }}>{r.sireName ? `Sire: ${r.sireName}` : animal?.paddock ?? 'No paddock'}</p>
                      </div>
                      <span className="flex-shrink-0 px-2.5 py-1 rounded-full" style={{ fontSize: '11px', fontWeight: 700, color: badgeColor, background: badgeBg, border: `1px solid ${badgeBorder}` }}>
                        {label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Withholding + Upcoming health checks ── */}
      {(show('withholding') || show('healthChecks')) && (
      <div className={show('withholding') && show('healthChecks') ? 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-4' : 'mb-4'}>

        {/* Active withholding periods */}
        {show('withholding') && <div className="rounded-2xl overflow-hidden" style={{ background: '#fefefe', border: activeWHP.length > 0 ? '1px solid #fecaca' : '1px solid #ebebeb' }}>
          <div className="px-5 pt-5 pb-3">
            <CardHeader
              title="Withholding Periods"
              subtitle={activeWHP.length > 0 ? `${activeWHP.length} animal${activeWHP.length > 1 ? 's' : ''} not clear` : 'All animals clear'}
              subtitleColor={activeWHP.length > 0 ? '#dc2626' : '#15803d'}
              icon={<ShieldAlert width={14} height={14} style={{ color: activeWHP.length > 0 ? '#dc2626' : '#15803d' }} />}
              iconBg={activeWHP.length > 0 ? '#fef2f2' : '#f0fdf4'}
            />
          </div>
          {activeWHP.length === 0 ? (
            <div className="px-5 pb-5 flex items-center gap-2">
              <CheckCircle2 width={14} height={14} style={{ color: '#15803d' }} />
              <p style={{ fontSize: '12px', color: '#6b7280' }}>No active withholding periods</p>
            </div>
          ) : (
            <div style={{ borderTop: '1px solid #f3f4f6' }}>
              {activeWHP.map((r, idx) => {
                const animal   = animals.find(a => a.id === r.animalId);
                const scfg     = animal ? SPECIES_CONFIG[animal.species as keyof typeof SPECIES_CONFIG] : null;
                const clearDate = new Date(r.treatmentDate + 'T12:00:00');
                clearDate.setDate(clearDate.getDate() + r.meatDays);
                const daysLeft = Math.round((clearDate.getTime() - new Date(new Date().toISOString().split('T')[0] + 'T12:00:00').getTime()) / 86400000);
                const clear = daysLeft <= 0;
                return (
                  <Link key={r.id} to={`/animals/${r.animalId}`} style={{ textDecoration: 'none', display: 'block' }} className="transition-all hover:bg-gray-50">
                    <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: idx < activeWHP.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: scfg?.bg ?? '#fef2f2', border: `1.5px solid ${scfg?.border ?? '#fecaca'}` }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: scfg?.color ?? '#dc2626' }}>{(animal?.name ?? 'U')[0].toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>{animal?.name ?? 'Unknown'}</p>
                          {scfg && <span style={{ fontSize: '10px', fontWeight: 600, color: scfg.color, background: scfg.bg, border: `1px solid ${scfg.border}`, padding: '1px 7px', borderRadius: '99px' }}>{scfg.label}</span>}
                        </div>
                        <p style={{ fontSize: '11px', color: '#9ca3af' }} className="truncate">{r.productName}</p>
                      </div>
                      <span className="flex-shrink-0 px-2.5 py-1 rounded-full" style={{ fontSize: '11px', fontWeight: 700, background: clear ? '#f0fdf4' : '#fef2f2', color: clear ? '#16a34a' : '#dc2626', border: `1px solid ${clear ? '#bbf7d0' : '#fecaca'}` }}>
                        {clear ? 'Clear' : `${daysLeft}d left`}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>}

        {/* Upcoming health checks */}
        {show('healthChecks') && <div className="rounded-2xl overflow-hidden" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
          <div className="px-5 pt-5 pb-3">
            <CardHeader title="Upcoming health checks" to="/animals" label="Animals" />
          </div>
          {upcomingHealthChecks.length === 0 ? (
            <div className="px-5 pb-5 flex items-center gap-2">
              <CheckCircle2 width={14} height={14} style={{ color: '#15803d' }} />
              <p style={{ fontSize: '12px', color: '#6b7280' }}>No checks due in the next 60 days</p>
            </div>
          ) : (
            <div style={{ borderTop: '1px solid #f3f4f6' }}>
              {upcomingHealthChecks.map((ev, idx) => {
                const animal   = animals.find(a => a.id === ev.animalId);
                const scfg     = animal ? SPECIES_CONFIG[animal.species as keyof typeof SPECIES_CONFIG] : null;
                const ecfg     = HEALTH_EVENT_CONFIG[ev.type];
                const daysAway = Math.round((new Date(ev.nextDue! + 'T12:00:00').getTime() - new Date(TODAY_STR + 'T12:00:00').getTime()) / 86400000);
                const soon     = daysAway <= 7;
                const label    = daysAway === 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : `in ${daysAway}d`;
                return (
                  <Link key={ev.id} to={`/animals/${ev.animalId}`} style={{ textDecoration: 'none', display: 'block' }} className="transition-all hover:bg-gray-50">
                    <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: idx < upcomingHealthChecks.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: scfg?.bg ?? '#f5f5f4', border: `1.5px solid ${scfg?.border ?? '#e5e7eb'}` }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: scfg?.color ?? '#9ca3af' }}>{(animal?.name ?? 'U')[0].toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>{animal?.name ?? 'Unknown'}</p>
                          {scfg && <span style={{ fontSize: '10px', fontWeight: 600, color: scfg.color, background: scfg.bg, border: `1px solid ${scfg.border}`, padding: '1px 7px', borderRadius: '99px' }}>{scfg.label}</span>}
                        </div>
                        <p style={{ fontSize: '11px', color: '#9ca3af' }}>{ecfg.label}</p>
                      </div>
                      <span className="flex-shrink-0 px-2.5 py-1 rounded-full" style={{ fontSize: '11px', fontWeight: 700, background: soon ? '#fff7ed' : '#f5f5f4', color: soon ? '#ea580c' : '#6b7280', border: `1px solid ${soon ? '#fed7aa' : '#e5e7eb'}` }}>
                        {label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>}
      </div>
      )}

      {/* ── Rainfall + Finance (Plus only) ── */}
      {profile.fernPlus && (show('rainfall') || show('finance')) && (
      <div className={show('rainfall') && show('finance') ? 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-4' : 'mb-4'}>

        {/* Rainfall & tanks */}
        {show('rainfall') && <Link to="/rainfall" style={{ textDecoration: 'none', display: 'block' }} className="h-full">
          <div className="rounded-2xl p-5 transition-all hover:shadow-md h-full" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
            <CardHeader title="Rainfall & Water" />
            <div className="flex items-end gap-8 mb-5">
              <div>
                <p style={{ fontSize: '32px', fontWeight: 800, color: '#3b82f6', letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {rainfallStats.thisMonthMm.toFixed(0)}
                  <span style={{ fontSize: '16px', fontWeight: 500, color: '#93c5fd', marginLeft: '3px' }}>mm</span>
                </p>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>May 2026</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {tankLevels.map(({ tank, pct }) => {
                const color = pct >= 70 ? '#3b82f6' : pct >= 40 ? '#f59e0b' : '#ef4444';
                const litres = Math.round((pct / 100) * tank.capacity_l);
                return (
                  <div key={tank.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>{tank.name}</span>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>{litres.toLocaleString()} L</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color }}>{pct}%</span>
                      </div>
                    </div>
                    <MiniBar pct={pct} color={color} />
                  </div>
                );
              })}
            </div>
          </div>
        </Link>}

        {/* Finance snapshot */}
        {show('finance') && <Link to="/finance" style={{ textDecoration: 'none', display: 'block' }} className="h-full">
          <div className="rounded-2xl p-5 transition-all hover:shadow-md h-full" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
            <CardHeader title="Finance, May 2026" />
            <div className="flex items-end gap-8 mb-5">
              <div>
                <p style={{
                  fontSize: '32px', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1,
                  color: financeStats.net >= 0 ? '#22c55e' : '#f87171',
                }}>
                  {financeStats.net >= 0 ? '+' : '−'}{NZD(Math.abs(financeStats.net))}
                </p>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Net P&L this month</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Income',   value: financeStats.income,  color: '#22c55e' },
                { label: 'Expenses', value: financeStats.expense, color: '#f87171' },
              ].map(({ label, value, color }) => {
                const maxVal = Math.max(financeStats.income, financeStats.expense, 1);
                const pct    = Math.round((value / maxVal) * 100);
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>{label}</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color }}>{NZD(value)}</span>
                    </div>
                    <MiniBar pct={pct} color={color} />
                  </div>
                );
              })}
            </div>
          </div>
        </Link>}
      </div>
      )}

      {/* ── Recent health events ── */}
      {show('recentEvents') && <div className="rounded-2xl overflow-hidden mb-0" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
        <div className="px-5 pt-5 pb-3">
          <CardHeader title="Recent health events" to="/animals" label="Animals" />
        </div>
        <div style={{ borderTop: '1px solid #f3f4f6' }}>
          {recentEvents.map((ev, idx) => {
            const animal = animals.find((a) => a.id === ev.animalId);
            const scfg   = animal ? SPECIES_CONFIG[animal.species as keyof typeof SPECIES_CONFIG] : null;
            const ecfg   = HEALTH_EVENT_CONFIG[ev.type];
            const row = (
              <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: idx < recentEvents.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: scfg?.bg ?? '#f5f5f4', border: `1.5px solid ${scfg?.border ?? '#e5e7eb'}` }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: scfg?.color ?? '#9ca3af' }}>{(animal?.name ?? '?')[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  {/* Top row: name + species + date */}
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p style={{ fontSize: '13px', fontWeight: 600, color: animal ? '#111' : '#9ca3af' }}>{animal?.name ?? 'Unknown'}</p>
                      {scfg && <span style={{ fontSize: '10px', fontWeight: 600, color: scfg.color, background: scfg.bg, border: `1px solid ${scfg.border}`, padding: '1px 7px', borderRadius: '99px', flexShrink: 0 }}>{scfg.label}</span>}
                    </div>
                    <span style={{ fontSize: '11px', color: '#9ca3af', flexShrink: 0 }}>{fmtDate(ev.date)}</span>
                  </div>
                  {/* Bottom row: event type + description + cost */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span style={{ fontSize: '10px', fontWeight: 600, color: ecfg.color, background: ecfg.bg ?? '#f5f5f4', padding: '1px 7px', borderRadius: '99px', flexShrink: 0 }}>{ecfg.label}</span>
                    {ev.description && <span style={{ fontSize: '11px', color: '#9ca3af' }} className="truncate">{ev.description}</span>}
                    {ev.cost !== undefined && ev.cost > 0 && <span style={{ fontSize: '10px', color: '#9ca3af', flexShrink: 0 }}>· ${ev.cost}</span>}
                  </div>
                </div>
              </div>
            );
            return animal ? (
              <Link key={ev.id} to={`/animals/${animal.id}`} className="block transition-all hover:bg-gray-50" style={{ textDecoration: 'none' }}>{row}</Link>
            ) : (
              <div key={ev.id}>{row}</div>
            );
          })}
        </div>
      </div>}

      </div>{/* end coordinated reveal */}

      <QuickLogModal open={quickLogOpen} onClose={() => setQuickLogOpen(false)} />
    </div>{/* end px-4 md:px-8 */}
    </div>
  );
}

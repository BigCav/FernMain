import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, ClipboardCheck, Baby, ShieldCheck, List } from 'lucide-react';
import { useTasks } from '../context/TasksContext';
import { useBreeding } from '../context/BreedingContext';
import { useWithholding, meatClearDate } from '../context/WithholdingContext';
import { useAnimals } from '../context/AnimalsContext';
import { TASK_CATEGORY_CONFIG, fmtDate, TODAY } from '../data/blockData';
import { Link } from 'react-router';
import { PageHeader } from '../components/PageHeader';

// ── Types ────────────────────────────────────────────────────────────────────

type EventKind = 'task' | 'breeding' | 'withholding';

interface CalEvent {
  id: string;
  date: string; // YYYY-MM-DD
  kind: EventKind;
  label: string;
  sublabel?: string;
  color: string;
  bg: string;
  border: string;
  linkTo?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function ymd(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

// Monday-first day of week (0=Mon … 6=Sun)
function startDow(year: number, month: number) {
  const d = new Date(year, month, 1).getDay(); // 0=Sun
  return (d + 6) % 7;
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const KIND_META: Record<EventKind, { icon: React.ElementType; defaultColor: string }> = {
  task:        { icon: ClipboardCheck, defaultColor: '#6b7280' },
  breeding:    { icon: Baby,           defaultColor: '#ea580c' },
  withholding: { icon: ShieldCheck,    defaultColor: '#16a34a' },
};

// ── Event dot ────────────────────────────────────────────────────────────────

function Dot({ color }: { color: string }) {
  return <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />;
}

// ── Day cell ─────────────────────────────────────────────────────────────────

function DayCell({
  dateStr,
  day,
  isToday,
  isSelected,
  isOtherMonth,
  events,
  onClick,
}: {
  dateStr: string;
  day: number;
  isToday: boolean;
  isSelected: boolean;
  isOtherMonth: boolean;
  events: CalEvent[];
  onClick: () => void;
}) {
  const MAX_DOTS = 3;
  const shown = events.slice(0, MAX_DOTS);
  const extra = events.length - MAX_DOTS;

  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center justify-center gap-1 rounded-xl transition-all w-full"
      style={{
        background: isSelected ? '#ea580c' : isToday ? '#fff7ed' : 'transparent',
        border: isSelected ? '1.5px solid #ea580c' : isToday ? '1.5px solid #fed7aa' : '1.5px solid transparent',
        opacity: isOtherMonth ? 0.3 : 1,
        minHeight: '52px',
      }}
    >
      <span
        style={{
          fontSize: '13px',
          fontWeight: isToday || isSelected ? 700 : 400,
          color: isSelected ? '#fff' : isToday ? '#ea580c' : '#111',
          lineHeight: 1,
        }}
      >
        {day}
      </span>
      {/* Event dots */}
      <div className="flex items-center gap-0.5" style={{ minHeight: '8px' }}>
        {shown.map((e, i) => (
          <Dot key={i} color={isSelected ? 'rgba(255,255,255,0.7)' : e.color} />
        ))}
        {extra > 0 && (
          <span style={{ fontSize: '8px', color: isSelected ? 'rgba(255,255,255,0.7)' : '#9ca3af', fontWeight: 600, lineHeight: 1 }}>
            +{extra}
          </span>
        )}
      </div>
    </button>
  );
}

// ── Event pill (in day detail) ────────────────────────────────────────────────

function EventPill({ event }: { event: CalEvent }) {
  const Icon = KIND_META[event.kind].icon;
  const inner = (
    <div
      className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl transition-all"
      style={{ background: event.bg, border: `1px solid ${event.border}` }}
    >
      <div
        className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: event.color + '22', color: event.color }}
      >
        <Icon width={12} height={12} />
      </div>
      <div className="min-w-0 flex-1">
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#111', lineHeight: 1.3 }}>{event.label}</p>
        {event.sublabel && (
          <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{event.sublabel}</p>
        )}
      </div>
    </div>
  );

  if (event.linkTo) {
    return <Link to={event.linkTo} style={{ textDecoration: 'none', display: 'block' }}>{inner}</Link>;
  }
  return inner;
}

// ── Upcoming list item ────────────────────────────────────────────────────────

function UpcomingItem({ event, showDate }: { event: CalEvent; showDate?: boolean }) {
  const Icon = KIND_META[event.kind].icon;
  const inner = (
    <div className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid #f5f5f5' }}>
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: event.bg, border: `1px solid ${event.border}`, color: event.color }}
      >
        <Icon width={13} height={13} />
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#111' }}>{event.label}</p>
        {event.sublabel && (
          <p style={{ fontSize: '11px', color: '#6b7280' }}>{event.sublabel}</p>
        )}
      </div>
      {showDate && (
        <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500, flexShrink: 0 }}>
          {fmtDate(event.date)}
        </span>
      )}
    </div>
  );

  if (event.linkTo) {
    return <Link to={event.linkTo} style={{ textDecoration: 'none', display: 'block' }}>{inner}</Link>;
  }
  return inner;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function FarmCalendar() {
  const { tasks } = useTasks();
  const { records: breedingRecords } = useBreeding();
  const { records: withholdingRecords } = useWithholding();
  const { animals } = useAnimals();

  const todayDate = new Date(TODAY);
  const [year,  setYear]  = useState(todayDate.getFullYear());
  const [month, setMonth] = useState(todayDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(TODAY);
  const [view, setView] = useState<'month' | 'upcoming'>('month');

  // ── Build all calendar events ──────────────────────────────────────────────

  const allEvents = useMemo<CalEvent[]>(() => {
    const evs: CalEvent[] = [];

    // Tasks
    tasks.filter(t => !t.completed && t.dueDate).forEach(t => {
      const cfg = TASK_CATEGORY_CONFIG[t.category];
      evs.push({
        id:       `task-${t.id}`,
        date:     t.dueDate,
        kind:     'task',
        label:    t.title,
        sublabel: cfg.label,
        color:    cfg.color,
        bg:       cfg.bg,
        border:   cfg.border,
        linkTo:   '/tasks',
      });
    });

    // Breeding due dates
    breedingRecords.filter(r => !r.actualBirthDate && r.expectedDueDate).forEach(r => {
      const animal = animals.find(a => a.id === r.animalId);
      evs.push({
        id:       `breed-${r.id}`,
        date:     r.expectedDueDate,
        kind:     'breeding',
        label:    animal ? `${animal.name} — birth due` : 'Birth due',
        sublabel: r.sireName ? `Sire: ${r.sireName}` : undefined,
        color:    '#ea580c',
        bg:       '#fff7ed',
        border:   '#fed7aa',
        linkTo:   animal ? `/animals/${animal.id}` : '/animals',
      });
    });

    // Withholding clearance dates
    withholdingRecords.forEach(r => {
      const clearDate = meatClearDate(r);
      if (clearDate >= TODAY) {
        const animal = animals.find(a => a.id === r.animalId);
        evs.push({
          id:       `whp-${r.id}`,
          date:     clearDate,
          kind:     'withholding',
          label:    animal ? `${animal.name} — WHP clear` : 'WHP cleared',
          sublabel: r.productName,
          color:    '#16a34a',
          bg:       '#f0fdf4',
          border:   '#bbf7d0',
          linkTo:   animal ? `/animals/${animal.id}` : '/animals',
        });
      }
    });

    return evs;
  }, [tasks, breedingRecords, withholdingRecords, animals]);

  // Map date → events
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    allEvents.forEach(e => {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    });
    return map;
  }, [allEvents]);

  // ── Calendar grid ──────────────────────────────────────────────────────────

  const totalDays = daysInMonth(year, month);
  const startOffset = startDow(year, month);
  // Pad to full weeks
  const totalCells = Math.ceil((startOffset + totalDays) / 7) * 7;

  // Previous month fill
  const prevMonthDays = daysInMonth(year, month === 0 ? 11 : month - 1);

  const cells = useMemo(() => {
    return Array.from({ length: totalCells }, (_, i) => {
      if (i < startOffset) {
        const d = prevMonthDays - startOffset + 1 + i;
        const m = month === 0 ? 11 : month - 1;
        const y = month === 0 ? year - 1 : year;
        return { day: d, dateStr: ymd(y, m, d), otherMonth: true };
      }
      const d = i - startOffset + 1;
      if (d > totalDays) {
        const overflow = d - totalDays;
        const m = month === 11 ? 0 : month + 1;
        const y = month === 11 ? year + 1 : year;
        return { day: overflow, dateStr: ymd(y, m, overflow), otherMonth: true };
      }
      return { day: d, dateStr: ymd(year, month, d), otherMonth: false };
    });
  }, [year, month, totalCells, startOffset, totalDays, prevMonthDays]);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }
  function goToday() {
    setYear(todayDate.getFullYear());
    setMonth(todayDate.getMonth());
    setSelectedDate(TODAY);
  }

  const selectedEvents = eventsByDate.get(selectedDate) ?? [];

  // Upcoming: next 60 days, sorted
  const upcoming = useMemo(() => {
    const cutoff = new Date(TODAY);
    cutoff.setDate(cutoff.getDate() + 60);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return allEvents
      .filter(e => e.date >= TODAY && e.date <= cutoffStr)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [allEvents]);

  // Group upcoming by date
  const upcomingGroups = useMemo(() => {
    const groups: { date: string; events: CalEvent[] }[] = [];
    for (const e of upcoming) {
      const last = groups[groups.length - 1];
      if (last?.date === e.date) last.events.push(e);
      else groups.push({ date: e.date, events: [e] });
    }
    return groups;
  }, [upcoming]);

  // Stats for header
  const thisMonthEvents = allEvents.filter(e => {
    const [y, m] = e.date.split('-').map(Number);
    return y === year && m - 1 === month;
  });

  return (
    <div className="pb-8">

      <PageHeader
        title="Calendar"
        action={
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #ebebeb' }}>
            <button onClick={() => setView('month')} className="flex items-center gap-1.5 px-3 py-2 transition-all" style={{ fontSize: '12px', fontWeight: view === 'month' ? 700 : 400, background: view === 'month' ? '#111' : '#fff', color: view === 'month' ? '#fff' : '#6b7280' }}>
              <CalendarDays width={13} height={13} />Month
            </button>
            <button onClick={() => setView('upcoming')} className="flex items-center gap-1.5 px-3 py-2 transition-all" style={{ fontSize: '12px', fontWeight: view === 'upcoming' ? 700 : 400, background: view === 'upcoming' ? '#111' : '#fff', color: view === 'upcoming' ? '#fff' : '#6b7280', borderLeft: '1px solid #ebebeb' }}>
              <List width={13} height={13} />Upcoming
            </button>
          </div>
        }
        chips={[
          { label: `${thisMonthEvents.length} event${thisMonthEvents.length !== 1 ? 's' : ''} in ${MONTH_NAMES[month]}`, variant: 'neutral' },
        ]}
      />

      <div className="max-w-5xl mx-auto px-4 md:px-8">

      {view === 'month' && (
        <div className="flex flex-col md:flex-row gap-4" style={{ height: '560px' }}>

          {/* ── Calendar card ── */}
          <div className="flex-1 rounded-2xl overflow-hidden flex flex-col h-full" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
            {/* Month nav */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
              <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:bg-gray-50" style={{ border: '1px solid #ebebeb' }}>
                <ChevronLeft width={14} height={14} style={{ color: '#6b7280' }} />
              </button>
              <div className="flex items-center gap-3">
                <p style={{ fontSize: '14px', fontWeight: 800, color: '#111', letterSpacing: '-0.02em' }}>
                  {MONTH_NAMES[month]} {year}
                </p>
                {(year !== todayDate.getFullYear() || month !== todayDate.getMonth()) && (
                  <button
                    onClick={goToday}
                    className="px-2.5 py-1 rounded-lg transition-all hover:bg-gray-50"
                    style={{ fontSize: '11px', fontWeight: 600, color: '#ea580c', border: '1px solid #fed7aa', background: '#fff7ed' }}
                  >
                    Today
                  </button>
                )}
              </div>
              <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:bg-gray-50" style={{ border: '1px solid #ebebeb' }}>
                <ChevronRight width={14} height={14} style={{ color: '#6b7280' }} />
              </button>
            </div>

            {/* Day name headers */}
            <div className="grid grid-cols-7 px-3 pt-3 pb-1">
              {DAY_NAMES.map(d => (
                <p key={d} className="text-center" style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {d}
                </p>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-0.5 px-3 pb-3 flex-1" style={{ gridAutoRows: '1fr' }}>
              {cells.map((cell, i) => (
                <DayCell
                  key={i}
                  dateStr={cell.dateStr}
                  day={cell.day}
                  isToday={cell.dateStr === TODAY}
                  isSelected={cell.dateStr === selectedDate}
                  isOtherMonth={cell.otherMonth}
                  events={eventsByDate.get(cell.dateStr) ?? []}
                  onClick={() => setSelectedDate(cell.dateStr)}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="px-4 pb-4 flex items-center gap-4 flex-wrap" style={{ borderTop: '1px solid #f5f5f5', paddingTop: '12px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: '2px' }}>Key</span>
              <div className="flex items-center gap-1.5"><Dot color="#ea580c" /><span style={{ fontSize: '11px', color: '#6b7280' }}>Birth due</span></div>
              <div className="flex items-center gap-1.5"><Dot color="#16a34a" /><span style={{ fontSize: '11px', color: '#6b7280' }}>WHP clear</span></div>
              <div className="flex items-center gap-1.5"><Dot color="#6366f1" /><span style={{ fontSize: '11px', color: '#6b7280' }}>Task</span></div>
            </div>
          </div>

          {/* ── Day detail panel ── */}
          <div className="w-full md:w-72 flex-shrink-0 rounded-2xl flex flex-col h-full" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
            <div className="px-4 py-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
              <p style={{ fontSize: '13px', fontWeight: 800, color: '#111', letterSpacing: '-0.02em' }}>
                {selectedDate === TODAY ? 'Today' : fmtDate(selectedDate)}
              </p>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>
                {selectedEvents.length === 0 ? 'Nothing on' : `${selectedEvents.length} event${selectedEvents.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="p-3 space-y-2 overflow-y-auto flex-1">
              {selectedEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <CalendarDays width={24} height={24} style={{ color: '#e5e7eb' }} />
                  <p style={{ fontSize: '12px', color: '#9ca3af' }}>No events this day</p>
                </div>
              ) : (
                selectedEvents.map(e => <EventPill key={e.id} event={e} />)
              )}
            </div>

            {/* Mini month summary */}
            {(() => {
              const taskCount   = thisMonthEvents.filter(e => e.kind === 'task').length;
              const birthCount  = thisMonthEvents.filter(e => e.kind === 'breeding').length;
              const whpCount    = thisMonthEvents.filter(e => e.kind === 'withholding').length;
              return (
                <div className="px-4 py-3 flex flex-col gap-1.5" style={{ borderTop: '1px solid #f0f0f0' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
                    {MONTH_NAMES[month]}
                  </p>
                  {[
                    { label: 'Tasks', count: taskCount,  color: '#6366f1', bg: '#eef2ff' },
                    { label: 'Births due', count: birthCount, color: '#ea580c', bg: '#fff7ed' },
                    { label: 'WHP clearances', count: whpCount, color: '#16a34a', bg: '#f0fdf4' },
                  ].map(({ label, count, color, bg }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>{label}</span>
                      <span className="px-2 py-0.5 rounded-md" style={{ fontSize: '11px', fontWeight: 700, color, background: bg }}>
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Upcoming view ── */}
      {view === 'upcoming' && (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>Next 60 days</p>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>{upcoming.length} upcoming event{upcoming.length !== 1 ? 's' : ''}</p>
          </div>

          {upcomingGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <CalendarDays width={32} height={32} style={{ color: '#e5e7eb' }} />
              <p style={{ fontSize: '13px', color: '#9ca3af' }}>Nothing coming up in the next 60 days</p>
            </div>
          ) : (
            <div className="px-5 pb-4">
              {upcomingGroups.map(group => {
                const isToday = group.date === TODAY;
                const isTomorrow = group.date === (() => { const d = new Date(TODAY); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })();
                const label = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : fmtDate(group.date);
                return (
                  <div key={group.date} className="mt-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span style={{ fontSize: '11px', fontWeight: 700, color: isToday ? '#ea580c' : '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        {label}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded-md"
                        style={{ fontSize: '10px', fontWeight: 700, background: isToday ? '#fff7ed' : '#f5f5f4', color: isToday ? '#ea580c' : '#9ca3af' }}
                      >
                        {group.events.length}
                      </span>
                    </div>
                    {group.events.map(e => <UpcomingItem key={e.id} event={e} />)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

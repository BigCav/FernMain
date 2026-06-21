import { useState, useMemo, useEffect } from 'react';
import { PlusGate } from '../components/PlusGate';
import { Plus, X, Leaf, Heart, Wrench, PawPrint } from 'lucide-react';
import { AnimatedSection } from '../components/AnimatedSection';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiSet } from '../lib/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CURRENT_MONTH = 4; // May

type EventCat = 'livestock' | 'health' | 'pasture' | 'maintenance';

interface SeasonEvent {
  id: string;
  label: string;
  cat: EventCat;
  months: number[];
  color: string;
  isCustom?: boolean;
}

const CAT_CONFIG: Record<EventCat, { label: string; Icon: React.ElementType; color: string; bg: string; border: string }> = {
  livestock:   { label: 'Livestock',   Icon: PawPrint, color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
  health:      { label: 'Health',      Icon: Heart,    color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  pasture:     { label: 'Pasture',     Icon: Leaf,     color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  maintenance: { label: 'Maintenance', Icon: Wrench,   color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
};

const DEFAULT_EVENTS: SeasonEvent[] = [
  { id: 'lambing',    label: 'Lambing',               cat: 'livestock',   months: [7,8,9],   color: '#ea580c' },
  { id: 'calving',    label: 'Calving',               cat: 'livestock',   months: [6,7,8],   color: '#3b82f6' },
  { id: 'ram-in',     label: 'Ram / bull joining',    cat: 'livestock',   months: [3,4],     color: '#9333ea' },
  { id: 'weaning',    label: 'Weaning',               cat: 'livestock',   months: [10,11],   color: '#0891b2' },
  { id: 'pre-vax',    label: 'Pre-lamb vaccination',  cat: 'health',      months: [5,6],     color: '#dc2626' },
  { id: 'crutching',  label: 'Crutching',             cat: 'health',      months: [5,6],     color: '#b45309' },
  { id: 'spring-dr',  label: 'Spring drenching',      cat: 'health',      months: [8,9,10],  color: '#ef4444' },
  { id: 'autumn-dr',  label: 'Autumn drenching',      cat: 'health',      months: [2,3,4],   color: '#ef4444' },
  { id: 'spring-fe',  label: 'Spring fertiliser',     cat: 'pasture',     months: [7,8],     color: '#16a34a' },
  { id: 'autumn-fe',  label: 'Autumn fertiliser',     cat: 'pasture',     months: [3,4],     color: '#16a34a' },
  { id: 'haymaking',  label: 'Hay & silage',          cat: 'pasture',     months: [0,1,2],   color: '#ca8a04' },
  { id: 'weed-ctrl',  label: 'Weed control',          cat: 'pasture',     months: [9,10,11], color: '#059669' },
  { id: 'shearing',   label: 'Shearing',              cat: 'maintenance', months: [9,10],    color: '#374151' },
  { id: 'fencing',    label: 'Fencing season',        cat: 'maintenance', months: [11,0,1],  color: '#4b5563' },
  { id: 'topping',    label: 'Topping / mowing',      cat: 'maintenance', months: [1,2,3],   color: '#6b7280' },
];

const SEASON_NOTES: { label: string; season: string; color: string; tips: string[] }[] = [
  {
    label: 'Autumn (Mar–May)', season: 'autumn', color: '#ea580c',
    tips: ['Ram & bull joining, ensure body condition score ≥3', 'Autumn drenching before pasture slowdown', 'Fertiliser to boost autumn growth', 'Wean any late lambs or calves'],
  },
  {
    label: 'Winter (Jun–Aug)', season: 'winter', color: '#3b82f6',
    tips: ['Crutch ewes 6–8 weeks before lambing', 'Pre-lamb vaccinations (Toxovax, 5-in-1)', 'Monitor body condition, supplement if needed', 'Check and repair all fencing before lambing'],
  },
  {
    label: 'Spring (Sep–Nov)', season: 'spring', color: '#16a34a',
    tips: ['Lambing / calving checks, twice daily', 'Spring drench lambs at weaning', 'Apply fertiliser as pasture growth picks up', 'Weed control before thistles set seed'],
  },
  {
    label: 'Summer (Dec–Feb)', season: 'summer', color: '#ca8a04',
    tips: ['Shearing and crutching', 'Hay & silage making in January', 'Summer fencing while ground is dry', 'Monitor water supply and tank levels'],
  },
];

const COLORS = ['#ea580c','#3b82f6','#16a34a','#dc2626','#9333ea','#0891b2','#ca8a04','#374151'];
const INPUT = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none bg-white text-gray-900 transition-colors focus:border-orange-400 text-[13px]';

export function SeasonPlanner() {
  const { user } = useAuth();
  const [events, setEvents] = useState<SeasonEvent[]>(DEFAULT_EVENTS);

  useEffect(() => {
    if (!user) { setEvents(DEFAULT_EVENTS); return; }
    apiGet<SeasonEvent[]>('seasonEvents').then(data => setEvents(data ?? DEFAULT_EVENTS));
  }, [user?.id]);
  const [showForm, setShowForm] = useState(false);
  const [fLabel, setFLabel] = useState('');
  const [fCat, setFCat] = useState<EventCat>('livestock');
  const [fMonths, setFMonths] = useState<number[]>([]);
  const [fColor, setFColor] = useState('#ea580c');

  const grouped = useMemo(() => {
    const cats: EventCat[] = ['livestock', 'health', 'pasture', 'maintenance'];
    return cats.map(cat => ({ cat, events: events.filter(e => e.cat === cat) }));
  }, [events]);

  function toggleMonth(m: number) {
    setFMonths(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m].sort((a, b) => a - b));
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!fLabel.trim() || fMonths.length === 0) return;
    const next = [...events, { id: `custom-${Date.now()}`, label: fLabel.trim(), cat: fCat, months: fMonths, color: fColor, isCustom: true }];
    setEvents(next); apiSet('seasonEvents', next);
    setFLabel(''); setFCat('livestock'); setFMonths([]); setFColor('#ea580c');
    setShowForm(false);
  }

  function removeEvent(id: string) {
    const next = events.filter(e => e.id !== id);
    setEvents(next); apiSet('seasonEvents', next);
  }

  function resetToDefaults() { setEvents(DEFAULT_EVENTS); apiSet('seasonEvents', DEFAULT_EVENTS); }

  return (
    <PlusGate
      feature="Season Planner"
      tagline="Plan your farming year with a full seasonal timeline — lambing, calving, drenching, and everything in between."
      perks={[
        'Year-at-a-glance seasonal calendar',
        'Schedule livestock, health, pasture and maintenance events',
        'Track what happened month by month',
        'Reset to sensible NZ defaults any time',
      ]}
      icon={<Leaf width={28} height={28} />}
    >
    <div className="px-4 pt-6 md:px-8 md:pt-8 max-w-6xl mx-auto pb-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p style={{ fontSize: '22px', fontWeight: 800, color: '#111', letterSpacing: '-0.03em' }}>Seasons Planner</p>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>NZ farming calendar, Tui Ridge, Wairarapa</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-shrink-0 transition-all active:scale-[0.97]"
          style={{ background: showForm ? '#f5f5f4' : '#ea580c', color: showForm ? '#6b7280' : '#fff', fontSize: '13px', fontWeight: 600 }}
        >
          {showForm ? <X width={14} height={14} /> : <Plus width={14} height={14} />}
          {showForm ? 'Cancel' : 'Add Event'}
        </button>
      </div>

      {/* Add form */}
      <AnimatedSection open={showForm}>
        <div className="rounded-2xl overflow-hidden mb-5" style={{ border: '1px solid #ebebeb' }}>
          <div className="px-5 py-4" style={{ background: '#f9f9f8', borderBottom: '1px solid #ebebeb' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>New Calendar Event</p>
          </div>
          <form onSubmit={handleAdd} className="p-5 space-y-4" style={{ background: '#fefefe' }}>
            <div>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Event name *</p>
              <input className={INPUT} placeholder="e.g. Deer velvet harvest" value={fLabel} onChange={e => setFLabel(e.target.value)} required />
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>Category</p>
              <div className="flex gap-1.5 flex-wrap">
                {(Object.entries(CAT_CONFIG) as [EventCat, typeof CAT_CONFIG[EventCat]][]).map(([key, cfg]) => (
                  <button key={key} type="button" onClick={() => setFCat(key)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all"
                    style={{ fontSize: '11px', fontWeight: fCat === key ? 700 : 400, background: fCat === key ? cfg.bg : '#f9f9f8', color: fCat === key ? cfg.color : '#6b7280', border: `1px solid ${fCat === key ? cfg.border : '#e5e7eb'}` }}
                  >
                    <cfg.Icon width={11} height={11} />{cfg.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>Active months <span style={{ color: '#d1d5db' }}>, tap to select</span></p>
              <div className="grid grid-cols-6 md:grid-cols-12 gap-1.5">
                {MONTHS.map((m, mi) => (
                  <button key={mi} type="button" onClick={() => toggleMonth(mi)}
                    className="py-2 rounded-xl transition-all"
                    style={{ fontSize: '11px', fontWeight: fMonths.includes(mi) ? 700 : 400, background: fMonths.includes(mi) ? fColor + '20' : '#f9f9f8', color: fMonths.includes(mi) ? fColor : '#9ca3af', border: `1px solid ${fMonths.includes(mi) ? fColor + '60' : '#e5e7eb'}` }}
                  >{m}</button>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>Colour</p>
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setFColor(c)}
                    className="w-7 h-7 rounded-full transition-all flex items-center justify-center flex-shrink-0"
                    style={{ background: c, boxShadow: fColor === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : 'none' }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={!fLabel.trim() || fMonths.length === 0}
                className="flex-1 py-2.5 rounded-xl transition-all disabled:opacity-40"
                style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 600 }}>
                Add to Calendar
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-xl"
                style={{ background: '#f5f5f4', color: '#6b7280', fontSize: '13px', border: '1px solid #e5e7eb' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </AnimatedSection>

      {/* Gantt calendar */}
      <div className="rounded-2xl overflow-hidden mb-5" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
        <div className="overflow-x-auto">
          <div style={{ minWidth: '680px' }}>

            {/* Month header row */}
            <div className="flex" style={{ borderBottom: '2px solid #f0f0f0' }}>
              <div className="flex-shrink-0 px-4 py-3" style={{ width: '176px', background: '#f9f9f8' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Activity</p>
              </div>
              {MONTHS.map((m, mi) => (
                <div key={mi} className="flex-1 py-2.5 flex flex-col items-center gap-0.5" style={{ background: mi === CURRENT_MONTH ? '#fff7ed' : '#f9f9f8', borderLeft: '1px solid #f0f0f0' }}>
                  <p style={{ fontSize: '10px', fontWeight: mi === CURRENT_MONTH ? 800 : 600, color: mi === CURRENT_MONTH ? '#ea580c' : '#9ca3af', letterSpacing: '0.04em' }}>{m}</p>
                  {mi === CURRENT_MONTH && <div className="w-1 h-1 rounded-full" style={{ background: '#ea580c' }} />}
                </div>
              ))}
            </div>

            {/* Category sections */}
            {grouped.map(({ cat, events: catEvents }) => {
              if (catEvents.length === 0) return null;
              const cfg = CAT_CONFIG[cat];
              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 px-4 py-2" style={{ background: cfg.bg, borderTop: '1px solid #f0f0f0' }}>
                    <cfg.Icon width={11} height={11} style={{ color: cfg.color }} />
                    <p style={{ fontSize: '10px', fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{cfg.label}</p>
                  </div>

                  {catEvents.map((ev, ei) => (
                    <div key={ev.id} className="flex group hover:brightness-[0.98] transition-all" style={{ borderTop: '1px solid #f8f8f8' }}>
                      <div className="flex-shrink-0 px-4 py-2.5 flex items-center gap-2" style={{ width: '176px', background: '#fefefe' }}>
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ev.color }} />
                        <p className="truncate flex-1" style={{ fontSize: '12px', fontWeight: 500, color: '#374151' }}>{ev.label}</p>
                        {ev.isCustom && (
                          <button onClick={() => removeEvent(ev.id)} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-0.5 rounded hover:bg-gray-100">
                            <X width={10} height={10} style={{ color: '#9ca3af' }} />
                          </button>
                        )}
                      </div>
                      {MONTHS.map((_, mi) => {
                        const active = ev.months.includes(mi);
                        const prevActive = ev.months.includes(mi - 1);
                        const nextActive = ev.months.includes(mi + 1);
                        const isCurrent = mi === CURRENT_MONTH;
                        return (
                          <div key={mi} className="flex-1 flex items-center px-0.5 py-2.5" style={{ background: isCurrent ? '#fffaf7' : '#fff', borderLeft: '1px solid #f5f5f5' }}>
                            {active && (
                              <div style={{
                                width: '100%',
                                height: '18px',
                                background: ev.color + '22',
                                border: `1.5px solid ${ev.color}55`,
                                borderRadius: `${!prevActive ? '5px' : '0'} ${!nextActive ? '5px' : '0'} ${!nextActive ? '5px' : '0'} ${!prevActive ? '5px' : '0'}`,
                                borderLeft: prevActive ? 'none' : undefined,
                                borderRight: nextActive ? 'none' : undefined,
                                marginLeft: prevActive ? '-1px' : 0,
                                marginRight: nextActive ? '-1px' : 0,
                              }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend + reset */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex flex-wrap gap-4">
          {(Object.entries(CAT_CONFIG) as [EventCat, typeof CAT_CONFIG[EventCat]][]).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <cfg.Icon width={11} height={11} style={{ color: cfg.color }} />
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>{cfg.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2 rounded-sm" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }} />
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>Current month</span>
          </div>
        </div>
        <button onClick={resetToDefaults} className="transition-colors hover:text-gray-600" style={{ fontSize: '11px', color: '#d1d5db' }}>
          Reset to defaults
        </button>
      </div>

      {/* Seasonal tip cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SEASON_NOTES.map(({ label, color, tips }) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#111' }}>{label}</p>
            </div>
            <ul className="space-y-1.5">
              {tips.map(tip => (
                <li key={tip} className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full mt-[7px] flex-shrink-0" style={{ background: color }} />
                  <p style={{ fontSize: '11px', color: '#6b7280', lineHeight: '1.55' }}>{tip}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

    </div>
    </PlusGate>
  );
}

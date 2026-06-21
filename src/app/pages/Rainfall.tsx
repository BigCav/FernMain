import { useState, useMemo } from 'react';
import { PlusGate } from '../components/PlusGate';
import { Plus, X, CloudRain, Droplets, BarChart2, Pencil, Check } from 'lucide-react';
import { useWaterLog, WaterLogType, WaterEntry, Tank } from '../context/WaterLogContext';
import { AnimatedSection } from '../components/AnimatedSection';
import { DropdownSelect } from '../components/DropdownSelect';
import { DatePickerInput } from '../components/DatePickerInput';
import { PageHeader } from '../components/PageHeader';

// ── Helpers ───────────────────────────────────────────────────────────────────
const INPUT = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none bg-white text-gray-900 transition-colors focus:border-orange-400 text-[13px]';

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-NZ', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

function daysDiff(dateStr: string) {
  const then = new Date(dateStr + 'T12:00:00').getTime();
  const now  = Date.now();
  return Math.round((now - then) / 86400000);
}

function monthKey(d: string) { return d.slice(0, 7); }

function getRecentMonths(n: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

function monthShort(ym: string) {
  const [y, m] = ym.split('-');
  return new Date(+y, +m - 1, 1).toLocaleDateString('en-NZ', { month: 'short', year: '2-digit' });
}

// ── Tank level bar ─────────────────────────────────────────────────────────────
function TankBar({ pct }: { pct: number }) {
  return (
    <div className="rounded-full overflow-hidden" style={{ height: '6px', background: '#f1f5f9' }}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, background: pct >= 70 ? '#3b82f6' : pct >= 40 ? '#f59e0b' : '#ef4444' }}
      />
    </div>
  );
}

// ── Monthly rainfall chart ─────────────────────────────────────────────────────
function RainfallChart({ entries }: { entries: WaterEntry[] }) {
  const MONTHS = getRecentMonths(4);
  const data = MONTHS.map((m) => ({
    label: monthShort(m),
    key: m,
    total: entries
      .filter((e) => e.type === 'rainfall' && monthKey(e.date) === m)
      .reduce((s, e) => s + (e.rainfall_mm ?? 0), 0),
  }));
  const maxVal = Math.max(...data.map((d) => d.total), 1);
  const currentMonth = getRecentMonths(1)[0];

  return (
    <div>
      <div className="flex items-end gap-3" style={{ height: '80px' }}>
        {data.map((d) => (
          <div key={d.label} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
            <span style={{ fontSize: '9px', color: '#9ca3af', fontVariantNumeric: 'tabular-nums' }}>
              {d.total > 0 ? `${d.total.toFixed(0)}` : ''}
            </span>
            <div
              className="w-full rounded-t-md transition-all"
              title={`${d.total.toFixed(1)} mm`}
              style={{
                background: d.key === currentMonth ? '#3b82f6' : '#bfdbfe',
                height: `${Math.max((d.total / maxVal) * 100, d.total > 0 ? 6 : 0)}%`,
                minHeight: d.total > 0 ? '6px' : '0',
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-1.5">
        {data.map((d) => (
          <div key={d.label} className="flex-1 text-center">
            <span style={{ fontSize: '10px', color: '#9ca3af' }}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tank summary cards ─────────────────────────────────────────────────────────
function TankSummary({ tanks, entries }: { tanks: Tank[]; entries: WaterEntry[] }) {
  if (tanks.length === 0) {
    return (
      <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', padding: '16px 0' }}>
        No tanks configured yet.
      </p>
    );
  }
  return (
    <div
      className="flex gap-3 overflow-x-auto pb-1"
      style={{ scrollbarWidth: 'none' }}
    >
      {tanks.map((tank) => {
        const latest = entries
          .filter((e) => e.type === 'tank' && e.tank_id === tank.id)
          .sort((a, b) => b.date.localeCompare(a.date))[0];
        const pct    = latest?.tank_pct ?? 0;
        const litres = Math.round((pct / 100) * tank.capacity_l);
        const color  = pct >= 70 ? '#3b82f6' : pct >= 40 ? '#f59e0b' : '#ef4444';
        const bg     = pct >= 70 ? '#eff6ff' : pct >= 40 ? '#fffbeb' : '#fef2f2';

        return (
          <div key={tank.id} className="rounded-2xl p-4 flex-shrink-0" style={{ background: '#fefefe', border: '1px solid #ebebeb', minWidth: '180px', flex: '1 0 180px' }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#111' }}>{tank.name}</p>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>{tank.location}</p>
              </div>
              <div className="px-2 py-0.5 rounded-lg" style={{ background: bg, fontSize: '12px', fontWeight: 800, color }}>
                {pct}%
              </div>
            </div>
            <TankBar pct={pct} />
            <div className="flex items-center justify-between mt-2">
              <span style={{ fontSize: '11px', color: '#6b7280' }}>
                {litres.toLocaleString()} L of {tank.capacity_l.toLocaleString()} L
              </span>
              {latest && (
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                  {daysDiff(latest.date) === 0 ? 'Today' : `${daysDiff(latest.date)}d ago`}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
type TabKey = 'log' | 'tanks';
type FilterKey = 'all' | 'rainfall' | 'tank';

export function Rainfall() {
  const { entries, tanks, addEntry, removeEntry, addTank, updateTank, removeTank } = useWaterLog();

  const [tab,      setTab]      = useState<TabKey>('log');
  const [filter,   setFilter]   = useState<FilterKey>('all');
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Reading form state
  const [fType,   setFType]   = useState<WaterLogType>('rainfall');
  const [fMm,     setFMm]     = useState('');
  const [fPct,    setFPct]    = useState('');
  const [fTankId, setFTankId] = useState('');
  const [fDate,   setFDate]   = useState(() => new Date().toISOString().slice(0, 10));
  const [fNotes,  setFNotes]  = useState('');

  // Tank management state
  const [showAddTank,  setShowAddTank]  = useState(false);
  const [editingTankId, setEditingTankId] = useState<string | null>(null);
  const [deleteTankId, setDeleteTankId] = useState<string | null>(null);
  const [tName,     setTName]     = useState('');
  const [tCapacity, setTCapacity] = useState('');
  const [tLocation, setTLocation] = useState('');

  function resetForm() {
    setFType('rainfall'); setFMm(''); setFPct('');
    setFTankId(tanks[0]?.id ?? '');
    setFDate(new Date().toISOString().slice(0, 10)); setFNotes('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (fType === 'rainfall' && !fMm) return;
    if (fType === 'tank'     && !fPct) return;
    addEntry({
      date:        fDate,
      type:        fType,
      rainfall_mm: fType === 'rainfall' ? parseFloat(fMm) : undefined,
      tank_pct:    fType === 'tank'     ? parseInt(fPct)   : undefined,
      tank_id:     fType === 'tank'     ? (fTankId || tanks[0]?.id || '') : undefined,
      notes:       fNotes.trim() || undefined,
    });
    resetForm();
    setShowForm(false);
  }

  function handleAddTank(e: React.FormEvent) {
    e.preventDefault();
    if (!tName.trim() || !tCapacity) return;
    addTank({ name: tName.trim(), capacity_l: parseInt(tCapacity), location: tLocation.trim() });
    setTName(''); setTCapacity(''); setTLocation('');
    setShowAddTank(false);
  }

  function startEditTank(tank: Tank) {
    setEditingTankId(tank.id);
    setTName(tank.name);
    setTCapacity(String(tank.capacity_l));
    setTLocation(tank.location);
  }

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTankId || !tName.trim() || !tCapacity) return;
    updateTank(editingTankId, { name: tName.trim(), capacity_l: parseInt(tCapacity), location: tLocation.trim() });
    setEditingTankId(null);
    setTName(''); setTCapacity(''); setTLocation('');
  }

  // Stats
  const rainfallEntries = useMemo(
    () => entries.filter((e) => e.type === 'rainfall'),
    [entries],
  );

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const monthlyTotals = useMemo(() => ({
    this: rainfallEntries
      .filter((e) => e.date.startsWith(thisMonth))
      .reduce((s, e) => s + (e.rainfall_mm ?? 0), 0),
    last: rainfallEntries
      .filter((e) => e.date.startsWith(lastMonth))
      .reduce((s, e) => s + (e.rainfall_mm ?? 0), 0),
    ytd: rainfallEntries
      .filter((e) => e.date.startsWith(String(now.getFullYear())))
      .reduce((s, e) => s + (e.rainfall_mm ?? 0), 0),
  }), [rainfallEntries, thisMonth, lastMonth]);

  const displayed = useMemo(
    () => entries.filter((e) => filter === 'all' || e.type === filter),
    [entries, filter],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, WaterEntry[]>();
    displayed.forEach((e) => {
      const mk = monthKey(e.date);
      if (!map.has(mk)) map.set(mk, []);
      map.get(mk)!.push(e);
    });
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [displayed]);

  const activeTankId = fTankId || tanks[0]?.id || '';

  return (
    <PlusGate
      feature="Rainfall & Water"
      tagline="Record rainfall and monitor your water tanks so you always know where you stand through dry spells."
      perks={[
        'Log daily rainfall readings',
        'Track tank levels as a percentage and in litres',
        'Spot dry spells with the rainfall timeline',
        'Get alerted when tanks run low',
      ]}
      icon={<CloudRain width={28} height={28} />}
    >
    <div className="pb-8">

      <PageHeader
        title="Rainfall & Water"
        action={
          <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-shrink-0 transition-all active:scale-[0.97]" style={{ background: showForm ? '#f5f5f4' : '#ea580c', color: showForm ? '#6b7280' : '#fff', fontSize: '13px', fontWeight: 600 }}>
            {showForm ? <X width={14} height={14} /> : <Plus width={14} height={14} />}
            {showForm ? 'Cancel' : 'Log Reading'}
          </button>
        }
        chips={[{ label: 'Rain gauge and tank levels', variant: 'neutral' }]}
      />

      <div className="max-w-5xl mx-auto px-4 md:px-8">

      {/* ── Tabs ── */}
      <div className="flex gap-1.5 mb-5">
        {([['log', 'Log'], ['tanks', 'Tanks']] as [TabKey, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="px-4 py-2 rounded-xl transition-all"
            style={{
              fontSize: '13px',
              fontWeight: tab === key ? 700 : 400,
              background: tab === key ? '#111' : '#fff',
              color:      tab === key ? '#fff' : '#6b7280',
              border:     `1px solid ${tab === key ? '#111' : '#e5e7eb'}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Add reading form ── */}
      <AnimatedSection open={showForm}>
        <div className="rounded-2xl overflow-hidden mb-5" style={{ border: '1px solid #ebebeb' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ background: '#f9f8f6', borderBottom: '1px solid #ebebeb' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>New Reading</p>
            <button onClick={() => { resetForm(); setShowForm(false); }}>
              <X width={14} height={14} style={{ color: '#9ca3af' }} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4" style={{ background: '#fefefe' }}>
            {/* Type toggle */}
            <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #e5e7eb' }}>
              {([['rainfall', 'Rainfall (mm)'], ['tank', 'Tank Level']] as [WaterLogType, string][]).map(([t, label]) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFType(t)}
                  className="flex-1 py-2.5 transition-all flex items-center justify-center gap-1.5"
                  style={{
                    fontSize: '12px',
                    fontWeight: fType === t ? 700 : 400,
                    background: fType === t ? '#eff6ff' : '#fff',
                    color:      fType === t ? '#3b82f6' : '#6b7280',
                    border:     'none',
                  }}
                >
                  {t === 'rainfall' ? <CloudRain width={12} height={12} /> : <Droplets width={12} height={12} />}
                  {label}
                </button>
              ))}
            </div>

            {fType === 'rainfall' ? (
              <div>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Rainfall (mm) *</p>
                <input
                  type="number" min="0" step="any" className={INPUT} placeholder="e.g. 12.5"
                  value={fMm} onChange={(e) => setFMm(e.target.value)} required
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Tank *</p>
                  {tanks.length === 0 ? (
                    <p style={{ fontSize: '12px', color: '#9ca3af', padding: '10px 0' }}>
                      No tanks yet — add one in the Tanks tab.
                    </p>
                  ) : (
                    <DropdownSelect
                      value={activeTankId}
                      onChange={setFTankId}
                      placeholder="Select tank"
                      options={tanks.map((t) => ({ label: t.name, value: t.id }))}
                    />
                  )}
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Level (%) *</p>
                  <input
                    type="number" min="0" max="100" step="1" className={INPUT} placeholder="e.g. 75"
                    value={fPct} onChange={(e) => setFPct(e.target.value)} required
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Date *</p>
                <DatePickerInput value={fDate} onChange={v => setFDate(v)} placeholder="Date" />
              </div>
              <div>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Notes</p>
                <input className={INPUT} placeholder="Optional notes" value={fNotes} onChange={(e) => setFNotes(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={(fType === 'rainfall' && !fMm) || (fType === 'tank' && (!fPct || tanks.length === 0))}
                className="flex-1 py-2.5 rounded-xl transition-all disabled:opacity-40"
                style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 600 }}
              >
                Save Reading
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

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'This Month', value: `${monthlyTotals.this.toFixed(1)}mm`, color: '#3b82f6' },
          { label: 'Last Month', value: `${monthlyTotals.last.toFixed(1)}mm`, color: '#111' },
          { label: 'YTD Total',  value: `${monthlyTotals.ytd.toFixed(0)}mm`,  color: '#111' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-4 transition-all hover:shadow-sm hover:-translate-y-px" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
            <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>{label}</p>
            <p style={{ fontSize: '22px', fontWeight: 800, color, letterSpacing: '-0.03em' }}>{value}</p>
          </div>
        ))}
        <div className="rounded-2xl p-4 transition-all hover:shadow-sm hover:-translate-y-px" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
          <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>Last Rain</p>
          {(() => {
            const last = [...rainfallEntries].sort((a, b) => b.date.localeCompare(a.date))[0];
            const d = last ? daysDiff(last.date) : null;
            return (
              <p style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.03em', color: d === null ? '#9ca3af' : d <= 2 ? '#3b82f6' : d <= 7 ? '#f59e0b' : '#9ca3af' }}>
                {d === null ? '—' : d === 0 ? 'Today' : `${d}d`}
              </p>
            );
          })()}
        </div>
      </div>

      {/* ── Chart + Tanks summary ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        <div className="rounded-2xl p-5" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 width={14} height={14} style={{ color: '#3b82f6' }} />
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#111' }}>Monthly rainfall (mm)</p>
          </div>
          <RainfallChart entries={entries} />
        </div>
        <div className="rounded-2xl p-5" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
          <div className="flex items-center gap-2 mb-4">
            <Droplets width={14} height={14} style={{ color: '#3b82f6' }} />
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#111' }}>Tank levels</p>
          </div>
          <TankSummary tanks={tanks} entries={entries} />
        </div>
      </div>

      {/* ── Tanks tab ── */}
      {tab === 'tanks' && (
        <div className="pb-8">

          {/* Add tank form */}
          <AnimatedSection open={showAddTank}>
            <div className="rounded-2xl overflow-hidden mb-4" style={{ border: '1px solid #ebebeb' }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ background: '#f9f8f6', borderBottom: '1px solid #ebebeb' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>Add Tank</p>
                <button onClick={() => setShowAddTank(false)}>
                  <X width={14} height={14} style={{ color: '#9ca3af' }} />
                </button>
              </div>
              <form onSubmit={handleAddTank} className="p-5 space-y-4" style={{ background: '#fefefe' }}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Tank name *</p>
                    <input className={INPUT} placeholder="e.g. House Tank" value={tName} onChange={e => setTName(e.target.value)} required />
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Capacity (litres) *</p>
                    <input type="number" min="1" className={INPUT} placeholder="e.g. 25000" value={tCapacity} onChange={e => setTCapacity(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Location</p>
                  <input className={INPUT} placeholder="e.g. Near woolshed" value={tLocation} onChange={e => setTLocation(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={!tName.trim() || !tCapacity}
                    className="flex-1 py-2.5 rounded-xl transition-all disabled:opacity-40"
                    style={{ background: '#3b82f6', color: '#fff', fontSize: '13px', fontWeight: 600 }}
                  >
                    Add Tank
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddTank(false); setTName(''); setTCapacity(''); setTLocation(''); }}
                    className="px-4 py-2.5 rounded-xl"
                    style={{ background: '#f5f5f4', color: '#6b7280', fontSize: '13px', border: '1px solid #e5e7eb' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </AnimatedSection>

          {tanks.length === 0 && !showAddTank ? (
            <div className="rounded-2xl py-14 flex flex-col items-center gap-4" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#eff6ff' }}>
                <Droplets width={22} height={22} style={{ color: '#3b82f6' }} />
              </div>
              <div className="text-center">
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#374151' }}>No tanks yet</p>
                <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Add your water tanks to track levels over time.</p>
              </div>
              <button
                onClick={() => setShowAddTank(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl"
                style={{ background: '#3b82f6', color: '#fff', fontSize: '13px', fontWeight: 600 }}
              >
                <Plus width={14} height={14} />
                Add first tank
              </button>
            </div>
          ) : (
            <>
              {!showAddTank && (
                <button
                  onClick={() => { setShowAddTank(true); setEditingTankId(null); setTName(''); setTCapacity(''); setTLocation(''); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all mb-4"
                  style={{ background: '#fefefe', border: '1px solid #e5e7eb', color: '#374151', fontSize: '13px', fontWeight: 600 }}
                >
                  <Plus width={14} height={14} style={{ color: '#3b82f6' }} />
                  Add Tank
                </button>
              )}

              <div className="space-y-4">
              {tanks.map((tank) => {
                const tankEntries = entries
                  .filter((e) => e.type === 'tank' && e.tank_id === tank.id)
                  .sort((a, b) => b.date.localeCompare(a.date));
                const latest = tankEntries[0];
                const pct    = latest?.tank_pct ?? 0;
                const color  = pct >= 70 ? '#3b82f6' : pct >= 40 ? '#f59e0b' : '#ef4444';
                const litres = Math.round((pct / 100) * tank.capacity_l);
                const isEditing = editingTankId === tank.id;

                return (
                  <div key={tank.id} className="rounded-2xl overflow-hidden" style={{ border: '1px solid #ebebeb' }}>
                    {/* Tank header */}
                    {isEditing ? (
                      <form onSubmit={handleSaveEdit} className="px-5 py-4 space-y-3" style={{ background: '#f9f8f6', borderBottom: '1px solid #ebebeb' }}>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Name *</p>
                            <input className={INPUT} value={tName} onChange={e => setTName(e.target.value)} required />
                          </div>
                          <div>
                            <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Capacity (L) *</p>
                            <input type="number" min="1" className={INPUT} value={tCapacity} onChange={e => setTCapacity(e.target.value)} required />
                          </div>
                        </div>
                        <div>
                          <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Location</p>
                          <input className={INPUT} value={tLocation} onChange={e => setTLocation(e.target.value)} />
                        </div>
                        <div className="flex gap-2">
                          <button type="submit" className="flex items-center gap-1.5 px-4 py-2 rounded-xl" style={{ background: '#3b82f6', color: '#fff', fontSize: '12px', fontWeight: 600 }}>
                            <Check width={12} height={12} /> Save
                          </button>
                          <button type="button" onClick={() => setEditingTankId(null)} className="px-4 py-2 rounded-xl" style={{ background: '#f5f5f4', color: '#6b7280', fontSize: '12px', border: '1px solid #e5e7eb' }}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="px-5 py-4 flex items-center justify-between" style={{ background: '#f9f8f6', borderBottom: '1px solid #ebebeb' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: pct >= 70 ? '#eff6ff' : pct >= 40 ? '#fffbeb' : '#fef2f2' }}>
                            <Droplets width={15} height={15} style={{ color }} />
                          </div>
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>{tank.name}</p>
                            <p style={{ fontSize: '11px', color: '#9ca3af' }}>{tank.location} · {tank.capacity_l.toLocaleString()} L capacity</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p style={{ fontSize: '22px', fontWeight: 800, color, letterSpacing: '-0.03em' }}>{pct}%</p>
                            <p style={{ fontSize: '10px', color: '#9ca3af' }}>{litres.toLocaleString()} L</p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => startEditTank(tank)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                              style={{ background: '#f0f0f0' }}
                            >
                              <Pencil width={11} height={11} style={{ color: '#6b7280' }} />
                            </button>
                            {deleteTankId === tank.id ? (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => { removeTank(tank.id); setDeleteTankId(null); }}
                                  className="px-2 py-1 rounded-lg text-white"
                                  style={{ fontSize: '10px', fontWeight: 700, background: '#dc2626' }}
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => setDeleteTankId(null)}
                                  className="px-2 py-1 rounded-lg"
                                  style={{ fontSize: '10px', background: '#f5f5f5', color: '#6b7280' }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteTankId(tank.id)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                                style={{ background: '#fee2e2' }}
                              >
                                <X width={11} height={11} style={{ color: '#dc2626' }} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Level bar */}
                    <div className="px-5 py-3" style={{ background: '#fefefe', borderBottom: '1px solid #f5f5f5' }}>
                      <div className="rounded-full overflow-hidden" style={{ height: '8px', background: '#f1f5f9' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>

                    {/* History entries */}
                    {tankEntries.length === 0 ? (
                      <div className="px-5 py-4 text-center">
                        <p style={{ fontSize: '12px', color: '#9ca3af' }}>No readings recorded yet.</p>
                      </div>
                    ) : (
                      <div>
                        {tankEntries.slice(0, 6).map((e, i) => {
                          const epct   = e.tank_pct ?? 0;
                          const ecolor = epct >= 70 ? '#3b82f6' : epct >= 40 ? '#f59e0b' : '#ef4444';
                          const ebg    = epct >= 70 ? '#eff6ff' : epct >= 40 ? '#fffbeb' : '#fef2f2';
                          return (
                            <div
                              key={e.id}
                              className="flex items-center gap-3 px-5 py-3 group"
                              style={{ background: '#fefefe', borderBottom: i < Math.min(tankEntries.length, 6) - 1 ? '1px solid #f5f5f5' : 'none' }}
                            >
                              <span style={{ fontSize: '11px', color: '#9ca3af', width: '120px', flexShrink: 0 }}>
                                {fmtDate(e.date)}
                              </span>
                              <div className="flex-1">
                                <div className="rounded-full overflow-hidden" style={{ height: '4px', background: '#f1f5f9' }}>
                                  <div className="h-full rounded-full" style={{ width: `${epct}%`, background: ecolor }} />
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-lg" style={{ fontSize: '11px', fontWeight: 700, background: ebg, color: ecolor }}>
                                  {epct}%
                                </span>
                                {deleteId === e.id ? (
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => { removeEntry(e.id); setDeleteId(null); }}
                                      className="px-2 py-1 rounded-lg text-white"
                                      style={{ fontSize: '10px', fontWeight: 700, background: '#dc2626' }}
                                    >
                                      Delete
                                    </button>
                                    <button
                                      onClick={() => setDeleteId(null)}
                                      className="px-2 py-1 rounded-lg"
                                      style={{ fontSize: '10px', background: '#f5f5f5', color: '#6b7280' }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDeleteId(e.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-gray-100"
                                  >
                                    <X width={11} height={11} style={{ color: '#9ca3af' }} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Log tab ── */}
      {tab === 'log' && (
        <>
          <div className="flex gap-1.5 mb-3">
            {([['all', 'All'], ['rainfall', 'Rainfall'], ['tank', 'Tank Levels']] as [FilterKey, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="px-3 py-1.5 rounded-xl transition-all"
                style={{
                  fontSize: '12px',
                  fontWeight: filter === key ? 700 : 400,
                  background: filter === key ? '#111' : '#fff',
                  color:      filter === key ? '#fff' : '#6b7280',
                  border:     `1px solid ${filter === key ? '#111' : '#e5e7eb'}`,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {grouped.length === 0 ? (
            <div className="py-16 text-center">
              <p style={{ fontSize: '13px', color: '#9ca3af' }}>No readings found.</p>
            </div>
          ) : (
            <div className="space-y-5 pb-8">
              {grouped.map(([mk, monthEntries]) => {
                const [y, m] = mk.split('-');
                const monthName = new Date(+y, +m - 1, 1).toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' });
                const monthRain = monthEntries
                  .filter((e) => e.type === 'rainfall')
                  .reduce((s, e) => s + (e.rainfall_mm ?? 0), 0);

                const byDate = new Map<string, WaterEntry[]>();
                monthEntries.forEach((e) => {
                  if (!byDate.has(e.date)) byDate.set(e.date, []);
                  byDate.get(e.date)!.push(e);
                });
                const dates = Array.from(byDate.entries()).sort(([a], [b]) => b.localeCompare(a));

                return (
                  <div key={mk}>
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        {monthName}
                      </span>
                      {monthRain > 0 && (
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#3b82f6', fontVariantNumeric: 'tabular-nums' }}>
                          {monthRain.toFixed(1)} mm total
                        </span>
                      )}
                    </div>

                    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #ebebeb' }}>
                      {dates.map(([date, dayEntries], di) => (
                        <div key={date}>
                          {dayEntries.map((e, ei) => {
                            const isLast = di === dates.length - 1 && ei === dayEntries.length - 1;
                            const isRain = e.type === 'rainfall';
                            const tank   = tanks.find((t) => t.id === e.tank_id);
                            const pct    = e.tank_pct ?? 0;
                            const color  = isRain ? '#3b82f6' : pct >= 70 ? '#3b82f6' : pct >= 40 ? '#f59e0b' : '#ef4444';
                            const bg     = isRain ? '#eff6ff' : pct >= 70 ? '#eff6ff' : pct >= 40 ? '#fffbeb' : '#fef2f2';

                            return (
                              <div
                                key={e.id}
                                className="flex items-center gap-3 px-4 py-3.5 group"
                                style={{ background: '#fefefe', borderBottom: !isLast ? '1px solid #f5f5f5' : 'none' }}
                              >
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                                  {isRain
                                    ? <CloudRain width={15} height={15} style={{ color }} />
                                    : <Droplets  width={15} height={15} style={{ color }} />
                                  }
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>
                                    {isRain ? `${e.rainfall_mm}mm rainfall` : `${tank?.name ?? 'Tank'} — ${pct}%`}
                                  </p>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>{fmtDate(date)}</span>
                                    {e.notes && (
                                      <>
                                        <span style={{ fontSize: '10px', color: '#d1d5db' }}>·</span>
                                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>{e.notes}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className="px-2 py-0.5 rounded-lg" style={{ fontSize: '12px', fontWeight: 700, background: bg, color }}>
                                    {isRain ? `${e.rainfall_mm} mm` : `${pct}%`}
                                  </span>
                                  {deleteId === e.id ? (
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => { removeEntry(e.id); setDeleteId(null); }}
                                        className="px-2 py-1 rounded-lg text-white"
                                        style={{ fontSize: '10px', fontWeight: 700, background: '#dc2626' }}
                                      >
                                        Delete
                                      </button>
                                      <button
                                        onClick={() => setDeleteId(null)}
                                        className="px-2 py-1 rounded-lg"
                                        style={{ fontSize: '10px', background: '#f5f5f5', color: '#6b7280' }}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setDeleteId(e.id)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-gray-100"
                                    >
                                      <X width={12} height={12} style={{ color: '#9ca3af' }} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      </div>
    </div>
    </PlusGate>
  );
}

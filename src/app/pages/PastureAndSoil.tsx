import { useState, useMemo, useEffect } from 'react';
import { PlusGate } from '../components/PlusGate';
import { Plus, X, Leaf, FlaskConical, Sprout, ChevronDown, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePaddocks } from '../context/PaddocksContext';
import { apiGet, apiSet } from '../lib/api';
import { AnimatedSection } from '../components/AnimatedSection';
import { DatePickerInput } from '../components/DatePickerInput';

const INPUT = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none bg-white text-gray-900 transition-colors focus:border-orange-400 text-[13px]';

// ── Types ──────────────────────────────────────────────────────────────────────

interface PastureReading {
  id: string;
  paddockId: string;
  date: string;
  coverKgDM: number;
  notes?: string;
}

interface SoilTest {
  id: string;
  paddockId: string;
  date: string;
  pH?: number;
  olsenP?: number;
  potassiumK?: number;
  sulfurS?: number;
  lab?: string;
  notes?: string;
}

interface FertiliserLog {
  id: string;
  paddockId: string;
  date: string;
  product: string;
  rateKgHa: number;
  costPerHa?: number;
  notes?: string;
}

// ── Cover status ───────────────────────────────────────────────────────────────

function coverStatus(kg: number): { label: string; color: string; bg: string; border: string } {
  if (kg < 800)  return { label: 'Critical',  color: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
  if (kg < 1500) return { label: 'Low',       color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' };
  if (kg < 2800) return { label: 'Target',    color: '#4ade80', bg: '#f0fdf4', border: '#bbf7d0' };
  return           { label: 'Surplus',  color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' };
}

function pHStatus(pH: number): { color: string; bg: string; label: string } {
  if (pH < 5.5) return { color: '#dc2626', bg: '#fef2f2', label: 'Too acid' };
  if (pH < 5.9) return { color: '#ea580c', bg: '#fff7ed', label: 'Low' };
  if (pH < 6.6) return { color: '#16a34a', bg: '#f0fdf4', label: 'Ideal' };
  return          { color: '#3b82f6', bg: '#eff6ff', label: 'High' };
}

function olsenStatus(p: number): { color: string; bg: string; label: string } {
  if (p < 15) return { color: '#dc2626', bg: '#fef2f2', label: 'Very low' };
  if (p < 25) return { color: '#ea580c', bg: '#fff7ed', label: 'Low' };
  if (p < 45) return { color: '#16a34a', bg: '#f0fdf4', label: 'Optimal' };
  return        { color: '#3b82f6', bg: '#eff6ff', label: 'High' };
}

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });
}
function daysDiff(d: string) {
  return Math.round((new Date('2026-05-17').getTime() - new Date(d + 'T12:00:00').getTime()) / 86400000);
}

// ── Mock seed data ─────────────────────────────────────────────────────────────

const MOCK_PASTURE: PastureReading[] = [
  { id: 'pr-1', paddockId: 'p-north',    date: '2026-05-10', coverKgDM: 2100 },
  { id: 'pr-2', paddockId: 'p-south',    date: '2026-05-14', coverKgDM: 850, notes: 'Heavily grazed, need to move stock' },
  { id: 'pr-3', paddockId: 'p-backbush', date: '2026-05-03', coverKgDM: 3200, notes: 'Resting well' },
  { id: 'pr-4', paddockId: 'p-house',    date: '2026-05-12', coverKgDM: 1750 },
  { id: 'pr-5', paddockId: 'p-north',    date: '2026-04-22', coverKgDM: 1900 },
  { id: 'pr-6', paddockId: 'p-south',    date: '2026-04-28', coverKgDM: 1600 },
];

const MOCK_SOIL: SoilTest[] = [
  { id: 'st-1', paddockId: 'p-north',    date: '2025-08-15', pH: 6.1, olsenP: 28, potassiumK: 8,  sulfurS: 6,  lab: 'Hill Laboratories' },
  { id: 'st-2', paddockId: 'p-south',    date: '2025-08-15', pH: 5.6, olsenP: 15, potassiumK: 5,  sulfurS: 4,  lab: 'Hill Laboratories', notes: 'Low P, apply superphosphate' },
  { id: 'st-3', paddockId: 'p-backbush', date: '2026-02-10', pH: 5.8, olsenP: 22, potassiumK: 7,  lab: 'Hill Laboratories' },
  { id: 'st-4', paddockId: 'p-house',    date: '2025-09-01', pH: 6.3, olsenP: 32, potassiumK: 10, sulfurS: 7 },
];

const MOCK_FERT: FertiliserLog[] = [
  { id: 'fl-1', paddockId: 'p-north',    date: '2026-04-05', product: 'Superphosphate',    rateKgHa: 250, costPerHa: 62 },
  { id: 'fl-2', paddockId: 'p-south',    date: '2026-04-05', product: 'Superphosphate',    rateKgHa: 300, costPerHa: 74, notes: 'Extra for low P result' },
  { id: 'fl-3', paddockId: 'all',        date: '2025-10-20', product: 'Ag lime',           rateKgHa: 2000, costPerHa: 45, notes: 'Aerial application' },
  { id: 'fl-4', paddockId: 'p-north',    date: '2025-08-10', product: 'Urea',              rateKgHa: 50,  costPerHa: 42 },
];


type Tab = 'pasture' | 'soil' | 'fertiliser';

export function PastureAndSoil() {
  const { user } = useAuth();
  const { paddocks } = usePaddocks();
  const [tab, setTab] = useState<Tab>('pasture');

  // Pasture state
  const [pastureReadings, setPastureReadings] = useState<PastureReading[]>([]);
  const [showPastureForm, setShowPastureForm] = useState(false);
  const [pPaddock, setPPaddock] = useState('');
  const [pDate, setPDate] = useState('2026-05-17');
  const [pCover, setPCover] = useState('');
  const [pNotes, setPNotes] = useState('');

  // Soil state
  const [soilTests, setSoilTests] = useState<SoilTest[]>([]);
  const [showSoilForm, setShowSoilForm] = useState(false);
  const [sPaddock, setSPaddock] = useState('');
  const [sDate, setSDate] = useState('2026-05-17');
  const [sPH, setSPH] = useState('');
  const [sOlsenP, setSOlsenP] = useState('');
  const [sK, setSK] = useState('');
  const [sS, setSS] = useState('');
  const [sLab, setSLab] = useState('');
  const [sNotes, setSNotes] = useState('');

  // Fertiliser state
  const [fertLogs, setFertLogs] = useState<FertiliserLog[]>([]);
  const [showFertForm, setShowFertForm] = useState(false);
  const [fPaddock, setFPaddock] = useState('');
  const [fDate, setFDate] = useState('2026-05-17');
  const [fProduct, setFProduct] = useState('');
  const [fRate, setFRate] = useState('');
  const [fCost, setFCost] = useState('');
  const [fNotes, setFNotes] = useState('');

  useEffect(() => {
    if (!user) { setPastureReadings([]); setSoilTests([]); setFertLogs([]); return; }
    apiGet<PastureReading[]>('pastureReadings').then(data => setPastureReadings(data ?? []));
    apiGet<SoilTest[]>('soilTests').then(data => setSoilTests(data ?? []));
    apiGet<FertiliserLog[]>('fertLogs').then(data => setFertLogs(data ?? []));
  }, [user?.id]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const paddockSummaries = useMemo(() => paddocks.map(p => {
    const readings = pastureReadings.filter(r => r.paddockId === p.id).sort((a, b) => b.date.localeCompare(a.date));
    const latest = readings[0];
    const prev = readings[1];
    const trend = latest && prev ? latest.coverKgDM - prev.coverKgDM : null;
    const latestSoil = soilTests.filter(s => s.paddockId === p.id).sort((a, b) => b.date.localeCompare(a.date))[0];
    return { paddock: p, latest, trend, latestSoil, readings };
  }), [pastureReadings, soilTests]);

  const sortedFert = useMemo(() => [...fertLogs].sort((a, b) => b.date.localeCompare(a.date)), [fertLogs]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  function addPasture(e: React.FormEvent) {
    e.preventDefault();
    if (!pCover) return;
    const next = [...pastureReadings, { id: `pr-${Date.now()}`, paddockId: pPaddock, date: pDate, coverKgDM: parseFloat(pCover), notes: pNotes.trim() || undefined }];
    setPastureReadings(next); apiSet('pastureReadings', next);
    setPCover(''); setPNotes(''); setShowPastureForm(false);
  }

  function addSoil(e: React.FormEvent) {
    e.preventDefault();
    const next = [...soilTests, { id: `st-${Date.now()}`, paddockId: sPaddock, date: sDate, pH: sPH ? parseFloat(sPH) : undefined, olsenP: sOlsenP ? parseFloat(sOlsenP) : undefined, potassiumK: sK ? parseFloat(sK) : undefined, sulfurS: sS ? parseFloat(sS) : undefined, lab: sLab.trim() || undefined, notes: sNotes.trim() || undefined }];
    setSoilTests(next); apiSet('soilTests', next);
    setSPH(''); setSOlsenP(''); setSK(''); setSS(''); setSLab(''); setSNotes(''); setShowSoilForm(false);
  }

  function addFert(e: React.FormEvent) {
    e.preventDefault();
    if (!fProduct.trim() || !fRate) return;
    const next = [...fertLogs, { id: `fl-${Date.now()}`, paddockId: fPaddock, date: fDate, product: fProduct.trim(), rateKgHa: parseFloat(fRate), costPerHa: fCost ? parseFloat(fCost) : undefined, notes: fNotes.trim() || undefined }];
    setFertLogs(next); apiSet('fertLogs', next);
    setFProduct(''); setFRate(''); setFCost(''); setFNotes(''); setShowFertForm(false);
  }

  function deleteFert(id: string) {
    const next = fertLogs.filter(f => f.id !== id);
    setFertLogs(next); apiSet('fertLogs', next);
  }

  const PADDOCK_OPTIONS = [{ id: 'all', name: 'All paddocks' }, ...paddocks];

  return (
    <PlusGate
      feature="Pasture & Soil"
      tagline="Log pasture cover readings, soil tests and fertiliser applications to get the most out of your land."
      perks={[
        'Record pasture cover per paddock in kg DM/ha',
        'Track soil test results and pH over time',
        'Log fertiliser applications with cost and coverage',
        'See which paddocks need attention at a glance',
      ]}
      icon={<Sprout width={28} height={28} />}
    >
    <div className="px-4 pt-6 md:px-8 md:pt-8 max-w-5xl mx-auto pb-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p style={{ fontSize: '22px', fontWeight: 800, color: '#111', letterSpacing: '-0.03em' }}>Pasture & Soil</p>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>Pasture cover, soil tests and fertiliser records for Tui Ridge</p>
        </div>
        <button
          onClick={() => { if (tab === 'pasture') setShowPastureForm(v => !v); else if (tab === 'soil') setShowSoilForm(v => !v); else setShowFertForm(v => !v); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-shrink-0 transition-all active:scale-[0.97]"
          style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 600 }}
        >
          <Plus width={14} height={14} />
          {tab === 'pasture' ? 'Log Cover' : tab === 'soil' ? 'Log Test' : 'Log Application'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-5">
        {([['pasture', 'Pasture Cover', Sprout], ['soil', 'Soil Tests', FlaskConical], ['fertiliser', 'Fertiliser', Leaf]] as [Tab, string, React.ElementType][]).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all"
            style={{ fontSize: '13px', fontWeight: tab === key ? 700 : 400, background: tab === key ? '#111' : '#fff', color: tab === key ? '#fff' : '#6b7280', border: `1px solid ${tab === key ? '#111' : '#e5e7eb'}` }}
          >
            <Icon width={13} height={13} />{label}
          </button>
        ))}
      </div>

      {/* ── PASTURE TAB ── */}
      {tab === 'pasture' && (
        <>
          <AnimatedSection open={showPastureForm}>
            <div className="rounded-2xl overflow-hidden mb-5" style={{ border: '1px solid #ebebeb' }}>
              <div className="px-5 py-4" style={{ background: '#f9f9f8', borderBottom: '1px solid #ebebeb' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>Log Pasture Cover</p>
              </div>
              <form onSubmit={addPasture} className="p-5 space-y-4" style={{ background: '#fefefe' }}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Paddock</p>
                    <div className="relative">
                      <select className={INPUT} value={pPaddock} onChange={e => setPPaddock(e.target.value)} style={{ appearance: 'none', paddingRight: '28px' }}>
                        {paddocks.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <ChevronDown width={12} height={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9ca3af' }} />
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Date</p>
                    <DatePickerInput value={pDate} onChange={v => setPDate(v)} placeholder="Date" />
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Cover (kg DM/ha) *</p>
                    <input type="number" min="0" step="50" className={INPUT} placeholder="e.g. 1800" value={pCover} onChange={e => setPCover(e.target.value)} required />
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Notes</p>
                    <input className={INPUT} placeholder="Optional" value={pNotes} onChange={e => setPNotes(e.target.value)} />
                  </div>
                </div>
                <div className="rounded-xl p-3" style={{ background: '#f9f9f8' }}>
                  <p style={{ fontSize: '11px', color: '#6b7280' }}>
                    <span style={{ fontWeight: 600 }}>Guide:</span> &lt;800 Critical · 800–1500 Low · 1500–2800 Target · &gt;2800 Surplus (kg DM/ha)
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={!pCover} className="flex-1 py-2.5 rounded-xl disabled:opacity-40" style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 600 }}>Save Reading</button>
                  <button type="button" onClick={() => setShowPastureForm(false)} className="px-4 py-2.5 rounded-xl" style={{ background: '#f5f5f4', color: '#6b7280', fontSize: '13px', border: '1px solid #e5e7eb' }}>Cancel</button>
                </div>
              </form>
            </div>
          </AnimatedSection>

          {/* Paddock summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {paddockSummaries.map(({ paddock, latest, trend }) => {
              const st = latest ? coverStatus(latest.coverKgDM) : null;
              const daysSince = latest ? daysDiff(latest.date) : null;
              const barPct = latest ? Math.min((latest.coverKgDM / 3500) * 100, 100) : 0;
              return (
                <div key={paddock.id} className="rounded-2xl overflow-hidden" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
                  <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>{paddock.name}</p>
                      <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>{paddock.hectares} ha</p>
                    </div>
                    {st ? (
                      <div className="text-right">
                        <p style={{ fontSize: '22px', fontWeight: 800, color: st.color, letterSpacing: '-0.03em' }}>
                          {latest!.coverKgDM.toLocaleString()}
                        </p>
                        <p style={{ fontSize: '10px', color: '#9ca3af' }}>kg DM/ha</p>
                      </div>
                    ) : (
                      <p style={{ fontSize: '12px', color: '#9ca3af' }}>No reading</p>
                    )}
                  </div>
                  {latest && (
                    <div className="px-5 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded-lg" style={{ fontSize: '10px', fontWeight: 700, background: st!.bg, color: st!.color, border: `1px solid ${st!.border}` }}>{st!.label}</span>
                        <div className="flex items-center gap-2">
                          {trend !== null && (
                            <span style={{ fontSize: '11px', color: trend >= 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                              {trend >= 0 ? '+' : ''}{trend} kg
                            </span>
                          )}
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                            {daysSince === 0 ? 'Today' : `${daysSince}d ago`}
                          </span>
                        </div>
                      </div>
                      <div className="rounded-full overflow-hidden" style={{ height: '6px', background: '#f3f4f6' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${barPct}%`, background: st!.color }} />
                      </div>
                      {latest.notes && <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>{latest.notes}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* History log */}
          {pastureReadings.length > 0 && (
            <div className="rounded-2xl overflow-hidden mt-5" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid #f5f5f5' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>Reading history</p>
              </div>
              <div className="divide-y" style={{ borderColor: '#f5f5f5' }}>
                {[...pastureReadings].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12).map(r => {
                  const pad = paddocks.find(p => p.id === r.paddockId);
                  const st = coverStatus(r.coverKgDM);
                  return (
                    <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: '12px', fontWeight: 600, color: '#111' }}>{pad?.name ?? r.paddockId}</p>
                        <p style={{ fontSize: '11px', color: '#9ca3af' }}>{fmtDate(r.date)}{r.notes ? ` · ${r.notes}` : ''}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: '13px', fontWeight: 700, color: st.color }}>{r.coverKgDM.toLocaleString()}</span>
                        <span className="px-2 py-0.5 rounded-lg" style={{ fontSize: '10px', fontWeight: 600, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{st.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── SOIL TESTS TAB ── */}
      {tab === 'soil' && (
        <>
          <AnimatedSection open={showSoilForm}>
            <div className="rounded-2xl overflow-hidden mb-5" style={{ border: '1px solid #ebebeb' }}>
              <div className="px-5 py-4" style={{ background: '#f9f9f8', borderBottom: '1px solid #ebebeb' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>Log Soil Test Results</p>
              </div>
              <form onSubmit={addSoil} className="p-5 space-y-4" style={{ background: '#fefefe' }}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Paddock</p>
                    <div className="relative">
                      <select className={INPUT} value={sPaddock} onChange={e => setSPaddock(e.target.value)} style={{ appearance: 'none', paddingRight: '28px' }}>
                        {paddocks.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <ChevronDown width={12} height={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9ca3af' }} />
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Date sampled</p>
                    <DatePickerInput value={sDate} onChange={v => setSDate(v)} placeholder="Date" />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>pH</p>
                    <input type="number" min="4" max="8" step="0.1" className={INPUT} placeholder="e.g. 6.0" value={sPH} onChange={e => setSPH(e.target.value)} />
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Olsen P</p>
                    <input type="number" min="0" step="1" className={INPUT} placeholder="e.g. 25" value={sOlsenP} onChange={e => setSOlsenP(e.target.value)} />
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>K (me%)</p>
                    <input type="number" min="0" step="0.1" className={INPUT} placeholder="e.g. 8" value={sK} onChange={e => setSK(e.target.value)} />
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>S (mg/kg)</p>
                    <input type="number" min="0" step="0.5" className={INPUT} placeholder="e.g. 5" value={sS} onChange={e => setSS(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Laboratory</p>
                    <input className={INPUT} placeholder="e.g. Hill Laboratories" value={sLab} onChange={e => setSLab(e.target.value)} />
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Notes</p>
                    <input className={INPUT} placeholder="Optional" value={sNotes} onChange={e => setSNotes(e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 py-2.5 rounded-xl" style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 600 }}>Save Test</button>
                  <button type="button" onClick={() => setShowSoilForm(false)} className="px-4 py-2.5 rounded-xl" style={{ background: '#f5f5f4', color: '#6b7280', fontSize: '13px', border: '1px solid #e5e7eb' }}>Cancel</button>
                </div>
              </form>
            </div>
          </AnimatedSection>

          {/* Soil test cards per paddock */}
          <div className="space-y-3">
            {paddocks.map(pad => {
              const tests = soilTests.filter(s => s.paddockId === pad.id).sort((a, b) => b.date.localeCompare(a.date));
              const latest = tests[0];
              return (
                <div key={pad.id} className="rounded-2xl overflow-hidden" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
                  <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: latest ? '1px solid #f5f5f5' : 'none' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>{pad.name}</p>
                      {latest
                        ? <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>Last tested {fmtDate(latest.date)}{latest.lab ? ` · ${latest.lab}` : ''}</p>
                        : <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>No soil test recorded</p>
                      }
                    </div>
                  </div>
                  {latest && (
                    <div className="px-5 py-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {latest.pH !== undefined && (() => { const s = pHStatus(latest.pH!); return (
                          <div className="rounded-xl p-3 text-center" style={{ background: s.bg }}>
                            <p style={{ fontSize: '10px', fontWeight: 600, color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>pH</p>
                            <p style={{ fontSize: '20px', fontWeight: 800, color: s.color }}>{latest.pH}</p>
                            <p style={{ fontSize: '10px', color: s.color, opacity: 0.7 }}>{s.label}</p>
                          </div>
                        ); })()}
                        {latest.olsenP !== undefined && (() => { const s = olsenStatus(latest.olsenP!); return (
                          <div className="rounded-xl p-3 text-center" style={{ background: s.bg }}>
                            <p style={{ fontSize: '10px', fontWeight: 600, color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Olsen P</p>
                            <p style={{ fontSize: '20px', fontWeight: 800, color: s.color }}>{latest.olsenP}</p>
                            <p style={{ fontSize: '10px', color: s.color, opacity: 0.7 }}>{s.label}</p>
                          </div>
                        ); })()}
                        {latest.potassiumK !== undefined && (
                          <div className="rounded-xl p-3 text-center" style={{ background: '#f9fafb' }}>
                            <p style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>K (me%)</p>
                            <p style={{ fontSize: '20px', fontWeight: 800, color: '#374151' }}>{latest.potassiumK}</p>
                          </div>
                        )}
                        {latest.sulfurS !== undefined && (
                          <div className="rounded-xl p-3 text-center" style={{ background: '#f9fafb' }}>
                            <p style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>S (mg/kg)</p>
                            <p style={{ fontSize: '20px', fontWeight: 800, color: '#374151' }}>{latest.sulfurS}</p>
                          </div>
                        )}
                      </div>
                      {latest.notes && <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '10px' }}>{latest.notes}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl p-4 mt-4" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>Soil test targets (pastoral NZ)</p>
            <p style={{ fontSize: '11px', color: '#a16207', lineHeight: '1.6' }}>
              pH 6.0–6.5 · Olsen P 20–40 · K 8–15 me% · S 5–8 mg/kg. Test every 3–5 years or after lime application.
            </p>
          </div>
        </>
      )}

      {/* ── FERTILISER TAB ── */}
      {tab === 'fertiliser' && (
        <>
          <AnimatedSection open={showFertForm}>
            <div className="rounded-2xl overflow-hidden mb-5" style={{ border: '1px solid #ebebeb' }}>
              <div className="px-5 py-4" style={{ background: '#f9f9f8', borderBottom: '1px solid #ebebeb' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>Log Fertiliser Application</p>
              </div>
              <form onSubmit={addFert} className="p-5 space-y-4" style={{ background: '#fefefe' }}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Paddock</p>
                    <div className="relative">
                      <select className={INPUT} value={fPaddock} onChange={e => setFPaddock(e.target.value)} style={{ appearance: 'none', paddingRight: '28px' }}>
                        {PADDOCK_OPTIONS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <ChevronDown width={12} height={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9ca3af' }} />
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Date applied</p>
                    <DatePickerInput value={fDate} onChange={v => setFDate(v)} placeholder="Date" />
                  </div>
                  <div className="col-span-2">
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Product *</p>
                    <input className={INPUT} placeholder="e.g. Superphosphate, Urea, Ag lime…" value={fProduct} onChange={e => setFProduct(e.target.value)} list="fert-products" required />
                    <datalist id="fert-products">
                      {['Superphosphate','Urea','Ag lime','DAP','Potassic superphosphate','Sulphur Super','Serpentine Super'].map(p => <option key={p} value={p} />)}
                    </datalist>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Rate (kg/ha) *</p>
                    <input type="number" min="0" step="10" className={INPUT} placeholder="e.g. 250" value={fRate} onChange={e => setFRate(e.target.value)} required />
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Cost ($/ha)</p>
                    <input type="number" min="0" step="1" className={INPUT} placeholder="Optional" value={fCost} onChange={e => setFCost(e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Notes</p>
                    <input className={INPUT} placeholder="e.g. Aerial application, spread by contractor…" value={fNotes} onChange={e => setFNotes(e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={!fProduct.trim() || !fRate} className="flex-1 py-2.5 rounded-xl disabled:opacity-40" style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 600 }}>Save Application</button>
                  <button type="button" onClick={() => setShowFertForm(false)} className="px-4 py-2.5 rounded-xl" style={{ background: '#f5f5f4', color: '#6b7280', fontSize: '13px', border: '1px solid #e5e7eb' }}>Cancel</button>
                </div>
              </form>
            </div>
          </AnimatedSection>

          {sortedFert.length === 0 ? (
            <div className="py-16 text-center">
              <p style={{ fontSize: '13px', color: '#9ca3af' }}>No fertiliser applications recorded yet.</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
              <div className="divide-y" style={{ borderColor: '#f5f5f5' }}>
                {sortedFert.map(f => {
                  const pad = PADDOCK_OPTIONS.find(p => p.id === f.paddockId);
                  const totalHa = f.paddockId === 'all'
                    ? paddocks.reduce((s, p) => s + p.hectares, 0)
                    : paddocks.find(p => p.id === f.paddockId)?.hectares ?? 0;
                  const totalCost = f.costPerHa ? f.costPerHa * totalHa : null;
                  return (
                    <div key={f.id} className="flex items-start gap-3 px-5 py-4 group">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#f0fdf4' }}>
                        <Leaf width={14} height={14} style={{ color: '#16a34a' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>{f.product}</p>
                          <span className="px-2 py-0.5 rounded-lg" style={{ fontSize: '10px', fontWeight: 600, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                            {f.rateKgHa} kg/ha
                          </span>
                        </div>
                        <p style={{ fontSize: '11px', color: '#6b7280' }}>
                          {pad?.name ?? f.paddockId} · {fmtDate(f.date)}
                          {totalCost !== null && ` · $${totalCost.toFixed(0)} total`}
                        </p>
                        {f.notes && <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{f.notes}</p>}
                      </div>
                      <button
                        onClick={() => deleteFert(f.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg flex-shrink-0"
                        style={{ color: '#9ca3af' }}
                      >
                        <Trash2 width={13} height={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
    </PlusGate>
  );
}

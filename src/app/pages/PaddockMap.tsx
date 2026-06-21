import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import { Droplets, AlertTriangle, RotateCcw, Plus, Trash2, MapIcon, X, ArrowRight, Leaf, Pencil, Search } from 'lucide-react';

// Approximate daily dry matter intake (kg DM/day) per species
const DAILY_INTAKE: Record<string, number> = {
  sheep: 1.5, cattle: 10, goat: 1.8, pig: 2.5,
  chicken: 0.12, horse: 10, alpaca: 1.8, deer: 3.5,
};

function paddockConsumption(animals: { species: string }[]): number {
  return animals.reduce((s, a) => s + (DAILY_INTAKE[a.species] ?? 1.5), 0);
}
import {
  PADDOCK_STATUS_CONFIG, GRASS_COVER_CONFIG, FENCE_CONDITION_CONFIG,
  SPECIES_CONFIG, HEALTH_STATUS_CONFIG, fmtDate,
  type Paddock,
} from '../data/blockData';
import { useAnimals } from '../context/AnimalsContext';
import { useProfile } from '../context/ProfileContext';
import { usePaddocks } from '../context/PaddocksContext';
import { NewPaddockModal } from '../components/NewPaddockModal';
import { PageHeader } from '../components/PageHeader';

// ─── Treemap algorithm ────────────────────────────────────────────────────────
interface TRect { x: number; y: number; w: number; h: number; }

function treeLayout(
  items: Array<{ id: string; hectares: number }>,
  rect: TRect = { x: 0, y: 0, w: 100, h: 100 },
): Array<{ id: string } & TRect> {
  if (items.length === 0) return [];
  if (items.length === 1) return [{ id: items[0].id, ...rect }];

  const total = items.reduce((s, i) => s + i.hectares, 0);
  let best = Infinity, splitIdx = 1, run = 0;
  for (let i = 0; i < items.length - 1; i++) {
    run += items[i].hectares;
    const diff = Math.abs(run * 2 - total);
    if (diff < best) { best = diff; splitIdx = i + 1; }
  }

  const groupA = items.slice(0, splitIdx);
  const groupB = items.slice(splitIdx);
  const ratioA = groupA.reduce((s, i) => s + i.hectares, 0) / total;
  const wide = rect.w >= rect.h;

  const rA: TRect = wide
    ? { x: rect.x,                y: rect.y, w: rect.w * ratioA,        h: rect.h }
    : { x: rect.x, y: rect.y,                w: rect.w, h: rect.h * ratioA        };
  const rB: TRect = wide
    ? { x: rect.x + rect.w * ratioA, y: rect.y, w: rect.w * (1 - ratioA), h: rect.h }
    : { x: rect.x, y: rect.y + rect.h * ratioA, w: rect.w, h: rect.h * (1 - ratioA) };

  return [...treeLayout(groupA, rA), ...treeLayout(groupB, rB)];
}

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, active, onClick }: {
  label: string; value: string | number; sub?: string; accent?: boolean; active?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl p-4 flex flex-col gap-1 w-full text-left transition-all hover:shadow-md active:scale-[0.98]"
      style={{
        background: active ? '#fff7ed' : '#fff',
        border: active ? '1px solid #ea580c' : accent ? '1px solid #fed7aa' : '1px solid #ebebeb',
        cursor: 'pointer',
      }}
    >
      <p style={{ fontSize: '11px', fontWeight: 600, color: active ? '#ea580c' : '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </p>
      <p style={{ fontSize: '24px', fontWeight: 800, color: accent ? '#ea580c' : '#111', letterSpacing: '-0.04em', lineHeight: 1 }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: '11px', color: active ? '#ea580c' : '#9ca3af' }}>{sub}</p>}
    </button>
  );
}

// ─── Legend pill ─────────────────────────────────────────────────────────────
function LegendItem({ fill, stroke, label }: { fill: string; stroke: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: fill, border: `1.5px solid ${stroke}` }} />
      <span style={{ fontSize: '11px', color: '#6b7280' }}>{label}</span>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
const FONT = "'Inter', system-ui, sans-serif";

export function PaddockMap() {
  const { animals, updateAnimalPaddock } = useAnimals();
  const { profile } = useProfile();
  const { paddocks, addPaddock, updatePaddock, removePaddock } = usePaddocks();

  const [selectedId, setSelectedId]     = useState<string>('');
  const [hoveredId, setHoveredId]       = useState<string | null>(null);
  const [modalOpen, setModalOpen]       = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [statFilter, setStatFilter]     = useState<'all' | 'grazing' | 'resting' | 'fence' | null>(null);
  const [searchQuery, setSearchQuery]   = useState('');

  function toggleFilter(f: 'all' | 'grazing' | 'resting' | 'fence') {
    setStatFilter(prev => prev === f ? null : f);
  }

  // Animal panel state
  const [addingAnimal, setAddingAnimal]   = useState(false);
  const [movingAll, setMovingAll]         = useState(false);

  const sorted = useMemo(
    () => [...paddocks].sort((a, b) => b.hectares - a.hectares),
    [paddocks],
  );

  // ── Two-pass layout: pull tiny paddocks out of the treemap ──────────────────
  // Pass 1: layout all paddocks to find which rects are too small to be useful
  const MIN_DIM_PCT = 8; // minimum % in either dimension to show in treemap
  const allLayout = useMemo(
    () => treeLayout(sorted.map(p => ({ id: p.id, hectares: p.hectares }))),
    [sorted],
  );

  const { mainSorted, chipPaddocks } = useMemo(() => {
    const tinyIds = new Set(
      allLayout.filter(r => Math.min(r.w, r.h) < MIN_DIM_PCT).map(r => r.id),
    );
    return {
      mainSorted:   sorted.filter(p => !tinyIds.has(p.id)),
      chipPaddocks: sorted.filter(p =>  tinyIds.has(p.id)),
    };
  }, [allLayout, sorted]);

  // Pass 2: layout only the main paddocks so they fill the full treemap area
  const layout = useMemo(
    () => treeLayout(mainSorted.map(p => ({ id: p.id, hectares: p.hectares }))),
    [mainSorted],
  );

  const rectMap = useMemo(
    () => new Map(layout.map(l => [l.id, { x: l.x, y: l.y, w: l.w, h: l.h }])),
    [layout],
  );

  const selected       = paddocks.find(p => p.id === selectedId);
  const paddockAnimals = selected ? animals.filter(a => a.paddock === selected.name) : [];
  const unassignedAnimals = selected
    ? animals.filter(a => a.paddock !== selected.name)
    : [];
  const statusCfg = selected ? PADDOCK_STATUS_CONFIG[selected.status]      : null;
  const grassCfg  = selected ? GRASS_COVER_CONFIG[selected.grassCover]     : null;
  const fenceCfg  = selected ? FENCE_CONDITION_CONFIG[selected.fenceCondition] : null;

  const totalHa      = paddocks.reduce((s, p) => s + p.hectares, 0);
  const grazingCount = paddocks.filter(p => p.status === 'grazing').length;
  const restingCount = paddocks.filter(p => p.status === 'resting').length;
  const fenceAlerts  = paddocks.filter(p => p.fenceCondition === 'fair' || p.fenceCondition === 'poor').length;

  const handleAdd = (p: Paddock) => {
    addPaddock(p);
    setSelectedId(p.id);
    setConfirmDelete(false);
  };

  const handleEdit = (p: Paddock) => {
    updatePaddock(p.id, p);
  };

  const handleDelete = () => {
    const remaining = paddocks.filter(p => p.id !== selectedId);
    removePaddock(selectedId);
    setSelectedId(remaining[0]?.id ?? '');
    setConfirmDelete(false);
  };

  function handleSelectPaddock(id: string) {
    setSelectedId(id);
    setConfirmDelete(false);
    setAddingAnimal(false);
    setMovingAll(false);
  }

  function handleRemoveAnimal(animalId: string) {
    updateAnimalPaddock(animalId, 'Unassigned');
  }

  function handleAssignAnimal(animalId: string) {
    if (!selected) return;
    updateAnimalPaddock(animalId, selected.name);
    setAddingAnimal(false);
  }

  function handleMoveAll(toPaddockName: string) {
    paddockAnimals.forEach(a => updateAnimalPaddock(a.id, toPaddockName));
    setMovingAll(false);
  }

  return (
    <div className="pb-8">

      <PageHeader
        title="Paddock Map"
        maxWidth="max-w-6xl"
        action={
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-shrink-0 transition-all active:scale-[0.97]" style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 600 }}>
            <Plus className="w-4 h-4" />New Paddock
          </button>
        }
        chips={[
          { label: `${paddocks.length} paddock${paddocks.length !== 1 ? 's' : ''}`, variant: 'neutral' },
          { label: `${totalHa.toFixed(1)}ha total`, variant: 'neutral' },
          ...(fenceAlerts > 0 ? [{ label: `${fenceAlerts} fence alert${fenceAlerts !== 1 ? 's' : ''}`, variant: 'warning' as const }] : []),
        ]}
      />

      <div className="max-w-6xl mx-auto px-4 md:px-8">

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard label="Paddocks"     value={paddocks.length} sub={`${totalHa.toFixed(1)}ha mapped`} active={statFilter === 'all'}    onClick={() => toggleFilter('all')}    />
        <StatCard label="Grazing"      value={grazingCount}    sub="paddocks active"                  active={statFilter === 'grazing'} onClick={() => toggleFilter('grazing')} />
        <StatCard label="Resting"      value={restingCount}    sub="paddocks resting"                 active={statFilter === 'resting'} onClick={() => toggleFilter('resting')} />
        <StatCard label="Fence Alerts" value={fenceAlerts}     sub="fair or poor" accent={fenceAlerts > 0} active={statFilter === 'fence'} onClick={() => toggleFilter('fence')} />
      </div>

      {/* ── Map + Detail ── */}
      <div className="flex flex-col md:flex-row gap-4 md:items-stretch">

        {/* ── Treemap card ── */}
        <div
          className="w-full md:flex-1 rounded-2xl overflow-hidden"
          style={{ background: '#fefefe', border: '1px solid #ebebeb' }}
        >
          {/* Legend */}
          <div
            className="px-4 py-3 flex items-center gap-4 flex-wrap"
            style={{ borderBottom: '1px solid #f0f0f0' }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', marginRight: '4px' }}>KEY</span>
            {Object.entries(PADDOCK_STATUS_CONFIG).map(([key, cfg]) => (
              <LegendItem key={key} fill={cfg.fill} stroke={cfg.stroke} label={cfg.label} />
            ))}
          </div>

          {/* Map area */}
          <div className="p-3">
            {paddocks.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center gap-4 rounded-2xl"
                style={{ aspectRatio: '4/3', background: '#f9f8f6', border: '2px dashed #e5e2dc' }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#f5f4f0' }}>
                  <MapIcon className="w-7 h-7" style={{ color: '#9ca3af' }} />
                </div>
                <div className="text-center px-6">
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#374151' }}>No paddocks yet</p>
                  <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                    Add your first paddock to see it here, sized proportionally to its hectares.
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl"
                  style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 600 }}
                >
                  <Plus className="w-4 h-4" />
                  Add first paddock
                </button>
              </div>
            ) : (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '4/3',
                  background: '#f0eeeb',
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}
              >
                {mainSorted.map(p => {
                  const rect = rectMap.get(p.id);
                  if (!rect) return null;

                  const cfg         = PADDOCK_STATUS_CONFIG[p.status];
                  const isSelected  = p.id === selectedId;
                  const isHovered   = p.id === hoveredId && !isSelected;
                  const animalCount = animals.filter(a => a.paddock === p.name).length;
                  const hasFenceAlert = p.fenceCondition === 'fair' || p.fenceCondition === 'poor';
                  const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
                  const matchesFilter =
                    matchesSearch && (
                      !statFilter || statFilter === 'all' ||
                      (statFilter === 'grazing' && p.status === 'grazing') ||
                      (statFilter === 'resting' && p.status === 'resting') ||
                      (statFilter === 'fence'   && (p.fenceCondition === 'fair' || p.fenceCondition === 'poor'))
                    );

                  const minDim   = Math.min(rect.w, rect.h);
                  const showFull = minDim > 18 && rect.w > 18;
                  const showName = minDim > 7  && rect.w > 10;

                  return (
                    <div
                      key={p.id}
                      style={{
                        position: 'absolute',
                        left: `${rect.x}%`,
                        top:  `${rect.y}%`,
                        width: `${rect.w}%`,
                        height: `${rect.h}%`,
                        padding: '3px',
                        boxSizing: 'border-box',
                        opacity: matchesFilter ? 1 : 0.18,
                        transition: 'opacity 0.25s ease',
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          background: isSelected ? cfg.activeFill : isHovered ? cfg.activeFill : cfg.fill,
                          border: isSelected ? '2px solid rgba(234,88,12,0.45)' : `1.5px solid ${cfg.stroke}`,
                          boxShadow: isSelected ? '0 0 0 2px rgba(234,88,12,0.10)' : 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          padding: showName ? '8px 10px' : '4px',
                          boxSizing: 'border-box',
                          transition: 'background 0.12s, border-color 0.12s',
                          filter: isHovered ? 'brightness(0.93)' : 'none',
                          position: 'relative',
                        }}
                        onClick={() => handleSelectPaddock(p.id)}
                        onMouseEnter={() => setHoveredId(p.id)}
                        onMouseLeave={() => setHoveredId(null)}
                      >
                        {hasFenceAlert && showName && (
                          <div style={{
                            position: 'absolute', top: '5px', right: '6px',
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: p.fenceCondition === 'poor' ? '#dc2626' : '#d97706',
                            flexShrink: 0,
                          }} />
                        )}
                        {showName && (
                          <div style={{
                            fontFamily: FONT, fontSize: showFull ? '11px' : '9px',
                            fontWeight: 700, color: '#1f2937', letterSpacing: '0.04em',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            lineHeight: 1.2, paddingRight: hasFenceAlert ? '14px' : '0',
                          }}>
                            {p.name}
                          </div>
                        )}
                        {showFull && (
                          <div style={{ fontFamily: FONT, fontSize: '9px', color: cfg.color, marginTop: '3px', fontWeight: 600 }}>
                            {p.hectares}ha · {cfg.label}
                          </div>
                        )}
                        {showFull && animalCount > 0 && (
                          <div style={{
                            marginTop: 'auto',
                            display: 'inline-flex', alignItems: 'center',
                            background: 'rgba(255,255,255,0.78)',
                            borderRadius: '5px', padding: '2px 6px',
                            fontSize: '8px', fontWeight: 600, color: '#374151',
                            width: 'fit-content', fontFamily: FONT,
                          }}>
                            {animalCount} {animalCount === 1 ? 'animal' : 'animals'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Small paddocks chip strip ── */}
          {chipPaddocks.length > 0 && (
            <div
              className="px-3 pb-3 flex flex-wrap items-center gap-1.5"
              style={{ borderTop: '1px solid #f5f4f0' }}
            >
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: '2px' }}>
                Small
              </span>
              {chipPaddocks.map(p => {
                const cfg        = PADDOCK_STATUS_CONFIG[p.status];
                const isSelected = p.id === selectedId;
                const animalCount = animals.filter(a => a.paddock === p.name).length;
                const chipMatchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
                const chipMatches =
                  chipMatchesSearch && (
                    !statFilter || statFilter === 'all' ||
                    (statFilter === 'grazing' && p.status === 'grazing') ||
                    (statFilter === 'resting' && p.status === 'resting') ||
                    (statFilter === 'fence'   && (p.fenceCondition === 'fair' || p.fenceCondition === 'poor'))
                  );
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPaddock(p.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all active:scale-95"
                    style={{
                      background: isSelected ? cfg.activeFill : cfg.fill,
                      border: isSelected ? '2px solid rgba(234,88,12,0.45)' : `1.5px solid ${cfg.stroke}`,
                      boxShadow: isSelected ? '0 0 0 2px rgba(234,88,12,0.10)' : 'none',
                      fontFamily: FONT,
                      opacity: chipMatches ? 1 : 0.18,
                      transition: 'opacity 0.25s ease',
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: isSelected ? 700 : 600, color: '#1f2937' }}>
                      {p.name}
                    </span>
                    <span style={{ fontSize: '10px', color: cfg.color, fontWeight: 500 }}>
                      {p.hectares}ha
                    </span>
                    {animalCount > 0 && (
                      <span
                        className="flex items-center justify-center rounded-full"
                        style={{ minWidth: '16px', height: '16px', background: 'rgba(255,255,255,0.8)', fontSize: '9px', fontWeight: 700, color: '#374151', padding: '0 4px' }}
                      >
                        {animalCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {paddocks.length > 0 && (
            <p
              className="md:hidden text-center py-2"
              style={{ fontSize: '11px', color: '#9ca3af', borderTop: '1px solid #f0f0f0' }}
            >
              Tap a paddock to view details
            </p>
          )}
        </div>

        {/* ── Detail panel ── */}
        <div
          className="w-full md:w-72 rounded-2xl flex-shrink-0 md:overflow-y-auto"
          style={{ background: '#fefefe', border: '1px solid #ebebeb', overflow: 'hidden' }}
        >
          {!selected ? (
            <div className="p-8 text-center">
              <p style={{ fontSize: '13px', color: '#9ca3af' }}>Select a paddock to view details</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-5" style={{ borderBottom: '1px solid #f0f0f0' }}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <p style={{ fontSize: '18px', fontWeight: 800, color: '#111', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
                    {selected.name}
                  </p>
                  <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                    <span
                      className="px-2 py-1 rounded-lg"
                      style={{ fontSize: '11px', fontWeight: 700, background: '#f5f4f0', color: '#6b7280' }}
                    >
                      {selected.hectares}ha
                    </span>
                    <button
                      onClick={() => setEditModalOpen(true)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                      style={{ background: '#f5f4f0' }}
                      title="Edit paddock"
                    >
                      <Pencil width={13} height={13} style={{ color: '#6b7280' }} />
                    </button>
                  </div>
                </div>
                {statusCfg && (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{
                      fontSize: '12px', fontWeight: 600,
                      background: statusCfg.fill, color: statusCfg.color,
                      border: `1px solid ${statusCfg.stroke}`,
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: statusCfg.color }} />
                    {statusCfg.label}
                  </span>
                )}
              </div>

              {/* ── Animals section ── */}
              <div style={{ borderBottom: '1px solid #f0f0f0' }}>
                {/* Feed consumption banner */}
                {paddockAnimals.length > 0 && (() => {
                  const kgPerDay = paddockConsumption(paddockAnimals);
                  const haPerSU  = selected!.hectares / (kgPerDay / 10);
                  return (
                    <div className="mx-5 mt-4 mb-1 px-3 py-2.5 rounded-xl flex items-center gap-3" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                      <Leaf width={14} height={14} style={{ color: '#15803d', flexShrink: 0 }} />
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: '11px', fontWeight: 700, color: '#15803d' }}>
                          ~{kgPerDay.toFixed(1)} kg DM/day consumed
                        </p>
                        <p style={{ fontSize: '10px', color: '#6b7280', marginTop: '1px' }}>
                          {selected!.hectares} ha · {(kgPerDay / selected!.hectares).toFixed(1)} kg/ha/day · {haPerSU.toFixed(2)} ha/SU
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Animals header */}
                <div className="flex items-center justify-between px-5 pt-4 pb-3">
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Animals ({paddockAnimals.length})
                  </p>
                  <button
                    onClick={() => { setAddingAnimal(v => !v); setMovingAll(false); }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all"
                    style={{
                      fontSize: '11px', fontWeight: 600,
                      background: addingAnimal ? '#111' : '#f5f5f4',
                      color: addingAnimal ? '#fff' : '#374151',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    {addingAnimal ? <X width={11} height={11} /> : <Plus width={11} height={11} />}
                    {addingAnimal ? 'Close' : 'Add'}
                  </button>
                </div>

                {/* Current animals list */}
                {paddockAnimals.length === 0 && !addingAnimal ? (
                  <p className="px-5 pb-4" style={{ fontSize: '12px', color: '#9ca3af' }}>
                    No animals assigned, tap Add to assign some.
                  </p>
                ) : (
                  <div className="px-5 space-y-1.5 overflow-y-auto" style={{ maxHeight: '138px' }}>
                    {paddockAnimals.map(animal => {
                      const sc = SPECIES_CONFIG[animal.species];
                      const hc = HEALTH_STATUS_CONFIG[animal.status];
                      return (
                        <Link
                          key={animal.id}
                          to={`/animals/${animal.id}`}
                          className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl transition-opacity active:opacity-70"
                          style={{ background: '#f9f9f8', border: '1px solid #f0f0f0', textDecoration: 'none' }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: hc.color }} />
                            <span
                              className="px-1.5 py-0.5 rounded-full flex-shrink-0"
                              style={{ fontSize: '9px', fontWeight: 700, color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}
                            >
                              {sc.label}
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#111' }} className="truncate">
                              {animal.name}
                            </span>
                            <span style={{ fontSize: '11px', color: '#9ca3af', flexShrink: 0 }}>{animal.tag}</span>
                          </div>
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveAnimal(animal.id); }}
                            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg transition-all"
                            style={{ background: '#fee2e2' }}
                            title="Remove from paddock"
                          >
                            <X width={10} height={10} style={{ color: '#dc2626' }} />
                          </button>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Add animal picker */}
                {addingAnimal && (
                  <div className="mx-5 mt-3 mb-4 rounded-xl overflow-hidden" style={{ border: '1px solid #ebebeb' }}>
                    <div className="px-3 py-2" style={{ background: '#f9f9f8', borderBottom: '1px solid #f0f0f0' }}>
                      <p style={{ fontSize: '11px', fontWeight: 600, color: '#374151' }}>
                        Assign an animal to {selected.name}
                      </p>
                    </div>
                    {unassignedAnimals.length === 0 ? (
                      <p className="px-3 py-3" style={{ fontSize: '12px', color: '#9ca3af' }}>
                        All animals are already here.
                      </p>
                    ) : (
                      <div className="divide-y" style={{ borderColor: '#f9f9f8', maxHeight: '180px', overflowY: 'auto' }}>
                        {unassignedAnimals.map(animal => {
                          const sc = SPECIES_CONFIG[animal.species];
                          return (
                            <button
                              key={animal.id}
                              onClick={() => handleAssignAnimal(animal.id)}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-all"
                              style={{ background: 'transparent' }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#f9f9f8')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <span
                                className="px-1.5 py-0.5 rounded-full flex-shrink-0"
                                style={{ fontSize: '9px', fontWeight: 700, color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}
                              >
                                {sc.label}
                              </span>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: '#111' }}>{animal.name}</span>
                              <span style={{ fontSize: '11px', color: '#9ca3af' }}>{animal.tag}</span>
                              <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: 'auto', flexShrink: 0 }}>
                                {animal.paddock || 'Unassigned'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Move all */}
                {paddockAnimals.length > 0 && (
                  <div className="px-5 pt-3 pb-4">
                    <button
                      onClick={() => { setMovingAll(v => !v); setAddingAnimal(false); }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all"
                      style={{
                        background: movingAll ? '#111' : '#f5f5f4',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 600, color: movingAll ? '#fff' : '#374151' }}>
                        Move all {paddockAnimals.length} {paddockAnimals.length === 1 ? 'animal' : 'animals'} to…
                      </span>
                      <ArrowRight width={14} height={14} style={{ color: movingAll ? '#fff' : '#9ca3af', flexShrink: 0 }} />
                    </button>

                    {movingAll && (
                      <div className="mt-2 rounded-xl overflow-hidden" style={{ border: '1px solid #ebebeb' }}>
                        <div className="px-3 py-2" style={{ background: '#f9f9f8', borderBottom: '1px solid #f0f0f0' }}>
                          <p style={{ fontSize: '11px', fontWeight: 600, color: '#374151' }}>Select destination paddock</p>
                        </div>
                        <div className="divide-y" style={{ borderColor: '#f9f9f8' }}>
                          {paddocks
                            .filter(p => p.id !== selectedId)
                            .map(p => {
                              const cfg = PADDOCK_STATUS_CONFIG[p.status];
                              const count = animals.filter(a => a.paddock === p.name).length;
                              return (
                                <button
                                  key={p.id}
                                  onClick={() => handleMoveAll(p.name)}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-all"
                                  style={{ background: 'transparent' }}
                                  onMouseEnter={e => (e.currentTarget.style.background = '#f9f9f8')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#111', flex: 1 }}>{p.name}</span>
                                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>{count} here</span>
                                </button>
                              );
                            })
                          }
                          {paddocks.filter(p => p.id !== selectedId).length === 0 && (
                            <p className="px-3 py-3" style={{ fontSize: '12px', color: '#9ca3af' }}>
                              No other paddocks available.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Conditions */}
              <div className="p-5 space-y-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
                {grassCfg && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        Grass Cover
                      </p>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: grassCfg.color }}>{grassCfg.label}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: '#f0f0f0' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${grassCfg.pct}%`, background: grassCfg.color }}
                      />
                    </div>
                  </div>
                )}

                {fenceCfg && selected.fenceCondition !== 'none' && (
                  <div className="flex items-center justify-between">
                    <p style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      Fence Condition
                    </p>
                    <div className="flex items-center gap-1.5">
                      {selected.fenceCondition !== 'good' && (
                        <AlertTriangle style={{ width: '12px', height: '12px', color: fenceCfg.color, flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: '12px', fontWeight: 700, color: fenceCfg.color }}>{fenceCfg.label}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <Droplets style={{ width: '14px', height: '14px', color: '#60a5fa', flexShrink: 0, marginTop: '1px' }} />
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>
                      Water
                    </p>
                    <p style={{ fontSize: '12px', color: '#374151' }}>{selected.waterSource}</p>
                  </div>
                </div>
              </div>

              {selected.lastRotated && (
                <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <RotateCcw style={{ width: '12px', height: '12px', color: '#9ca3af', flexShrink: 0 }} />
                  <p style={{ fontSize: '11px', color: '#9ca3af' }}>
                    Last rotated {fmtDate(selected.lastRotated)}
                  </p>
                </div>
              )}

              {/* Remove paddock */}
              <div className="p-4">
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all"
                    style={{ background: '#fef2f2' }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#dc2626' }}>Remove paddock</span>
                    <Trash2 style={{ width: '14px', height: '14px', color: '#dc2626' }} />
                  </button>
                ) : (
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #fecaca' }}>
                    <p className="px-4 pt-3 pb-2" style={{ fontSize: '12px', color: '#374151' }}>
                      Remove <strong>{selected.name}</strong> from the map?
                    </p>
                    <div className="flex">
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="flex-1 py-2.5"
                        style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', background: '#f9f9f8', borderTop: '1px solid #f0f0f0' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDelete}
                        className="flex-1 py-2.5"
                        style={{ fontSize: '12px', fontWeight: 700, color: '#fff', background: '#dc2626', borderTop: '1px solid #fecaca' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Notes card (below map row) ── */}
      {selected?.notes && (
        <div className="mt-4 rounded-2xl p-5" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
            {selected.name} Notes
          </p>
          <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.7 }}>{selected.notes}</p>
        </div>
      )}

      {/* ── Paddock list table ── */}
      {paddocks.length > 0 && (
        <div className="mt-4 mb-4 rounded-2xl overflow-hidden" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
          {/* Header */}
          <div className="px-5 py-4 flex items-center justify-between gap-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#111', flexShrink: 0 }}>
              {statFilter === 'grazing' ? 'Grazing Paddocks' : statFilter === 'resting' ? 'Resting Paddocks' : statFilter === 'fence' ? 'Fence Alerts' : 'All Paddocks'}
            </p>
            <div className="flex items-center gap-3 ml-auto">
              <div className="relative">
                <Search width={13} height={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search paddocks…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl outline-none transition-colors"
                  style={{ fontSize: '12px', background: '#f5f5f4', border: '1px solid #ebebeb', color: '#111', width: '160px' }}
                  onFocus={e => (e.target.style.borderColor = '#ea580c')}
                  onBlur={e => (e.target.style.borderColor = '#ebebeb')}
                />
              </div>
              <p style={{ fontSize: '11px', color: '#9ca3af', flexShrink: 0 }}>{paddocks.length} · {totalHa.toFixed(1)}ha</p>
            </div>
          </div>

          {/* Column headers — desktop only */}
          <div
            className="hidden md:grid px-5 py-2"
            style={{ gridTemplateColumns: '1fr 100px 72px 120px 80px', borderBottom: '1px solid #f5f5f5' }}
          >
            {['Paddock', 'Status', 'Animals', 'Grass cover', 'Fencing'].map(h => (
              <p key={h} style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                {h}
              </p>
            ))}
          </div>

          <div className="divide-y" style={{ borderColor: '#f5f5f5' }}>
            {[...paddocks]
              .filter(p => {
                if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                if (statFilter === 'grazing') return p.status === 'grazing';
                if (statFilter === 'resting') return p.status === 'resting';
                if (statFilter === 'fence')   return p.fenceCondition === 'fair' || p.fenceCondition === 'poor';
                return true;
              })
              .sort((a, b) => b.hectares - a.hectares).map(p => {
              const cfg    = PADDOCK_STATUS_CONFIG[p.status];
              const gcfg   = GRASS_COVER_CONFIG[p.grassCover];
              const fcfg   = FENCE_CONDITION_CONFIG[p.fenceCondition];
              const count  = animals.filter(a => a.paddock === p.name).length;
              const isActive = p.id === selectedId;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPaddock(p.id)}
                  className="w-full text-left transition-all"
                  style={{ background: isActive ? '#fafaf9' : 'transparent' }}
                >
                  {/* Desktop row */}
                  <div
                    className="hidden md:grid items-center px-5 py-3.5 gap-3"
                    style={{ gridTemplateColumns: '1fr 100px 72px 120px 80px' }}
                  >
                    {/* Paddock name */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                      <div className="min-w-0">
                        <p style={{ fontSize: '13px', fontWeight: isActive ? 700 : 500, color: '#111' }} className="truncate">
                          {p.name}
                        </p>
                        <p style={{ fontSize: '11px', color: '#9ca3af' }}>{p.hectares}ha</p>
                      </div>
                    </div>

                    {/* Status */}
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit"
                      style={{ fontSize: '11px', fontWeight: 600, background: cfg.fill, color: cfg.color, border: `1px solid ${cfg.stroke}` }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                      {cfg.label}
                    </span>

                    {/* Animals */}
                    <span
                      className="inline-flex items-center justify-center rounded-lg w-fit px-2.5 py-1"
                      style={{ fontSize: '11px', fontWeight: 600, background: count > 0 ? '#f5f4f0' : 'transparent', color: count > 0 ? '#374151' : '#9ca3af' }}
                    >
                      {count > 0 ? count : '-'}
                    </span>

                    {/* Grass cover */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span style={{ fontSize: '11px', fontWeight: 600, color: gcfg.color }}>{gcfg.label}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#f0f0f0', width: '80px' }}>
                        <div className="h-full rounded-full" style={{ width: `${gcfg.pct}%`, background: gcfg.color }} />
                      </div>
                    </div>

                    {/* Fence */}
                    {p.fenceCondition === 'none' ? (
                      <span style={{ fontSize: '11px', color: '#d1d5db' }}>—</span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: fcfg.color }}
                        />
                        <span style={{ fontSize: '11px', fontWeight: 600, color: fcfg.color }}>{fcfg.label}</span>
                      </div>
                    )}
                  </div>

                  {/* Mobile row */}
                  <div className="md:hidden flex items-center gap-3 px-5 py-3.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: '13px', fontWeight: isActive ? 700 : 500, color: '#111' }} className="truncate">
                        {p.name}
                      </p>
                      <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>
                        {p.hectares}ha · {count} {count === 1 ? 'animal' : 'animals'} · Grass {gcfg.label}
                      </p>
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{ fontSize: '11px', fontWeight: 600, background: cfg.fill, color: cfg.color, border: `1px solid ${cfg.stroke}` }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Add Paddock Modal ── */}
      <NewPaddockModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAdd}
      />

      {/* ── Edit Paddock Modal ── */}
      <NewPaddockModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        initialValues={selected}
        onEdit={handleEdit}
      />
      </div>
    </div>
  );
}
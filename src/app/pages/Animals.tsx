import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AnimatedSection } from '../components/AnimatedSection';
import { DatePickerInput } from '../components/DatePickerInput';
import { useAnimals } from '../context/AnimalsContext';
import { useSpecies } from '../context/SpeciesContext';
import { useMobs, MOB_COLORS } from '../context/MobContext';
import {
  Animal, Sex, HealthStatus,
  SPECIES_CONFIG, HEALTH_STATUS_CONFIG, getAnimalAge, TODAY,
} from '../data/blockData';
import { usePaddocks } from '../context/PaddocksContext';
import { useProfile } from '../context/ProfileContext';
import { Search, Plus, X, AlertTriangle, Users, ChevronDown, ChevronUp, Check, Lock, Zap } from 'lucide-react';
import { DropdownSelect } from '../components/DropdownSelect';
import { BirthdayBannerGroup } from '../components/BirthdayBannerGroup';
import { PageHeader } from '../components/PageHeader';

const SPECIES_TABS: { value: string; label: string }[] = [
  { value: 'all',     label: 'All'      },
  { value: 'sheep',   label: 'Sheep'    },
  { value: 'cattle',  label: 'Cattle'   },
  { value: 'chicken', label: 'Chickens' },
  { value: 'goat',    label: 'Goats'    },
  { value: 'horse',   label: 'Horses'   },
  { value: 'alpaca',  label: 'Alpacas'  },
  { value: 'pig',     label: 'Pigs'     },
];

const INPUT = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none bg-white text-gray-900 transition-colors focus:border-orange-400 text-[13px]';

export function Animals() {
  const { animals, addAnimal } = useAnimals();
  const { paddocks } = usePaddocks();
  const { allSpecies } = useSpecies();
  const { profile } = useProfile();
  const { mobs, addMob, removeMob, updateMob, addAnimalToMob, removeAnimalFromMob } = useMobs();
  const [searchParams] = useSearchParams();
  const [activeSpecies, setActiveSpecies] = useState<string>('all');
  const [activeMobId, setActiveMobId]     = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showMobPanel, setShowMobPanel] = useState(false);
  const [showAttentionOnly, setShowAttentionOnly] = useState(
    () => searchParams.get('attention') === '1',
  );

  // New mob form state
  const [newMobName, setNewMobName] = useState('');
  const [newMobColor, setNewMobColor] = useState(MOB_COLORS[0]);
  const [showNewMobForm, setShowNewMobForm] = useState(false);

  // Mob assignment panel: which mob is being edited
  const [editMobId, setEditMobId] = useState<string | null>(null);

  // Form state
  const [name,          setName]          = useState('');
  const [tag,           setTag]           = useState('');
  const [species,       setSpecies]       = useState<string>('sheep');
  const [breed,         setBreed]         = useState('');
  const [sex,           setSex]           = useState<Sex>('female');
  const [dob,           setDob]           = useState('');
  const [paddock,       setPaddock]       = useState('');
  const [weight,        setWeight]        = useState('');
  const [status,        setStatus]        = useState<HealthStatus>('healthy');
  const [notes,         setNotes]         = useState('');
  const [purchaseDate,  setPurchaseDate]  = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [naitTag,       setNaitTag]       = useState('');
  const [showOptional,  setShowOptional]  = useState(false);

  // Only show tabs for species that actually have animals, plus 'all'
  const visibleTabs = useMemo(() => {
    const present = new Set(animals.map((a) => a.species));
    const tabs: { value: string; label: string }[] = [{ value: 'all', label: 'All' }];
    allSpecies
      .filter((s) => present.has(s.key))
      .forEach((s) => tabs.push({ value: s.key, label: s.label }));
    return tabs;
  }, [animals, allSpecies]);

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

  const filtered = useMemo(() => {
    return animals.filter((a) => {
      if (showAttentionOnly && a.status === 'healthy') return false;
      const matchSpecies = activeSpecies === 'all' || a.species === activeSpecies;
      const activeMob = activeMobId ? mobs.find(m => m.id === activeMobId) : null;
      const matchMob = !activeMob || activeMob.animalIds.includes(a.id);
      const q = search.toLowerCase();
      const matchSearch = !q ||
        a.name.toLowerCase().includes(q) ||
        a.tag.toLowerCase().includes(q) ||
        a.breed.toLowerCase().includes(q) ||
        a.paddock.toLowerCase().includes(q);
      return matchSpecies && matchMob && matchSearch;
    });
  }, [animals, activeSpecies, activeMobId, mobs, search, showAttentionOnly]);

  const monitorCount = animals.filter((a) => a.status !== 'healthy').length;

  function handleCreateMob(e: React.FormEvent) {
    e.preventDefault();
    if (!newMobName.trim()) return;
    addMob({ id: `mob-${Date.now()}`, name: newMobName.trim(), color: newMobColor, animalIds: [] });
    setNewMobName('');
    setNewMobColor(MOB_COLORS[0]);
    setShowNewMobForm(false);
  }

  function toggleAnimalInMob(mobId: string, animalId: string, inMob: boolean) {
    if (inMob) removeAnimalFromMob(mobId, animalId);
    else addAnimalToMob(mobId, animalId);
  }

  function resetForm() {
    setName(''); setTag(''); setSpecies('sheep'); setBreed('');
    setSex('female'); setDob(''); setPaddock(''); setWeight('');
    setStatus('healthy'); setNotes(''); setPurchaseDate(''); setPurchasePrice(''); setNaitTag(''); setShowOptional(false);
  }

  function handleClose() { resetForm(); setShowForm(false); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const animal: Animal = {
      id:            `a-${Date.now()}`,
      name:          name.trim(),
      tag:           tag.trim(),
      species,
      breed:         breed.trim(),
      sex,
      dob,
      paddock:       paddock.trim() || 'Unassigned',
      status,
      weight:        weight ? parseFloat(weight) : undefined,
      notes:         notes.trim() || undefined,
      purchaseDate:  purchaseDate || undefined,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
      naitTag:       species === 'cattle' && naitTag.trim() ? naitTag.trim() : undefined,
    };
    addAnimal(animal);
    resetForm();
    setShowForm(false);
  }

  return (
    <div className="pb-8">

      <PageHeader
        title="Animals"
        action={
          <>
            <button
              onClick={() => setShowMobPanel(v => !v)}
              className="hidden md:flex items-center gap-2 px-3 py-2.5 rounded-xl flex-shrink-0 transition-all active:scale-[0.97]"
              style={{ background: showMobPanel ? '#111' : '#f5f5f4', color: showMobPanel ? '#fff' : '#374151', fontSize: '13px', fontWeight: 600, border: '1px solid #e5e7eb' }}
            >
              <Users width={14} height={14} />
              <span className="hidden sm:inline">Mobs</span>
              {mobs.length > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px]" style={{ background: showMobPanel ? '#ffffff30' : '#ea580c20', color: showMobPanel ? '#fff' : '#ea580c' }}>
                  {mobs.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-shrink-0 transition-all active:scale-[0.97]"
              style={{ background: showForm ? '#f5f5f4' : '#ea580c', color: showForm ? '#6b7280' : '#fff', fontSize: '13px', fontWeight: 600 }}
            >
              {showForm ? <X width={14} height={14} /> : (!profile.fernPlus && animals.length >= 30 ? <Lock width={14} height={14} /> : <Plus width={14} height={14} />)}
              {showForm ? 'Cancel' : 'Add Animal'}
            </button>
          </>
        }
        chips={[
          { label: profile.fernPlus ? `${animals.length} registered` : `${animals.length}/30 registered`, variant: 'neutral' },
          ...(monitorCount > 0 ? [{ label: `${monitorCount} need attention`, variant: 'warning' as const, onClick: () => setShowAttentionOnly(v => !v), active: showAttentionOnly }] : []),
        ]}
      />

      <div className="max-w-5xl mx-auto px-4 md:px-8">

      {/* ── Mob management panel ── */}
      <AnimatedSection open={showMobPanel}>
        <div className="rounded-2xl mb-5 overflow-hidden" style={{ border: '1px solid #ebebeb' }}>
          <div className="flex items-center justify-between px-5 py-3" style={{ background: '#f9f9f8', borderBottom: '1px solid #ebebeb' }}>
            <div className="flex items-center gap-2">
              <Users width={13} height={13} style={{ color: '#6b7280' }} />
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>Mob Groups</p>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>{mobs.length} mob{mobs.length !== 1 ? 's' : ''}</span>
            </div>
            <button
              onClick={() => setShowNewMobForm(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all"
              style={{ fontSize: '12px', fontWeight: 600, background: '#ea580c', color: '#fff' }}
            >
              <Plus width={11} height={11} />
              New Mob
            </button>
          </div>

          {/* New mob form */}
          <AnimatedSection open={showNewMobForm}>
            <form onSubmit={handleCreateMob} className="px-5 py-4 space-y-3" style={{ borderBottom: '1px solid #f0f0f0', background: '#fefefe' }}>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Mob name</p>
                  <input
                    className={INPUT}
                    placeholder="e.g. Lambing ewes"
                    value={newMobName}
                    onChange={e => setNewMobName(e.target.value)}
                    required

                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl transition-all flex-shrink-0"
                  style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 600 }}
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewMobForm(false)}
                  className="px-3 py-2.5 rounded-xl flex-shrink-0"
                  style={{ background: '#f5f5f4', color: '#6b7280', fontSize: '13px', border: '1px solid #e5e7eb' }}
                >
                  <X width={13} height={13} />
                </button>
              </div>
              <div>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>Colour</p>
                <div className="flex gap-2">
                  {MOB_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewMobColor(c)}
                      className="w-6 h-6 rounded-full transition-all flex items-center justify-center"
                      style={{ background: c, boxShadow: newMobColor === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : 'none' }}
                    >
                      {newMobColor === c && <Check width={10} height={10} style={{ color: '#fff' }} />}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </AnimatedSection>

          {/* Mob list */}
          {mobs.length === 0 ? (
            <div className="px-5 py-6 text-center" style={{ background: '#fefefe' }}>
              <p style={{ fontSize: '13px', color: '#9ca3af' }}>No mobs yet, create a group to organise animals</p>
            </div>
          ) : (
            <div className="divide-y" style={{ divideColor: '#f0f0f0', background: '#fefefe' }}>
              {mobs.map(mob => {
                const mobAnimals = animals.filter(a => mob.animalIds.includes(a.id));
                const isFiltering = activeMobId === mob.id;
                const isEditing = editMobId === mob.id;
                return (
                  <div key={mob.id} style={{ borderTop: '1px solid #f0f0f0' }}>
                    <div className="flex items-center gap-3 px-5 py-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: mob.color }} />
                      <button
                        onClick={() => setActiveMobId(isFiltering ? null : mob.id)}
                        className="flex-1 text-left transition-all"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <span style={{ fontSize: '13px', fontWeight: isFiltering ? 700 : 500, color: isFiltering ? mob.color : '#111' }}>
                          {mob.name}
                        </span>
                        <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '8px' }}>
                          {mobAnimals.length} animal{mobAnimals.length !== 1 ? 's' : ''}
                        </span>
                        {isFiltering && (
                          <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: mob.color + '20', color: mob.color }}>
                            Filtering
                          </span>
                        )}
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditMobId(isEditing ? null : mob.id)}
                          className="px-2 py-1 rounded-lg transition-all"
                          style={{ fontSize: '11px', color: '#6b7280', background: isEditing ? '#f0f0f0' : 'transparent' }}
                        >
                          {isEditing ? <ChevronUp width={12} height={12} /> : <ChevronDown width={12} height={12} />}
                        </button>
                        <button
                          onClick={() => removeMob(mob.id)}
                          className="p-1 rounded-lg transition-all"
                          style={{ color: '#9ca3af' }}
                        >
                          <X width={12} height={12} />
                        </button>
                      </div>
                    </div>

                    {/* Assign animals sub-panel */}
                    {isEditing && (
                      <div className="px-5 pb-4" style={{ background: '#fafaf9' }}>
                        <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>Tap to add/remove animals</p>
                        <div className="flex flex-wrap gap-2">
                          {animals.map(a => {
                            const inMob = mob.animalIds.includes(a.id);
                            const scfg = SPECIES_CONFIG[a.species];
                            return (
                              <button
                                key={a.id}
                                onClick={() => toggleAnimalInMob(mob.id, a.id, inMob)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all"
                                style={{
                                  fontSize: '11px',
                                  fontWeight: inMob ? 700 : 400,
                                  background: inMob ? mob.color + '15' : '#f0f0f0',
                                  color: inMob ? mob.color : '#6b7280',
                                  border: `1px solid ${inMob ? mob.color + '50' : '#e5e7eb'}`,
                                }}
                              >
                                {inMob && <Check width={9} height={9} />}
                                {a.name}
                                <span style={{ opacity: 0.6, fontSize: '9px' }}>{scfg.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AnimatedSection>

      {/* ── Inline add form ── */}
      <AnimatedSection open={showForm}>
        {/* Animal limit gate for free users */}
        {!profile.fernPlus && animals.length >= 30 ? (
          <div className="rounded-2xl mb-5 overflow-hidden" style={{ background: '#fefefe', border: '1px solid #fed7aa' }}>
            <div className="px-5 py-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fff7ed' }}>
                <Lock width={16} height={16} style={{ color: '#ea580c' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginBottom: '4px' }}>
                  30 animal limit reached
                </p>
                <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.6, marginBottom: '12px' }}>
                  The free plan supports up to 30 animals. Upgrade to Fern Plus for unlimited animals.
                </p>
                <Link
                  to="/fern-plus"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-[0.97]"
                  style={{ background: '#ea580c', color: '#fff', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}
                >
                  <Zap width={12} height={12} />
                  View Fern Plus
                </Link>
              </div>
              <button onClick={handleClose} style={{ color: '#9ca3af', flexShrink: 0 }}>
                <X width={14} height={14} />
              </button>
            </div>
          </div>
        ) : (
        <div className="rounded-2xl mb-5 overflow-hidden" style={{ border: '1px solid #ebebeb' }}>
          {/* Form header */}
          <div className="flex items-center justify-between px-5 py-4" style={{ background: '#f9f9f8', borderBottom: '1px solid #ebebeb' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>New Animal</p>
            <button onClick={handleClose}>
              <X width={14} height={14} style={{ color: '#9ca3af' }} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4" style={{ background: '#fefefe' }}>

            {/* Species */}
            <div>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>Animal Type</p>
              <DropdownSelect
                value={species}
                onChange={v => setSpecies(v)}
                placeholder="Select animal type…"
                options={allSpecies.map(s => ({ label: s.label, value: s.key }))}
              />
            </div>

            {/* Name + Tag */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Name *</p>
                <input
                  className={INPUT}
                  placeholder="e.g. Dolly"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Tag / ID *</p>
                <input
                  className={INPUT}
                  placeholder="e.g. #007"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* NAIT tag — cattle only */}
            {species === 'cattle' && (
              <div>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>
                  NAIT tag number
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-md" style={{ fontSize: '9px', fontWeight: 700, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>NAIT</span>
                </p>
                <input
                  className={INPUT}
                  placeholder="e.g. 982 000123456789"
                  value={naitTag}
                  onChange={(e) => setNaitTag(e.target.value)}
                />
                <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '3px' }}>15-digit RFID or visual tag number. Optional — can be added later.</p>
              </div>
            )}

            {/* Sex */}
            <div>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Sex *</p>
              <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #e5e7eb' }}>
                {(['female', 'male'] as Sex[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSex(s)}
                    className="flex-1 py-2.5 transition-all"
                    style={{
                      fontSize: '12px',
                      fontWeight: sex === s ? 700 : 400,
                      background: sex === s ? '#111' : '#fff',
                      color: sex === s ? '#fff' : '#6b7280',
                    }}
                  >
                    {s === 'female' ? 'Female' : 'Male'}
                  </button>
                ))}
              </div>
            </div>

            {/* DOB */}
            <div>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Date of birth *</p>
              <DatePickerInput value={dob} onChange={v => setDob(v)} placeholder="Date of birth" />
            </div>

            {/* Optional fields toggle */}
            <button
              type="button"
              onClick={() => setShowOptional(v => !v)}
              className="flex items-center gap-1.5 w-full py-2 rounded-xl transition-colors"
              style={{ fontSize: '12px', color: '#6b7280', background: '#f9f9f8', border: '1px solid #f0f0f0', paddingLeft: '12px' }}
            >
              {showOptional
                ? <ChevronUp width={13} height={13} />
                : <ChevronDown width={13} height={13} />
              }
              <span style={{ fontWeight: 500 }}>Optional details</span>
              {!showOptional && (breed || weight || paddock || purchaseDate || purchasePrice || notes) && (
                <span className="ml-auto mr-3 px-1.5 py-0.5 rounded-full" style={{ fontSize: '10px', fontWeight: 700, background: '#ea580c', color: '#fff' }}>
                  filled
                </span>
              )}
            </button>

            <AnimatedSection open={showOptional}>
              <div className="space-y-4 pt-1">
                {/* Breed + Weight */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Breed</p>
                    <input
                      className={INPUT}
                      placeholder="e.g. Romney, Angus…"
                      value={breed}
                      onChange={(e) => setBreed(e.target.value)}
                    />
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Weight (kg)</p>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      className={INPUT}
                      placeholder="e.g. 45"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                  </div>
                </div>

                {/* Paddock */}
                <div>
                  <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Paddock</p>
                  <DropdownSelect
                    value={paddock}
                    onChange={setPaddock}
                    placeholder="Select paddock…"
                    options={[
                      { label: 'Unassigned', value: '' },
                      ...paddocks.map(p => ({ label: p.name, value: p.name })),
                    ]}
                  />
                </div>

                {/* Health status */}
                <div>
                  <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>Health Status</p>
                  <div className="flex gap-2">
                    {(['healthy', 'monitor', 'sick'] as HealthStatus[]).map((s) => {
                      const cfg = HEALTH_STATUS_CONFIG[s];
                      const active = status === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStatus(s)}
                          className="flex-1 py-2 rounded-xl transition-all"
                          style={{
                            fontSize: '12px',
                            fontWeight: active ? 700 : 400,
                            background: active ? cfg.bg : '#f9f9f8',
                            color: active ? cfg.color : '#6b7280',
                            border: `1px solid ${active ? cfg.border : '#f0f0f0'}`,
                          }}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Purchase info */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Purchase date</p>
                    <DatePickerInput value={purchaseDate} onChange={v => setPurchaseDate(v)} placeholder="Purchase date" />
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Purchase price ($)</p>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={INPUT}
                      placeholder="e.g. 250"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Notes</p>
                  <textarea
                    className={INPUT}
                    style={{ resize: 'none', height: '64px' }}
                    placeholder="Any observations, treatments, or context..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </AnimatedSection>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl transition-all"
                style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 600 }}
              >
                Add to Register
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl"
                style={{ background: '#f5f5f4', color: '#6b7280', fontSize: '13px', border: '1px solid #e5e7eb' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
        )}
      </AnimatedSection>

      {/* ── Birthday alerts ── */}
      {birthdayAlerts.length > 0 && (
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

      {/* Search */}
      <div className="relative mb-3">
        <Search
          width={14}
          height={14}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: '#9ca3af' }}
        />
        <input
          className="w-full pl-9 pr-4 py-2.5 rounded-xl outline-none transition-colors"
          style={{ background: '#fefefe', border: '1px solid #ebebeb', fontSize: '13px', color: '#111' }}
          placeholder="Search by name, tag, breed or paddock..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Mob filter chip ── */}
      {activeMobId && (() => {
        const mob = mobs.find(m => m.id === activeMobId);
        if (!mob) return null;
        return (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: mob.color + '15', border: `1px solid ${mob.color}50` }}>
              <div className="w-2 h-2 rounded-full" style={{ background: mob.color }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: mob.color }}>{mob.name}</span>
              <button onClick={() => setActiveMobId(null)} className="ml-0.5 flex items-center justify-center w-4 h-4 rounded-full" style={{ background: mob.color + '30' }}>
                <X width={9} height={9} style={{ color: mob.color }} />
              </button>
            </div>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>{filtered.length} animal{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        );
      })()}

      {/* ── Attention filter chip ── */}
      {showAttentionOnly && (
        <div className="flex items-center gap-2 mb-4">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
          >
            <AlertTriangle width={12} height={12} style={{ color: '#d97706', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#d97706' }}>
              Needs Attention
            </span>
            <button
              onClick={() => setShowAttentionOnly(false)}
              className="ml-0.5 flex items-center justify-center w-4 h-4 rounded-full transition-all"
              style={{ background: '#fde68a' }}
              title="Clear filter"
            >
              <X width={9} height={9} style={{ color: '#92400e' }} />
            </button>
          </div>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>
            {filtered.length} {filtered.length === 1 ? 'animal' : 'animals'}
          </span>
        </div>
      )}

      {/* Species tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-5" style={{ scrollbarWidth: 'none' }}>
        {visibleTabs.map((tab) => {
          const active = activeSpecies === tab.value;
          const cfg = tab.value !== 'all' ? (SPECIES_CONFIG[tab.value] ?? null) : null;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveSpecies(tab.value)}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl transition-all hover:shadow-sm hover:brightness-[0.97]"
              style={{
                fontSize: '12px',
                fontWeight: active ? 700 : 400,
                background: active ? (cfg ? cfg.bg : '#111') : '#fff',
                color: active ? (cfg ? cfg.color : '#fff') : '#6b7280',
                border: `1px solid ${active ? (cfg ? cfg.border : '#111') : '#ebebeb'}`,
              }}
            >
              {tab.label}
              {tab.value !== 'all' && (
                <span className="ml-1.5" style={{ opacity: 0.7 }}>
                  {animals.filter((a) => a.species === tab.value).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Animal list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p style={{ fontSize: '14px', color: '#9ca3af' }}>
            {showAttentionOnly
              ? 'No animals currently need attention'
              : search || activeSpecies !== 'all'
              ? 'No animals match your search'
              : 'No animals yet, tap "+ Add Animal" to register your first'}
          </p>
          {showAttentionOnly && (
            <button
              onClick={() => setShowAttentionOnly(false)}
              className="mt-3 px-4 py-2 rounded-xl transition-all"
              style={{ fontSize: '12px', fontWeight: 600, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a' }}
            >
              Clear filter
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table header */}
          <div
            className="hidden md:grid gap-3 px-4 pb-2 mb-1"
            style={{ gridTemplateColumns: '110px 1fr 120px 110px 100px 80px', borderBottom: '1px solid #ebebeb' }}
          >
            {['Species', 'Name / Tag', 'Breed', 'Paddock', 'Age', 'Status'].map((h) => (
              <p key={h} style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                {h}
              </p>
            ))}
          </div>

          <div className="space-y-1.5">
            {filtered.map((animal) => {
              const scfg = SPECIES_CONFIG[animal.species];
              const hcfg = HEALTH_STATUS_CONFIG[animal.status];
              return (
                <Link
                  key={animal.id}
                  to={`/animals/${animal.id}`}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  {/* Mobile card */}
                  <div
                    className="md:hidden rounded-2xl p-4 transition-all active:scale-[0.99] hover:shadow-md"
                    style={{ background: '#fefefe', border: '1px solid #ebebeb' }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          <span
                            className="inline-block px-2 py-0.5 rounded-full"
                            style={{ fontSize: '10px', fontWeight: 700, color: scfg.color, background: scfg.bg, border: `1px solid ${scfg.border}` }}
                          >
                            {scfg.label}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p style={{ fontSize: '14px', fontWeight: 700, color: '#111' }}>{animal.name}</p>
                          <p style={{ fontSize: '11px', color: '#9ca3af' }}>
                            {animal.tag} · {animal.breed} · {animal.paddock}
                          </p>
                          <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '1px' }}>
                            {getAnimalAge(animal.dob)} · {animal.sex === 'female' ? 'Female' : 'Male'}
                            {animal.weight ? ` · ${animal.weight}kg` : ''}
                          </p>
                        </div>
                      </div>
                      <span
                        className="inline-block px-2.5 py-1 rounded-xl flex-shrink-0"
                        style={{ fontSize: '11px', fontWeight: 600, color: hcfg.color, background: hcfg.bg, border: `1px solid ${hcfg.border}` }}
                      >
                        {hcfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Desktop row */}
                  <div
                    className="hidden md:grid items-center gap-3 px-4 py-3 rounded-2xl transition-all hover:shadow-md"
                    style={{ gridTemplateColumns: '110px 1fr 120px 110px 100px 80px', background: '#fefefe', border: '1px solid #ebebeb' }}
                  >
                    <span
                      className="inline-block px-2 py-0.5 rounded-full w-fit"
                      style={{ fontSize: '10px', fontWeight: 700, color: scfg.color, background: scfg.bg, border: `1px solid ${scfg.border}` }}
                    >
                      {scfg.label}
                    </span>
                    <div className="min-w-0">
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>{animal.name}</p>
                      <p style={{ fontSize: '11px', color: '#9ca3af' }}>{animal.tag}</p>
                    </div>
                    <p style={{ fontSize: '12px', color: '#374151' }}>{animal.breed}</p>
                    <p style={{ fontSize: '12px', color: '#374151' }}>{animal.paddock}</p>
                    <p style={{ fontSize: '12px', color: '#374151' }}>{getAnimalAge(animal.dob)}</p>
                    <span
                      className="inline-block px-2.5 py-1 rounded-xl w-fit"
                      style={{ fontSize: '11px', fontWeight: 600, color: hcfg.color, background: hcfg.bg, border: `1px solid ${hcfg.border}` }}
                    >
                      {hcfg.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
      </div>
    </div>
  );
}
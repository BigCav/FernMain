import { useState, useRef, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { useParams, Link, useNavigate } from 'react-router';
import { AnimatedSection } from '../components/AnimatedSection';
import { ArrowLeft, Plus, X, ArrowRight, BookOpen, Camera, Trash2 } from 'lucide-react';
import { useAnimals } from '../context/AnimalsContext';
import { usePhotos } from '../context/PhotoContext';
import { useWeight } from '../context/WeightContext';
import { useBreeding } from '../context/BreedingContext';
import { useWithholding } from '../context/WithholdingContext';
import { useProfile } from '../context/ProfileContext';
import {
  HealthEvent, HealthEventType, SPECIES_CONFIG, HEALTH_STATUS_CONFIG,
  HEALTH_EVENT_CONFIG, TRANSFER_PURPOSE_CONFIG,
  getAnimalAge, fmtDate, TODAY,
} from '../data/blockData';
import { TransferModal } from '../components/TransferModal';
import { AnimalPassport } from '../components/AnimalPassport';
import { WeightSection } from '../components/WeightSection';
import { BreedingSection } from '../components/BreedingSection';
import { WithholdingSection } from '../components/WithholdingSection';
import { SellingCalculator } from '../components/SellingCalculator';
import { DatePickerInput } from '../components/DatePickerInput';

const INPUT = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none bg-white text-gray-900 transition-colors focus:border-orange-400 text-sm';

const EVENT_TYPES: { value: HealthEventType; label: string }[] = [
  { value: 'checkup',     label: 'Check-up'    },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'worming',     label: 'Worming'     },
  { value: 'treatment',   label: 'Treatment'   },
  { value: 'injury',      label: 'Injury'      },
];

export function AnimalDetail() {
  const { id } = useParams<{ id: string }>();
  const { animals, healthEvents, addHealthEvent, updateAnimal, updateAnimalStatus, addTransfer, removeAnimal, removeHealthEventsForAnimal } = useAnimals();

  const animal = animals.find((a) => a.id === id);
  const events = healthEvents
    .filter((e) => e.animalId === id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const { photos, setPhoto, removePhoto } = usePhotos();
  const { entriesForAnimal, removeEntriesForAnimal } = useWeight();
  const { removeRecordsForAnimal: removeBreedingForAnimal } = useBreeding();
  const { removeRecordsForAnimal: removeWithholdingForAnimal } = useWithholding();
  const { profile } = useProfile();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [adding, setAdding]      = useState(false);
  const [evType, setEvType]      = useState<HealthEventType>('checkup');
  const [evDate, setEvDate]      = useState(TODAY);
  const [evDesc, setEvDesc]      = useState('');
  const [evVet,  setEvVet]       = useState('');
  const [evCost, setEvCost]      = useState('');
  const [evNext, setEvNext]      = useState('');

  const [notesDraft,    setNotesDraft]    = useState<string | null>(null);
  const [showTransfer,  setShowTransfer]  = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const navigate = useNavigate();
  const [showPassport,  setShowPassport]  = useState(false);
  const [lightbox,      setLightbox]      = useState(false);

  if (!animal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p style={{ fontSize: '15px', color: '#9ca3af' }}>Animal not found</p>
        <Link to="/animals" style={{ fontSize: '13px', color: '#ea580c' }}>← Back to Animals</Link>
      </div>
    );
  }

  const scfg = SPECIES_CONFIG[animal.species];
  const animalPhoto = photos[animal.id];
  const weightEntries = entriesForAnimal(animal.id);
  const latestWeightKg = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].kg : (animal.weight ?? null);
  const ownerName     = profile.name     || 'Me';
  const ownerProperty = profile.property || '';
  const ownerLocation = profile.location || '';
  const transfers     = animal.transfers ?? [];

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      // Resize to max 800px using a canvas
      const img = new Image();
      img.onload = () => {
        const maxSize = 800;
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) { height = Math.round((height / width) * maxSize); width = maxSize; }
          else { width = Math.round((width / height) * maxSize); height = maxSize; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        setPhoto(animal!.id, canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  }

  function handleAddEvent(e: FormEvent) {
    e.preventDefault();
    if (!evDesc.trim()) return;
    const ev: HealthEvent = {
      id:          `h-${Date.now()}`,
      animalId:    animal!.id,
      date:        evDate,
      type:        evType,
      description: evDesc.trim(),
      vet:         evVet.trim() || undefined,
      cost:        evCost ? parseFloat(evCost) : undefined,
      nextDue:     evNext || undefined,
    };
    addHealthEvent(ev);
    setAdding(false);
    setEvType('checkup'); setEvDate(TODAY);
    setEvDesc(''); setEvVet(''); setEvCost(''); setEvNext('');
  }

  function handleDelete() {
    if (!animal) return;
    removeAnimal(animal.id);
    removeHealthEventsForAnimal(animal.id);
    removeEntriesForAnimal(animal.id);
    removeBreedingForAnimal(animal.id);
    removeWithholdingForAnimal(animal.id);
    removePhoto(animal.id);
    navigate('/animals');
  }

  return (
    <motion.div
      className="px-4 pt-6 pb-10 md:px-8 md:pt-8 max-w-6xl mx-auto"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >

      {/* Back nav */}
      <Link
        to="/animals"
        className="inline-flex items-center gap-2 mb-5 transition-colors"
        style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}
      >
        <ArrowLeft width={15} height={15} />
        Animals
      </Link>

      {/* Two-column grid on desktop */}
      <div className="md:grid md:grid-cols-[1fr_360px] md:gap-6 md:items-start">

      {/* ── LEFT COLUMN ── */}
      <div>

      {/* Animal profile card */}
      <div className="rounded-2xl overflow-hidden mb-4" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
        {/* Desktop: always colour stripe */}
        <div className="hidden md:block" style={{ height: '4px', background: scfg.border }} />

        {/* Mobile: photo (taller) or colour stripe */}
        {animalPhoto ? (
          <div className="relative md:hidden" style={{ height: '253px', cursor: 'zoom-in' }} onClick={() => setLightbox(true)}>
            <img
              src={animalPhoto}
              alt={animal.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)', pointerEvents: 'none' }} />
            <div className="absolute bottom-3 right-3 flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); photoInputRef.current?.click(); }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl backdrop-blur-sm"
                style={{ background: 'rgba(255,255,255,0.85)', fontSize: '11px', fontWeight: 600, color: '#374151' }}
              >
                <Camera width={11} height={11} />
                Change
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); removePhoto(animal.id); }}
                className="p-1.5 rounded-xl backdrop-blur-sm"
                style={{ background: 'rgba(255,255,255,0.85)', color: '#6b7280' }}
              >
                <X width={11} height={11} />
              </button>
            </div>
          </div>
        ) : (
          <div className="md:hidden" style={{ height: '4px', background: scfg.border }} />
        )}

        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handlePhotoChange}
        />

        <div className="p-5 md:p-6">
          {/* Header */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block px-2 py-0.5 rounded-full"
                  style={{ fontSize: '10px', fontWeight: 700, color: scfg.color, background: scfg.bg, border: `1px solid ${scfg.border}` }}
                >
                  {scfg.label}
                </span>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>{animal.tag}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!animalPhoto && (
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all"
                    style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', background: '#f5f5f4', border: '1px solid #e5e7eb' }}
                  >
                    <Camera width={11} height={11} />
                    Add photo
                  </button>
                )}
                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>Delete?</span>
                    <button
                      onClick={handleDelete}
                      className="px-2.5 py-1 rounded-xl transition-all active:scale-[0.97]"
                      style={{ fontSize: '11px', fontWeight: 700, color: '#fff', background: '#dc2626' }}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="px-2.5 py-1 rounded-xl transition-all"
                      style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', background: '#f5f5f4', border: '1px solid #e5e7eb' }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="p-1.5 rounded-lg transition-all hover:bg-red-50"
                    title="Delete animal"
                  >
                    <Trash2 width={13} height={13} style={{ color: '#9ca3af' }} />
                  </button>
                )}
              </div>
            </div>
            <p style={{ fontSize: '24px', fontWeight: 800, color: '#111', letterSpacing: '-0.03em' }}>
              {animal.name}
            </p>
          </div>

          {/* Key info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
            {[
              ...(animal.breed ? [{ label: 'Breed', value: animal.breed }] : []),
              { label: 'Age',      value: getAnimalAge(animal.dob) },
              { label: 'Sex',      value: animal.sex === 'female' ? 'Female' : 'Male' },
              { label: 'Paddock',  value: animal.paddock },
              ...(latestWeightKg != null ? [{ label: 'Weight', value: `${latestWeightKg} kg` }] : []),
              { label: 'DOB',      value: fmtDate(animal.dob) },
              ...(animal.purchaseDate ? [{ label: 'Purchased', value: fmtDate(animal.purchaseDate) }] : []),
              ...(animal.purchasePrice ? [{ label: 'Purchase Price', value: `$${animal.purchasePrice}` }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="p-3 rounded-xl" style={{ background: '#f9f9f8', border: '1px solid #f0f0f0' }}>
                <p style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>
                  {label}
                </p>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Status toggle */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
              Update Status
            </p>
            <div className="flex gap-2">
              {(['healthy', 'monitor', 'sick'] as const).map((s) => {
                const cfg = HEALTH_STATUS_CONFIG[s];
                const active = animal.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => updateAnimalStatus(animal.id, s)}
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

          {/* Notes */}
          <div className="mt-4">
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
              Notes
            </p>
            <textarea
              rows={3}
              value={notesDraft ?? (animal.notes ?? '')}
              onChange={e => setNotesDraft(e.target.value)}
              placeholder="Vet instructions, behavioural notes, reminders…"
              className="w-full px-3 py-2.5 rounded-xl outline-none resize-none"
              style={{
                fontSize: '12px',
                color: '#374151',
                background: '#f9f9f8',
                border: '1px solid #e5e7eb',
                lineHeight: 1.5,
              }}
            />
            {notesDraft !== null && (
              <div className="flex justify-end mt-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNotesDraft(null)}
                  className="px-3 py-1.5 rounded-lg transition-all active:scale-[0.97]"
                  style={{ fontSize: '12px', fontWeight: 500, color: '#9ca3af', background: '#f3f4f6', border: '1px solid #e5e7eb' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateAnimal(animal.id, { notes: notesDraft.trim() || undefined });
                    setNotesDraft(null);
                  }}
                  className="px-3 py-1.5 rounded-lg transition-all active:scale-[0.97]"
                  style={{ fontSize: '12px', fontWeight: 600, color: '#fff', background: '#ea580c' }}
                >
                  Save
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Health history */}
      <div className="rounded-2xl overflow-hidden mb-4" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>Health Records</p>
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all"
            style={{ background: '#f5f5f4', color: '#374151', fontSize: '12px', fontWeight: 600, border: '1px solid #e5e7eb', visibility: adding ? 'hidden' : 'visible', pointerEvents: adding ? 'none' : 'auto' }}
          >
            <Plus width={12} height={12} />
            Add Event
          </button>
        </div>

        {/* Add event form */}
        <AnimatedSection open={adding}>
          <form onSubmit={handleAddEvent} className="p-5 space-y-4" style={{ borderBottom: '1px solid #f0f0f0', background: '#f9f9f8' }}>
            <div className="flex items-center justify-between mb-1">
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#111' }}>New Health Record</p>
              <button type="button" onClick={() => setAdding(false)}>
                <X width={14} height={14} style={{ color: '#9ca3af' }} />
              </button>
            </div>

            {/* Type tabs */}
            <div className="flex flex-wrap gap-1.5">
              {EVENT_TYPES.map((t) => {
                const active = evType === t.value;
                const cfg = HEALTH_EVENT_CONFIG[t.value];
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setEvType(t.value)}
                    className="px-3 py-1.5 rounded-xl transition-all"
                    style={{
                      fontSize: '11px',
                      fontWeight: active ? 700 : 400,
                      background: active ? '#fff' : '#f5f5f4',
                      color: active ? cfg.color : '#6b7280',
                      border: `1px solid ${active ? cfg.color + '60' : '#e5e7eb'}`,
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            <textarea
              className={INPUT}
              style={{ fontSize: '13px', resize: 'none', height: '80px' }}
              placeholder="Description of event / treatment / findings..."
              value={evDesc}
              onChange={(e) => setEvDesc(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Date</p>
                <DatePickerInput value={evDate} onChange={v => setEvDate(v)} placeholder="Date" />
              </div>
              <div>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Cost ($)</p>
                <input type="number" min="0" step="0.01" className={INPUT} style={{ fontSize: '13px' }} placeholder="Optional" value={evCost} onChange={(e) => setEvCost(e.target.value)} />
              </div>
              <div>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Vet / Provider</p>
                <input className={INPUT} style={{ fontSize: '13px' }} placeholder="Optional" value={evVet} onChange={(e) => setEvVet(e.target.value)} />
              </div>
              <div>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Next Due</p>
                <DatePickerInput value={evNext} onChange={v => setEvNext(v)} placeholder="Next due" />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl transition-all"
                style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 600 }}
              >
                Save Record
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="px-4 py-2.5 rounded-xl"
                style={{ background: '#fefefe', color: '#6b7280', fontSize: '13px', border: '1px solid #e5e7eb' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </AnimatedSection>

        {/* Events list */}
        {events.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>No health records yet, add one above</p>
          </div>
        ) : (
          <div>
            {events.map((ev, idx) => {
              const cfg = HEALTH_EVENT_CONFIG[ev.type];
              return (
                <div key={ev.id} className="flex items-start gap-3 px-5 py-3.5" style={{ borderTop: idx > 0 ? '1px solid #f3f4f6' : 'none' }}>
                  {/* Icon circle */}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#ffffff', border: `1.5px solid #e5e7eb` }}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.color }} />
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span style={{ fontSize: '11px', fontWeight: 700, color: cfg.color, background: cfg.bg ?? '#f5f5f4', padding: '2px 9px', borderRadius: '99px' }}>
                        {cfg.label}
                      </span>
                      <span style={{ fontSize: '11px', color: '#9ca3af', flexShrink: 0 }}>{fmtDate(ev.date)}</span>
                    </div>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: '#111' }}>{ev.description}</p>
                    {(ev.vet || ev.cost || ev.nextDue) && (
                      <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 mt-1">
                        {ev.vet && <span style={{ fontSize: '11px', color: '#9ca3af' }}>Vet: {ev.vet}</span>}
                        {ev.cost !== undefined && ev.cost > 0 && <span style={{ fontSize: '11px', color: '#9ca3af' }}>${ev.cost}</span>}
                        {ev.nextDue && <span style={{ fontSize: '11px', color: '#ea580c', fontWeight: 600 }}>Next due: {fmtDate(ev.nextDue)}</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Passport & Transfers ── */}
      <div className="rounded-2xl overflow-hidden mb-4" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid #f0f0f0' }}
        >
          <div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>
              <span className="md:hidden">Ownership</span>
              <span className="hidden md:inline">Passport &amp; Transfers</span>
            </p>
            <p className="hidden md:block" style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>
              Chain of custody · {(animal.transfers ?? []).length} transfer{(animal.transfers ?? []).length !== 1 ? 's' : ''} recorded
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPassport(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all"
              style={{ fontSize: '12px', fontWeight: 600, color: '#374151', background: '#f5f5f4', border: '1px solid #e5e7eb' }}
            >
              <BookOpen width={12} height={12} />
              Passport
            </button>
            {profile.fernPlus && (
              <button
                onClick={() => setShowTransfer(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all"
                style={{ fontSize: '12px', fontWeight: 600, color: '#fff', background: '#ea580c' }}
              >
                <ArrowRight width={12} height={12} />
                Transfer
              </button>
            )}
          </div>
        </div>

        {/* Transfer timeline */}
        {transfers.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: '#f5f5f4' }}
            >
              <BookOpen width={18} height={18} style={{ color: '#9ca3af' }} />
            </div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>No transfers yet</p>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
              Record a transfer to start this animal's chain of custody.
            </p>
          </div>
        ) : (
          <div className="p-5">
            {/* Current holder — always at top, orange blip */}
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center flex-shrink-0 mt-0.5" style={{ width: '16px' }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ea580c', boxShadow: '0 0 0 2px #fed7aa' }} />
                <div style={{ width: '2px', flex: 1, minHeight: '24px', background: '#e5e7eb', marginTop: '4px' }} />
              </div>
              <div className="flex-1 pb-4">
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#111' }}>{ownerName}</p>
                {(ownerProperty || ownerLocation) && (
                  <p style={{ fontSize: '11px', color: '#9ca3af' }}>{[ownerProperty, ownerLocation].filter(Boolean).join(', ')}</p>
                )}
              </div>
            </div>

            {/* Transfer steps — newest first */}
            {[...transfers].reverse().map((tr, i) => {
              const cfg = TRANSFER_PURPOSE_CONFIG[tr.purpose];
              return (
                <div key={tr.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center flex-shrink-0 mt-0.5" style={{ width: '16px' }}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#9ca3af', boxShadow: '0 0 0 2px #f0f0f0' }} />
                    <div style={{ width: '2px', flex: 1, minHeight: '24px', background: '#e5e7eb', marginTop: '4px' }} />
                  </div>
                  <div className="flex-1 pb-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className="inline-block px-1.5 py-0.5 rounded-full"
                        style={{ fontSize: '9px', fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
                      >
                        {cfg.label}
                      </span>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>{fmtDate(tr.date)}</span>
                      {tr.price != null && (
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#15803d' }}>${tr.price.toFixed(2)}</span>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#111' }}>{tr.fromName}</p>
                    {tr.fromProperty && <p style={{ fontSize: '11px', color: '#9ca3af' }}>{[tr.fromProperty, tr.fromLocation].filter(Boolean).join(', ')}</p>}
                    {tr.notes && (
                      <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px', fontStyle: 'italic' }}>{tr.notes}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>


      </div>{/* end left column */}

      {/* ── RIGHT COLUMN ── */}
      <div>
        {/* Desktop photo card */}
        {animalPhoto && (
          <div
            className="hidden md:block rounded-2xl overflow-hidden mb-4"
            style={{ border: '1px solid #ebebeb', cursor: 'zoom-in', position: 'relative' }}
            onClick={() => setLightbox(true)}
          >
            <img
              src={animalPhoto}
              alt={animal.name}
              style={{ width: '100%', height: '280px', objectFit: 'cover', display: 'block' }}
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)' }} />
            <div className="absolute bottom-3 right-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => photoInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl backdrop-blur-sm"
                style={{ background: 'rgba(255,255,255,0.85)', fontSize: '11px', fontWeight: 600, color: '#374151' }}
              >
                <Camera width={11} height={11} />
                Change
              </button>
              <button
                onClick={() => removePhoto(animal.id)}
                className="p-1.5 rounded-xl backdrop-blur-sm"
                style={{ background: 'rgba(255,255,255,0.85)', color: '#6b7280' }}
              >
                <X width={11} height={11} />
              </button>
            </div>
          </div>
        )}
        <WeightSection animalId={animal.id} />
        <BreedingSection animalId={animal.id} species={animal.species} />
        <WithholdingSection animalId={animal.id} />
        <SellingCalculator animalId={animal.id} purchasePrice={animal.purchasePrice} />
      </div>

      </div>{/* end grid */}

      {/* Lightbox */}
      {lightbox && animalPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.92)', cursor: 'zoom-out' }}
          onClick={() => setLightbox(false)}
        >
          <img
            src={animalPhoto}
            alt={animal.name}
            style={{ maxWidth: '92vw', maxHeight: '92vh', objectFit: 'contain', borderRadius: '16px', boxShadow: '0 25px 80px rgba(0,0,0,0.6)' }}
          />
        </div>
      )}

      {/* Modals */}
      <TransferModal
        animal={animal}
        open={showTransfer}
        onClose={() => setShowTransfer(false)}
        onConfirm={(tr) => addTransfer(animal.id, tr)}
      />
      <AnimalPassport
        animal={animal}
        healthEvents={healthEvents}
        open={showPassport}
        onClose={() => setShowPassport(false)}
      />
    </motion.div>
  );
}
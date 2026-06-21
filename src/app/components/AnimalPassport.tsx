import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, ArrowRight } from 'lucide-react';
import {
  Animal, HealthEvent,
  SPECIES_CONFIG, HEALTH_STATUS_CONFIG, HEALTH_EVENT_CONFIG, TRANSFER_PURPOSE_CONFIG,
  OWNER, getAnimalAge, fmtDate,
} from '../data/blockData';
import { useProfile } from '../context/ProfileContext';
import { useWeight } from '../context/WeightContext';

interface Props {
  animal: Animal;
  healthEvents: HealthEvent[];
  open: boolean;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2" style={{ paddingBottom: '6px', borderBottom: '1px solid #f5f5f4' }}>
      <span style={{ fontSize: '11px', color: '#9ca3af', width: '96px', flexShrink: 0, paddingTop: '1px' }}>{label}</span>
      <span style={{ fontSize: '12px', color: '#111', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

export function AnimalPassport({ animal, healthEvents, open, onClose }: Props) {
  const { profile } = useProfile();
  const { entriesForAnimal } = useWeight();

  const weightEntries = entriesForAnimal(animal.id);
  const latestWeightKg = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].kg : (animal.weight ?? null);

  const ownerName     = profile.name     || OWNER.name;
  const ownerProperty = profile.property || OWNER.property;
  const ownerLocation = profile.location || OWNER.location;

  const scfg = SPECIES_CONFIG[animal.species];
  const hcfg = HEALTH_STATUS_CONFIG[animal.status];
  const events = [...healthEvents]
    .filter((e) => e.animalId === animal.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const transfers = animal.transfers ?? [];

  function handlePrint() {
    window.print();
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <AnimatePresence>
      {open && (
    <motion.div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="w-full md:max-w-2xl rounded-t-3xl md:rounded-2xl overflow-hidden"
        initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.97, y: 12 }}
        animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
        exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.97, y: 12 }}
        transition={{ type: 'spring', stiffness: 380, damping: 34, mass: 0.9 }}
        style={{ background: '#fefefe', maxHeight: '94vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid #f0f0f0' }}
        >
          <div>
            <p style={{ fontSize: '15px', fontWeight: 800, color: '#111', letterSpacing: '-0.02em' }}>
              Animal Passport
            </p>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '1px' }}>
              {animal.name} · {animal.tag} · {scfg.label}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all"
              style={{ fontSize: '12px', fontWeight: 600, color: '#374151', background: '#f5f5f4', border: '1px solid #e5e7eb' }}
            >
              <Printer width={13} height={13} />
              Print
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl"
              style={{ background: '#f5f5f4' }}
            >
              <X width={14} height={14} style={{ color: '#6b7280' }} />
            </button>
          </div>
        </div>

        {/* Passport document */}
        <div className="overflow-y-auto flex-1 p-5 pb-10 space-y-5">

          {/* Identity */}
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #ebebeb' }}>
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ background: '#f9f9f8', borderBottom: '1px solid #f0f0f0' }}
            >
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Identity
              </p>
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5 rounded-full"
                  style={{ fontSize: '10px', fontWeight: 700, color: scfg.color, background: scfg.bg, border: `1px solid ${scfg.border}` }}
                >
                  {scfg.label}
                </span>
                <span
                  className="px-2 py-0.5 rounded-full"
                  style={{ fontSize: '10px', fontWeight: 700, color: hcfg.color, background: hcfg.bg, border: `1px solid ${hcfg.border}` }}
                >
                  {hcfg.label}
                </span>
              </div>
            </div>
            <div className="p-4 space-y-2">
              <Row label="Name"     value={animal.name} />
              <Row label="Tag / ID" value={animal.tag} />
              <Row label="Species"  value={scfg.label} />
              {animal.breed ? <Row label="Breed" value={animal.breed} /> : null}
              <Row label="Sex"      value={animal.sex === 'female' ? 'Female' : 'Male'} />
              <Row label="DOB"      value={fmtDate(animal.dob)} />
              <Row label="Age"      value={getAnimalAge(animal.dob)} />
              {latestWeightKg != null ? <Row label="Weight" value={`${latestWeightKg} kg`} /> : null}
              {animal.purchaseDate  ? <Row label="Acquired"       value={fmtDate(animal.purchaseDate)} /> : null}
              {animal.purchasePrice ? <Row label="Purchase price" value={`$${animal.purchasePrice}`}   /> : null}
            </div>
          </div>

          {/* Health records */}
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #ebebeb' }}>
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ background: '#f9f9f8', borderBottom: '1px solid #f0f0f0' }}
            >
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Health Records
              </p>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>{events.length} events</span>
            </div>

            {events.length === 0 ? (
              <p className="px-4 py-6 text-center" style={{ fontSize: '12px', color: '#9ca3af' }}>
                No health records on file.
              </p>
            ) : (
              <div className="divide-y" style={{ borderColor: '#f9f9f9' }}>
                {events.map((ev) => {
                  const cfg = HEALTH_EVENT_CONFIG[ev.type];
                  return (
                    <div key={ev.id} className="px-4 py-3.5">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5" style={{ background: cfg.color }} />
                          <span style={{ fontSize: '11px', fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {cfg.label}
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#9ca3af', flexShrink: 0 }}>{fmtDate(ev.date)}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#374151', paddingLeft: '14px', lineHeight: 1.55 }}>{ev.description}</p>
                      <div className="flex flex-wrap gap-3 mt-1.5 pl-3.5">
                        {ev.vet  && <span style={{ fontSize: '11px', color: '#6b7280' }}>Vet: {ev.vet}</span>}
                        {ev.cost != null && ev.cost > 0 && <span style={{ fontSize: '11px', color: '#6b7280' }}>Cost: ${ev.cost}</span>}
                        {ev.nextDue && <span style={{ fontSize: '11px', color: '#ea580c', fontWeight: 600 }}>Next due: {fmtDate(ev.nextDue)}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ownership history */}
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #ebebeb' }}>
            <div className="px-4 py-3" style={{ background: '#f9f9f8', borderBottom: '1px solid #f0f0f0' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Ownership History
              </p>
            </div>
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center flex-shrink-0" style={{ width: '16px' }}>
                  <div className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5" style={{ background: '#ea580c', border: '2px solid #fff', boxShadow: '0 0 0 1.5px #ea580c' }} />
                  {transfers.length > 0 && <div style={{ width: '2px', flex: 1, minHeight: '28px', background: '#e5e7eb', marginTop: '4px' }} />}
                </div>
                <div className="flex-1 pb-4">
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#111' }}>{ownerName}</p>
                  {(ownerProperty || ownerLocation) && (
                    <p style={{ fontSize: '11px', color: '#6b7280' }}>{[ownerProperty, ownerLocation].filter(Boolean).join(', ')}</p>
                  )}
                  {transfers.length === 0 && (
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>No transfers recorded. {ownerName} is the current holder.</p>
                  )}
                </div>
              </div>
              {[...transfers].reverse().map((tr, i) => {
                const cfg = TRANSFER_PURPOSE_CONFIG[tr.purpose];
                const isOrigin = i === transfers.length - 1;
                return (
                  <div key={tr.id} className="flex items-start gap-3">
                    <div className="flex flex-col items-center flex-shrink-0" style={{ width: '16px' }}>
                      <div className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5" style={{ background: '#d1d5db', border: '2px solid #fff', boxShadow: '0 0 0 1.5px #d1d5db' }} />
                      <div style={{ width: '2px', flex: 1, minHeight: '28px', background: '#e5e7eb', marginTop: '4px' }} />
                    </div>
                    <div className="flex-1 pb-4 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <ArrowRight width={11} height={11} style={{ color: '#9ca3af' }} />
                        <span className="px-1.5 py-0.5 rounded-full" style={{ fontSize: '9px', fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
                        {tr.price != null && <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>${tr.price.toFixed(2)}</span>}
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>{fmtDate(tr.date)}</span>
                      </div>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: '#111' }}>{tr.fromName}</p>
                      {(tr.fromProperty || tr.fromLocation) && (
                        <p style={{ fontSize: '11px', color: '#6b7280' }}>{[tr.fromProperty, tr.fromLocation].filter(Boolean).join(', ')}</p>
                      )}
                      {isOrigin && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded-md" style={{ fontSize: '9px', fontWeight: 700, background: '#f9f9f8', color: '#9ca3af', border: '1px solid #e5e7eb' }}>Origin</span>
                      )}
                      {tr.notes && <p style={{ fontSize: '11px', color: '#9ca3af', fontStyle: 'italic', marginTop: '2px' }}>{tr.notes}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer stamp */}
          <div className="text-center pb-2">
            <p style={{ fontSize: '10px', color: '#d1d5db' }}>
              {ownerProperty}, {ownerLocation} · {fmtDate(new Date().toISOString().split('T')[0])}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
}
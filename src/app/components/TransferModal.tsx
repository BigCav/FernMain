import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { X, ArrowRight } from 'lucide-react';
import {
  Animal, TransferRecord, TransferPurpose,
  TRANSFER_PURPOSE_CONFIG, OWNER, SPECIES_CONFIG, TODAY,
} from '../data/blockData';
import { useNotifications } from '../context/NotificationsContext';
import { useProfile } from '../context/ProfileContext';
import { useAnimals } from '../context/AnimalsContext';
import { useWeight } from '../context/WeightContext';
import { useBreeding } from '../context/BreedingContext';
import { useWithholding } from '../context/WithholdingContext';
import { usePhotos } from '../context/PhotoContext';
import { apiSendTransferNotification } from '../lib/api';
import { DatePickerInput } from './DatePickerInput';

interface Props {
  animal: Animal;
  open: boolean;
  onClose: () => void;
  onConfirm: (transfer: TransferRecord) => void;
}

const PURPOSES: { value: TransferPurpose; label: string }[] = [
  { value: 'sale',      label: 'Sale'             },
  { value: 'loan',      label: 'Loan / Agistment' },
  { value: 'breeding',  label: 'Breeding / Stud'  },
  { value: 'slaughter', label: 'Slaughter / Works'},
  { value: 'gifted',    label: 'Gifted'            },
  { value: 'other',     label: 'Other'             },
];

const INPUT = 'w-full px-3 py-2.5 rounded-xl outline-none transition-colors text-gray-900 bg-white'
  + ' border border-gray-200 focus:border-orange-400';

export function TransferModal({ animal, open, onClose, onConfirm }: Props) {
  const scfg = SPECIES_CONFIG[animal.species];
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { profile } = useProfile();
  const { healthEvents, removeAnimal } = useAnimals();
  const { entriesForAnimal } = useWeight();
  const { recordsForAnimal: breedingForAnimal } = useBreeding();
  const { recordsForAnimal: withholdingForAnimal } = useWithholding();
  const { photos } = usePhotos();

  const isCattle = animal.species === 'cattle';

  const [toEmail,          setToEmail]          = useState('');
  const [date,             setDate]             = useState(TODAY);
  const [purpose,          setPurpose]          = useState<TransferPurpose>('sale');
  const [price,            setPrice]            = useState('');
  const [notes,            setNotes]            = useState('');
  const [destNaitLocation, setDestNaitLocation] = useState('');
  const [step,             setStep]             = useState<'form' | 'confirm'>('form');

  function reset() {
    setToEmail(''); setDate(TODAY); setPurpose('sale'); setPrice(''); setNotes('');
    setDestNaitLocation(''); setStep('form');
  }

  function handleClose() { reset(); onClose(); }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStep('confirm');
  }

  function handleConfirm() {
    const transferId = `tr-${Date.now()}`;
    const transfer: TransferRecord = {
      id:               transferId,
      date,
      fromName:         profile.name || OWNER.name,
      fromProperty:     profile.property || OWNER.property,
      fromLocation:     profile.location || OWNER.location,
      toEmail:          toEmail.trim() || undefined,
      destNaitLocation: isCattle && destNaitLocation.trim() ? destNaitLocation.trim() : undefined,
      price:            price ? parseFloat(price) : undefined,
      purpose,
      notes:            notes.trim() || undefined,
    };

    const transferPayload = {
      transferId,
      animalId: animal.id,
      animalName: animal.name,
      animalTag: animal.tag,
      animalBreed: animal.breed,
      animalSpecies: animal.species,
      fromEmail: profile.email || '',
      fromName: profile.name || OWNER.name,
      fromProperty: profile.property || OWNER.property,
      fromLocation: profile.location || OWNER.location,
      toEmail: toEmail.trim(),
      photo: photos[animal.id] || undefined,
      date,
      purpose,
      price: price ? parseFloat(price) : undefined,
      notes: notes.trim() || undefined,
      animalSnapshot: animal,
      weightHistory: entriesForAnimal(animal.id),
      healthEvents: healthEvents.filter(e => e.animalId === animal.id),
      breedingRecords: breedingForAnimal(animal.id),
      withholdingRecords: withholdingForAnimal(animal.id),
      status: 'pending' as const,
    };

    // Notification for the sender — informational only, no accept/decline
    addNotification({
      type: 'transfer_sent',
      title: `Transfer sent — ${animal.name}`,
      body: `Sent to ${toEmail.trim()}. You will be notified when they respond.`,
      transfer: transferPayload,
    });

    // Deliver transfer_incoming notification to the recipient's account via backend
    apiSendTransferNotification(toEmail.trim(), {
      type: 'transfer_incoming',
      title: `Incoming animal — ${animal.name}`,
      body: `${profile.name || OWNER.name} from ${profile.property || OWNER.property} has sent you ${animal.name} (${animal.tag}). Accept or decline below.`,
      transfer: transferPayload,
    });

    onConfirm(transfer);
    removeAnimal(animal.id);
    reset();
    onClose();
    navigate('/animals');
  }

  const purposeCfg = TRANSFER_PURPOSE_CONFIG[purpose];
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <AnimatePresence>
      {open && (
    <motion.div
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <motion.div
        className="w-full md:max-w-lg rounded-t-3xl md:rounded-2xl overflow-hidden"
        initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.97, y: 12 }}
        animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
        exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.97, y: 12 }}
        transition={{ type: 'spring', stiffness: 380, damping: 34, mass: 0.9 }}
        style={{ background: '#fefefe', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid #f0f0f0' }}
        >
          <div>
            <p style={{ fontSize: '15px', fontWeight: 800, color: '#111', letterSpacing: '-0.02em' }}>
              Transfer Animal
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="inline-block px-2 py-0.5 rounded-full"
                style={{ fontSize: '10px', fontWeight: 700, color: scfg.color, background: scfg.bg, border: `1px solid ${scfg.border}` }}
              >
                {scfg.label}
              </span>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>{animal.name} · {animal.tag}</span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
            style={{ background: '#f5f5f4' }}
          >
            <X width={14} height={14} style={{ color: '#6b7280' }} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {step === 'form' ? (
            <form id="transfer-form" onSubmit={handleSubmit} className="p-5 space-y-5">

              {/* Purpose */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
                  Purpose
                </p>
                <div className="flex flex-wrap gap-2">
                  {PURPOSES.map((p) => {
                    const cfg = TRANSFER_PURPOSE_CONFIG[p.value];
                    const active = purpose === p.value;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPurpose(p.value)}
                        className="px-3 py-1.5 rounded-xl transition-all"
                        style={{
                          fontSize: '12px',
                          fontWeight: active ? 700 : 400,
                          background: active ? cfg.bg : '#f9f9f8',
                          color: active ? cfg.color : '#6b7280',
                          border: `1px solid ${active ? cfg.border : '#e5e7eb'}`,
                        }}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Email */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
                  Recipient
                </p>
                <div>
                  <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Email address *</p>
                  <input
                    type="email"
                    className={INPUT}
                    style={{ fontSize: '13px' }}
                    placeholder="e.g. john@fernsidefarm.co.nz"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Date + Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Transfer date *</p>
                  <DatePickerInput value={date} onChange={v => setDate(v)} placeholder="Transfer date" />
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Sale price ($)</p>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={INPUT}
                    style={{ fontSize: '13px' }}
                    placeholder="Optional"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              </div>

              {/* Notes / conditions */}
              <div>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Notes / conditions (optional)</p>
                <textarea
                  className={INPUT}
                  style={{ fontSize: '13px', resize: 'none', height: '80px' }}
                  placeholder="e.g. Sold with full health records. EID tag transferred."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* NAIT — cattle only */}
              {isCattle && (
                <div className="rounded-xl p-4 space-y-3" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#92400e' }}>NAIT Movement</span>
                    <span className="px-1.5 py-0.5 rounded-md" style={{ fontSize: '9px', fontWeight: 700, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>Required</span>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#92400e', marginBottom: '4px' }}>Destination NAIT location number (optional)</p>
                    <input
                      className={INPUT}
                      style={{ fontSize: '13px', background: '#fefefe' }}
                      placeholder="e.g. 654321"
                      value={destNaitLocation}
                      onChange={(e) => setDestNaitLocation(e.target.value)}
                    />
                  </div>
                  <p style={{ fontSize: '11px', color: '#92400e', lineHeight: 1.5 }}>
                    NAIT requires this movement to be registered within 48 hours. You will need to log it manually at nait.co.nz until API integration is live.
                  </p>
                </div>
              )}
            </form>
          ) : (
            /* Confirmation screen */
            <div className="p-5">
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #ebebeb' }}>
                {/* From → To header */}
                <div className="p-4" style={{ background: '#f9f9f8', borderBottom: '1px solid #f0f0f0' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>
                    Confirm Transfer
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: '12px', fontWeight: 700, color: '#111' }}>{OWNER.name}</p>
                      <p style={{ fontSize: '11px', color: '#9ca3af' }}>{OWNER.property}, {OWNER.location}</p>
                    </div>
                    <ArrowRight width={16} height={16} style={{ color: '#ea580c', flexShrink: 0 }} />
                    <div className="flex-1 min-w-0 text-right">
                      <p style={{ fontSize: '12px', fontWeight: 700, color: '#111' }}>
                        {toEmail || 'Recipient'}
                      </p>
                      <span
                        className="px-1.5 py-0.5 rounded-full"
                        style={{ fontSize: '9px', fontWeight: 700, color: purposeCfg.color, background: purposeCfg.bg, border: `1px solid ${purposeCfg.border}` }}
                      >
                        {purposeCfg.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detail rows */}
                <div className="divide-y" style={{ borderColor: '#f9f9f8' }}>
                  {[
                    { label: 'Animal',   value: `${animal.name} (${animal.tag})` },
                    { label: 'Breed',    value: `${animal.breed} ${scfg.label}` },
                    { label: 'Date',     value: new Date(date + 'T00:00:00').toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' }) },
                    { label: 'Purpose',  value: purposeCfg.label },
                    ...(toEmail          ? [{ label: 'Email',      value: toEmail }] : []),
                    ...(price            ? [{ label: 'Price',      value: `$${parseFloat(price).toFixed(2)}` }] : []),
                    ...(destNaitLocation ? [{ label: 'Dest. NAIT', value: destNaitLocation }] : []),
                    ...(notes            ? [{ label: 'Notes',      value: notes }] : []),
                  ].map(({ label, value }) => (
                    <div key={label} className="flex gap-3 px-4 py-3">
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', width: '64px', flexShrink: 0, paddingTop: '1px' }}>{label}</span>
                      <span style={{ fontSize: '12px', color: '#111', lineHeight: 1.5 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="mt-4 p-3.5 rounded-xl flex items-start gap-2.5"
                style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
              >
                <p style={{ fontSize: '12px', color: '#92400e', lineHeight: 1.55 }}>
                  This transfer will be permanently recorded in {animal.name}'s passport. The animal record stays in your register for your own reference.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2.5 p-4 flex-shrink-0" style={{ borderTop: '1px solid #f0f0f0' }}>
          {step === 'form' ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-xl"
                style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', background: '#f5f5f4', border: '1px solid #e5e7eb' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="transfer-form"
                className="flex-1 py-2.5 rounded-xl transition-all active:scale-[0.97]"
                style={{ fontSize: '13px', fontWeight: 700, color: '#fff', background: '#ea580c' }}
              >
                Review Transfer
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('form')}
                className="flex-1 py-2.5 rounded-xl"
                style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', background: '#f5f5f4', border: '1px solid #e5e7eb' }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-xl transition-all active:scale-[0.97]"
                style={{ fontSize: '13px', fontWeight: 700, color: '#fff', background: '#111' }}
              >
                Confirm &amp; Record Transfer
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
}

import { useState } from 'react';
import { Plus, X, Baby, CheckCircle2, Trash2 } from 'lucide-react';
import { useBreeding, BreedingRecord, calcDueDate, daysUntilDue, GESTATION_DAYS } from '../context/BreedingContext';
import { fmtDate, TODAY } from '../data/blockData';
import { AnimatedSection } from './AnimatedSection';
import { DatePickerInput } from './DatePickerInput';

const INPUT = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none bg-white text-gray-900 transition-colors focus:border-orange-400 text-sm';

function DueChip({ dueDate, actualBirthDate }: { dueDate: string; actualBirthDate?: string }) {
  if (actualBirthDate) {
    return <span className="px-2 py-0.5 rounded-lg" style={{ fontSize: '10px', fontWeight: 700, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>Delivered {fmtDate(actualBirthDate)}</span>;
  }
  const days = daysUntilDue(dueDate);
  if (days < 0)  return <span className="px-2 py-0.5 rounded-lg" style={{ fontSize: '10px', fontWeight: 700, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>Overdue by {Math.abs(days)}d</span>;
  if (days <= 14) return <span className="px-2 py-0.5 rounded-lg" style={{ fontSize: '10px', fontWeight: 700, background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa' }}>Due in {days}d</span>;
  return <span className="px-2 py-0.5 rounded-lg" style={{ fontSize: '10px', fontWeight: 600, background: '#f5f5f4', color: '#6b7280', border: '1px solid #e5e7eb' }}>Due {fmtDate(dueDate)}</span>;
}

export function BreedingSection({ animalId, species }: { animalId: string; species: string }) {
  const { recordsForAnimal, addRecord, updateRecord, removeRecord } = useBreeding();
  const records = recordsForAnimal(animalId);

  const [adding, setAdding]       = useState(false);
  const [sireName, setSireName]   = useState('');
  const [matingDate, setMating]   = useState(TODAY);
  const [notes, setNotes]         = useState('');
  const [confirmBirth, setConfirmBirth] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState(TODAY);
  const [offspringCount, setOffspringCount] = useState('1');

  const gestation = GESTATION_DAYS[species.toLowerCase()];
  const dueDate   = matingDate ? calcDueDate(matingDate, species) : '';

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!matingDate) return;
    addRecord({
      id: `b-${Date.now()}`,
      animalId,
      sireName: sireName.trim() || undefined,
      matingDate,
      expectedDueDate: calcDueDate(matingDate, species),
      notes: notes.trim() || undefined,
    });
    setSireName(''); setMating(TODAY); setNotes('');
    setAdding(false);
  }

  function handleConfirmBirth(id: string) {
    updateRecord(id, { actualBirthDate: birthDate, offspringCount: parseInt(offspringCount) || 1 });
    setConfirmBirth(null);
    setBirthDate(TODAY);
    setOffspringCount('1');
  }

  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>Breeding Records</p>
          {gestation && <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>Gestation: ~{gestation} days for {species}</p>}
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all"
          style={{ background: '#f5f5f4', color: '#374151', fontSize: '12px', fontWeight: 600, border: '1px solid #e5e7eb', visibility: adding ? 'hidden' : 'visible', pointerEvents: adding ? 'none' : 'auto' }}
        >
          <Plus width={12} height={12} />
          Add Mating
        </button>
      </div>

      <AnimatedSection open={adding}>
        <form onSubmit={handleAdd} className="p-5 space-y-3" style={{ borderBottom: '1px solid #f0f0f0', background: '#f9f9f8' }}>
          <div className="flex items-center justify-between">
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#111' }}>New Mating Record</p>
            <button type="button" onClick={() => setAdding(false)}><X width={14} height={14} style={{ color: '#9ca3af' }} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Mating Date</p>
              <DatePickerInput value={matingDate} onChange={v => setMating(v)} placeholder="Mating date" />
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Expected Due</p>
              <input className={INPUT} value={dueDate ? fmtDate(dueDate) : '-'} readOnly style={{ background: '#f5f5f4', color: '#6b7280' }} />
            </div>
          </div>
          <div>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Sire / Method</p>
            <input className={INPUT} placeholder="e.g. Angus bull, AI, sire #402" value={sireName} onChange={e => setSireName(e.target.value)} />
          </div>
          <div>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Notes (optional)</p>
            <input className={INPUT} placeholder="e.g. Confirmed in-calf at 6-week scan" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 py-2.5 rounded-xl" style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 600 }}>Save</button>
            <button type="button" onClick={() => setAdding(false)} className="px-4 py-2.5 rounded-xl" style={{ background: '#fefefe', color: '#6b7280', fontSize: '13px', border: '1px solid #e5e7eb' }}>Cancel</button>
          </div>
        </form>
      </AnimatedSection>

      {records.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p style={{ fontSize: '13px', color: '#9ca3af' }}>No breeding records yet</p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: '#f3f4f6' }}>
          {records.map((r) => (
            <div key={r.id} className="px-5 py-3.5">
              {/* Confirm birth inline form */}
              {confirmBirth === r.id ? (
                <div className="space-y-3">
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#111' }}>Record birth</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Birth Date</p>
                      <DatePickerInput value={birthDate} onChange={v => setBirthDate(v)} placeholder="Birth date" />
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Offspring</p>
                      <input type="number" min="1" max="10" className={INPUT} value={offspringCount} onChange={e => setOffspringCount(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleConfirmBirth(r.id)} className="flex-1 py-2 rounded-xl" style={{ background: '#15803d', color: '#fff', fontSize: '12px', fontWeight: 600 }}>Confirm Birth</button>
                    <button onClick={() => setConfirmBirth(null)} className="px-3 py-2 rounded-xl" style={{ background: '#fefefe', color: '#6b7280', fontSize: '12px', border: '1px solid #e5e7eb' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 group">
                  {/* Circle icon */}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: r.actualBirthDate ? '#f0fdf4' : '#fff7ed', border: `1.5px solid ${r.actualBirthDate ? '#bbf7d0' : '#fed7aa'}` }}>
                    {r.actualBirthDate
                      ? <CheckCircle2 width={16} height={16} style={{ color: '#15803d' }} />
                      : <Baby width={16} height={16} style={{ color: '#ea580c' }} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Top row: date + due chip */}
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>
                        Mated {fmtDate(r.matingDate)}
                      </p>
                      <DueChip dueDate={r.expectedDueDate} actualBirthDate={r.actualBirthDate} />
                    </div>
                    {/* Sub info */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {r.sireName && <span style={{ fontSize: '11px', color: '#9ca3af' }}>Sire: {r.sireName}</span>}
                      {r.offspringCount !== undefined && r.actualBirthDate && (
                        <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>{r.offspringCount} offspring</span>
                      )}
                      {r.notes && <span style={{ fontSize: '11px', color: '#9ca3af' }}>{r.notes}</span>}
                    </div>
                    {!r.actualBirthDate && (
                      <button
                        onClick={() => setConfirmBirth(r.id)}
                        className="mt-2 px-3 py-1.5 rounded-xl transition-all active:scale-[0.97]"
                        style={{ fontSize: '11px', fontWeight: 600, color: '#15803d', background: '#f0fdf4', border: '1px solid #bbf7d0' }}
                      >
                        Record birth
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => removeRecord(r.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg flex-shrink-0 mt-0.5"
                    style={{ color: '#d1d5db' }}
                  >
                    <Trash2 width={13} height={13} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

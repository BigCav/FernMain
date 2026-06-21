import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Plus, X, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { useWeight, WeightEntry } from '../context/WeightContext';
import { TODAY, fmtDate } from '../data/blockData';
import { AnimatedSection } from './AnimatedSection';
import { DatePickerInput } from './DatePickerInput';

const INPUT = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none bg-white text-gray-900 transition-colors focus:border-orange-400 text-sm';

function fmtShort(date: string) {
  const d = new Date(date + 'T12:00:00');
  return d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' });
}

export function WeightSection({ animalId }: { animalId: string }) {
  const { entriesForAnimal, addEntry, removeEntry } = useWeight();
  const entries = entriesForAnimal(animalId);

  const [adding, setAdding] = useState(false);
  const [kg, setKg]         = useState('');
  const [date, setDate]     = useState(TODAY);
  const [notes, setNotes]   = useState('');

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!kg || !date) return;
    addEntry({ id: `w-${Date.now()}`, animalId, date, kg: parseFloat(kg), notes: notes.trim() || undefined });
    setKg(''); setDate(TODAY); setNotes('');
    setAdding(false);
  }

  const chartData = entries.map(e => ({ date: fmtShort(e.date), kg: e.kg, rawDate: e.date }));

  const latest   = entries[entries.length - 1];
  const prev     = entries[entries.length - 2];
  const change   = latest && prev ? latest.kg - prev.kg : null;
  const last3    = entries.slice(-3);
  const declining = last3.length === 3 && last3[1].kg < last3[0].kg && last3[2].kg < last3[1].kg;
  const totalDrop = declining ? last3[2].kg - last3[0].kg : 0;

  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ background: '#fefefe', border: declining ? '1px solid #fecaca' : '1px solid #ebebeb' }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>Weight Log</p>
          {latest && (
            <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>
              Latest: <span style={{ color: '#111', fontWeight: 600 }}>{latest.kg} kg</span>
              {change !== null && (
                <span style={{ color: change >= 0 ? '#15803d' : '#dc2626', marginLeft: '6px' }}>
                  {change >= 0 ? '+' : ''}{change.toFixed(1)} kg since last
                </span>
              )}
            </p>
          )}
          {declining && (
            <div className="flex items-center gap-1.5 mt-2 px-2 py-1 rounded-lg" style={{ background: '#fef2f2', display: 'inline-flex' }}>
              <TrendingDown width={11} height={11} style={{ color: '#dc2626' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626' }}>
                {totalDrop.toFixed(1)} kg drop over 3 readings, consider a health check
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all"
          style={{ background: '#f5f5f4', color: '#374151', fontSize: '12px', fontWeight: 600, border: '1px solid #e5e7eb', visibility: adding ? 'hidden' : 'visible', pointerEvents: adding ? 'none' : 'auto' }}
        >
          <Plus width={12} height={12} />
          Log Weight
        </button>
      </div>

      <AnimatedSection open={adding}>
        <form onSubmit={handleAdd} className="p-5 space-y-3" style={{ borderBottom: '1px solid #f0f0f0', background: '#f9f9f8' }}>
          <div className="flex items-center justify-between">
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#111' }}>New Weight Entry</p>
            <button type="button" onClick={() => setAdding(false)}><X width={14} height={14} style={{ color: '#9ca3af' }} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Weight (kg)</p>
              <input type="number" min="0" step="0.1" className={INPUT} placeholder="e.g. 420" value={kg} onChange={e => setKg(e.target.value)} required />
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Date</p>
              <DatePickerInput value={date} onChange={v => setDate(v)} placeholder="Date" />
            </div>
          </div>
          <div>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Notes (optional)</p>
            <input className={INPUT} placeholder="e.g. Pre-shear weigh" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 py-2.5 rounded-xl" style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 600 }}>Save</button>
            <button type="button" onClick={() => setAdding(false)} className="px-4 py-2.5 rounded-xl" style={{ background: '#fefefe', color: '#6b7280', fontSize: '13px', border: '1px solid #e5e7eb' }}>Cancel</button>
          </div>
        </form>
      </AnimatedSection>

      {entries.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p style={{ fontSize: '13px', color: '#9ca3af' }}>No weight records yet, log the first one above</p>
        </div>
      ) : (
        <>
          {entries.length >= 2 && (
            <div className="px-4 pt-4 pb-2">
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="rawDate" tickFormatter={fmtShort} tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ background: '#fefefe', border: '1px solid #ebebeb', borderRadius: '10px', fontSize: '12px', padding: '6px 10px' }}
                    formatter={(v: number) => [`${v} kg`, 'Weight']}
                  />
                  <Line type="monotone" dataKey="kg" stroke="#ea580c" strokeWidth={2} dot={{ fill: '#ea580c', r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="divide-y" style={{ borderColor: '#f9f9f9' }}>
            {[...entries].reverse().map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-5 py-3 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#111' }}>{e.kg} kg</span>
                    {e.notes && <span style={{ fontSize: '11px', color: '#9ca3af' }} className="truncate">{e.notes}</span>}
                  </div>
                  <p style={{ fontSize: '11px', color: '#9ca3af' }}>{fmtDate(e.date)}</p>
                </div>
                <button
                  onClick={() => removeEntry(e.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg"
                  style={{ color: '#9ca3af' }}
                >
                  <Trash2 width={13} height={13} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

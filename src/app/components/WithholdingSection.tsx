import { useState } from 'react';
import { Plus, X, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react';
import { useWithholding, WithholdingRecord, meatClearDate, milkClearDate, daysUntilClear, isActive, COMMON_PRODUCTS } from '../context/WithholdingContext';
import { fmtDate, TODAY } from '../data/blockData';
import { AnimatedSection } from './AnimatedSection';
import { DatePickerInput } from './DatePickerInput';
import { DropdownSelect } from './DropdownSelect';

const INPUT = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none bg-white text-gray-900 transition-colors focus:border-orange-400 text-sm';

function ClearChip({ label, clearDate }: { label: string; clearDate: string }) {
  const days = daysUntilClear(clearDate);
  if (days <= 0) {
    return <span style={{ fontSize: '10px', fontWeight: 700, color: '#15803d', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '2px 6px', borderRadius: '6px' }}>{label}: Clear</span>;
  }
  return <span style={{ fontSize: '10px', fontWeight: 700, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', padding: '2px 6px', borderRadius: '6px' }}>{label}: {days}d left</span>;
}

export function WithholdingSection({ animalId }: { animalId: string }) {
  const { recordsForAnimal, addRecord, removeRecord } = useWithholding();
  const records = recordsForAnimal(animalId);

  const [adding, setAdding]           = useState(false);
  const [product, setProduct]         = useState('');
  const [treatDate, setTreatDate]     = useState(TODAY);
  const [meatDays, setMeatDays]       = useState('28');
  const [milkDays, setMilkDays]       = useState('');
  const [notes, setNotes]             = useState('');
  const [customProduct, setCustom]    = useState(false);

  function handleProductSelect(name: string) {
    if (name === 'Custom…') {
      setProduct('');
      setCustom(true);
      setMeatDays('');
      setMilkDays('');
    } else {
      const p = COMMON_PRODUCTS.find(p => p.name === name);
      setProduct(name);
      setCustom(false);
      setMeatDays(String(p?.meatDays ?? 28));
      setMilkDays(p?.milkDays !== undefined ? String(p.milkDays) : '');
    }
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!product && !customProduct) return;
    addRecord({
      id: `wh-${Date.now()}`,
      animalId,
      productName: product.trim(),
      treatmentDate: treatDate,
      meatDays: parseInt(meatDays) || 0,
      milkDays: milkDays ? parseInt(milkDays) : undefined,
      notes: notes.trim() || undefined,
    });
    setProduct(''); setTreatDate(TODAY); setMeatDays('28'); setMilkDays(''); setNotes(''); setCustom(false);
    setAdding(false);
  }

  const activeCount = records.filter(isActive).length;

  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>Withholding Periods</p>
          <p style={{ fontSize: '11px', color: activeCount > 0 ? '#dc2626' : '#9ca3af', marginTop: '1px' }}>
            {activeCount > 0 ? `${activeCount} active WHP, not clear for processing` : 'No active withholding periods'}
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all"
          style={{ background: '#f5f5f4', color: '#374151', fontSize: '12px', fontWeight: 600, border: '1px solid #e5e7eb', visibility: adding ? 'hidden' : 'visible', pointerEvents: adding ? 'none' : 'auto' }}
        >
          <Plus width={12} height={12} />
          Log Treatment
        </button>
      </div>

      <AnimatedSection open={adding}>
        <form onSubmit={handleAdd} className="p-5 space-y-3" style={{ borderBottom: '1px solid #f0f0f0', background: '#f9f9f8' }}>
          <div className="flex items-center justify-between">
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#111' }}>Log Treatment / Drench</p>
            <button type="button" onClick={() => setAdding(false)}><X width={14} height={14} style={{ color: '#9ca3af' }} /></button>
          </div>

          {/* Product selector */}
          <div>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Product</p>
            <DropdownSelect
              value={customProduct ? 'Custom…' : product}
              onChange={handleProductSelect}
              options={COMMON_PRODUCTS.map(p => ({ label: p.name, value: p.name }))}
              placeholder="Select product…"
            />
            {customProduct && (
              <input className={INPUT} placeholder="Product name" value={product} onChange={e => setProduct(e.target.value)} required style={{ marginTop: '8px' }} />
            )}
          </div>

          <div>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Treatment Date</p>
            <DatePickerInput value={treatDate} onChange={v => setTreatDate(v)} placeholder="Treatment date" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Meat WHP (days)</p>
              <input type="number" min="0" className={INPUT} value={meatDays} onChange={e => setMeatDays(e.target.value)} required />
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Milk WHP (days)</p>
              <input type="number" min="0" className={INPUT} placeholder="N/A" value={milkDays} onChange={e => setMilkDays(e.target.value)} />
            </div>
          </div>
          <div>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Notes (optional)</p>
            <input className={INPUT} placeholder="e.g. Spring drench, whole mob" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 py-2.5 rounded-xl" style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 600 }}>Save</button>
            <button type="button" onClick={() => setAdding(false)} className="px-4 py-2.5 rounded-xl" style={{ background: '#fefefe', color: '#6b7280', fontSize: '13px', border: '1px solid #e5e7eb' }}>Cancel</button>
          </div>
        </form>
      </AnimatedSection>

      {records.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p style={{ fontSize: '13px', color: '#9ca3af' }}>No treatments logged yet</p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: '#f3f4f6' }}>
          {records.map((r) => {
            const active    = isActive(r);
            const meatClear = meatClearDate(r);
            const milkClear = milkClearDate(r);
            return (
              <div key={r.id} className="flex items-center gap-3 px-5 py-3.5 group">
                {/* Circle icon */}
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: active ? '#fef2f2' : '#f0fdf4', border: `1.5px solid ${active ? '#fecaca' : '#bbf7d0'}` }}>
                  {active
                    ? <ShieldAlert width={16} height={16} style={{ color: '#dc2626' }} />
                    : <ShieldCheck width={16} height={16} style={{ color: '#15803d' }} />
                  }
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#111', marginBottom: '2px' }}>{r.productName}</p>
                  <p style={{ fontSize: '11px', color: '#9ca3af' }}>
                    Treated {fmtDate(r.treatmentDate)}{r.milkDays ? ` · Milk: ${r.milkDays}d` : ''}
                  </p>
                  {r.notes && <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>{r.notes}</p>}
                </div>
                {/* Chips on the right */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <ClearChip label="Meat" clearDate={meatClear} />
                  {milkClear && <ClearChip label="Milk" clearDate={milkClear} />}
                </div>
                <button
                  onClick={() => removeRecord(r.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg flex-shrink-0"
                  style={{ color: '#d1d5db' }}
                >
                  <Trash2 width={13} height={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useState, useMemo } from 'react';
import { TrendingUp, DollarSign, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useWeight } from '../context/WeightContext';
import { describeDate } from '../utils/naturalDate';
import { AnimatedSection } from './AnimatedSection';

interface Props {
  animalId: string;
  purchasePrice?: number;
}

const INPUT = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none bg-white text-gray-900 transition-colors focus:border-orange-400 text-[13px]';

export function SellingCalculator({ animalId, purchasePrice }: Props) {
  const { entriesForAnimal } = useWeight();
  const [open, setOpen] = useState(false);

  const entries = entriesForAnimal(animalId);
  const latestWeight = entries.length > 0 ? entries[entries.length - 1].kg : null;

  const [targetKg, setTargetKg]   = useState(latestWeight ? String(Math.round(latestWeight * 1.15)) : '');
  const [gainPerDay, setGainPerDay] = useState('0.2');
  const [pricePerKg, setPricePerKg] = useState('4.50');

  const result = useMemo(() => {
    const current  = latestWeight ?? parseFloat(targetKg) * 0.85;
    const target   = parseFloat(targetKg);
    const gain     = parseFloat(gainPerDay);
    const price    = parseFloat(pricePerKg);

    if (!target || !gain || !price || isNaN(target) || isNaN(gain) || isNaN(price)) return null;
    if (target <= current) return null;

    const days = Math.ceil((target - current) / gain);
    const saleDate = new Date();
    saleDate.setDate(saleDate.getDate() + days);
    const saleDateIso = saleDate.toISOString().slice(0, 10);

    const revenue = target * price;
    const profit  = purchasePrice != null ? revenue - purchasePrice : null;

    return { days, saleDateIso, revenue, profit, current, target, price };
  }, [targetKg, gainPerDay, pricePerKg, latestWeight, purchasePrice]);

  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 transition-colors"
        style={{ borderBottom: open ? '1px solid #f0f0f0' : 'none' }}
      >
        <div className="flex items-center gap-2">
          <TrendingUp width={15} height={15} style={{ color: '#16a34a' }} />
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>Selling Calculator</p>
        </div>
        {open
          ? <ChevronUp width={14} height={14} style={{ color: '#9ca3af' }} />
          : <ChevronDown width={14} height={14} style={{ color: '#9ca3af' }} />
        }
      </button>

      <AnimatedSection open={open}>
        <div className="p-5 space-y-4">
          {/* Current weight display */}
          {latestWeight != null ? (
            <div className="p-3 rounded-xl flex items-center gap-2" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <span style={{ fontSize: '12px', color: '#15803d' }}>Current weight:</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#14532d' }}>{latestWeight} kg</span>
              <span style={{ fontSize: '11px', color: '#6b7280', marginLeft: 'auto' }}>
                {entries.length > 0 ? new Date(entries[entries.length - 1].date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' }) : ''}
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-xl" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
              <p style={{ fontSize: '12px', color: '#92400e' }}>No weight recorded, log a weight first for accurate estimates</p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Target weight (kg)</p>
              <input
                type="number"
                min="0"
                step="0.5"
                className={INPUT}
                value={targetKg}
                onChange={e => setTargetKg(e.target.value)}
                placeholder="e.g. 90"
              />
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Daily gain (kg/day)</p>
              <input
                type="number"
                min="0"
                step="0.01"
                className={INPUT}
                value={gainPerDay}
                onChange={e => setGainPerDay(e.target.value)}
                placeholder="e.g. 0.2"
              />
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>$/kg liveweight</p>
              <input
                type="number"
                min="0"
                step="0.05"
                className={INPUT}
                value={pricePerKg}
                onChange={e => setPricePerKg(e.target.value)}
                placeholder="e.g. 4.50"
              />
            </div>
          </div>

          {result ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar width={12} height={12} style={{ color: '#16a34a' }} />
                  <p style={{ fontSize: '10px', fontWeight: 600, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Days to target</p>
                </div>
                <p style={{ fontSize: '22px', fontWeight: 800, color: '#14532d', letterSpacing: '-0.03em' }}>{result.days}</p>
                <p style={{ fontSize: '11px', color: '#16a34a' }}>{describeDate(result.saleDateIso)}</p>
              </div>

              <div className="p-3 rounded-xl" style={{ background: '#fefce8', border: '1px solid #fde68a' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <DollarSign width={12} height={12} style={{ color: '#ca8a04' }} />
                  <p style={{ fontSize: '10px', fontWeight: 600, color: '#a16207', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Est. Revenue</p>
                </div>
                <p style={{ fontSize: '22px', fontWeight: 800, color: '#78350f', letterSpacing: '-0.03em' }}>
                  ${result.revenue.toFixed(0)}
                </p>
                <p style={{ fontSize: '11px', color: '#a16207' }}>
                  {result.target}kg × ${result.price}/kg
                </p>
              </div>

              {result.profit != null && (
                <div className="col-span-2 p-3 rounded-xl" style={{ background: result.profit >= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${result.profit >= 0 ? '#bbf7d0' : '#fecaca'}` }}>
                  <p style={{ fontSize: '10px', fontWeight: 600, color: result.profit >= 0 ? '#15803d' : '#dc2626', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '2px' }}>
                    Est. {result.profit >= 0 ? 'Profit' : 'Loss'} (vs purchase price ${purchasePrice})
                  </p>
                  <p style={{ fontSize: '18px', fontWeight: 800, color: result.profit >= 0 ? '#14532d' : '#991b1b' }}>
                    {result.profit >= 0 ? '+' : ''}${result.profit.toFixed(0)}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-xl text-center" style={{ background: '#f9f9f8' }}>
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                {latestWeight != null && parseFloat(targetKg) <= latestWeight
                  ? 'Target weight must be greater than current weight'
                  : 'Enter target weight, daily gain and price to see estimate'}
              </p>
            </div>
          )}
        </div>
      </AnimatedSection>
    </div>
  );
}

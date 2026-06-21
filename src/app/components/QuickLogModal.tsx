import { useState } from 'react';
import { X, Scale, ShieldAlert, ClipboardCheck, ChevronRight, Check } from 'lucide-react';
import { DropdownSelect } from './DropdownSelect';
import { useAnimals } from '../context/AnimalsContext';
import { useWeight } from '../context/WeightContext';
import { useWithholding, COMMON_PRODUCTS } from '../context/WithholdingContext';
import { useTasks } from '../context/TasksContext';
import { TODAY, daysDiff, TASK_CATEGORY_CONFIG } from '../data/blockData';

const INPUT = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none bg-white text-gray-900 transition-colors focus:border-orange-400 text-sm';

type Mode = 'pick' | 'weight' | 'treatment' | 'task';

const ACTIONS = [
  { mode: 'weight'    as Mode, Icon: Scale,         label: 'Log weight',      desc: 'Record a weigh-in for an animal',        color: '#ea580c', bg: '#fff7ed' },
  { mode: 'treatment' as Mode, Icon: ShieldAlert,    label: 'Log treatment',   desc: 'Drench, injection or medication',          color: '#dc2626', bg: '#fef2f2' },
  { mode: 'task'      as Mode, Icon: ClipboardCheck, label: 'Complete a task', desc: "Mark one of today's tasks as done",       color: '#15803d', bg: '#f0fdf4' },
];

export function QuickLogModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { animals } = useAnimals();
  const { addEntry: addWeight } = useWeight();
  const { addRecord: addWHP } = useWithholding();
  const { tasks, completeTask } = useTasks();

  const [mode, setMode]         = useState<Mode>('pick');
  const [done, setDone]         = useState(false);
  const [fading, setFading]     = useState(false);

  function animateTo(newMode: Mode) {
    setFading(true);
    setTimeout(() => { setMode(newMode); setFading(false); }, 160);
  }

  function animateDone() {
    setFading(true);
    setTimeout(() => { setDone(true); setFading(false); }, 160);
  }

  const [wAnimal, setWAnimal]   = useState('');
  const [wKg, setWKg]           = useState('');

  const [tAnimal, setTAnimal]   = useState('');
  const [tProduct, setTProduct] = useState('');
  const [tMeat, setTMeat]       = useState('28');
  const [tMilk, setTMilk]       = useState('');
  const [tCustom, setTCustom]   = useState(false);

  const [tTask, setTTask]       = useState('');

  const pendingTasks = tasks
    .filter(t => !t.completed && daysDiff(t.dueDate) <= 1)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 8);

  function reset() {
    setFading(true);
    setTimeout(() => {
      setMode('pick'); setDone(false);
      setWAnimal(''); setWKg('');
      setTAnimal(''); setTProduct(''); setTMeat('28'); setTMilk(''); setTCustom(false);
      setTTask('');
      setFading(false);
    }, 160);
  }

  function handleClose() { reset(); onClose(); }

  function handleProductSelect(name: string) {
    if (name === 'Custom…') {
      setTProduct(''); setTCustom(true); setTMeat(''); setTMilk('');
    } else {
      const p = COMMON_PRODUCTS.find(p => p.name === name);
      setTProduct(name); setTCustom(false);
      setTMeat(String(p?.meatDays ?? 28));
      setTMilk(p?.milkDays !== undefined ? String(p.milkDays) : '');
    }
  }

  function submitWeight() {
    if (!wAnimal || !wKg) return;
    addWeight({ id: `w-${Date.now()}`, animalId: wAnimal, date: TODAY, kg: parseFloat(wKg) });
    animateDone();
  }

  function submitTreatment() {
    if (!tAnimal || !tProduct) return;
    addWHP({ id: `wh-${Date.now()}`, animalId: tAnimal, productName: tProduct, treatmentDate: TODAY, meatDays: parseInt(tMeat) || 0, milkDays: tMilk ? parseInt(tMilk) : undefined });
    animateDone();
  }

  function submitTask() {
    if (!tTask) return;
    completeTask(tTask);
    animateDone();
  }

  const animalName = (id: string) => animals.find(a => a.id === id)?.name ?? '';

  function renderInner() { return (
    <div className="flex flex-col flex-1 overflow-y-auto min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
        <div className="flex items-center gap-2">
          {mode !== 'pick' && !done && (
            <button onClick={() => animateTo('pick')} className="p-1 rounded-lg" style={{ color: '#9ca3af' }}>
              <ChevronRight width={16} height={16} style={{ transform: 'rotate(180deg)' }} />
            </button>
          )}
          <p style={{ fontSize: '15px', fontWeight: 700, color: '#111' }}>
            {done ? 'Logged!' : mode === 'pick' ? 'Quick Log' : ACTIONS.find(a => a.mode === mode)?.label}
          </p>
        </div>
        <button onClick={handleClose} className="p-1.5 rounded-xl" style={{ background: '#f5f5f4' }}>
          <X width={15} height={15} style={{ color: '#6b7280' }} />
        </button>
      </div>

      <div
        className="p-5 overflow-y-auto flex-1"
        style={{
          opacity: fading ? 0 : 1,
          transform: fading ? 'translateY(8px)' : 'translateY(0)',
          transition: 'opacity 160ms ease, transform 160ms ease',
        }}
      >
        {/* Done state */}
        {done && (
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#f0fdf4' }}>
              <Check width={28} height={28} style={{ color: '#15803d' }} strokeWidth={2.5} />
            </div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>
              {mode === 'weight'    && `Weight logged for ${animalName(wAnimal)}`}
              {mode === 'treatment' && `Treatment logged for ${animalName(tAnimal)}`}
              {mode === 'task'      && 'Task marked complete'}
            </p>
            <div className="flex gap-2 mt-2 w-full">
              <button onClick={reset} className="flex-1 py-2.5 rounded-xl" style={{ background: '#f5f5f4', color: '#374151', fontSize: '13px', fontWeight: 600 }}>
                Log another
              </button>
              <button onClick={handleClose} className="flex-1 py-2.5 rounded-xl" style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 600 }}>
                Done
              </button>
            </div>
          </div>
        )}

        {/* Pick mode */}
        {!done && mode === 'pick' && (
          <div className="space-y-2">
            {ACTIONS.map(({ mode: m, Icon, label, desc, color, bg }) => (
              <button
                key={m}
                onClick={() => animateTo(m)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all hover:brightness-[0.97] text-left"
                style={{ background: '#f9f9f8', border: '1px solid #f0f0f0' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                  <Icon width={18} height={18} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>{label}</p>
                  <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>{desc}</p>
                </div>
                <ChevronRight width={16} height={16} style={{ color: '#d1d5db', flexShrink: 0 }} />
              </button>
            ))}
          </div>
        )}

        {/* Weight form */}
        {!done && mode === 'weight' && (
          <div className="space-y-4">
            <div>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>Animal</p>
              <DropdownSelect
                value={wAnimal}
                onChange={setWAnimal}
                options={animals.map(a => ({ label: `${a.name} (${a.tag})`, value: a.id }))}
                placeholder="Select animal…"
              />
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>Weight (kg)</p>
              <input type="number" min="0" step="0.1" className={INPUT} placeholder="e.g. 420" value={wKg} onChange={e => setWKg(e.target.value)} />
            </div>
            <p style={{ fontSize: '11px', color: '#9ca3af' }}>Date: today ({TODAY})</p>
            <button
              onClick={submitWeight}
              disabled={!wAnimal || !wKg}
              className="w-full py-3 rounded-xl transition-all disabled:opacity-40"
              style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 700 }}
            >
              Log Weight
            </button>
          </div>
        )}

        {/* Treatment form */}
        {!done && mode === 'treatment' && (
          <div className="space-y-4">
            <div>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>Animal</p>
              <DropdownSelect
                value={tAnimal}
                onChange={setTAnimal}
                options={animals.map(a => ({ label: `${a.name} (${a.tag})`, value: a.id }))}
                placeholder="Select animal…"
              />
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>Product</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {COMMON_PRODUCTS.map(p => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleProductSelect(p.name)}
                    className="px-2.5 py-1 rounded-lg transition-all"
                    style={{
                      fontSize: '11px',
                      fontWeight: (tProduct === p.name || (p.name === 'Custom…' && tCustom)) ? 700 : 400,
                      background: (tProduct === p.name || (p.name === 'Custom…' && tCustom)) ? '#fff' : '#f5f5f4',
                      color: (tProduct === p.name || (p.name === 'Custom…' && tCustom)) ? '#ea580c' : '#6b7280',
                      border: `1px solid ${(tProduct === p.name || (p.name === 'Custom…' && tCustom)) ? '#fed7aa' : '#e5e7eb'}`,
                    }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
              {tCustom && (
                <input className={INPUT} placeholder="Product name" value={tProduct} onChange={e => setTProduct(e.target.value)} />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>Meat WHP (days)</p>
                <input type="number" min="0" className={INPUT} value={tMeat} onChange={e => setTMeat(e.target.value)} />
              </div>
              <div>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>Milk WHP (optional)</p>
                <input type="number" min="0" className={INPUT} placeholder="N/A" value={tMilk} onChange={e => setTMilk(e.target.value)} />
              </div>
            </div>
            <button
              onClick={submitTreatment}
              disabled={!tAnimal || !tProduct}
              className="w-full py-3 rounded-xl transition-all disabled:opacity-40"
              style={{ background: '#dc2626', color: '#fff', fontSize: '13px', fontWeight: 700 }}
            >
              Log Treatment
            </button>
          </div>
        )}

        {/* Task form */}
        {!done && mode === 'task' && (
          <div className="space-y-3">
            <p style={{ fontSize: '11px', color: '#9ca3af' }}>Overdue and due today/tomorrow</p>
            {pendingTasks.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '24px 0' }}>No pending tasks right now</p>
            ) : (
              <div className="space-y-1.5">
                {pendingTasks.map(t => {
                  const cfg     = TASK_CATEGORY_CONFIG[t.category];
                  const diff    = daysDiff(t.dueDate);
                  const overdue = diff < 0;
                  const active  = tTask === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTTask(active ? '' : t.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                      style={{
                        background: active ? '#f0fdf4' : '#f9f9f8',
                        border: `1px solid ${active ? '#86efac' : '#f0f0f0'}`,
                      }}
                    >
                      <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                        style={{ borderColor: active ? '#15803d' : '#d1d5db', background: active ? '#15803d' : 'transparent' }}>
                        {active && <Check width={9} height={9} style={{ color: '#fff' }} strokeWidth={3} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: '12px', fontWeight: 600, color: '#111' }} className="truncate">{t.title}</p>
                        <span className="inline-block px-1.5 py-0.5 rounded-md mt-0.5" style={{ fontSize: '9px', fontWeight: 700, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: overdue ? '#dc2626' : '#ea580c', flexShrink: 0 }}>
                        {overdue ? `${Math.abs(diff)}d overdue` : diff === 0 ? 'Today' : 'Tomorrow'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {pendingTasks.length > 0 && (
              <button
                onClick={submitTask}
                disabled={!tTask}
                className="w-full py-3 rounded-xl transition-all disabled:opacity-40"
                style={{ background: '#15803d', color: '#fff', fontSize: '13px', fontWeight: 700 }}
              >
                Mark Complete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  ); }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{
          background: 'rgba(0,0,0,0.42)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
        onClick={handleClose}
      />

      {/* Mobile bottom sheet */}
      <div
        className="md:hidden fixed left-0 right-0 bottom-0 z-[51] rounded-t-3xl flex flex-col overflow-y-auto"
        style={{
          background: '#fefefe',
          maxHeight: 'calc(100vh - 100px)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 80px)',
          transform: open ? 'translateY(0)' : 'translateY(110%)',
          transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
          willChange: 'transform',
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: '#d1d5db' }} />
        </div>
        {renderInner()}
      </div>

      {/* Desktop centered modal */}
      <div
        className="hidden md:flex fixed inset-0 z-[51] items-center justify-center"
        style={{ pointerEvents: open ? 'auto' : 'none' }}
        onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      >
        <div
          className="w-[400px] rounded-2xl flex flex-col overflow-hidden"
          style={{
            background: '#fefefe',
            maxHeight: 'calc(100vh - 100px)',
            opacity: open ? 1 : 0,
            transform: open ? 'scale(1) translateY(0px)' : 'scale(0.95) translateY(16px)',
            transition: 'opacity 0.25s ease, transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
            willChange: 'transform, opacity',
          }}
        >
          {renderInner()}
        </div>
      </div>
    </>
  );
}

import { useState, useMemo } from 'react';
import { Plus, X, Package, AlertTriangle, Trash2, Search, FlaskConical, Syringe, Wrench, Wheat, HeartPulse, Edit2, ChevronDown } from 'lucide-react';
import { useInventory, InventoryCategory, InventoryItem } from '../context/InventoryContext';
import { AnimatedSection } from '../components/AnimatedSection';
import { DropdownSelect } from '../components/DropdownSelect';
import { fmtDate, TODAY } from '../data/blockData';
import { DatePickerInput } from '../components/DatePickerInput';
import { PageHeader } from '../components/PageHeader';

// ── Config ───────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<InventoryCategory, { label: string; color: string; bg: string; border: string; Icon: React.ElementType }> = {
  chemical:  { label: 'Chemical',  color: '#dc2626', bg: '#fef2f2', border: '#fecaca', Icon: FlaskConical },
  vaccine:   { label: 'Vaccine',   color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', Icon: Syringe     },
  medical:   { label: 'Medical',   color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', Icon: HeartPulse  },
  equipment: { label: 'Equipment', color: '#374151', bg: '#f9fafb', border: '#e5e7eb', Icon: Wrench      },
  feed:      { label: 'Feed',      color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', Icon: Wheat       },
  other:     { label: 'Other',     color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', Icon: Package     },
};

const UNIT_OPTIONS   = ['L', 'mL', 'kg', 'g', 'units', 'boxes', 'bags', 'rolls', 'pairs', 'bottles'].map(u => ({ label: u, value: u }));
const CATEGORY_OPTIONS = (Object.keys(CATEGORY_CONFIG) as InventoryCategory[]).map(k => ({ label: CATEGORY_CONFIG[k].label, value: k }));

const INPUT = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none bg-white text-gray-900 transition-colors focus:border-orange-400 text-sm';

function daysUntilExpiry(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - new Date(TODAY).getTime()) / 86400000);
}

const EMPTY_FORM = {
  name: '', category: 'other' as InventoryCategory, quantity: '', unit: 'units',
  threshold: '', expiry: '', location: '', supplier: '', cost: '', notes: '',
};

// ── Inline form ───────────────────────────────────────────────────────────────

function ItemForm({
  initial,
  onSave,
  onClose,
  title,
}: {
  initial?: InventoryItem;
  onSave: (item: InventoryItem) => void;
  onClose: () => void;
  title: string;
}) {
  const [name,      setName]      = useState(initial?.name ?? EMPTY_FORM.name);
  const [category,  setCategory]  = useState<InventoryCategory>(initial?.category ?? EMPTY_FORM.category);
  const [quantity,  setQuantity]  = useState(initial ? String(initial.quantity) : EMPTY_FORM.quantity);
  const [unit,      setUnit]      = useState(initial?.unit ?? EMPTY_FORM.unit);
  const [threshold, setThreshold] = useState(initial?.reorderThreshold !== undefined ? String(initial.reorderThreshold) : EMPTY_FORM.threshold);
  const [expiry,    setExpiry]    = useState(initial?.expiryDate ?? EMPTY_FORM.expiry);
  const [location,  setLocation]  = useState(initial?.location ?? EMPTY_FORM.location);
  const [supplier,  setSupplier]  = useState(initial?.supplier ?? EMPTY_FORM.supplier);
  const [cost,      setCost]      = useState(initial?.costPerUnit !== undefined ? String(initial.costPerUnit) : EMPTY_FORM.cost);
  const [notes,     setNotes]     = useState(initial?.notes ?? EMPTY_FORM.notes);
  const hasOptional = !!(initial?.reorderThreshold || initial?.expiryDate || initial?.location || initial?.supplier || initial?.costPerUnit || initial?.notes);
  const [showOptional, setShowOptional] = useState(hasOptional);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      id:               initial?.id ?? `inv-${Date.now()}`,
      name:             name.trim(),
      category,
      quantity:         parseFloat(quantity) || 0,
      unit,
      reorderThreshold: threshold ? parseFloat(threshold) : undefined,
      expiryDate:       expiry || undefined,
      location:         location.trim() || undefined,
      supplier:         supplier.trim() || undefined,
      costPerUnit:      cost ? parseFloat(cost) : undefined,
      notes:            notes.trim() || undefined,
      lastUpdated:      TODAY,
    });
  }

  return (
    <div className="rounded-2xl mb-5 overflow-hidden" style={{ border: '1px solid #ebebeb' }}>
      <div className="px-5 py-4" style={{ background: '#f9f9f8', borderBottom: '1px solid #ebebeb' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>{title}</p>
      </div>
      <form onSubmit={handleSubmit} className="p-5 space-y-4" style={{ background: '#fefefe' }}>
        {/* Name */}
        <input
          className={INPUT}
          style={{ fontSize: '13px' }}
          placeholder="Item name (e.g. Ivermectin Pour-On)"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />

        {/* Category + Unit */}
        <div className="flex gap-3">
          <div className="flex-1">
            <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Category</p>
            <DropdownSelect value={category} onChange={v => setCategory(v as InventoryCategory)} options={CATEGORY_OPTIONS} placeholder="Category" />
          </div>
          <div className="w-32">
            <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Unit</p>
            <DropdownSelect value={unit} onChange={setUnit} options={UNIT_OPTIONS} placeholder="Unit" />
          </div>
        </div>

        {/* Quantity */}
        <div>
          <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Quantity</p>
          <input className={INPUT} style={{ fontSize: '13px' }} type="number" min="0" step="any" placeholder="0" value={quantity} onChange={e => setQuantity(e.target.value)} required />
        </div>

        {/* Optional details toggle */}
        <button
          type="button"
          onClick={() => setShowOptional(v => !v)}
          className="flex items-center gap-1.5 w-full px-3 py-2.5 rounded-xl transition-all"
          style={{ background: '#f9f9f8', border: '1px solid #ebebeb', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}
        >
          <ChevronDown
            width={13} height={13}
            style={{ transition: 'transform 0.2s', transform: showOptional ? 'rotate(180deg)' : 'rotate(0deg)', color: '#9ca3af' }}
          />
          Optional details
        </button>

        <AnimatedSection open={showOptional}>
          <div className="space-y-4 pt-1">
            {/* Threshold */}
            <div>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Low stock alert at</p>
              <div className="relative">
                <input className={INPUT} style={{ fontSize: '13px', paddingRight: '40px' }} type="number" min="0" step="any" placeholder="e.g. 2" value={threshold} onChange={e => setThreshold(e.target.value)} />
                <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: '#9ca3af', pointerEvents: 'none' }}>{unit}</span>
              </div>
            </div>

            {/* Expiry + Location */}
            <div className="flex gap-3">
              <div className="flex-1">
                <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Expiry date</p>
                <DatePickerInput value={expiry} onChange={v => setExpiry(v)} placeholder="Expiry date" />
              </div>
              <div className="flex-1">
                <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Location</p>
                <input className={INPUT} style={{ fontSize: '13px' }} placeholder="Shed 1, Cabinet…" value={location} onChange={e => setLocation(e.target.value)} />
              </div>
            </div>

            {/* Supplier + Cost */}
            <div className="flex gap-3">
              <div className="flex-1">
                <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Supplier</p>
                <input className={INPUT} style={{ fontSize: '13px' }} placeholder="Farmlands, Vetshed…" value={supplier} onChange={e => setSupplier(e.target.value)} />
              </div>
              <div className="w-36">
                <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Cost / unit</p>
                <div className="relative">
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#9ca3af' }}>$</span>
                  <input className={INPUT} style={{ fontSize: '13px', paddingLeft: '22px' }} type="number" min="0" step="any" placeholder="0.00" value={cost} onChange={e => setCost(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Notes */}
            <textarea className={INPUT} style={{ fontSize: '13px', resize: 'none', height: '64px' }} placeholder="Withholding period, storage instructions…" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </AnimatedSection>

        <div className="flex gap-2">
          <button type="submit" className="flex-1 py-2.5 rounded-xl" style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 600 }}>
            {initial ? 'Save changes' : 'Add to inventory'}
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl" style={{ background: '#f5f5f4', color: '#6b7280', fontSize: '13px', border: '1px solid #e5e7eb' }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Item row ─────────────────────────────────────────────────────────────────

function ItemRow({ item, editing, onEdit, onCancelEdit, onSaveEdit }: {
  item: InventoryItem;
  editing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (updated: InventoryItem) => void;
}) {
  const { adjustQuantity, removeItem } = useInventory();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const cfg        = CATEGORY_CONFIG[item.category];
  const isLow      = item.reorderThreshold !== undefined && item.quantity <= item.reorderThreshold;
  const expiryDays = item.expiryDate ? daysUntilExpiry(item.expiryDate) : null;
  const isExpired  = expiryDays !== null && expiryDays < 0;
  const isExpiring = expiryDays !== null && expiryDays >= 0 && expiryDays <= 30;

  return (
    <div style={{ borderBottom: '1px solid #f5f5f5' }}>
      {/* Edit form inline */}
      <AnimatedSection open={editing}>
        <div className="px-5 pt-4 pb-2">
          <ItemForm initial={item} onSave={onSaveEdit} onClose={onCancelEdit} title={`Edit — ${item.name}`} />
        </div>
      </AnimatedSection>

      {!editing && (
        <div className="px-5 py-3.5 transition-colors hover:bg-gray-50">
          {confirmDelete ? (
            <div className="flex items-center justify-between gap-3">
              <p style={{ fontSize: '12px', color: '#374151' }}>Remove <strong>{item.name}</strong>?</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 rounded-lg" style={{ fontSize: '11px', fontWeight: 600, background: '#f5f5f4', color: '#6b7280', border: '1px solid #e5e7eb' }}>Cancel</button>
                <button onClick={() => removeItem(item.id)} className="px-3 py-1.5 rounded-lg" style={{ fontSize: '11px', fontWeight: 700, background: '#dc2626', color: '#fff' }}>Remove</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                <cfg.Icon width={13} height={13} style={{ color: cfg.color }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#111' }} className="truncate">{item.name}</p>
                  {isLow && !isExpired && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md flex-shrink-0" style={{ fontSize: '10px', fontWeight: 700, background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa' }}>
                      <AlertTriangle width={8} height={8} /> Low
                    </span>
                  )}
                  {isExpired && (
                    <span className="px-1.5 py-0.5 rounded-md flex-shrink-0" style={{ fontSize: '10px', fontWeight: 700, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>Expired</span>
                  )}
                  {isExpiring && !isExpired && (
                    <span className="px-1.5 py-0.5 rounded-md flex-shrink-0" style={{ fontSize: '10px', fontWeight: 700, background: '#fefce8', color: '#a16207', border: '1px solid #fde68a' }}>
                      Exp. {expiryDays === 0 ? 'today' : `in ${expiryDays}d`}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="px-1.5 py-0.5 rounded-md" style={{ fontSize: '10px', fontWeight: 600, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
                  {item.location && <span style={{ fontSize: '11px', color: '#9ca3af' }}>{item.location}</span>}
                </div>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => adjustQuantity(item.id, -1)} className="w-7 h-7 flex items-center justify-center rounded-lg transition-all active:scale-95" style={{ background: '#f5f5f4', border: '1px solid #e5e7eb', color: '#6b7280', fontSize: '16px', lineHeight: 1 }}>−</button>
                <div className="text-center" style={{ minWidth: '52px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: isLow ? '#ea580c' : '#111' }}>
                    {item.quantity} <span style={{ fontSize: '11px', fontWeight: 400, color: '#9ca3af' }}>{item.unit}</span>
                  </p>
                </div>
                <button onClick={() => adjustQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center rounded-lg transition-all active:scale-95" style={{ background: '#f5f5f4', border: '1px solid #e5e7eb', color: '#6b7280', fontSize: '16px', lineHeight: 1 }}>+</button>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={onEdit} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all" style={{ color: '#9ca3af' }}>
                  <Edit2 width={12} height={12} />
                </button>
                <button onClick={() => setConfirmDelete(true)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 transition-all" style={{ color: '#9ca3af' }}>
                  <Trash2 width={12} height={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type FilterCat = InventoryCategory | 'all' | 'alerts';

export function Inventory() {
  const { items, addItem, updateItem } = useInventory();
  const [showAddForm,  setShowAddForm]  = useState(false);
  const [addFormKey,   setAddFormKey]   = useState(0);
  const [editingId,    setEditingId]    = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterCat>('all');
  const [searchQuery,  setSearchQuery]  = useState('');

  const lowStockCount = items.filter(i => i.reorderThreshold !== undefined && i.quantity <= i.reorderThreshold).length;
  const expiredCount  = items.filter(i => i.expiryDate && daysUntilExpiry(i.expiryDate) < 0).length;
  const expiringCount = items.filter(i => i.expiryDate && daysUntilExpiry(i.expiryDate) >= 0 && daysUntilExpiry(i.expiryDate) <= 30).length;
  const alertCount    = lowStockCount + expiredCount;

  const filtered = useMemo(() => {
    let list = items;
    if (searchQuery) list = list.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.supplier?.toLowerCase().includes(searchQuery.toLowerCase()));
    if (activeFilter === 'alerts') list = list.filter(i => (i.reorderThreshold !== undefined && i.quantity <= i.reorderThreshold) || (i.expiryDate && daysUntilExpiry(i.expiryDate) <= 30));
    else if (activeFilter !== 'all') list = list.filter(i => i.category === activeFilter);
    return list;
  }, [items, activeFilter, searchQuery]);

  function handleAdd(item: InventoryItem) {
    addItem(item);
    setShowAddForm(false);
  }

  function handleEdit(item: InventoryItem) {
    updateItem(item.id, item);
    setEditingId(null);
  }

  function handleToggleAdd() {
    setShowAddForm(v => {
      if (!v) setAddFormKey(k => k + 1);
      return !v;
    });
    setEditingId(null);
  }

  const FILTERS: { value: FilterCat; label: string; count?: number }[] = [
    { value: 'all',    label: 'All',    count: items.length },
    { value: 'alerts', label: 'Alerts', count: alertCount   },
    ...Object.entries(CATEGORY_CONFIG).map(([k, v]) => ({
      value: k as InventoryCategory,
      label: v.label,
      count: items.filter(i => i.category === k).length,
    })),
  ];

  return (
    <div className="pb-8">

      <PageHeader
        title="Inventory"
        action={
          <button onClick={handleToggleAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-shrink-0 transition-all active:scale-[0.97]" style={{ background: showAddForm ? '#f5f5f4' : '#ea580c', color: showAddForm ? '#6b7280' : '#fff', fontSize: '13px', fontWeight: 600 }}>
            {showAddForm ? <X width={14} height={14} /> : <Plus width={14} height={14} />}
            {showAddForm ? 'Cancel' : 'Add Item'}
          </button>
        }
        chips={[
          { label: `${items.length} item${items.length !== 1 ? 's' : ''}`, variant: 'neutral' },
          ...(alertCount > 0 ? [{ label: `${alertCount} alert${alertCount !== 1 ? 's' : ''}`, variant: 'danger' as const, onClick: () => setActiveFilter(f => f === 'alerts' ? 'all' : 'alerts'), active: activeFilter === 'alerts' }] : []),
        ]}
      />

      <div className="max-w-5xl mx-auto px-4 md:px-8">

      {/* Inline add form */}
      <AnimatedSection open={showAddForm}>
        <ItemForm key={addFormKey} title="New Item" onSave={handleAdd} onClose={() => setShowAddForm(false)} />
      </AnimatedSection>

      {/* Alert banner */}
      {(alertCount > 0 || expiringCount > 0) && (
        <div className="rounded-2xl px-4 py-3.5 mb-5 flex items-center gap-3" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
          <AlertTriangle width={13} height={13} style={{ color: '#ea580c', flexShrink: 0 }} />
          <p style={{ fontSize: '12px', color: '#92400e', fontWeight: 500 }}>
            {[
              lowStockCount > 0 && `${lowStockCount} item${lowStockCount !== 1 ? 's' : ''} low on stock`,
              expiredCount  > 0 && `${expiredCount} item${expiredCount !== 1 ? 's' : ''} expired`,
              expiringCount > 0 && `${expiringCount} item${expiringCount !== 1 ? 's' : ''} expiring within 30 days`,
            ].filter(Boolean).join(' · ')}
          </p>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Items',   value: items.length,   accent: false,             sub: 'tracked'           },
          { label: 'Low Stock',     value: lowStockCount,  accent: lowStockCount > 0, sub: 'need reorder'      },
          { label: 'Expired',       value: expiredCount,   accent: expiredCount > 0,  sub: 'remove or replace' },
          { label: 'Expiring Soon', value: expiringCount,  accent: expiringCount > 0, sub: 'within 30 days'    },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 transition-all hover:shadow-sm hover:-translate-y-px" style={{ background: '#fefefe', border: `1px solid ${s.accent ? '#fed7aa' : '#ebebeb'}` }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</p>
            <p style={{ fontSize: '24px', fontWeight: 800, color: s.accent ? '#ea580c' : '#111', letterSpacing: '-0.04em', lineHeight: 1, marginTop: '4px' }}>{s.value}</p>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* List card */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
        {/* Toolbar */}
        <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid #f0f0f0' }}>
          <div className="relative flex-1 max-w-xs">
            <Search width={13} height={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search items…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl outline-none transition-colors w-full"
              style={{ fontSize: '12px', background: '#f5f5f4', border: '1px solid #ebebeb', color: '#111' }}
              onFocus={e => (e.target.style.borderColor = '#ea580c')}
              onBlur={e => (e.target.style.borderColor = '#ebebeb')}
            />
          </div>
          <p style={{ fontSize: '11px', color: '#9ca3af', flexShrink: 0 }}>{filtered.length} item{filtered.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Category filter pills */}
        <div className="flex gap-1.5 overflow-x-auto px-5 py-3" style={{ borderBottom: '1px solid #f0f0f0', scrollbarWidth: 'none' }}>
          {FILTERS.filter(f => f.value === 'all' || f.value === 'alerts' || (f.count ?? 0) > 0).map(f => {
            const active  = activeFilter === f.value;
            const isAlert = f.value === 'alerts';
            const catCfg  = f.value !== 'all' && f.value !== 'alerts' ? CATEGORY_CONFIG[f.value as InventoryCategory] : null;
            return (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all"
                style={{
                  fontSize: '12px',
                  fontWeight: active ? 700 : 400,
                  background: active ? (isAlert ? '#fff7ed' : catCfg ? catCfg.bg : '#111') : '#f9f9f8',
                  color:      active ? (isAlert ? '#ea580c' : catCfg ? catCfg.color : '#fff') : '#6b7280',
                  border:     `1px solid ${active ? (isAlert ? '#fed7aa' : catCfg ? catCfg.border : '#111') : '#e5e7eb'}`,
                }}
              >
                {isAlert && <AlertTriangle width={10} height={10} />}
                {catCfg && <catCfg.Icon width={10} height={10} />}
                {f.label}
                {(f.count ?? 0) > 0 && (
                  <span className="px-1 rounded" style={{ fontSize: '9px', fontWeight: 700, background: 'rgba(0,0,0,0.08)' }}>
                    {f.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Items */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Package width={28} height={28} style={{ color: '#e5e7eb' }} />
            <div className="text-center">
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                {items.length === 0 ? 'No items yet' : 'No items match'}
              </p>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                {items.length === 0 ? 'Add chemicals, vaccines, equipment and more' : 'Try a different search or filter'}
              </p>
            </div>
            {items.length === 0 && (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl mt-1"
                style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 600 }}
              >
                <Plus width={14} height={14} /> Add first item
              </button>
            )}
          </div>
        ) : (
          <div>
            {filtered.map(item => (
              <ItemRow
                key={item.id}
                item={item}
                editing={editingId === item.id}
                onEdit={() => { setEditingId(item.id); setShowAddForm(false); }}
                onCancelEdit={() => setEditingId(null)}
                onSaveEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

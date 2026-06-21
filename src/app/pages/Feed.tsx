import { useState } from 'react';
import { AnimatedSection } from '../components/AnimatedSection';
import { useFeed } from '../context/FeedContext';
import { useSuppliers, SUPPLIER_CAT_CONFIG, SUPPLIER_CATS, Supplier, SupplierCategory } from '../context/SuppliersContext';
import {
  FeedItem, FeedType, FEED_TYPE_CONFIG,
  feedDaysRemaining, feedStockPct, isLowStock,
} from '../data/blockData';
import {
  AlertTriangle, Plus, X, Package,
  Phone, Mail, MapPin, Pencil, Trash2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';

type Tab = 'feed' | 'suppliers';

const FEED_TYPES: { value: FeedType; label: string }[] = [
  { value: 'hay',        label: 'Hay'        },
  { value: 'grain',      label: 'Grain'      },
  { value: 'pellet',     label: 'Pellet'     },
  { value: 'supplement', label: 'Supplement' },
  { value: 'mineral',    label: 'Mineral'    },
];

const INPUT = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none bg-white text-gray-900 transition-colors focus:border-orange-400 text-[13px]';

// ── Stock bar ─────────────────────────────────────────────────────────────────
function StockBar({ item }: { item: FeedItem }) {
  const days     = feedDaysRemaining(item);
  const pct      = feedStockPct(item);
  const low      = isLowStock(item);
  const urgent   = days <= 7;
  const barColor = pct >= 66 ? '#22c55e' : pct >= 33 ? '#ea580c' : '#dc2626';
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span style={{ fontSize: '11px', color: '#9ca3af' }}>{item.stockKg} kg remaining</span>
        <span style={{ fontSize: '12px', fontWeight: 700, color: urgent ? '#dc2626' : low ? '#d97706' : '#6b7280' }}>{days}d left</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: '#f0f0f0' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
      </div>
      <div className="flex items-center justify-between mt-1">
        <span style={{ fontSize: '10px', color: '#9ca3af' }}>Reorder at {item.reorderAtKg} kg</span>
        <span style={{ fontSize: '10px', color: '#9ca3af' }}>{item.dailyUseKg} kg/day</span>
      </div>
    </div>
  );
}

// ── Supplier card ─────────────────────────────────────────────────────────────
function SupplierCard({
  supplier, suppliedItems, onUpdate, onRemove,
}: {
  supplier:      Supplier;
  suppliedItems: FeedItem[];
  onUpdate:      (updates: Partial<Omit<Supplier, 'id'>>) => void;
  onRemove:      () => void;
}) {
  const [editing,    setEditing]    = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  // Edit form state — initialised from supplier
  const [eName,     setEName]     = useState(supplier.name);
  const [eCat,      setECat]      = useState<SupplierCategory>(supplier.category);
  const [ePhone,    setEPhone]    = useState(supplier.phone ?? '');
  const [eEmail,    setEEmail]    = useState(supplier.email ?? '');
  const [eAddress,  setEAddress]  = useState(supplier.address ?? '');
  const [eNotes,    setENotes]    = useState(supplier.notes ?? '');

  const cfg = SUPPLIER_CAT_CONFIG[supplier.category];

  function handleSave() {
    onUpdate({
      name:     eName.trim(),
      category: eCat,
      phone:    ePhone.trim() || undefined,
      email:    eEmail.trim() || undefined,
      address:  eAddress.trim() || undefined,
      notes:    eNotes.trim() || undefined,
    });
    setEditing(false);
  }

  // ── Edit mode ──
  if (editing) {
    return (
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #ea580c' }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ background: '#fff7ed', borderBottom: '1px solid #fed7aa' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#ea580c' }}>Edit Supplier</p>
          <button onClick={() => setEditing(false)}><X width={13} height={13} style={{ color: '#9ca3af' }} /></button>
        </div>
        <div className="p-4 space-y-3" style={{ background: '#fefefe' }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Name</p>
              <input className={INPUT} value={eName} onChange={(e) => setEName(e.target.value)} required />
            </div>
            <div className="col-span-2">
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>Category</p>
              <div className="flex flex-wrap gap-1.5">
                {SUPPLIER_CATS.map((cat) => {
                  const c = SUPPLIER_CAT_CONFIG[cat];
                  const active = eCat === cat;
                  return (
                    <button key={cat} type="button" onClick={() => setECat(cat)}
                      className="px-2.5 py-1 rounded-xl transition-all"
                      style={{ fontSize: '10px', fontWeight: active ? 700 : 400, background: active ? c.bg : '#f9f9f8', color: active ? c.color : '#6b7280', border: `1px solid ${active ? c.border : '#e5e7eb'}` }}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Phone</p>
              <input className={INPUT} type="tel" value={ePhone} onChange={(e) => setEPhone(e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Email</p>
              <input className={INPUT} type="email" value={eEmail} onChange={(e) => setEEmail(e.target.value)} placeholder="Optional" />
            </div>
            <div className="col-span-2">
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Address</p>
              <input className={INPUT} value={eAddress} onChange={(e) => setEAddress(e.target.value)} placeholder="Optional" />
            </div>
            <div className="col-span-2">
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Notes</p>
              <input className={INPUT} value={eNotes} onChange={(e) => setENotes(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} disabled={!eName.trim()}
              className="flex-1 py-2 rounded-xl transition-all disabled:opacity-40"
              style={{ background: '#ea580c', color: '#fff', fontSize: '12px', fontWeight: 600 }}
            >
              Save Changes
            </button>
            <button onClick={() => setEditing(false)}
              className="px-4 py-2 rounded-xl"
              style={{ background: '#f5f5f4', color: '#6b7280', fontSize: '12px', border: '1px solid #e5e7eb' }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── View mode ──
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <span
            className="inline-block px-2 py-0.5 rounded-full mb-1.5"
            style={{ fontSize: '10px', fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
          >
            {cfg.label}
          </span>
          <p style={{ fontSize: '15px', fontWeight: 700, color: '#111' }}>{supplier.name}</p>
        </div>
        {/* Edit / Delete */}
        <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
          <button
            onClick={() => { setEditing(true); setConfirmDel(false); }}
            className="p-1.5 rounded-lg transition-all hover:bg-gray-100"
            title="Edit"
          >
            <Pencil width={12} height={12} style={{ color: '#9ca3af' }} />
          </button>
          {confirmDel ? (
            <div className="flex items-center gap-1">
              <button
                onClick={onRemove}
                className="px-2 py-1 rounded-lg text-white transition-all"
                style={{ fontSize: '10px', fontWeight: 700, background: '#dc2626' }}
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDel(false)}
                className="px-2 py-1 rounded-lg"
                style={{ fontSize: '10px', background: '#f5f5f5', color: '#6b7280' }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDel(true)}
              className="p-1.5 rounded-lg transition-all hover:bg-red-50"
              title="Delete"
            >
              <Trash2 width={12} height={12} style={{ color: '#9ca3af' }} />
            </button>
          )}
        </div>
      </div>

      {/* Contact details */}
      <div className="space-y-1.5">
        {supplier.phone && (
          <a
            href={`tel:${supplier.phone.replace(/\s/g, '')}`}
            className="flex items-center gap-2 no-underline group"
          >
            <Phone width={12} height={12} style={{ color: '#9ca3af', flexShrink: 0 }} />
            <span style={{ fontSize: '13px', color: '#111', fontWeight: 500 }}
              className="group-hover:underline"
            >
              {supplier.phone}
            </span>
          </a>
        )}
        {supplier.email && (
          <a
            href={`mailto:${supplier.email}`}
            className="flex items-center gap-2 no-underline group"
          >
            <Mail width={12} height={12} style={{ color: '#9ca3af', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: '#6b7280' }}
              className="group-hover:underline truncate"
            >
              {supplier.email}
            </span>
          </a>
        )}
        {supplier.address && (
          <div className="flex items-start gap-2">
            <MapPin width={12} height={12} style={{ color: '#9ca3af', flexShrink: 0, marginTop: '1px' }} />
            <span style={{ fontSize: '12px', color: '#6b7280' }}>{supplier.address}</span>
          </div>
        )}
      </div>

      {/* Notes */}
      {supplier.notes && (
        <p style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.5 }}>{supplier.notes}</p>
      )}

      {/* Supplied feed items */}
      {suppliedItems.length > 0 && (
        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '10px' }}>
          <p style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
            Supplied items
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suppliedItems.map((fi) => (
              <span
                key={fi.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ fontSize: '10px', fontWeight: 500, background: '#f5f5f4', color: '#374151', border: '1px solid #e5e7eb' }}
              >
                <Package width={9} height={9} />
                {fi.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function Feed() {
  const { feedItems, addFeedItem, updateStock, removeFeedItem } = useFeed();
  const { suppliers, addSupplier, updateSupplier, removeSupplier } = useSuppliers();

  const [tab, setTab] = useState<Tab>('feed');

  // ── Feed form state ──
  const [addingFeed,       setAddingFeed]       = useState(false);
  const [showFeedOptional, setShowFeedOptional] = useState(false);
  const [editingId,        setEditingId]        = useState<string | null>(null);
  const [editStock,        setEditStock]        = useState('');
  const [editMax,          setEditMax]          = useState('');
  const [confirmDelId,     setConfirmDelId]     = useState<string | null>(null);
  const [newName,          setNewName]          = useState('');
  const [newType,          setNewType]          = useState<FeedType>('hay');
  const [newStock,         setNewStock]         = useState('');
  const [newDaily,         setNewDaily]         = useState('');
  const [newCostPerKg,     setNewCostPerKg]     = useState('');
  const [newReorder,       setNewReorder]       = useState('');
  const [newSupplier,      setNewSupplier]      = useState('');
  const [newLocation,      setNewLocation]      = useState('');

  // ── Supplier form state ──
  const [addingSupplier, setAddingSupplier] = useState(false);
  const [sName,     setSName]     = useState('');
  const [sCat,      setSCat]      = useState<SupplierCategory>('feed');
  const [sPhone,    setSPhone]    = useState('');
  const [sEmail,    setSEmail]    = useState('');
  const [sAddress,  setSAddress]  = useState('');
  const [sNotes,    setSNotes]    = useState('');
  const [sCatFilter, setSCatFilter] = useState<SupplierCategory | 'all'>('all');

  const [filterLow, setFilterLow] = useState(false);

  const lowCount    = feedItems.filter(isLowStock).length;
  const sortedItems = [...feedItems].sort((a, b) => {
    const aLow = isLowStock(a) ? 0 : 1;
    const bLow = isLowStock(b) ? 0 : 1;
    if (aLow !== bLow) return aLow - bLow;
    return feedDaysRemaining(a) - feedDaysRemaining(b);
  });
  const displayedItems = filterLow ? sortedItems.filter(isLowStock) : sortedItems;

  const filteredSuppliers = sCatFilter === 'all'
    ? suppliers
    : suppliers.filter((s) => s.category === sCatFilter);

  // Categories that have at least one supplier
  const presentCats = [...new Set(suppliers.map((s) => s.category))];

  function handleAddFeed(e: React.FormEvent) {
    e.preventDefault();
    const stockVal = parseFloat(newStock) || 0;
    const item: FeedItem = {
      id:             `f-${Date.now()}`,
      name:           newName.trim(),
      type:           newType,
      stockKg:        stockVal,
      initialStockKg: stockVal,
      dailyUseKg:     parseFloat(newDaily) || 1,
      costPerKg:      parseFloat(newCostPerKg) || 0,
      reorderAtKg:    parseFloat(newReorder) || 0,
      supplier:       newSupplier.trim() || undefined,
      location:       newLocation.trim() || undefined,
    };
    addFeedItem(item);
    setAddingFeed(false);
    setShowFeedOptional(false);
    setNewName(''); setNewType('hay'); setNewStock(''); setNewDaily('');
    setNewCostPerKg(''); setNewReorder(''); setNewSupplier(''); setNewLocation('');
  }

  function handleUpdateStock(id: string) {
    const val = parseFloat(editStock);
    const max = parseFloat(editMax);
    if (!isNaN(val)) updateStock(id, val, !isNaN(max) && max > 0 ? max : undefined);
    setEditingId(null); setEditStock(''); setEditMax('');
  }

  function handleAddSupplier(e: React.FormEvent) {
    e.preventDefault();
    if (!sName.trim()) return;
    addSupplier({
      name:     sName.trim(),
      category: sCat,
      phone:    sPhone.trim() || undefined,
      email:    sEmail.trim() || undefined,
      address:  sAddress.trim() || undefined,
      notes:    sNotes.trim() || undefined,
    });
    setAddingSupplier(false);
    setSName(''); setSCat('feed'); setSPhone(''); setSEmail(''); setSAddress(''); setSNotes('');
  }

  function handleAddBtn() {
    if (tab === 'feed') {
      if (!addingFeed) setShowFeedOptional(false);
      setAddingFeed(v => !v);
      setAddingSupplier(false);
    } else {
      setAddingSupplier(v => !v);
      setAddingFeed(false);
    }
  }

  return (
    <div className="pb-8">

      <PageHeader
        title="Feed & Supplies"
        action={
          <button onClick={handleAddBtn} className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-shrink-0 transition-all active:scale-[0.97]" style={{ background: (tab === 'feed' ? addingFeed : addingSupplier) ? '#f5f5f4' : '#ea580c', color: (tab === 'feed' ? addingFeed : addingSupplier) ? '#6b7280' : '#fff', fontSize: '13px', fontWeight: 600 }}>
            {(tab === 'feed' ? addingFeed : addingSupplier) ? <X width={14} height={14} /> : <Plus width={14} height={14} />}
            {(tab === 'feed' ? addingFeed : addingSupplier) ? 'Cancel' : tab === 'feed' ? 'Add Feed' : 'Add Supplier'}
          </button>
        }
        chips={[
          { label: tab === 'feed' ? `${feedItems.length} items tracked` : `${suppliers.length} suppliers`, variant: 'neutral' },
          ...(tab === 'feed' && lowCount > 0 ? [{ label: `${lowCount} below reorder level`, variant: 'warning' as const, onClick: () => setFilterLow(v => !v), active: filterLow }] : []),
        ]}
      />

      <div className="max-w-5xl mx-auto px-4 md:px-8">

      {/* ── Tabs ── */}
      <div className="flex gap-1.5 mb-5">
        {(['feed', 'suppliers'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 rounded-xl transition-all"
            style={{
              fontSize: '13px',
              fontWeight: tab === t ? 700 : 400,
              background: tab === t ? '#111' : '#fff',
              color:      tab === t ? '#fff' : '#6b7280',
              border:     `1px solid ${tab === t ? '#111' : '#e5e7eb'}`,
            }}
          >
            {t === 'feed' ? 'Feed & Stock' : 'Suppliers'}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          FEED TAB
      ══════════════════════════════════════════════════════ */}
      {tab === 'feed' && (
        <>
          {/* Add feed form */}
          <AnimatedSection open={addingFeed}>
            <div className="rounded-2xl mb-5 overflow-hidden" style={{ border: '1px solid #ebebeb' }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ background: '#f9f9f8', borderBottom: '1px solid #ebebeb' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>Add Feed Item</p>
                <button onClick={() => setAddingFeed(false)}><X width={14} height={14} style={{ color: '#9ca3af' }} /></button>
              </div>
              <form onSubmit={handleAddFeed} className="p-5 space-y-4" style={{ background: '#fefefe' }}>
                {/* Name */}
                <div>
                  <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Name *</p>
                  <input className={INPUT} placeholder="e.g. Meadow Hay" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                </div>

                {/* Type */}
                <div>
                  <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>Type *</p>
                  <div className="flex flex-wrap gap-1.5">
                    {FEED_TYPES.map((t) => {
                      const active = newType === t.value;
                      const cfg = FEED_TYPE_CONFIG[t.value];
                      return (
                        <button key={t.value} type="button" onClick={() => setNewType(t.value)}
                          className="px-3 py-1.5 rounded-xl transition-all"
                          style={{ fontSize: '11px', fontWeight: active ? 700 : 400, background: active ? cfg.bg : '#f9f9f8', color: active ? cfg.color : '#6b7280', border: `1px solid ${active ? cfg.border : '#e5e7eb'}` }}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Stock + Daily use */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Current stock (kg) *</p>
                    <input type="number" min="0" step="0.1" className={INPUT} placeholder="e.g. 500" value={newStock} onChange={(e) => setNewStock(e.target.value)} required />
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Daily use (kg/day)</p>
                    <input type="number" min="0" step="0.1" className={INPUT} placeholder="e.g. 2.5" value={newDaily} onChange={(e) => setNewDaily(e.target.value)} />
                  </div>
                </div>

                {/* Optional fields toggle */}
                <button
                  type="button"
                  onClick={() => setShowFeedOptional(v => !v)}
                  className="flex items-center gap-1.5 w-full py-2 rounded-xl transition-colors"
                  style={{ fontSize: '12px', color: '#6b7280', background: '#f9f9f8', border: '1px solid #f0f0f0', paddingLeft: '12px' }}
                >
                  {showFeedOptional
                    ? <ChevronUp width={13} height={13} />
                    : <ChevronDown width={13} height={13} />
                  }
                  <span style={{ fontWeight: 500 }}>Optional details</span>
                  {!showFeedOptional && (newCostPerKg || newReorder || newSupplier || newLocation) && (
                    <span className="ml-auto mr-3 px-1.5 py-0.5 rounded-full" style={{ fontSize: '10px', fontWeight: 700, background: '#ea580c', color: '#fff' }}>
                      filled
                    </span>
                  )}
                </button>

                <AnimatedSection open={showFeedOptional}>
                  <div className="space-y-4 pt-1">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Cost per kg ($)</p>
                        <input type="number" min="0" step="0.01" className={INPUT} placeholder="e.g. 0.35" value={newCostPerKg} onChange={(e) => setNewCostPerKg(e.target.value)} />
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Reorder at (kg)</p>
                        <input type="number" min="0" step="1" className={INPUT} placeholder="e.g. 100" value={newReorder} onChange={(e) => setNewReorder(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Supplier</p>
                        <input className={INPUT} placeholder="e.g. Farmlands" value={newSupplier} onChange={(e) => setNewSupplier(e.target.value)} />
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Storage location</p>
                        <input className={INPUT} placeholder="e.g. Main Barn" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </AnimatedSection>

                <div className="flex gap-2">
                  <button type="submit" className="flex-1 py-2.5 rounded-xl transition-all" style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 600 }}>
                    Add Feed Item
                  </button>
                  <button type="button" onClick={() => { setAddingFeed(false); setShowFeedOptional(false); }} className="px-4 py-2.5 rounded-xl" style={{ background: '#f5f5f4', color: '#6b7280', fontSize: '13px', border: '1px solid #e5e7eb' }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </AnimatedSection>

          {/* Empty state */}
          {sortedItems.length === 0 && !addingFeed && (
            <div className="py-16 text-center">
              <p style={{ fontSize: '13px', color: '#9ca3af' }}>No feed items yet, tap "Add Feed" to start tracking stock.</p>
            </div>
          )}

          {/* Feed grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-8">
            {displayedItems.map((item) => {
              const low    = isLowStock(item);
              const days   = feedDaysRemaining(item);
              const urgent = days <= 7;
              const tcfg   = FEED_TYPE_CONFIG[item.type];
              return (
                <div
                  key={item.id}
                  className="rounded-2xl p-5 flex flex-col gap-4"
                  style={{ background: '#fefefe', border: `1px solid ${urgent ? '#fecaca' : low ? '#fde68a' : '#ebebeb'}` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-block px-2 py-0.5 rounded-full" style={{ fontSize: '10px', fontWeight: 700, color: tcfg.color, background: tcfg.bg, border: `1px solid ${tcfg.border}` }}>
                          {tcfg.label}
                        </span>
                        {low && <AlertTriangle width={12} height={12} style={{ color: urgent ? '#dc2626' : '#d97706', flexShrink: 0 }} />}
                      </div>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: '#111' }}>{item.name}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {confirmDelId === item.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { removeFeedItem(item.id); setConfirmDelId(null); }}
                            className="px-2 py-1 rounded-lg text-white transition-all"
                            style={{ fontSize: '10px', fontWeight: 700, background: '#dc2626' }}
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setConfirmDelId(null)}
                            className="px-2 py-1 rounded-lg"
                            style={{ fontSize: '10px', background: '#f5f5f5', color: '#6b7280' }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelId(item.id)}
                          className="p-1.5 rounded-lg transition-all hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 width={12} height={12} style={{ color: '#9ca3af' }} />
                        </button>
                      )}
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#f5f5f4' }}>
                        <Package width={16} height={16} style={{ color: '#9ca3af' }} />
                      </div>
                    </div>
                  </div>

                  <StockBar item={item} />

                  <div className="space-y-1.5 pt-1" style={{ borderTop: '1px solid #f0f0f0' }}>
                    <div className="flex justify-between">
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>Location</span>
                      <span style={{ fontSize: '11px', color: item.location ? '#374151' : '#d1d5db', fontWeight: item.location ? 500 : 400 }}>{item.location || 'None'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>Supplier</span>
                      {item.supplier ? (
                        <button
                          onClick={() => setTab('suppliers')}
                          className="truncate ml-2 text-right hover:underline"
                          style={{ fontSize: '11px', color: '#ea580c', fontWeight: 500, maxWidth: '140px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          {item.supplier}
                        </button>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#d1d5db' }}>—</span>
                      )}
                    </div>
                    <div className="flex justify-between"><span style={{ fontSize: '11px', color: '#9ca3af' }}>Cost/kg</span><span style={{ fontSize: '11px', color: '#374151', fontWeight: 500 }}>${item.costPerKg.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span style={{ fontSize: '11px', color: '#9ca3af' }}>Weekly cost</span><span style={{ fontSize: '11px', color: '#374151', fontWeight: 500 }}>${(item.dailyUseKg * 7 * item.costPerKg).toFixed(0)}</span></div>
                  </div>

                  {editingId === item.id ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <p style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '3px' }}>Current stock</p>
                          <input
                            type="number" min="0" step="0.1"
                            className={INPUT}
                            style={{ paddingRight: '28px' }}
                            placeholder="e.g. 2"
                            value={editStock}
                            onChange={(e) => setEditStock(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUpdateStock(item.id);
                              if (e.key === 'Escape') { setEditingId(null); setEditStock(''); setEditMax(''); }
                            }}
                          />
                          <span className="absolute right-3 bottom-2.5" style={{ fontSize: '11px', color: '#9ca3af' }}>kg</span>
                        </div>
                        <div className="relative">
                          <p style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '3px' }}>
                            Max / full {item.initialStockKg ? `(${item.initialStockKg}kg)` : ''}
                          </p>
                          <input
                            type="number" min="0" step="0.1"
                            className={INPUT}
                            style={{ paddingRight: '28px' }}
                            placeholder={item.initialStockKg ? String(item.initialStockKg) : 'e.g. 4'}
                            value={editMax}
                            onChange={(e) => setEditMax(e.target.value)}
                          />
                          <span className="absolute right-3 bottom-2.5" style={{ fontSize: '11px', color: '#9ca3af' }}>kg</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdateStock(item.id)} className="flex-1 py-2 rounded-xl" style={{ background: '#ea580c', color: '#fff', fontSize: '12px', fontWeight: 600 }}>Save</button>
                        <button onClick={() => { setEditingId(null); setEditStock(''); setEditMax(''); }} className="px-3 py-2 rounded-xl" style={{ background: '#f5f5f4', color: '#6b7280', fontSize: '12px', border: '1px solid #e5e7eb' }}>
                          <X width={12} height={12} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingId(item.id); setEditStock(String(item.stockKg)); setEditMax(''); }}
                      className="w-full py-2 rounded-xl transition-all"
                      style={{ background: '#f5f5f4', color: '#374151', fontSize: '12px', fontWeight: 500, border: '1px solid #e5e7eb' }}
                    >
                      Update Stock
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          SUPPLIERS TAB
      ══════════════════════════════════════════════════════ */}
      {tab === 'suppliers' && (
        <>
          {/* Add supplier form */}
          <AnimatedSection open={addingSupplier}>
            <div className="rounded-2xl mb-5 overflow-hidden" style={{ border: '1px solid #ebebeb' }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ background: '#f9f9f8', borderBottom: '1px solid #ebebeb' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>Add Supplier</p>
                <button onClick={() => setAddingSupplier(false)}><X width={14} height={14} style={{ color: '#9ca3af' }} /></button>
              </div>
              <form onSubmit={handleAddSupplier} className="p-5 space-y-4" style={{ background: '#fefefe' }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="col-span-1 sm:col-span-2">
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Name *</p>
                    <input className={INPUT} placeholder="e.g. Wairarapa Vets" value={sName} onChange={(e) => setSName(e.target.value)} required />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>Category *</p>
                    <div className="flex flex-wrap gap-1.5">
                      {SUPPLIER_CATS.map((cat) => {
                        const c = SUPPLIER_CAT_CONFIG[cat];
                        const active = sCat === cat;
                        return (
                          <button key={cat} type="button" onClick={() => setSCat(cat)}
                            className="px-2.5 py-1.5 rounded-xl transition-all"
                            style={{ fontSize: '11px', fontWeight: active ? 700 : 400, background: active ? c.bg : '#f9f9f8', color: active ? c.color : '#6b7280', border: `1px solid ${active ? c.border : '#e5e7eb'}` }}
                          >
                            {c.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Phone</p>
                    <input type="tel" className={INPUT} placeholder="e.g. 06 370 1234" value={sPhone} onChange={(e) => setSPhone(e.target.value)} />
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Email</p>
                    <input type="email" className={INPUT} placeholder="e.g. info@example.co.nz" value={sEmail} onChange={(e) => setSEmail(e.target.value)} />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Address</p>
                    <input className={INPUT} placeholder="Optional street address" value={sAddress} onChange={(e) => setSAddress(e.target.value)} />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Notes</p>
                    <input className={INPUT} placeholder="Delivery minimums, hours, preferred contacts…" value={sNotes} onChange={(e) => setSNotes(e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={!sName.trim()} className="flex-1 py-2.5 rounded-xl transition-all disabled:opacity-40" style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 600 }}>
                    Save Supplier
                  </button>
                  <button type="button" onClick={() => setAddingSupplier(false)} className="px-4 py-2.5 rounded-xl" style={{ background: '#f5f5f4', color: '#6b7280', fontSize: '13px', border: '1px solid #e5e7eb' }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </AnimatedSection>

          {/* Category filter */}
          {presentCats.length > 1 && (
            <div className="flex gap-1.5 flex-wrap mb-4">
              <button
                onClick={() => setSCatFilter('all')}
                className="px-3 py-1.5 rounded-xl transition-all"
                style={{ fontSize: '11px', fontWeight: sCatFilter === 'all' ? 700 : 400, background: sCatFilter === 'all' ? '#111' : '#fff', color: sCatFilter === 'all' ? '#fff' : '#6b7280', border: `1px solid ${sCatFilter === 'all' ? '#111' : '#e5e7eb'}` }}
              >
                All
              </button>
              {presentCats.map((cat) => {
                const c      = SUPPLIER_CAT_CONFIG[cat];
                const active = sCatFilter === cat;
                return (
                  <button key={cat} onClick={() => setSCatFilter(cat)}
                    className="px-3 py-1.5 rounded-xl transition-all"
                    style={{ fontSize: '11px', fontWeight: active ? 700 : 400, background: active ? c.bg : '#fff', color: active ? c.color : '#6b7280', border: `1px solid ${active ? c.border : '#e5e7eb'}` }}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Supplier grid */}
          {filteredSuppliers.length === 0 ? (
            <div className="py-16 text-center">
              <p style={{ fontSize: '13px', color: '#9ca3af' }}>
                {suppliers.length === 0
                  ? 'No suppliers yet, tap "Add Supplier" to add your first contact.'
                  : 'No suppliers in this category.'}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3 pb-8">
              {filteredSuppliers.map((supplier) => {
                const suppliedItems = feedItems.filter(
                  (fi) => fi.supplier?.toLowerCase() === supplier.name.toLowerCase(),
                );
                return (
                  <SupplierCard
                    key={supplier.id}
                    supplier={supplier}
                    suppliedItems={suppliedItems}
                    onUpdate={(updates) => updateSupplier(supplier.id, updates)}
                    onRemove={() => removeSupplier(supplier.id)}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}

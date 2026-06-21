import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { DropdownSelect } from './DropdownSelect';
import {
  PADDOCK_STATUS_CONFIG,
  GRASS_COVER_CONFIG,
  FENCE_CONDITION_CONFIG,
  type Paddock,
  type PaddockStatus,
  type GrassCover,
  type FenceCondition,
} from '../data/blockData';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd?: (paddock: Paddock) => void;
  onEdit?: (paddock: Paddock) => void;
  initialValues?: Paddock;
}

const FIELD_LABEL = {
  fontSize: '11px', fontWeight: 700, color: '#6b7280',
  textTransform: 'uppercase' as const, letterSpacing: '0.06em',
  display: 'block', marginBottom: '6px',
};
const INPUT = {
  fontSize: '13px', color: '#111', background: '#fafaf9',
  border: '1px solid #e5e7eb', borderRadius: '10px',
  padding: '10px 12px', outline: 'none',
  width: '100%', boxSizing: 'border-box' as const, display: 'block',
};

export function NewPaddockModal({ open, onClose, onAdd, onEdit, initialValues }: Props) {
  const isEdit = !!initialValues;

  const [name, setName]                     = useState('');
  const [hectares, setHectares]             = useState('');
  const [status, setStatus]                 = useState<PaddockStatus>('grazing');
  const [grassCover, setGrassCover]         = useState<GrassCover>('good');
  const [fenceCondition, setFenceCondition] = useState<FenceCondition>('good');
  const [waterSource, setWaterSource]       = useState('');
  const [notes, setNotes]                   = useState('');

  // Populate fields when editing
  useEffect(() => {
    if (initialValues) {
      setName(initialValues.name);
      setHectares(String(initialValues.hectares));
      setStatus(initialValues.status);
      setGrassCover(initialValues.grassCover);
      setFenceCondition(initialValues.fenceCondition);
      setWaterSource(initialValues.waterSource === 'Not specified' ? '' : initialValues.waterSource);
      setNotes(initialValues.notes ?? '');
    } else {
      setName(''); setHectares(''); setStatus('grazing');
      setGrassCover('good'); setFenceCondition('good');
      setWaterSource(''); setNotes('');
    }
  }, [initialValues, open]);

  const handleClose = () => { onClose(); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ha = parseFloat(hectares);
    if (!name.trim() || isNaN(ha) || ha <= 0) return;
    const paddock: Paddock = {
      id: initialValues?.id ?? `p-${Date.now()}`,
      name: name.trim(),
      hectares: ha,
      status,
      grassCover,
      fenceCondition,
      waterSource: waterSource.trim() || 'Not specified',
      notes: notes.trim() || undefined,
      lastRotated: initialValues?.lastRotated,
    };
    if (isEdit) onEdit?.(paddock);
    else        onAdd?.(paddock);
    onClose();
  };

  const formContent = (
    <>
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0"
        style={{ borderBottom: '1px solid #f0f0f0' }}
      >
        <p style={{ fontSize: '16px', fontWeight: 800, color: '#111', letterSpacing: '-0.03em' }}>
          {isEdit ? 'Edit Paddock' : 'New Paddock'}
        </p>
        <button
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center rounded-xl"
          style={{ background: '#f5f4f0' }}
        >
          <X className="w-4 h-4" style={{ color: '#6b7280' }} />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto">
        <div>
          <label style={FIELD_LABEL}>Paddock name *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. North Paddock"
            required
            style={INPUT}
          />
        </div>

        <div>
          <label style={FIELD_LABEL}>Size (hectares) *</label>
          <input
            type="number"
            value={hectares}
            onChange={e => setHectares(e.target.value)}
            placeholder="0.0"
            min="0.01"
            step="any"
            required
            style={INPUT}
          />
        </div>

        <div>
          <label style={FIELD_LABEL}>Current status</label>
          <DropdownSelect
            value={status}
            onChange={v => setStatus(v as PaddockStatus)}
            options={Object.entries(PADDOCK_STATUS_CONFIG).map(([k, cfg]) => ({ label: cfg.label, value: k }))}
            placeholder="Select status…"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={FIELD_LABEL}>Grass cover</label>
            <DropdownSelect
              value={grassCover}
              onChange={v => setGrassCover(v as GrassCover)}
              options={Object.entries(GRASS_COVER_CONFIG).map(([k, cfg]) => ({ label: cfg.label, value: k }))}
              placeholder="Select cover…"
            />
          </div>
          <div>
            <label style={FIELD_LABEL}>Fence condition</label>
            <DropdownSelect
              value={fenceCondition}
              onChange={v => setFenceCondition(v as FenceCondition)}
              options={Object.entries(FENCE_CONDITION_CONFIG).map(([k, cfg]) => ({ label: cfg.label, value: k }))}
              placeholder="Select condition…"
            />
          </div>
        </div>

        <div>
          <label style={FIELD_LABEL}>Water source</label>
          <input
            type="text"
            value={waterSource}
            onChange={e => setWaterSource(e.target.value)}
            placeholder="e.g. Trough (mains fed)"
            style={INPUT}
          />
        </div>

        <div>
          <label style={FIELD_LABEL}>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any notes about this paddock..."
            rows={3}
            style={{ ...INPUT, resize: 'none', lineHeight: '1.5' }}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-3 rounded-xl"
            style={{ background: '#f5f4f0', fontSize: '13px', fontWeight: 600, color: '#6b7280' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-3 rounded-xl"
            style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 600 }}
          >
            {isEdit ? 'Save Changes' : 'Add Paddock'}
          </button>
        </div>
      </form>
    </>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200]"
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
        className="md:hidden fixed left-0 right-0 bottom-0 z-[201] rounded-t-2xl flex flex-col"
        style={{
          background: '#fefefe',
          maxHeight: '90vh',
          transform: open ? 'translateY(0)' : 'translateY(110%)',
          transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
          willChange: 'transform',
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: '#d1d5db' }} />
        </div>
        {formContent}
      </div>

      {/* Desktop centered modal */}
      <div
        className="hidden md:flex fixed inset-0 z-[201] items-center justify-center"
        style={{ pointerEvents: open ? 'auto' : 'none' }}
        onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      >
        <div
          className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: '#fefefe',
            maxHeight: '90vh',
            opacity: open ? 1 : 0,
            transform: open ? 'scale(1) translateY(0px)' : 'scale(0.95) translateY(16px)',
            transition: 'opacity 0.25s ease, transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
            willChange: 'transform, opacity',
          }}
        >
          {formContent}
        </div>
      </div>
    </>
  );
}

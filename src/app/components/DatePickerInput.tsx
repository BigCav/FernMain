import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { TODAY } from '../data/blockData';

// ── Calendar helpers (same logic as FarmCalendar) ────────────────────────────

function ymd(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function startDow(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return (d + 6) % 7; // Monday-first
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_LABELS = ['Mo','Tu','We','Th','Fr','Sa','Su'];

function formatDisplay(v: string): string {
  if (!v) return '';
  const [y, m, d] = v.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

// ── Popup calendar ────────────────────────────────────────────────────────────

function CalendarPopup({
  value,
  onChange,
  onClose,
  anchorRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}) {
  const todayDate = new Date(TODAY);
  const initYear  = value ? parseInt(value.split('-')[0]) : todayDate.getFullYear();
  const initMonth = value ? parseInt(value.split('-')[1]) - 1 : todayDate.getMonth();

  const [year,  setYear]  = useState(initYear);
  const [month, setMonth] = useState(initMonth);
  const [style, setStyle] = useState<React.CSSProperties>({ opacity: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  // Position on mount
  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect   = anchor.getBoundingClientRect();
    const popupH = 310;
    const popupW = 280;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top  = spaceBelow > popupH + 8 ? rect.bottom + 4 : rect.top - popupH - 4;
    const left = Math.min(rect.left, window.innerWidth - popupW - 8);
    setStyle({ position: 'fixed', top, left, width: popupW, opacity: 1, zIndex: 9999 });
  }, [anchorRef]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        !popupRef.current?.contains(e.target as Node) &&
        !anchorRef.current?.contains(e.target as Node)
      ) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, anchorRef]);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const totalDays    = daysInMonth(year, month);
  const startOffset  = startDow(year, month);
  const totalCells   = Math.ceil((startOffset + totalDays) / 7) * 7;
  const prevMoDays   = daysInMonth(year, month === 0 ? 11 : month - 1);

  const cells = Array.from({ length: totalCells }, (_, i) => {
    if (i < startOffset) {
      const d = prevMoDays - startOffset + 1 + i;
      const m = month === 0 ? 11 : month - 1;
      const y = month === 0 ? year - 1 : year;
      return { day: d, dateStr: ymd(y, m, d), otherMonth: true };
    }
    const d = i - startOffset + 1;
    if (d > totalDays) {
      const overflow = d - totalDays;
      const m = month === 11 ? 0 : month + 1;
      const y = month === 11 ? year + 1 : year;
      return { day: overflow, dateStr: ymd(y, m, overflow), otherMonth: true };
    }
    return { day: d, dateStr: ymd(year, month, d), otherMonth: false };
  });

  return createPortal(
    <div
      ref={popupRef}
      style={{
        ...style,
        background: '#fefefe',
        border: '1px solid #e5e7eb',
        borderRadius: '16px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.14)',
        overflow: 'hidden',
        transition: 'opacity 0.12s ease',
      }}
    >
      {/* Month nav */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #f0f0f0' }}>
        <button
          type="button"
          onClick={prevMonth}
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
        >
          <ChevronLeft width={13} height={13} style={{ color: '#6b7280' }} />
        </button>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>
          {MONTHS[month]} {year}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
        >
          <ChevronRight width={13} height={13} style={{ color: '#6b7280' }} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 px-3 pt-2 pb-1">
        {DAY_LABELS.map(d => (
          <p key={d} className="text-center" style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {d}
          </p>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-px px-2 pb-2">
        {cells.map((cell, i) => {
          const isToday    = cell.dateStr === TODAY;
          const isSelected = cell.dateStr === value;
          return (
            <button
              key={i}
              type="button"
              onClick={() => { onChange(cell.dateStr); onClose(); }}
              className="flex items-center justify-center rounded-lg transition-all"
              style={{
                height: '32px',
                fontSize: '12px',
                fontWeight: isToday || isSelected ? 700 : 400,
                color:      isSelected ? '#fff' : isToday ? '#ea580c' : cell.otherMonth ? '#d1d5db' : '#111',
                background: isSelected ? '#ea580c' : isToday ? '#fff7ed' : 'transparent',
                border:     isSelected ? '1.5px solid #ea580c' : isToday ? '1.5px solid #fed7aa' : '1.5px solid transparent',
                opacity:    cell.otherMonth && !isSelected ? 0.4 : 1,
              }}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2" style={{ borderTop: '1px solid #f5f5f5' }}>
        <button
          type="button"
          onClick={() => { onChange(''); onClose(); }}
          style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => { onChange(TODAY); onClose(); }}
          style={{ fontSize: '11px', color: '#ea580c', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          Today
        </button>
      </div>
    </div>,
    document.body,
  );
}

// ── Full-width DatePickerInput (replaces <input type="date">) ─────────────────

export function DatePickerInput({
  value,
  onChange,
  placeholder = 'Select date',
  disabled,
  style: styleProp,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <div className={`relative w-full ${className ?? ''}`} style={styleProp}>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className="w-full px-3 py-2.5 rounded-xl border text-left flex items-center justify-between outline-none transition-colors"
        style={{
          fontSize: '13px',
          background: disabled ? '#f9fafb' : '#fff',
          borderColor: open ? '#fb923c' : '#e5e7eb',
          color: value ? '#111' : '#9ca3af',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <span>{value ? formatDisplay(value) : placeholder}</span>
        <CalendarDays width={14} height={14} style={{ color: '#9ca3af', flexShrink: 0 }} />
      </button>

      {open && (
        <CalendarPopup
          value={value}
          onChange={onChange}
          onClose={() => setOpen(false)}
          anchorRef={btnRef}
        />
      )}
    </div>
  );
}

// ── Compact icon-only trigger (for inline text + calendar combos) ─────────────
// Renders an absolutely-positionable icon button that opens the same popup.
// Usage: position it over the calendar icon in a text+date combo field.

export function DatePickerTrigger({
  value,
  onChange,
  style: styleProp,
}: {
  value: string;
  onChange: (v: string) => void;
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{ ...styleProp, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
        aria-label="Pick date"
      />
      {open && (
        <CalendarPopup
          value={value}
          onChange={onChange}
          onClose={() => setOpen(false)}
          anchorRef={btnRef}
        />
      )}
    </>
  );
}

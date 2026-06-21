import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

type OptionItem = string | { label: string; value: string };

function optLabel(o: OptionItem) { return typeof o === 'string' ? o : o.label; }
function optValue(o: OptionItem) { return typeof o === 'string' ? o : o.value; }

export function DropdownSelect({
  value, onChange, options, placeholder, disabled, dark,
}: {
  value: string;
  onChange: (v: string) => void;
  options: OptionItem[];
  placeholder: string;
  disabled?: boolean;
  dark?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedLabel = options.find(o => optValue(o) === value);
  const displayText = selectedLabel ? optLabel(selectedLabel) : '';

  const btnBg     = dark ? 'rgba(255,255,255,0.07)' : disabled ? '#f9fafb' : '#fff';
  const btnBorder = dark
    ? open ? 'rgba(251,146,60,0.7)' : 'rgba(255,255,255,0.12)'
    : open ? '#fb923c' : '#e5e7eb';
  const btnColor = dark
    ? value ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)'
    : value ? '#111827' : '#9ca3af';

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className="w-full px-4 py-3 rounded-xl text-left flex items-center justify-between transition-colors outline-none"
        style={{
          fontSize: '14px',
          background: btnBg,
          border: `1px solid ${btnBorder}`,
          color: btnColor,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span className="truncate">{displayText || placeholder}</span>
        <ChevronDown
          width={14} height={14}
          style={{
            color: dark ? 'rgba(255,255,255,0.35)' : '#9ca3af',
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
          }}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-50"
          style={{
            background: '#fefefe',
            border: '1px solid #e5e7eb',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            maxHeight: '220px',
            overflowY: 'auto',
          }}
        >
          {options.map(opt => {
            const val = optValue(opt);
            const lbl = optLabel(opt);
            const isSelected = val === value;
            const isHovered  = val === hovered;
            return (
              <button
                key={val}
                type="button"
                onClick={() => { onChange(val); setOpen(false); }}
                onMouseEnter={() => setHovered(val)}
                onMouseLeave={() => setHovered(null)}
                className="w-full px-4 py-2.5 text-left transition-colors"
                style={{
                  fontSize: '13px',
                  color:      isSelected ? '#ea580c' : '#111827',
                  fontWeight: isSelected ? 600 : 400,
                  background: isSelected ? '#fff7ed' : isHovered ? '#f5f5f4' : 'transparent',
                }}
              >
                {lbl}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

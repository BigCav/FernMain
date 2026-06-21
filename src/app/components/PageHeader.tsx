import React from 'react';

type ChipVariant = 'neutral' | 'warning' | 'danger' | 'success' | 'orange';

export interface HeaderChip {
  label: string;
  variant?: ChipVariant;
  onClick?: () => void;
  active?: boolean;
}

interface PageHeaderProps {
  title: string;
  titleIcon?: React.ReactNode;
  action?: React.ReactNode;
  chips?: HeaderChip[];
  maxWidth?: string;
}

const CHIP_STYLES: Record<ChipVariant, { background: string; color: string; border: string }> = {
  neutral: { background: '#ffffff', color: '#374151', border: '1px solid #e5e7eb'  },
  warning: { background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa'  },
  danger:  { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca'  },
  success: { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0'  },
  orange:  { background: '#fff7ed', color: '#ea580c', border: '1px solid #ea580c'  },
};

export function PageHeader({ title, titleIcon, action, chips, maxWidth = 'max-w-5xl' }: PageHeaderProps) {
  const hasChips = chips && chips.length > 0;

  return (
    <div
      style={{
        background: '#fefefe',
        borderBottomLeftRadius: '20px',
        borderBottomRightRadius: '20px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        marginBottom: '20px',
        overflow: 'hidden',
      }}
    >
      {/* Title row */}
      <div className={`${maxWidth} mx-auto px-4 md:px-8`}>
        <div className={`flex items-center justify-between gap-3 pt-5 md:pt-6 ${hasChips ? 'pb-4' : 'pb-5'}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            {titleIcon}
            <p style={{ fontSize: '22px', fontWeight: 800, color: '#111', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
              {title}
            </p>
          </div>
          {action && (
            <div className="flex-shrink-0 flex items-center gap-2">{action}</div>
          )}
        </div>
      </div>

      {/* Stat fold — full width, tinted, attached to bottom of card */}
      {hasChips && (
        <div style={{ background: '#f7f6f4', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <div className={`${maxWidth} mx-auto px-4 md:px-8 py-2.5 flex items-center gap-2 flex-wrap`}>
            {chips.map((chip, i) => {
              const variant = chip.variant ?? 'neutral';
              const s = chip.active ? CHIP_STYLES['orange'] : CHIP_STYLES[variant];
              return (
                <button
                  key={i}
                  onClick={chip.onClick}
                  disabled={!chip.onClick}
                  style={{
                    ...s,
                    fontSize: '12px',
                    fontWeight: chip.active ? 700 : 600,
                    padding: '4px 11px',
                    borderRadius: '20px',
                    cursor: chip.onClick ? 'pointer' : 'default',
                    lineHeight: 1.5,
                    transition: 'all 0.15s',
                    display: 'inline-flex',
                    alignItems: 'center',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                  }}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

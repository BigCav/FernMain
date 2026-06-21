import { useState } from 'react';
import { Link } from 'react-router';
import { Cake, X } from 'lucide-react';

interface BirthdayEntry {
  animal: { id: string; name: string; species: string };
  diff: number;
  age: number;
  scfg: { label: string; color: string; bg: string; border: string };
}

const DISMISSED_KEY = 'fern_dismissed_bdays';
const YEAR = new Date().getFullYear();

function getDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

function persistDismiss(id: string) {
  try {
    const set = getDismissed();
    set.add(`${id}_${YEAR}`);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set]));
  } catch {}
}

const CONFETTI: { l: string; t: string; c: string; s: number; circ: boolean; dur: number; del: number; b: boolean }[] = [
  { l: '4%',  t: '18%', c: '#c084fc', s: 5, circ: true,  dur: 2.8, del: 0.0,  b: false },
  { l: '11%', t: '72%', c: '#f472b6', s: 4, circ: false, dur: 3.2, del: 0.4,  b: true  },
  { l: '19%', t: '30%', c: '#fbbf24', s: 3, circ: true,  dur: 2.5, del: 0.8,  b: false },
  { l: '27%', t: '78%', c: '#818cf8', s: 5, circ: false, dur: 3.6, del: 0.2,  b: true  },
  { l: '36%', t: '14%', c: '#34d399', s: 4, circ: true,  dur: 2.9, del: 1.1,  b: false },
  { l: '44%', t: '60%', c: '#fb923c', s: 3, circ: false, dur: 3.1, del: 0.5,  b: true  },
  { l: '52%', t: '28%', c: '#e879f9', s: 5, circ: true,  dur: 2.7, del: 0.9,  b: false },
  { l: '61%', t: '80%', c: '#60a5fa', s: 4, circ: false, dur: 3.4, del: 0.3,  b: true  },
  { l: '70%', t: '10%', c: '#a3e635', s: 3, circ: true,  dur: 2.6, del: 0.7,  b: false },
  { l: '78%', t: '55%', c: '#f87171', s: 5, circ: false, dur: 3.0, del: 1.3,  b: true  },
  { l: '86%', t: '22%', c: '#c084fc', s: 4, circ: true,  dur: 2.8, del: 0.6,  b: false },
  { l: '93%', t: '68%', c: '#fbbf24', s: 3, circ: false, dur: 3.3, del: 1.6,  b: true  },
  { l: '30%', t: '50%', c: '#34d399', s: 4, circ: true,  dur: 2.4, del: 1.0,  b: false },
  { l: '57%', t: '85%', c: '#f472b6', s: 5, circ: false, dur: 3.5, del: 0.2,  b: true  },
  { l: '75%', t: '38%', c: '#818cf8', s: 3, circ: true,  dur: 2.9, del: 1.4,  b: false },
  { l: '16%', t: '50%', c: '#fb923c', s: 4, circ: false, dur: 3.0, del: 0.9,  b: true  },
];

export function BirthdayBannerGroup({ alerts }: { alerts: BirthdayEntry[] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(() => getDismissed());

  const visible = alerts.filter(a => !dismissed.has(`${a.animal.id}_${YEAR}`));

  function dismiss(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    persistDismiss(id);
    setDismissed(prev => new Set([...prev, `${id}_${YEAR}`]));
  }

  if (visible.length === 0) return null;

  const hasToday = visible.some(a => a.diff === 0);
  const bg = hasToday
    ? 'linear-gradient(135deg, #fdf4ff 0%, #f3e8ff 40%, #fce7f3 100%)'
    : 'linear-gradient(135deg, #fdf4ff 0%, #f8f0ff 60%, #f5f0ff 100%)';

  return (
    <div
      className="rounded-2xl"
      style={{
        background: bg,
        border: `1px solid ${hasToday ? '#d8b4fe' : '#e9d5ff'}`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Confetti layer */}
      {CONFETTI.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: p.l,
            top: p.t,
            width: p.s,
            height: p.s,
            background: p.c,
            borderRadius: p.circ ? '50%' : '2px',
            animation: `${p.b ? 'confetti-float-b' : 'confetti-float'} ${p.dur}s ease-in-out infinite`,
            animationDelay: `${p.del}s`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Rows */}
      {visible.map(({ animal, diff, age, scfg }, idx) => (
        <Link
          key={animal.id}
          to={`/animals/${animal.id}`}
          style={{ textDecoration: 'none', display: 'block' }}
          className="hover:brightness-[0.97] transition-all"
        >
          <div
            className="flex items-center gap-3"
            style={{
              padding: '13px 16px',
              borderTop: idx > 0 ? '1px solid rgba(168,85,247,0.12)' : undefined,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: diff === 0 ? '#f3e8ff' : '#f5f0ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                animation: 'cake-glow 2.4s ease-in-out infinite',
                animationDelay: `${idx * 0.5}s`,
              }}
            >
              <Cake width={15} height={15} style={{ color: '#a855f7' }} />
            </div>

            <p style={{ fontSize: '13px', color: '#111', fontWeight: 500, flex: 1 }}>
              <span style={{ fontWeight: 700 }}>{animal.name}</span>
              {' '}turns {age}{' '}
              {diff === 0
                ? <span style={{ color: '#a855f7', fontWeight: 700 }}>today! 🎉</span>
                : diff === 1 ? 'tomorrow' : `in ${diff} days`}
            </p>

            <span
              style={{
                fontSize: '10px', fontWeight: 700,
                color: scfg.color, background: scfg.bg,
                border: `1px solid ${scfg.border}`,
                padding: '2px 8px', borderRadius: 999,
                flexShrink: 0,
              }}
            >
              {scfg.label}
            </span>

            <button
              onClick={(e) => dismiss(animal.id, e)}
              className="flex items-center justify-center flex-shrink-0 transition-all hover:opacity-100"
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background: 'rgba(168,85,247,0.1)',
                border: 'none',
                padding: 0,
                opacity: 0.55,
                color: '#7e22ce',
              }}
              title="Dismiss"
            >
              <X width={11} height={11} strokeWidth={2.5} />
            </button>
          </div>
        </Link>
      ))}
    </div>
  );
}

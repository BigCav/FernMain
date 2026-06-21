import { useGame } from '../context/GameContext';
import type { Screen } from '../types/game';
import { Map, Building2, FlaskConical, User, Shield } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TABS: { id: Screen; label: string; Icon: any }[] = [
  { id: 'map',      label: 'Map',      Icon: Map          },
  { id: 'city',     label: 'City',     Icon: Building2    },
  { id: 'research', label: 'Research', Icon: FlaskConical  },
  { id: 'lord',     label: 'Lord',     Icon: User         },
  { id: 'alliance', label: 'Alliance', Icon: Shield       },
];

export function BottomNav() {
  const { activeScreen, setActiveScreen, selectHex, setAttackSource } = useGame();

  return (
    <div
      className="flex-shrink-0 flex items-center justify-around px-1 pt-1 pb-2"
      style={{
        background: 'linear-gradient(0deg, rgba(4,8,18,0.99) 0%, rgba(8,15,28,0.97) 100%)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {TABS.map(({ id, label, Icon }) => {
        const active = activeScreen === id;
        return (
          <button
            key={id}
            className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl transition-all active:scale-95"
            style={active ? {
              background: 'rgba(59,130,246,0.12)',
              border: '1px solid rgba(59,130,246,0.2)',
            } : { border: '1px solid transparent' }}
            onClick={() => {
              setActiveScreen(id);
              if (id === 'map') { selectHex(null); setAttackSource(null); }
            }}
          >
            <Icon
              size={18}
              className="transition-all"
              style={{ color: active ? '#60a5fa' : '#334155' }}
            />
            <span
              className="font-game text-[10px] leading-none transition-all"
              style={{ color: active ? '#93c5fd' : '#334155', fontWeight: active ? 700 : 500, letterSpacing: '0.04em' }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
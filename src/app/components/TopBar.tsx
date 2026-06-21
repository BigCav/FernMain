import { useGame } from '../context/GameContext';
import { Settings, Zap } from 'lucide-react';

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

export function TopBar() {
  const { resources, lord, setActiveScreen } = useGame();

  return (
    <div
      className="relative z-30 flex-shrink-0"
      style={{
        background: 'linear-gradient(180deg, rgba(4,8,18,0.98) 0%, rgba(8,15,28,0.96) 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Row 1 – lord + power */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <button
          className="flex items-center gap-2 active:opacity-70"
          onClick={() => setActiveScreen('lord')}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[14px]"
            style={{ background: 'linear-gradient(135deg, #1e3a5f, #0d1f3a)', border: '1.5px solid rgba(59,130,246,0.45)' }}
          >
            👑
          </div>
          <div className="text-left">
            <div className="text-[11px] text-slate-400 leading-none font-game">{lord.title}</div>
            <div className="text-[13px] text-white leading-tight font-game" style={{ fontWeight: 700 }}>
              {lord.name}
              <span className="ml-1 text-[11px] text-blue-400">Lv.{lord.level}</span>
            </div>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)' }}
          >
            <Zap size={11} className="text-yellow-400" />
            <span className="text-[12px] font-game text-yellow-300" style={{ fontWeight: 700 }}>
              {fmt(resources.power)}
            </span>
          </div>
          <button className="text-slate-500 active:text-slate-300">
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Row 2 – resources */}
      <div className="flex items-center justify-between px-2 pb-2 gap-1">
        {[
          { icon: '🪙', value: fmt(resources.gold),   label: 'Gold',   color: '#fbbf24' },
          { icon: '🌿', value: fmt(resources.food),   label: 'Food',   color: '#4ade80' },
          { icon: '💎', value: fmt(resources.gems),   label: 'Gems',   color: '#c084fc' },
          { icon: '⚔️', value: fmt(resources.army),   label: 'Army',   color: '#60a5fa' },
          { icon: '📈', value: `+${resources.income}/h`, label: 'Income', color: '#34d399' },
        ].map(({ icon, value, label, color }) => (
          <div
            key={label}
            className="flex-1 flex flex-col items-center gap-0.5 py-1 rounded-xl"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <span className="text-[14px] leading-none">{icon}</span>
            <span className="text-[10px] leading-none font-game" style={{ color, fontWeight: 700 }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

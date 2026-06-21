import { useGame } from '../context/GameContext';
import { Trophy, Clock, ChevronRight } from 'lucide-react';

function fmtTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${secs % 60}s`;
}

export function EventBanner() {
  const { worldEvent } = useGame();
  const pct = Math.min(100, Math.round((worldEvent.progress / worldEvent.target) * 100));

  return (
    <div
      className="flex-shrink-0 mx-2 my-1.5 rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(90deg, rgba(30,15,5,0.96) 0%, rgba(60,30,5,0.94) 50%, rgba(30,15,5,0.96) 100%)',
        border: '1px solid rgba(251,191,36,0.22)',
        boxShadow: '0 2px 12px rgba(251,191,36,0.08)',
      }}
    >
      <div className="flex items-center gap-2.5 px-3 py-2">
        {/* Icon */}
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #78350f, #92400e)', border: '1px solid rgba(251,191,36,0.35)' }}
        >
          <Trophy size={14} className="text-yellow-400" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-game text-yellow-300" style={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              {worldEvent.title}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-amber-500/80">
              <Clock size={9} />
              <span className="font-game">{fmtTime(worldEvent.timeLeftSecs)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Progress bar */}
            <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.4)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                  boxShadow: '0 0 6px rgba(251,191,36,0.5)',
                }}
              />
            </div>
            <span className="text-[10px] font-game text-yellow-400 flex-shrink-0" style={{ fontWeight: 700 }}>
              {worldEvent.progress}/{worldEvent.target}
            </span>
          </div>
          <div className="text-[9px] text-amber-700 font-game mt-0.5">
            Objective: {worldEvent.description}
          </div>
        </div>

        <ChevronRight size={12} className="text-amber-700 flex-shrink-0" />
      </div>
    </div>
  );
}

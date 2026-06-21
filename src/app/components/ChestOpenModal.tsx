import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import type { GearItem, GearRarity } from '../types/game';

const RARITY_CONFIG: Record<GearRarity, { color: string; glow: string; label: string; bg: string }> = {
  common:    { color: '#94a3b8', glow: 'rgba(148,163,184,0.5)', label: 'Common',    bg: 'rgba(148,163,184,0.1)' },
  rare:      { color: '#3b82f6', glow: 'rgba(59,130,246,0.6)',  label: 'Rare',      bg: 'rgba(59,130,246,0.12)'  },
  epic:      { color: '#a855f7', glow: 'rgba(168,85,247,0.7)',  label: 'Epic',      bg: 'rgba(168,85,247,0.14)'  },
  legendary: { color: '#f59e0b', glow: 'rgba(245,158,11,0.8)',  label: 'Legendary', bg: 'rgba(245,158,11,0.16)'  },
};

const SLOT_EMOJI: Record<string, string> = {
  weapon: '⚔️', helmet: '⛑️', armor: '🛡️', shield: '🏰', ring: '💍', boots: '👟',
};
const STAT_LABEL: Record<string, string> = {
  atk: '⚔️ ATK', def: '🛡️ DEF', hp: '❤️ HP', income: '🪙 Income', power: '⚡ Power',
};

type Phase = 'idle' | 'shaking' | 'opening' | 'reveal';

interface Props {
  gear: GearItem;
  chestLabel?: string;
  onCollect: () => void;
}

export function ChestOpenModal({ gear, chestLabel = 'Legendary Chest', onCollect }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const rc = RARITY_CONFIG[gear.rarity];

  const handleTap = () => {
    if (phase === 'idle') {
      setPhase('shaking');
      setTimeout(() => setPhase('opening'), 650);
      setTimeout(() => setPhase('reveal'), 1050);
    }
  };

  return (
    <div
      className="absolute inset-0 z-[100] flex flex-col items-center justify-center fade-in"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(4px)' }}
    >
      {/* Close (only after reveal) */}
      {phase === 'reveal' && (
        <button className="absolute top-4 right-4 text-slate-500 active:text-white p-2"
          onClick={onCollect}>
          <X size={20} />
        </button>
      )}

      {/* Chest label */}
      <div className="font-game text-[12px] text-amber-500/70 mb-6" style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {chestLabel}
      </div>

      {/* ── Chest phase ── */}
      {phase !== 'reveal' && (
        <button onClick={handleTap} className="relative flex flex-col items-center gap-4 active:scale-95 transition-transform">
          <div
            className={`text-[90px] leading-none select-none ${phase === 'shaking' ? 'chest-shake' : ''} ${phase === 'opening' ? 'chest-burst' : ''}`}
            style={{
              filter: phase === 'shaking'
                ? `drop-shadow(0 0 24px ${rc.glow})`
                : 'drop-shadow(0 0 12px rgba(251,191,36,0.4))',
            }}
          >
            📦
          </div>
          {phase === 'idle' && (
            <div className="font-game text-[14px] text-slate-400" style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
              Tap to open
            </div>
          )}
          {phase === 'shaking' && (
            <div className="font-game text-[14px] text-yellow-400">Opening…</div>
          )}
        </button>
      )}

      {/* ── Reveal phase ── */}
      {phase === 'reveal' && (
        <div className="flex flex-col items-center gap-4 gear-reveal">
          {/* Rarity sparkles */}
          <div className="relative">
            {/* Pulsing aura */}
            <div
              className="absolute inset-0 rounded-full rarity-aura"
              style={{
                background: `radial-gradient(circle, ${rc.glow} 0%, transparent 70%)`,
                transform: 'scale(2.5)',
              }}
            />
            {/* Sparkle ring decorations */}
            {[0, 60, 120, 180, 240, 300].map(deg => (
              <div
                key={deg}
                className="absolute w-2 h-2 rounded-full sparkle-ring"
                style={{
                  background: rc.color,
                  top: '50%', left: '50%',
                  marginTop: '-4px', marginLeft: '-4px',
                  transform: `rotate(${deg}deg) translateX(52px)`,
                  animationDelay: `${deg / 300 * 0.4}s`,
                  boxShadow: `0 0 6px ${rc.color}`,
                }}
              />
            ))}

            {/* Gear card */}
            <div
              className="relative w-44 h-52 rounded-2xl flex flex-col items-center justify-center gap-3 p-4"
              style={{
                background: `linear-gradient(145deg, ${rc.bg}, rgba(10,15,25,0.95))`,
                border: `2px solid ${rc.color}`,
                boxShadow: `0 0 40px ${rc.glow}, 0 0 80px ${rc.glow.replace('0.', '0.2')}`,
              }}
            >
              {/* Rarity badge */}
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full font-game text-[10px]"
                style={{ background: rc.color, color: '#000', fontWeight: 800, letterSpacing: '0.08em' }}
              >
                {rc.label.toUpperCase()}
              </div>

              <div className="text-[48px] leading-none">{SLOT_EMOJI[gear.slot]}</div>
              <div className="text-center">
                <div className="font-game text-[15px] text-white" style={{ fontWeight: 800 }}>{gear.name}</div>
                <div className="font-game text-[10px] text-slate-500 mt-0.5">{gear.description}</div>
              </div>
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-game text-[13px]"
                style={{ background: `${rc.color}20`, border: `1px solid ${rc.color}40`, color: rc.color, fontWeight: 700 }}
              >
                <Sparkles size={12} />
                {STAT_LABEL[gear.statType]} +{gear.statValue}%
              </div>
            </div>
          </div>

          {/* Collect button */}
          <button
            className="mt-6 px-8 py-3 rounded-xl font-game text-[14px]"
            style={{
              background: `linear-gradient(180deg, ${rc.color}, ${rc.color}99)`,
              border: `1px solid ${rc.color}60`,
              boxShadow: `0 4px 20px ${rc.glow}`,
              color: gear.rarity === 'legendary' || gear.rarity === 'epic' ? '#fff' : '#000',
              fontWeight: 800,
              letterSpacing: '0.06em',
            }}
            onClick={onCollect}
          >
            Collect — Added to Inventory
          </button>
        </div>
      )}
    </div>
  );
}

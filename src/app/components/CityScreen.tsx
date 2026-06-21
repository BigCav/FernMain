import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ChevronLeft, Clock, Plus, Minus } from 'lucide-react';

function fmtTime(secs: number): string {
  if (secs >= 3600) return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
  if (secs >= 60)   return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  return `${secs}s`;
}
function countdown(fin: number) {
  return fmtTime(Math.max(0, Math.floor((fin - Date.now()) / 1000)));
}
function timerPct(fin: number, totalMs: number) {
  return Math.min(100, Math.max(0, ((Date.now() - (fin - totalMs)) / totalMs) * 100));
}

const TROOP_EMOJI: Record<string, string> = {
  militia: '🗡️', soldiers: '⚔️', knights: '🏇', royalGuard: '👑',
};
const TIER_COLOR: Record<string, string> = {
  militia: '#94a3b8', soldiers: '#60a5fa', knights: '#a78bfa', royalGuard: '#fbbf24',
};

export function CityScreen() {
  const { buildings, troops, setActiveScreen, startBuildingUpgrade, trainTroops, resources } = useGame();
  const [tab, setTab] = useState<'buildings' | 'troops'>('buildings');
  const [trainCounts, setTrainCounts] = useState<Record<string, number>>({});

  const adjustTrain = (type: string, delta: number) => {
    setTrainCounts(p => ({ ...p, [type]: Math.max(0, (p[type] ?? 1) + delta) }));
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col screen-slide-in"
      style={{ background:'linear-gradient(160deg,#080f1c 0%,#060a14 100%)' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3"
        style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <button className="text-blue-400 active:opacity-70 p-1" onClick={() => setActiveScreen('map')}>
          <ChevronLeft size={22} />
        </button>
        <div>
          <div className="font-title text-[16px] text-white" style={{ letterSpacing:'0.04em' }}>Capital City</div>
          <div className="font-game text-[11px] text-slate-500">🪙 {resources.gold.toLocaleString()} · ⚔️ {resources.army.toLocaleString()} troops</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-3 py-2.5"
        style={{ borderBottom:'1px solid rgba(255,255,255,0.05)', background:'rgba(0,0,0,0.2)' }}>
        {(['buildings', 'troops'] as const).map(t => (
          <button key={t}
            className="flex-1 py-2 rounded-xl font-game text-[12px] capitalize transition-all"
            style={tab === t ? {
              background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.35)',
              color:'#93c5fd', fontWeight:700,
            } : {
              background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)',
              color:'#475569',
            }}
            onClick={() => setTab(t)}>
            {t === 'buildings' ? '🏰 Buildings' : '⚔️ Troops'}
          </button>
        ))}
      </div>

      {tab === 'buildings' ? (
        <div className="flex-1 overflow-y-auto game-scroll px-3 py-3">
          <div className="grid grid-cols-2 gap-2">
            {buildings.map(b => {
              const isUpgrading = !!b.upgradeFinishAt;
              const isMax = b.level >= b.maxLevel;
              const cost = b.costBase * (b.level + 1);
              const timeSecs = b.timeBase * (b.level + 1);
              const totalMs = timeSecs * 1000;
              const tPct = isUpgrading ? timerPct(b.upgradeFinishAt!, totalMs) : 0;

              return (
                <div key={b.id} className="rounded-xl p-3 flex flex-col gap-2"
                  style={{
                    background: isUpgrading ? 'rgba(52,211,153,0.06)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isUpgrading ? 'rgba(52,211,153,0.25)' : isMax ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.07)'}`,
                  }}>
                  {/* Building info */}
                  <div className="flex items-start gap-2">
                    <div className="text-[22px] leading-none">{b.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-game text-[12px] text-slate-100" style={{ fontWeight:700 }}>{b.name}</div>
                      <div className="font-game text-[9px] text-slate-500 leading-tight">{b.description}</div>
                    </div>
                  </div>

                  {/* Level pips */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5 flex-1">
                      {Array.from({ length: b.maxLevel }, (_, i) => (
                        <div key={i} className="flex-1 h-1 rounded-sm"
                          style={{ background: i < b.level ? (isMax ? '#fbbf24' : '#3b82f6') : 'rgba(255,255,255,0.08)' }} />
                      ))}
                    </div>
                    <span className="font-game text-[10px] text-slate-500">Lv.{b.level}</span>
                  </div>

                  {/* Bonus */}
                  <div className="font-game text-[10px] text-emerald-400">{b.bonus}</div>

                  {/* Timer */}
                  {isUpgrading && (
                    <div>
                      <div className="flex items-center gap-1 text-emerald-400 mb-1">
                        <Clock size={9} />
                        <span className="font-game text-[10px]">{countdown(b.upgradeFinishAt!)}</span>
                      </div>
                      <div className="h-1 rounded-full" style={{ background:'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full timer-bar" style={{ width:`${tPct}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Upgrade button */}
                  {!isUpgrading && !isMax && (
                    <button className="w-full py-1.5 rounded-lg font-game text-[11px]"
                      style={{ background:'rgba(59,130,246,0.12)', border:'1px solid rgba(59,130,246,0.25)', color:'#93c5fd', fontWeight:700 }}
                      onClick={() => startBuildingUpgrade(b.id)}>
                      🪙 {cost.toLocaleString()} · {fmtTime(timeSecs)}
                    </button>
                  )}
                  {isMax && (
                    <div className="w-full py-1 rounded-lg font-game text-[10px] text-center text-yellow-500"
                      style={{ background:'rgba(251,191,36,0.08)' }}>★ Max Level</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Troops tab */
        <div className="flex-1 overflow-y-auto game-scroll px-3 py-3 space-y-2">
          {troops.map(tier => {
            const count = trainCounts[tier.type] ?? 1;
            const total = tier.trainCost * count;
            const canAfford = resources.gold >= total;

            return (
              <div key={tier.type} className="rounded-xl p-3"
                style={{
                  background: tier.unlocked ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                  border: `1px solid ${tier.unlocked ? TIER_COLOR[tier.type] + '30' : 'rgba(255,255,255,0.04)'}`,
                  opacity: tier.unlocked ? 1 : 0.5,
                }}>
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="text-[24px]">{TROOP_EMOJI[tier.type]}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-game text-[14px] text-slate-100" style={{ fontWeight:700 }}>{tier.name}</span>
                      {!tier.unlocked && (
                        <span className="font-game text-[9px] px-1.5 py-0.5 rounded"
                          style={{ background:'rgba(239,68,68,0.12)', color:'#f87171' }}>LOCKED</span>
                      )}
                    </div>
                    <div className="font-game text-[11px] text-slate-400">
                      ⚔️ ATK {tier.attack} · 🛡️ DEF {tier.defense} · 🪙 {tier.trainCost} each
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-game text-[15px]" style={{ color: TIER_COLOR[tier.type], fontWeight:700 }}>{tier.count.toLocaleString()}</div>
                    <div className="font-game text-[9px] text-slate-600">in army</div>
                  </div>
                </div>

                {tier.unlocked && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-black/30 rounded-lg px-2 py-1.5" style={{ border:'1px solid rgba(255,255,255,0.07)' }}>
                      <button onClick={() => adjustTrain(tier.type, -1)} className="text-slate-400 active:text-white">
                        <Minus size={12} />
                      </button>
                      <span className="font-game text-[13px] text-white w-8 text-center" style={{ fontWeight:700 }}>{count}</span>
                      <button onClick={() => adjustTrain(tier.type, 1)} className="text-slate-400 active:text-white">
                        <Plus size={12} />
                      </button>
                    </div>
                    <button className="flex-1 py-2 rounded-xl font-game text-[12px]"
                      style={{
                        background: canAfford ? `${TIER_COLOR[tier.type]}18` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${canAfford ? TIER_COLOR[tier.type] + '40' : 'rgba(255,255,255,0.06)'}`,
                        color: canAfford ? TIER_COLOR[tier.type] : '#334155', fontWeight: 700,
                      }}
                      onClick={() => tier.unlocked && trainTroops(tier.type, count)}>
                      Train · 🪙 {total.toLocaleString()}
                    </button>
                  </div>
                )}

                {!tier.unlocked && (
                  <div className="font-game text-[10px] text-slate-600 text-center py-1">
                    Unlock at Barracks Lv.5
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

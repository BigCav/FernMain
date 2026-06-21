import { useState, useEffect } from 'react';
import { useGame, isAdjacent, STRONGHOLD_CONFIG, STRONGHOLD_MAX } from '../context/GameContext';
import { Swords, Shield, X, ArrowRight, Users, MapPin, Hammer, TrendingUp, Lock } from 'lucide-react';

const OWNER_LABELS: Record<string, { name: string; color: string }> = {
  player:       { name: 'Your Kingdom',   color: '#60a5fa' },
  enemy_red:    { name: 'Crimson Realm',  color: '#f87171' },
  enemy_purple: { name: 'Shadow Hold',    color: '#c084fc' },
  enemy_gold:   { name: 'Gilded Empire',  color: '#fcd34d' },
  neutral:      { name: 'Uncharted',      color: '#64748b' },
};
const TYPE_LABELS: Record<string, string> = {
  plain: 'Plains', forest: 'Forest', mountain: 'Mountain', city: 'City', water: 'Water',
};
const TYPE_BONUS: Record<string, string | null> = {
  plain: null, forest: '+20% DEF', mountain: '+35% DEF', city: '+150 Gold/h', water: null,
};

// ─── Build countdown hook ─────────────────────────────────────────────────────
function useBuildCountdown(finishAt: number | undefined) {
  const [secs, setSecs] = useState(() =>
    finishAt ? Math.max(0, Math.ceil((finishAt - Date.now()) / 1000)) : 0
  );
  useEffect(() => {
    if (!finishAt) { setSecs(0); return; }
    const update = () => setSecs(Math.max(0, Math.ceil((finishAt - Date.now()) / 1000)));
    update();
    const t = setInterval(update, 500);
    return () => clearInterval(t);
  }, [finishAt]);
  return secs;
}

function fmtSecs(s: number) {
  if (s >= 60) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${s}s`;
}

// ─── Stronghold Section ───────────────────────────────────────────────────────
function StrongholdSection({ hexId }: { hexId: string }) {
  const { hexes, resources, buildOrUpgradeStronghold } = useGame();
  const hex = hexes.find(h => h.id === hexId);
  if (!hex || hex.owner !== 'player' || hex.type === 'water') return null;

  const level      = hex.strongholdLevel;
  const building   = hex.strongholdBuilding;
  const isMax      = level >= STRONGHOLD_MAX;
  const nextLevel  = level + 1;
  const cfg        = STRONGHOLD_CONFIG[level];       // current
  const nextCfg    = STRONGHOLD_CONFIG[nextLevel];   // next (undefined if max)
  const countdown  = useBuildCountdown(building);
  const canAfford  = nextCfg && resources.gold >= nextCfg.cost;

  return (
    <div className="mx-3 mb-3 rounded-xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Section header */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-1.5">
          <span className="text-[12px]">🏯</span>
          <span className="font-game text-[11px] text-slate-400" style={{ fontWeight: 700 }}>
            Stronghold
          </span>
          {level > 0 && (
            <span className="font-game text-[10px] px-1.5 py-0.5 rounded"
              style={{ background: `${cfg.color}25`, color: cfg.color, border: `1px solid ${cfg.color}40`, fontWeight: 700 }}>
              {cfg.name}
            </span>
          )}
        </div>
        {level > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="font-game text-[10px] text-slate-500">DEF</span>
            <span className="font-game text-[12px]" style={{ color: cfg.color, fontWeight: 700 }}>+{cfg.def}%</span>
            {cfg.visionBonus > 0 && (
              <>
                <span className="font-game text-[10px] text-slate-500 ml-1">👁</span>
                <span className="font-game text-[11px] text-blue-400">+{cfg.visionBonus}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Level pips */}
      {!building && (
        <div className="flex gap-1 px-3 pt-2">
          {Array.from({ length: STRONGHOLD_MAX }, (_, i) => {
            const lc = STRONGHOLD_CONFIG[i + 1];
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full h-1.5 rounded-full"
                  style={{ background: i < level ? lc.color : 'rgba(255,255,255,0.07)', boxShadow: i < level ? `0 0 4px ${lc.color}66` : 'none' }} />
                <span className="font-game text-[8px]" style={{ color: i < level ? lc.color : '#334155' }}>
                  {lc.name.slice(0, 3).toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Action area */}
      <div className="px-3 pb-3 pt-2">
        {/* Currently building */}
        {building && countdown > 0 && (
          <div className="flex items-center gap-2 py-2 rounded-xl px-3"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)' }}>
            <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent flex-shrink-0"
              style={{ animation: 'spin 1s linear infinite' }} />
            <div className="flex-1">
              <div className="font-game text-[11px] text-blue-400" style={{ fontWeight: 700 }}>
                Building {STRONGHOLD_CONFIG[nextLevel > STRONGHOLD_MAX ? STRONGHOLD_MAX : nextLevel]?.name}…
              </div>
              <div className="font-game text-[10px] text-slate-500">{fmtSecs(countdown)} remaining</div>
            </div>
            <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div className="h-full rounded-full timer-bar transition-all"
                style={{ width: `${Math.max(0, (1 - countdown / (nextCfg?.time ?? 1)) * 100)}%` }} />
            </div>
          </div>
        )}

        {/* Build/upgrade button */}
        {!building && !isMax && nextCfg && (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="font-game text-[10px] text-slate-500 mb-0.5">
                → <span style={{ color: nextCfg.color }}>{nextCfg.name}</span>
                <span className="text-slate-600"> · DEF +{nextCfg.def}% · 👁 +{nextCfg.visionBonus} · ⏱ {fmtSecs(nextCfg.time)}</span>
              </div>
            </div>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-game text-[12px] transition-all active:scale-95"
              style={canAfford ? {
                background: `linear-gradient(135deg, ${nextCfg.color}25, ${nextCfg.color}10)`,
                border: `1px solid ${nextCfg.color}50`,
                color: nextCfg.color,
                fontWeight: 700,
              } : {
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#334155',
              }}
              onClick={() => buildOrUpgradeStronghold(hexId)}
              disabled={!canAfford}>
              {canAfford ? <Hammer size={11} /> : <Lock size={11} />}
              {canAfford ? `${nextCfg.cost.toLocaleString()}🪙` : `Need ${nextCfg.cost.toLocaleString()}🪙`}
            </button>
          </div>
        )}

        {/* Max level message */}
        {isMax && !building && (
          <div className="flex items-center gap-2 font-game text-[11px]"
            style={{ color: STRONGHOLD_CONFIG[STRONGHOLD_MAX].color }}>
            <TrendingUp size={12} />
            <span style={{ fontWeight: 700 }}>Citadel — Maximum level reached</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── HexPanel ─────────────────────────────────────────────────────────────────
export function HexPanel() {
  const {
    hexes, selectedHexId, attackSourceId, selectHex,
    setAttackSource, initiateAttack, initiateReinforce,
  } = useGame();

  const hex    = selectedHexId  ? hexes.find(h => h.id === selectedHexId)  : null;
  const srcHex = attackSourceId ? hexes.find(h => h.id === attackSourceId) : null;
  if (!hex) return null;

  const ownerInfo = OWNER_LABELS[hex.owner] ?? OWNER_LABELS.neutral;
  const isOwn     = hex.owner === 'player';
  const isHostile = hex.owner !== 'player';
  const adjacent  = srcHex ? isAdjacent(srcHex.col, srcHex.row, hex.col, hex.row) : false;
  const isSource  = hex.id === attackSourceId;
  const bonus     = TYPE_BONUS[hex.type];
  const sendTroops = srcHex ? Math.max(1, Math.floor(srcHex.troops * 0.65)) : 0;
  const shLevel   = hex.strongholdLevel;
  const shDef     = [0, 10, 20, 35, 55][shLevel] ?? 0;

  function handleAttack() {
    if (!srcHex || !adjacent) return;
    initiateAttack(srcHex.id, hex!.id);
    selectHex(hex!.id);
  }
  function handleReinforce() {
    if (!srcHex || !adjacent) return;
    const t = Math.max(1, Math.floor(srcHex.troops * 0.4));
    initiateReinforce(srcHex.id, hex!.id, t);
    selectHex(null);
  }

  return (
    <div className="flex-shrink-0 mx-2 mb-2 rounded-2xl overflow-hidden panel-slide-up"
      style={{
        background: 'linear-gradient(160deg,#0e1b2d 0%,#09111d 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.55)',
      }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: ownerInfo.color, boxShadow: `0 0 5px ${ownerInfo.color}` }} />
          <span className="font-game text-[13px] text-slate-100" style={{ fontWeight: 700 }}>
            {hex.isCapital ? '★ Capital' : hex.isCity ? '⬡ City' : TYPE_LABELS[hex.type]}
          </span>
          <span className="font-game text-[11px]" style={{ color: ownerInfo.color }}>
            {ownerInfo.name}
          </span>
        </div>
        <button className="text-slate-500 active:text-slate-300 -mr-1 p-1"
          onClick={() => { selectHex(null); setAttackSource(null); }}>
          <X size={15} />
        </button>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 px-4 py-2">
        <div className="flex items-center gap-1.5">
          <Users size={11} className="text-slate-500" />
          <span className="font-game text-[12px] text-slate-300">
            <span className="text-white" style={{ fontWeight: 700 }}>{hex.troops.toLocaleString()}</span> troops
          </span>
        </div>
        {bonus && (
          <>
            <div className="w-px h-3 bg-slate-700" />
            <span className="font-game text-[11px] text-emerald-400">{bonus}</span>
          </>
        )}
        {shLevel > 0 && (
          <>
            <div className="w-px h-3 bg-slate-700" />
            <span className="font-game text-[11px]" style={{ color: STRONGHOLD_CONFIG[shLevel].color }}>
              🏯 {STRONGHOLD_CONFIG[shLevel].name} +{shDef}% DEF
            </span>
          </>
        )}
        <div className="w-px h-3 bg-slate-700 ml-auto" />
        <div className="flex items-center gap-1 text-slate-600">
          <MapPin size={10} />
          <span className="font-game text-[10px]">{hex.col},{hex.row}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-3 pb-3">
        {isOwn && !isSource && (
          <button className="flex-1 py-2.5 rounded-xl btn-primary flex items-center justify-center gap-1.5 text-[13px]"
            onClick={() => setAttackSource(hex.id)}>
            <Swords size={13} /> Set March Source
          </button>
        )}
        {isSource && (
          <div className="flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 text-[12px] font-game"
            style={{ background:'rgba(251,191,36,0.1)', border:'1px solid rgba(251,191,36,0.22)', color:'#fbbf24', fontWeight:700 }}>
            ⚡ March Source set — tap a target
          </div>
        )}
        {isOwn && !isSource && srcHex && adjacent && (
          <button className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-[13px]"
            style={{ background:'linear-gradient(180deg,#059669,#065f46)', border:'1px solid rgba(52,211,153,0.3)', color:'#fff', fontFamily:'Rajdhani,sans-serif', fontWeight:700 }}
            onClick={handleReinforce}>
            <Shield size={13} /> Reinforce
          </button>
        )}
        {isHostile && srcHex && adjacent && (
          <button className="flex-1 py-2.5 rounded-xl btn-danger flex items-center justify-center gap-1.5 text-[13px]"
            onClick={handleAttack}>
            <Swords size={13} /> Attack ({sendTroops})
            <ArrowRight size={11} />
          </button>
        )}
        {isHostile && !srcHex && (
          <div className="flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 text-[12px] font-game"
            style={{ background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.14)', color:'#f87171' }}>
            <Swords size={12} /> Select your tile first
          </div>
        )}
        {isHostile && srcHex && !adjacent && (
          <div className="flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 text-[12px] font-game"
            style={{ background:'rgba(100,116,139,0.08)', border:'1px solid rgba(100,116,139,0.14)', color:'#64748b' }}>
            Not adjacent to march source
          </div>
        )}
      </div>

      {/* Stronghold build section — only for owned non-water tiles */}
      {isOwn && hex.type !== 'water' && (
        <StrongholdSection hexId={hex.id} />
      )}
    </div>
  );
}

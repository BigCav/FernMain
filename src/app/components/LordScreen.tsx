import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ChevronLeft, Swords, Shield, TrendingUp, CheckCircle, Plus, Lock } from 'lucide-react';
import { ChestOpenModal } from './ChestOpenModal';
import type { GearSlot, GearRarity, GearItem } from '../types/game';

// ─── Constants ────────────────────────────────────────────────────────────────
const RARITY_COLOR: Record<GearRarity, string> = {
  common: '#94a3b8', rare: '#3b82f6', epic: '#a855f7', legendary: '#f59e0b',
};
const RARITY_LABEL: Record<GearRarity, string> = {
  common: 'Common', rare: 'Rare', epic: 'Epic', legendary: 'Legendary',
};
const SLOT_INFO: Record<GearSlot, { label: string; emoji: string }> = {
  weapon: { label: 'Weapon', emoji: '⚔️' },
  helmet: { label: 'Helmet', emoji: '⛑️' },
  armor:  { label: 'Armor',  emoji: '🛡️' },
  shield: { label: 'Shield', emoji: '🏰' },
  ring:   { label: 'Ring',   emoji: '💍' },
  boots:  { label: 'Boots',  emoji: '👟' },
};
const STAT_LABEL: Record<string, string> = {
  atk: '⚔️ ATK', def: '🛡️ DEF', hp: '❤️ HP', income: '🪙 Income', power: '⚡ Power',
};
const SLOTS: GearSlot[] = ['weapon', 'helmet', 'armor', 'shield', 'ring', 'boots'];
type Tab = 'stats' | 'skills' | 'gear';

// ─── Stats Tab ─────────────────────────────────────────────────────────────────
function StatsTab() {
  const { lord: l } = useGame();
  const xpPct = Math.round((l.xp / l.xpNeeded) * 100);

  const gearAtk    = Object.values(l.equippedGear).reduce((s, g) => s + (g?.statType === 'atk'    ? (g?.statValue ?? 0) : 0), 0);
  const gearDef    = Object.values(l.equippedGear).reduce((s, g) => s + (g?.statType === 'def'    ? (g?.statValue ?? 0) : 0), 0);
  const gearIncome = Object.values(l.equippedGear).reduce((s, g) => s + (g?.statType === 'income' ? (g?.statValue ?? 0) : 0), 0);

  const bonuses = [
    { label: 'Attack',  Icon: Swords,     base: l.attackBonus,  gear: gearAtk,    color: '#f87171', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)'  },
    { label: 'Defense', Icon: Shield,     base: l.defenseBonus, gear: gearDef,    color: '#60a5fa', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
    { label: 'Income',  Icon: TrendingUp, base: l.incomeBonus,  gear: gearIncome, color: '#4ade80', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)'  },
  ];

  const achievements = [
    { emoji: '🏆', label: 'Conqueror', sub: '100 tiles',  done: true  },
    { emoji: '⚔️', label: 'Warlord',   sub: '50 battles', done: true  },
    { emoji: '🌿', label: 'Farmer',    sub: '10K food',   done: false },
    { emoji: '💎', label: 'Gem Lord',  sub: '1K gems',    done: false },
    { emoji: '👥', label: 'Diplomat',  sub: 'Join ally',  done: true  },
  ];

  return (
    <div className="flex-1 overflow-y-auto game-scroll pb-4">
      {/* Portrait + XP */}
      <div className="flex items-center gap-4 px-4 py-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
            style={{ background:'linear-gradient(135deg,#1e3a5f,#0d1f3a)', border:'2px solid rgba(59,130,246,0.45)', boxShadow:'0 0 20px rgba(59,130,246,0.18)' }}>
            👑
          </div>
          <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-[12px]"
            style={{ background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', border:'1.5px solid rgba(96,165,250,0.5)', fontFamily:'Rajdhani,sans-serif', fontWeight:700, color:'#fff' }}>
            {l.level}
          </div>
        </div>
        <div className="flex-1">
          <div className="font-title text-[18px] text-white mb-0.5">{l.name}</div>
          <div className="font-game text-[12px] text-blue-400 mb-2.5" style={{ fontWeight:600 }}>{l.title}</div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.06)' }}>
              <div className="h-full xp-bar rounded-full transition-all" style={{ width:`${xpPct}%`, boxShadow:'0 0 8px rgba(99,102,241,0.6)' }} />
            </div>
            <span className="font-game text-[10px] text-slate-500 flex-shrink-0">{xpPct}%</span>
          </div>
          <div className="font-game text-[10px] text-indigo-400">{(l.xpNeeded - l.xp).toLocaleString()} XP → Lv.{l.level + 1}</div>
        </div>
      </div>

      {/* Bonuses grid */}
      <div className="px-4 mb-4">
        <div className="font-game text-[11px] text-slate-500 mb-2" style={{ letterSpacing:'0.08em', textTransform:'uppercase' }}>Active Bonuses</div>
        <div className="grid grid-cols-3 gap-2">
          {bonuses.map(({ label, Icon, base, gear, color, bg, border }) => (
            <div key={label} className="rounded-xl p-3 text-center" style={{ background:bg, border:`1px solid ${border}` }}>
              <Icon size={16} style={{ color, margin:'0 auto 4px' }} />
              <div className="font-game text-[14px]" style={{ color, fontWeight:700 }}>+{base + gear}%</div>
              {gear > 0 && <div className="font-game text-[9px]" style={{ color:'rgba(255,255,255,0.38)' }}>({base} + {gear}⚙)</div>}
              <div className="font-game text-[9px] text-slate-500 mt-0.5 leading-tight">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="px-4">
        <div className="font-game text-[11px] text-slate-500 mb-2" style={{ letterSpacing:'0.08em', textTransform:'uppercase' }}>Achievements</div>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth:'none' }}>
          {achievements.map(a => (
            <div key={a.label} className="flex-shrink-0 w-[72px] rounded-xl p-2.5 text-center relative"
              style={{ background:a.done?'rgba(251,191,36,0.08)':'rgba(255,255,255,0.03)', border:`1px solid ${a.done?'rgba(251,191,36,0.22)':'rgba(255,255,255,0.06)'}` }}>
              {a.done && <CheckCircle size={10} className="absolute top-1.5 right-1.5 text-emerald-400" />}
              <div className="text-[20px] mb-1">{a.emoji}</div>
              <div className="font-game text-[10px] leading-tight" style={{ color:a.done?'#fbbf24':'#475569', fontWeight:700 }}>{a.label}</div>
              <div className="font-game text-[9px] text-slate-600">{a.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Skills Tab ────────────────────────────────────────────────────────────────
function SkillsTab() {
  const { lord: l, upgradeSkill } = useGame();
  return (
    <div className="flex-1 overflow-y-auto game-scroll pb-4">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="font-game text-[11px] text-slate-500" style={{ letterSpacing:'0.08em', textTransform:'uppercase' }}>Hero Skills</div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full"
          style={{ background:l.skillPoints > 0 ?'rgba(251,191,36,0.15)':'rgba(255,255,255,0.05)', border:`1px solid ${l.skillPoints > 0 ?'rgba(251,191,36,0.35)':'rgba(255,255,255,0.08)'}` }}>
          <span className="font-game text-[12px]" style={{ color:l.skillPoints > 0 ?'#fbbf24':'#475569', fontWeight:700 }}>
            {l.skillPoints} {l.skillPoints === 1 ? 'point' : 'points'} available
          </span>
        </div>
      </div>

      {l.skillPoints === 0 && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-xl font-game text-[11px] text-slate-600 text-center"
          style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)' }}>
          Capture tiles or level up to earn skill points
        </div>
      )}

      <div className="px-4 space-y-3">
        {l.skills.map(skill => {
          const pct       = (skill.level / skill.maxLevel) * 100;
          const isMax     = skill.level >= skill.maxLevel;
          const canUpgrade = l.skillPoints > 0 && !isMax;
          const totalBonus = skill.level * skill.statPerLevel;
          return (
            <div key={skill.id} className="rounded-xl p-4"
              style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${isMax ? skill.color + '30' : 'rgba(255,255,255,0.07)'}` }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-game text-[14px] text-slate-100" style={{ fontWeight:700 }}>{skill.name}</span>
                    {isMax && <CheckCircle size={12} style={{ color:skill.color }} />}
                  </div>
                  <div className="font-game text-[10px] text-slate-500">{skill.description}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-center">
                    <div className="font-game text-[13px]" style={{ color:skill.color, fontWeight:700 }}>{skill.level}/{skill.maxLevel}</div>
                    {totalBonus > 0 && <div className="font-game text-[9px] text-slate-500">+{totalBonus}% now</div>}
                  </div>
                  <button
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90"
                    style={canUpgrade ? {
                      background:`linear-gradient(135deg,${skill.color}40,${skill.color}20)`,
                      border:`1.5px solid ${skill.color}60`, color:skill.color,
                      boxShadow:`0 0 10px ${skill.color}30`,
                    } : { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#334155' }}
                    onClick={() => canUpgrade && upgradeSkill(skill.id)}
                    disabled={!canUpgrade}
                  >
                    {isMax ? <CheckCircle size={14} /> : <Plus size={15} />}
                  </button>
                </div>
              </div>
              {/* Pips */}
              <div className="flex gap-1 mb-2">
                {Array.from({ length: skill.maxLevel }, (_, i) => (
                  <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
                    style={{ background:i < skill.level ? skill.color:'rgba(255,255,255,0.07)', boxShadow:i < skill.level ? `0 0 4px ${skill.color}80`:'none' }} />
                ))}
              </div>
              <div className="h-1 rounded-full" style={{ background:'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all" style={{ width:`${pct}%`, background:skill.color, boxShadow:`0 0 6px ${skill.color}66` }} />
              </div>
              {!isMax && canUpgrade && (
                <div className="mt-2 font-game text-[10px]" style={{ color:skill.color + 'aa' }}>
                  → Upgrade for +{skill.statPerLevel}% {skill.statType.toUpperCase()}
                </div>
              )}
              {!isMax && !canUpgrade && (
                <div className="mt-2 flex items-center gap-1 font-game text-[10px] text-slate-600">
                  <Lock size={9} /> Earn more skill points to upgrade
                </div>
              )}
              {isMax && <div className="mt-2 font-game text-[10px] text-slate-600">★ Maximum level reached</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Gear Tab ─────────────────────────────────────────────────────────────────
function GearSlotCard({ slot, item, onUnequip }: { slot: GearSlot; item?: GearItem; onUnequip: () => void }) {
  const { label, emoji } = SLOT_INFO[slot];
  if (!item) {
    return (
      <div className="rounded-xl p-2.5 flex flex-col items-center gap-1.5" style={{ background:'rgba(255,255,255,0.03)', border:'1px dashed rgba(255,255,255,0.09)', minHeight:76 }}>
        <div className="text-[20px] opacity-25">{emoji}</div>
        <div className="font-game text-[9px] text-slate-700">{label}</div>
        <div className="font-game text-[8px] text-slate-800">Empty</div>
      </div>
    );
  }
  const rc = RARITY_COLOR[item.rarity];
  return (
    <button className="rounded-xl p-2.5 flex flex-col items-center gap-1 active:scale-95 transition-transform text-center"
      style={{ background:`${rc}10`, border:`1.5px solid ${rc}40`, minHeight:76 }}
      onClick={onUnequip}>
      <div className="text-[20px]">{emoji}</div>
      <div className="font-game text-[9px] leading-tight" style={{ color:rc, fontWeight:700 }}>
        {item.name.length > 11 ? item.name.slice(0,10) + '…' : item.name}
      </div>
      <div className="font-game text-[8px]" style={{ color:rc + 'aa' }}>+{item.statValue}% {item.statType.toUpperCase()}</div>
    </button>
  );
}

function InventoryCard({ item, onEquip }: { item: GearItem; onEquip: () => void }) {
  const rc = RARITY_COLOR[item.rarity];
  const { emoji } = SLOT_INFO[item.slot];
  return (
    <button className="flex-shrink-0 w-24 rounded-xl p-2.5 flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
      style={{ background:`${rc}0e`, border:`1.5px solid ${rc}35` }}
      onClick={onEquip}>
      <div className="relative">
        <div className="text-[24px]">{emoji}</div>
        <div className="absolute -bottom-1 -right-2 text-[8px] px-1 rounded font-game"
          style={{ background:rc, color:'#000', fontWeight:800 }}>
          {RARITY_LABEL[item.rarity].slice(0,3).toUpperCase()}
        </div>
      </div>
      <div className="font-game text-[9px] text-center leading-tight text-slate-200" style={{ fontWeight:700 }}>
        {item.name.length > 10 ? item.name.slice(0,9) + '…' : item.name}
      </div>
      <div className="font-game text-[8px]" style={{ color:rc }}>+{item.statValue}% {item.statType.toUpperCase()}</div>
    </button>
  );
}

function GearTab({ onOpenChest }: { onOpenChest: () => void }) {
  const { lord: l, equipGear, unequipGear } = useGame();
  const [selectedItem, setSelectedItem] = useState<GearItem | null>(null);

  return (
    <div className="flex-1 overflow-y-auto game-scroll pb-4">
      {/* Chests */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="font-game text-[11px] text-slate-500" style={{ letterSpacing:'0.08em', textTransform:'uppercase' }}>Chests</div>
          <span className="font-game text-[11px] text-amber-400">{l.chests} available</span>
        </div>
        {l.chests > 0 ? (
          <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl btn-gold text-[14px]"
            onClick={onOpenChest}>
            <span className="text-[18px]">📦</span> Open Legendary Chest
          </button>
        ) : (
          <div className="py-3 rounded-xl font-game text-[13px] text-center text-slate-600"
            style={{ background:'rgba(255,255,255,0.03)', border:'1px dashed rgba(255,255,255,0.07)' }}>
            No chests — capture tiles to earn more
          </div>
        )}
      </div>

      {/* Equipped */}
      <div className="px-4 mb-3">
        <div className="font-game text-[11px] text-slate-500 mb-2" style={{ letterSpacing:'0.08em', textTransform:'uppercase' }}>Equipped</div>
        <div className="grid grid-cols-3 gap-2">
          {SLOTS.map(slot => (
            <GearSlotCard key={slot} slot={slot} item={l.equippedGear[slot]} onUnequip={() => unequipGear(slot)} />
          ))}
        </div>
        <div className="font-game text-[9px] text-slate-700 text-center mt-2">Tap equipped item to unequip</div>
      </div>

      {/* Inventory */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-game text-[11px] text-slate-500" style={{ letterSpacing:'0.08em', textTransform:'uppercase' }}>Inventory</div>
          <span className="font-game text-[11px] text-slate-600">{l.inventory.length} items</span>
        </div>
        {l.inventory.length === 0 ? (
          <div className="py-6 rounded-xl text-center font-game text-[12px] text-slate-700"
            style={{ background:'rgba(255,255,255,0.02)', border:'1px dashed rgba(255,255,255,0.06)' }}>
            Open chests to collect gear
          </div>
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth:'none' }}>
              {l.inventory.map(item => (
                <InventoryCard key={item.id} item={item} onEquip={() => setSelectedItem(item)} />
              ))}
            </div>
            {/* Item detail */}
            {selectedItem && (
              <div className="mt-3 rounded-xl p-3"
                style={{ background:`${RARITY_COLOR[selectedItem.rarity]}10`, border:`1px solid ${RARITY_COLOR[selectedItem.rarity]}35` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[18px]">{SLOT_INFO[selectedItem.slot].emoji}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-game text-[13px] text-white" style={{ fontWeight:700 }}>{selectedItem.name}</span>
                        <span className="font-game text-[8px] px-1.5 py-0.5 rounded" style={{ background:RARITY_COLOR[selectedItem.rarity], color:'#000', fontWeight:800 }}>
                          {RARITY_LABEL[selectedItem.rarity].slice(0,3).toUpperCase()}
                        </span>
                      </div>
                      <div className="font-game text-[10px] text-slate-500">{selectedItem.description}</div>
                    </div>
                  </div>
                  <button className="text-slate-600 active:text-white p-1" onClick={() => setSelectedItem(null)}>✕</button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 font-game text-[12px]" style={{ color:RARITY_COLOR[selectedItem.rarity], fontWeight:700 }}>
                    {STAT_LABEL[selectedItem.statType]} +{selectedItem.statValue}%
                  </div>
                  <button className="px-4 py-2 rounded-xl font-game text-[12px]"
                    style={{ background:RARITY_COLOR[selectedItem.rarity], color:'#000', fontWeight:800 }}
                    onClick={() => { equipGear(selectedItem.id); setSelectedItem(null); }}>
                    Equip
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main LordScreen ──────────────────────────────────────────────────────────
export function LordScreen() {
  const { lord: l, setActiveScreen, openChest, pendingChestGear, clearPendingChestGear } = useGame();
  const [tab, setTab] = useState<Tab>('stats');

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: 'stats',  label: 'Hero'   },
    { id: 'skills', label: 'Skills', badge: l.skillPoints > 0 ? l.skillPoints : undefined },
    { id: 'gear',   label: 'Gear',   badge: l.chests > 0 ? l.chests : undefined },
  ];

  const handleOpenChest = () => {
    openChest();
    // Switch to gear tab to see the modal
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col screen-slide-in"
      style={{ background:'linear-gradient(160deg,#080f1c 0%,#060a14 100%)' }}>

      {/* Chest modal — rendered at root level of LordScreen so it's above overflow container */}
      {pendingChestGear && (
        <ChestOpenModal gear={pendingChestGear} onCollect={clearPendingChestGear} />
      )}

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3"
        style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <button className="text-blue-400 active:opacity-70 p-1" onClick={() => setActiveScreen('map')}>
          <ChevronLeft size={22} />
        </button>
        <div className="flex-1">
          <div className="font-title text-[16px] text-white" style={{ letterSpacing:'0.04em' }}>Lord</div>
          <div className="font-game text-[11px] text-slate-500">{l.title} · Lv.{l.level} · {l.name}</div>
        </div>
        {l.skillPoints > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full"
            style={{ background:'rgba(251,191,36,0.15)', border:'1px solid rgba(251,191,36,0.3)' }}>
            <span className="text-[10px]">⚡</span>
            <span className="font-game text-[11px] text-yellow-400" style={{ fontWeight:700 }}>{l.skillPoints} pts</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-4 py-2.5"
        style={{ borderBottom:'1px solid rgba(255,255,255,0.05)', background:'rgba(0,0,0,0.2)' }}>
        {TABS.map(t => (
          <button key={t.id}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-game text-[12px] transition-all relative"
            style={tab === t.id ? {
              background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.35)', color:'#93c5fd', fontWeight:700,
            } : {
              background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', color:'#475569',
            }}
            onClick={() => setTab(t.id)}>
            {t.label}
            {t.badge !== undefined && (
              <div className="absolute -top-1.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-game"
                style={{ background:'#f59e0b', color:'#000', fontWeight:800 }}>
                {t.badge}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'stats'  && <StatsTab />}
      {tab === 'skills' && <SkillsTab />}
      {tab === 'gear'   && <GearTab onOpenChest={handleOpenChest} />}
    </div>
  );
}

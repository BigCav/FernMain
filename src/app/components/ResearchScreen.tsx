import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ChevronLeft, Clock, CheckCircle, Lock } from 'lucide-react';
import type { ResearchBranch, ResearchNode } from '../types/game';

function fmtTime(secs: number): string {
  if (secs >= 3600) return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
  return `${secs}s`;
}
function countdown(finishAt: number): string {
  const rem = Math.max(0, Math.floor((finishAt - Date.now()) / 1000));
  return fmtTime(rem);
}
function pct(finishAt: number, totalMs: number): number {
  const elapsed = Date.now() - (finishAt - totalMs);
  return Math.min(100, Math.max(0, (elapsed / totalMs) * 100));
}

function NodeCard({ node, branchId, branchColor, onStart }: {
  node: ResearchNode; branchId: string; branchColor: string;
  onStart: () => void;
}) {
  const isActive = !!node.activeUntil;
  const isMax    = node.level >= node.maxLevel;
  const cost     = node.costBase * (node.level + 1);
  const timeSecs = node.timeBase * (node.level + 1);
  const totalMs  = timeSecs * 1000;
  const timerPct = isActive ? pct(node.activeUntil!, totalMs) : 0;

  return (
    <div className="rounded-xl p-3"
      style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${isActive ? branchColor + '44' : isMax ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)'}` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-game text-[13px] text-slate-100" style={{ fontWeight: 700 }}>{node.name}</span>
            {isMax && <CheckCircle size={12} style={{ color: branchColor, flexShrink: 0 }} />}
          </div>
          <div className="font-game text-[10px] text-slate-500">{node.description}</div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {/* Level pips */}
          <div className="flex gap-0.5">
            {Array.from({ length: node.maxLevel }, (_, i) => (
              <div key={i} className="w-3 h-1.5 rounded-sm"
                style={{ background: i < node.level ? branchColor : 'rgba(255,255,255,0.1)' }} />
            ))}
          </div>
          <span className="font-game text-[10px]" style={{ color: branchColor }}>
            {node.bonus}
          </span>
        </div>
      </div>

      {/* Active timer */}
      {isActive && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1 text-emerald-400">
              <Clock size={10} />
              <span className="font-game text-[10px]">{countdown(node.activeUntil!)}</span>
            </div>
            <span className="font-game text-[10px] text-slate-500">Upgrading Lv.{node.level + 1}</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background:'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full timer-bar transition-all"
              style={{ width:`${timerPct}%` }} />
          </div>
        </div>
      )}

      {/* Upgrade button */}
      {!isActive && !isMax && (
        <button className="w-full mt-2 py-1.5 rounded-lg font-game text-[12px] flex items-center justify-center gap-1.5"
          style={{ background:`${branchColor}18`, border:`1px solid ${branchColor}33`, color: branchColor, fontWeight: 700 }}
          onClick={onStart}>
          🪙 {cost.toLocaleString()} · {fmtTime(timeSecs)}
        </button>
      )}
      {isMax && (
        <div className="w-full mt-2 py-1.5 rounded-lg font-game text-[11px] text-center text-slate-600"
          style={{ background:'rgba(255,255,255,0.02)' }}>
          Max Level
        </div>
      )}
    </div>
  );
}

export function ResearchScreen() {
  const { researchBranches, setActiveScreen, startResearch, resources } = useGame();
  const [activeTab, setActiveTab] = useState(researchBranches[0].id);

  const branch = researchBranches.find(b => b.id === activeTab)!;

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
          <div className="font-title text-[16px] text-white" style={{ letterSpacing:'0.04em' }}>Research</div>
          <div className="font-game text-[11px] text-slate-500">🪙 {resources.gold.toLocaleString()} available</div>
        </div>
      </div>

      {/* Branch tabs */}
      <div className="flex gap-2 px-3 py-2.5"
        style={{ borderBottom:'1px solid rgba(255,255,255,0.05)', background:'rgba(0,0,0,0.2)' }}>
        {researchBranches.map(b => {
          const active = b.id === activeTab;
          const activeNodes = b.nodes.filter(n => n.activeUntil).length;
          return (
            <button key={b.id}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-game text-[12px] transition-all"
              style={active ? {
                background: `${b.color}20`, border:`1px solid ${b.color}50`,
                color: b.color, fontWeight: 700,
              } : {
                background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)',
                color: '#475569',
              }}
              onClick={() => setActiveTab(b.id)}>
              <span>{b.icon}</span>
              {b.name}
              {activeNodes > 0 && (
                <div className="w-4 h-4 rounded-full flex items-center justify-center text-[9px]"
                  style={{ background: b.color, color:'#000', fontWeight:700 }}>
                  {activeNodes}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Nodes */}
      <div className="flex-1 overflow-y-auto game-scroll px-3 py-3 space-y-2">
        {branch.nodes.map((node, i) => {
          const prevUnlocked = i === 0 || branch.nodes[i - 1].level > 0;
          return (
            <div key={node.id} className="relative">
              {!prevUnlocked && (
                <div className="absolute inset-0 z-10 rounded-xl flex items-center justify-center"
                  style={{ background:'rgba(0,0,0,0.6)', backdropFilter:'blur(2px)' }}>
                  <Lock size={14} className="text-slate-600" />
                </div>
              )}
              <NodeCard
                node={node} branchId={branch.id} branchColor={branch.color}
                onStart={() => startResearch(branch.id, node.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

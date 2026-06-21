import { useGame } from '../context/GameContext';
import { ChevronLeft, Users, Zap, Crown, Circle, Swords, Clock } from 'lucide-react';

const RANK_COLOR: Record<string, string> = {
  R5: '#fbbf24', R4: '#f87171', R3: '#c084fc', R2: '#60a5fa', R1: '#64748b',
};

function fmtPower(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'K';
  return String(n);
}

export function AllianceScreen() {
  const { alliance, setActiveScreen, startRally } = useGame();

  const online = alliance.members.filter(m => m.online).length;
  const total  = alliance.members.length;

  return (
    <div className="absolute inset-0 z-50 flex flex-col screen-slide-in"
      style={{ background:'linear-gradient(160deg,#080f1c 0%,#060a14 100%)' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3"
        style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <button className="text-blue-400 active:opacity-70 p-1" onClick={() => setActiveScreen('map')}>
          <ChevronLeft size={22} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-title text-[16px] text-white" style={{ letterSpacing:'0.04em' }}>[{alliance.tag}]</span>
            <span className="font-game text-[15px] text-yellow-300" style={{ fontWeight:700 }}>{alliance.name}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex items-center gap-1">
              <Zap size={10} className="text-yellow-400" />
              <span className="font-game text-[11px] text-yellow-400">{fmtPower(alliance.power)} power</span>
            </div>
            <div className="w-px h-3 bg-slate-700" />
            <div className="flex items-center gap-1">
              <Users size={10} className="text-blue-400" />
              <span className="font-game text-[11px] text-blue-400">{online}/{total} online</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto game-scroll">

        {/* Alliance stats banner */}
        <div className="mx-3 my-3 rounded-xl p-3"
          style={{ background:'linear-gradient(135deg,rgba(251,191,36,0.08),rgba(251,191,36,0.04))', border:'1px solid rgba(251,191,36,0.18)' }}>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label:'Members',    value: total,                    color:'#e2e8f0' },
              { label:'Rank',       value: '#12 Global',             color:'#fbbf24' },
              { label:'Tiles Held', value: '384',                    color:'#60a5fa' },
            ].map(s => (
              <div key={s.label}>
                <div className="font-game text-[14px]" style={{ color: s.color, fontWeight:700 }}>{s.value}</div>
                <div className="font-game text-[9px] text-slate-600">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Rally button */}
        <div className="mx-3 mb-3">
          {!alliance.rallyActive ? (
            <button
              className="w-full py-3 rounded-xl btn-danger flex items-center justify-center gap-2 text-[14px]"
              onClick={() => startRally()}>
              <Swords size={16} />
              Rally Attack — Call Alliance!
            </button>
          ) : (
            <div className="rounded-xl p-3"
              style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Swords size={14} className="text-red-400" />
                  <span className="font-game text-[13px] text-red-300" style={{ fontWeight:700 }}>Rally in Progress!</span>
                </div>
                <div className="flex items-center gap-1 text-red-400">
                  <Clock size={11} />
                  <span className="font-game text-[12px]">{alliance.rallyTimeLeft ?? 0}s</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-game text-[11px] text-slate-500">Troops assembled</span>
                <span className="font-game text-[13px] text-white" style={{ fontWeight:700 }}>
                  ⚔️ {(alliance.rallyTroops ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full" style={{ background:'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full bg-red-500 transition-all"
                  style={{ width:`${100 - ((alliance.rallyTimeLeft ?? 0) / 300) * 100}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Members list */}
        <div className="px-3 mb-2">
          <div className="font-game text-[11px] text-slate-500 mb-2" style={{ letterSpacing:'0.08em', textTransform:'uppercase' }}>
            Members
          </div>
          <div className="space-y-1.5">
            {alliance.members.map(m => (
              <div key={m.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)' }}>
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] flex-shrink-0"
                  style={{ background: m.color + '20', border:`1.5px solid ${m.color}50`, fontFamily:'Rajdhani,sans-serif', fontWeight:700, color: m.color }}>
                  {m.name.slice(0, 2).toUpperCase()}
                </div>

                {/* Name + rank */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-game text-[13px] text-slate-100 truncate" style={{ fontWeight:700 }}>{m.name}</span>
                    {m.rank === 'R5' && <Crown size={10} className="text-yellow-400 flex-shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-game text-[10px]" style={{ color: RANK_COLOR[m.rank] }}>{m.rank}</span>
                    <span className="text-slate-700">·</span>
                    <span className="font-game text-[10px] text-slate-500">{fmtPower(m.contribution)} contrib</span>
                  </div>
                </div>

                {/* Power + online */}
                <div className="text-right flex-shrink-0">
                  <div className="font-game text-[12px] text-slate-200" style={{ fontWeight:700 }}>{fmtPower(m.power)}</div>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <Circle
                      size={6}
                      className={m.online ? 'text-emerald-400' : 'text-slate-600'}
                      fill={m.online ? '#4ade80' : '#475569'}
                    />
                    <span className="font-game text-[9px]" style={{ color: m.online ? '#4ade80' : '#475569' }}>
                      {m.online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alliance chat preview */}
        <div className="px-3 pb-4 mt-1">
          <div className="font-game text-[11px] text-slate-500 mb-2" style={{ letterSpacing:'0.08em', textTransform:'uppercase' }}>Alliance Chat</div>
          <div className="rounded-xl p-3 space-y-2"
            style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)' }}>
            {[
              { name:'KingSlayer', msg:'Rally on the eastern border NOW', time:'2m', color:'#f59e0b' },
              { name:'Dragonfire', msg:'I\'m sending 400 knights', time:'1m', color:'#ef4444' },
              { name:'LordVarys',  msg:'En route from sector 4-7', time:'30s', color:'#a855f7' },
            ].map((msg, i) => (
              <div key={i} className="flex gap-2">
                <span className="font-game text-[11px] flex-shrink-0" style={{ color: msg.color, fontWeight:700 }}>{msg.name}:</span>
                <span className="font-game text-[11px] text-slate-400 flex-1">{msg.msg}</span>
                <span className="font-game text-[9px] text-slate-700 flex-shrink-0">{msg.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

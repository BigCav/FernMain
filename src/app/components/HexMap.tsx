import { useEffect, useRef, useMemo } from 'react';
import {
  useGame, hexCenter, hexPolyPoints, isAdjacent,
  HEX_SIZE, COL_SPACING, SVG_W, SVG_H, hexPixelDist,
  STRONGHOLD_CONFIG,
} from '../context/GameContext';
import type { HexTile, MarchLine, Owner } from '../types/game';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnimMotion: any = 'animateMotion';

// ─── Colour Tables ────────────────────────────────────────────────────────────
const TERRAIN_FILL: Record<HexTile['type'], [string, string]> = {
  water:    ['#0a1e38', '#05101e'],
  plain:    ['#2a3d1c', '#192610'],
  forest:   ['#1a2e16', '#0d1c0a'],
  mountain: ['#2e2e42', '#1c1c2e'],
  city:     ['#38280e', '#1e1608'],
};
const OWNER_TINT: Record<Owner, string> = {
  player:       'rgba(56,130,250,0.30)',
  enemy_red:    'rgba(220,55,55,0.30)',
  enemy_purple: 'rgba(160,65,230,0.30)',
  enemy_gold:   'rgba(210,165,20,0.28)',
  neutral:      'rgba(0,0,0,0)',
};
const OWNER_STROKE: Record<Owner, string> = {
  player:       '#4888f4',
  enemy_red:    '#e04040',
  enemy_purple: '#a040e0',
  enemy_gold:   '#d4a010',
  neutral:      '#1e2a3a',
};
const OWNER_SOLID: Record<Owner, string> = {
  player:       '#1d4ed8',
  enemy_red:    '#b91c1c',
  enemy_purple: '#7e22ce',
  enemy_gold:   '#92400e',
  neutral:      '#334155',
};
const MARCH_COLOR: Record<Owner, string> = {
  player:       '#60a5fa',
  enemy_red:    '#f87171',
  enemy_purple: '#c084fc',
  enemy_gold:   '#fcd34d',
  neutral:      '#94a3b8',
};

function fmtTroops(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

// ─── Terrain Symbol ───────────────────────────────────────────────────────────
function TerrainIcon({ type, cx, cy }: { type: HexTile['type']; cx: number; cy: number }) {
  if (type === 'forest')   return <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#4ade80" opacity="0.45">♦</text>;
  if (type === 'mountain') return <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#8888aa" opacity="0.5">▲</text>;
  if (type === 'city')     return <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#d4a010" opacity="0.65">⬡</text>;
  return null;
}

// ─── Stronghold SVG Icon ──────────────────────────────────────────────────────
function StrongholdIcon({ cx, cy, level, isBuilding }: {
  cx: number; cy: number; level: number; isBuilding: boolean;
}) {
  if (level <= 0 && !isBuilding) return null;
  const color  = isBuilding ? '#64748b' : (STRONGHOLD_CONFIG[level]?.color ?? '#94a3b8');
  const iy = cy - 11; // icon top baseline

  return (
    <g style={{ pointerEvents: 'none' }} opacity={isBuilding ? 0.65 : 1}>
      {/* Tower body */}
      <rect x={cx - 4} y={iy + 3} width={8}   height={6}  fill={color} rx="0.5" />
      {/* Three battlements */}
      <rect x={cx - 4} y={iy}     width={2}   height={3.5} fill={color} rx="0.3" />
      <rect x={cx - 1} y={iy}     width={2}   height={3.5} fill={color} rx="0.3" />
      <rect x={cx + 2} y={iy}     width={2}   height={3.5} fill={color} rx="0.3" />
      {/* Gate */}
      <rect x={cx - 1.5} y={iy + 6} width={3} height={3}  fill="rgba(0,0,0,0.55)" rx="1" />
      {/* Glow ring behind tower (for higher levels) */}
      {level >= 3 && (
        <circle cx={cx} cy={iy + 5} r={7.5} fill="none" stroke={color}
          strokeWidth="0.7" opacity="0.35" />
      )}
      {/* Level pip dots */}
      {level > 0 && Array.from({ length: level }, (_, i) => (
        <rect key={i}
          x={cx - level * 1.5 + i * 3.1} y={iy - 2.5}
          width={2} height={2} fill={color} rx="0.5" opacity={0.9} />
      ))}
      {/* Build spinner */}
      {isBuilding && (
        <circle cx={cx} cy={iy + 4} r={7} fill="none" stroke={color}
          strokeWidth="0.8" strokeDasharray="2.5 2" opacity={0.5} />
      )}
    </g>
  );
}

// ─── Fog Hex ──────────────────────────────────────────────────────────────────
function FogHex({ tile, onClick }: { tile: HexTile; onClick: () => void }) {
  const inner = hexPolyPoints(tile.col, tile.row, HEX_SIZE - 1.5);
  const outer = hexPolyPoints(tile.col, tile.row, HEX_SIZE);
  return (
    <g onClick={onClick} style={{ cursor: 'default' }}>
      <polygon points={inner} fill="#030810" />
      <polygon points={outer} fill="none" stroke="rgba(15,30,55,0.5)" strokeWidth="0.6" className="fog-edge" />
    </g>
  );
}

// ─── Single Hex ───────────────────────────────────────────────────────────────
function HexCell({
  tile, isSelected, isSource, isValidTarget, isCapture, onClick,
}: {
  tile: HexTile;
  isSelected: boolean; isSource: boolean; isValidTarget: boolean; isCapture: boolean;
  onClick: () => void;
}) {
  const { x: cx, y: cy } = hexCenter(tile.col, tile.row);
  const inner  = hexPolyPoints(tile.col, tile.row, HEX_SIZE - 1.5);
  const outer  = hexPolyPoints(tile.col, tile.row, HEX_SIZE);
  const gradId = `tg-${tile.type}`;
  const strokeW     = tile.owner === 'neutral' ? 0.6 : 1.5;
  const strokeColor = isSource ? '#fbbf24' : isSelected ? '#e2e8f0' : OWNER_STROKE[tile.owner];
  const hasStronghold = tile.strongholdLevel > 0 || !!tile.strongholdBuilding;

  return (
    <g onClick={onClick} style={{ cursor: tile.type === 'water' ? 'default' : 'pointer' }}>
      <polygon points={inner} fill={`url(#${gradId})`} />
      {tile.owner !== 'neutral' && tile.type !== 'water' && (
        <polygon points={inner} fill={OWNER_TINT[tile.owner]} />
      )}
      {isValidTarget && <polygon points={outer} fill="rgba(239,68,68,0.18)" className="attack-target-hex" />}
      {(isSelected || isSource) && (
        <polygon points={outer} fill={isSource ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.10)'} />
      )}
      <polygon
        points={outer} fill="none"
        stroke={strokeColor}
        strokeWidth={isSelected || isSource ? 2 : strokeW}
        className={isSource ? 'source-glow' : ''}
      />
      {isValidTarget && (
        <polygon points={outer} fill="none" stroke="#ef4444" strokeWidth="1.8" className="attack-target-hex" />
      )}
      {isCapture && <polygon points={outer} fill="white" className="capture-flash" />}
      {tile.type !== 'water' && !hasStronghold && <TerrainIcon type={tile.type} cx={cx} cy={cy} />}
      {tile.isCapital && (
        <text x={cx} y={cy - 7} textAnchor="middle" dominantBaseline="middle"
          fontSize="9" fill="#fbbf24"
          style={{ filter: 'drop-shadow(0 0 3px rgba(251,191,36,0.8))' }}>★</text>
      )}
      {/* Stronghold icon – shown on non-capital player tiles */}
      {hasStronghold && !tile.isCapital && tile.type !== 'water' && (
        <StrongholdIcon
          cx={cx} cy={cy}
          level={tile.strongholdLevel}
          isBuilding={!!tile.strongholdBuilding}
        />
      )}
      {tile.troops > 0 && tile.type !== 'water' && (
        <g>
          <circle cx={cx} cy={cy + 9} r={7} fill={OWNER_SOLID[tile.owner]} stroke="rgba(0,0,0,0.5)" strokeWidth="0.5" />
          <text x={cx} y={cy + 9} textAnchor="middle" dominantBaseline="middle"
            fill="white" fontSize={tile.troops >= 100 ? '5.5' : '7'} fontWeight="700"
            fontFamily="Rajdhani, sans-serif">
            {fmtTroops(tile.troops)}
          </text>
        </g>
      )}
    </g>
  );
}

// ─── March Line ───────────────────────────────────────────────────────────────
function MarchLineEl({ march, hexes }: { march: MarchLine; hexes: HexTile[] }) {
  const src = hexes.find(h => h.id === march.sourceId);
  const tgt = hexes.find(h => h.id === march.targetId);
  if (!src || !tgt) return null;
  const { x: x1, y: y1 } = hexCenter(src.col, src.row);
  const { x: x2, y: y2 } = hexCenter(tgt.col, tgt.row);
  const dur  = (march.duration / 1000).toFixed(2);
  const col  = MARCH_COLOR[march.owner];
  const path = `M${x1},${y1} L${x2},${y2}`;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={col} strokeWidth="1.5" strokeDasharray="4 3"
        opacity="0.75" className="march-dash" />
      <circle r="6" fill={col} opacity="0.18">
        <AnimMotion dur={`${dur}s`} fill="freeze" path={path} />
      </circle>
      <circle r="3.5" fill={col} stroke="rgba(0,0,0,0.6)" strokeWidth="0.8">
        <AnimMotion dur={`${dur}s`} fill="freeze" path={path} />
      </circle>
    </g>
  );
}

// ─── Gradient Defs ────────────────────────────────────────────────────────────
function GradientDefs() {
  return (
    <defs>
      {(Object.entries(TERRAIN_FILL) as [HexTile['type'], [string, string]][]).map(([type, [c0, c1]]) => (
        <radialGradient key={type} id={`tg-${type}`} cx="50%" cy="40%" r="65%">
          <stop offset="0%"   stopColor={c0} />
          <stop offset="100%" stopColor={c1} />
        </radialGradient>
      ))}
    </defs>
  );
}

// ─── Fog of War — per-tile vision including stronghold bonus ──────────────────
function useVisibleHexIds(hexes: HexTile[], baseRadius: number): Set<string> {
  return useMemo(() => {
    const playerHexes = hexes.filter(h => h.owner === 'player');
    const visible     = new Set<string>();

    hexes.forEach(hex => {
      if (hex.type === 'water') return;
      for (const ph of playerHexes) {
        // Each stronghold on a player tile boosts its local vision
        const shVision  = STRONGHOLD_CONFIG[ph.strongholdLevel]?.visionBonus ?? 0;
        const radius    = (baseRadius + shVision) * COL_SPACING;
        if (hexPixelDist(ph.col, ph.row, hex.col, hex.row) <= radius) {
          visible.add(hex.id);
          break;
        }
      }
    });
    playerHexes.forEach(h => visible.add(h.id));
    return visible;
  }, [hexes, baseRadius]);
}

// ─── HexMap ───────────────────────────────────────────────────────────────────
export function HexMap() {
  const {
    hexes, marchLines, selectedHexId, attackSourceId,
    captureAnimIds, selectHex, setAttackSource,
    initiateAttack, completeMarch, visionRadius,
  } = useGame();

  const visibleHexIds = useVisibleHexIds(hexes, visionRadius);

  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  useEffect(() => {
    marchLines.forEach(march => {
      if (timersRef.current[march.id]) return;
      const remaining = march.duration - (Date.now() - march.startTime);
      timersRef.current[march.id] = setTimeout(() => {
        completeMarch(march);
        delete timersRef.current[march.id];
      }, Math.max(0, remaining));
    });
    Object.keys(timersRef.current).forEach(id => {
      if (!marchLines.find(m => m.id === id)) {
        clearTimeout(timersRef.current[id]);
        delete timersRef.current[id];
      }
    });
  }, [marchLines.map(m => m.id).join(',')]);

  const sourceHex = attackSourceId ? hexes.find(h => h.id === attackSourceId) : null;

  const validTargetIds = new Set(
    sourceHex
      ? hexes
          .filter(h => h.type !== 'water' && h.owner !== 'player'
                    && isAdjacent(sourceHex.col, sourceHex.row, h.col, h.row))
          .map(h => h.id)
      : []
  );

  function handleHexClick(tile: HexTile) {
    if (tile.type === 'water') { selectHex(null); return; }
    if (attackSourceId && validTargetIds.has(tile.id)) {
      initiateAttack(attackSourceId, tile.id);
      selectHex(tile.id);
      return;
    }
    if (attackSourceId && tile.owner === 'player') {
      setAttackSource(tile.id);
      selectHex(tile.id);
      return;
    }
    setAttackSource(null);
    selectHex(tile.id === selectedHexId ? null : tile.id);
  }

  return (
    <div className="flex-1 overflow-hidden relative">
      {/* Vision radius badge */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 rounded-full"
        style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <span className="text-[9px] font-game text-slate-500">👁</span>
        <span className="text-[9px] font-game text-slate-400">{visionRadius.toFixed(1)}</span>
      </div>

      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width="100%" height="100%"
        style={{ display: 'block', background: '#060d18' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <GradientDefs />

        {hexes.filter(h => h.type === 'water').map(tile => (
          <HexCell key={tile.id} tile={tile}
            isSelected={false} isSource={false} isValidTarget={false} isCapture={false}
            onClick={() => handleHexClick(tile)}
          />
        ))}

        {hexes.filter(h => h.type !== 'water').map(tile => {
          if (!visibleHexIds.has(tile.id)) {
            return <FogHex key={tile.id} tile={tile} onClick={() => handleHexClick(tile)} />;
          }
          return (
            <HexCell key={tile.id} tile={tile}
              isSelected={tile.id === selectedHexId && tile.id !== attackSourceId}
              isSource={tile.id === attackSourceId}
              isValidTarget={validTargetIds.has(tile.id)}
              isCapture={captureAnimIds.has(tile.id)}
              onClick={() => handleHexClick(tile)}
            />
          );
        })}

        {marchLines.map(march => (
          <MarchLineEl key={march.id} march={march} hexes={hexes} />
        ))}
      </svg>
    </div>
  );
}

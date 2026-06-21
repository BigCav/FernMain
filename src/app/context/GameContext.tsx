import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type {
  HexTile, Resources, Lord, ResearchBranch, Building, TroopTier,
  Alliance, WorldEvent, MarchLine, Owner, Screen,
  HeroSkill, GearItem, GearSlot, GearRarity,
} from '../types/game';

// ─── Hex Geometry ─────────────────────────────────────────────────────────────
export const HEX_SIZE     = 22;
export const COL_SPACING  = Math.sqrt(3) * HEX_SIZE;
export const ROW_SPACING  = 1.5 * HEX_SIZE;
export const HEX_COLS     = 9;
export const HEX_ROWS     = 16;
export const SVG_W        = Math.round((HEX_COLS + 0.5) * COL_SPACING);
export const SVG_H        = Math.round((HEX_ROWS - 1) * ROW_SPACING + HEX_SIZE * 2);

export function hexCenter(col: number, row: number) {
  return {
    x: (col + 0.5) * COL_SPACING + (row % 2 === 1 ? COL_SPACING / 2 : 0),
    y: row * ROW_SPACING + HEX_SIZE,
  };
}

export function hexPolyPoints(col: number, row: number, r = HEX_SIZE): string {
  const { x: cx, y: cy } = hexCenter(col, row);
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}

export function getNeighbors(col: number, row: number) {
  return row % 2 === 1
    ? [
        { col: col - 1, row }, { col: col + 1, row },
        { col, row: row - 1 }, { col: col + 1, row: row - 1 },
        { col, row: row + 1 }, { col: col + 1, row: row + 1 },
      ]
    : [
        { col: col - 1, row }, { col: col + 1, row },
        { col: col - 1, row: row - 1 }, { col, row: row - 1 },
        { col: col - 1, row: row + 1 }, { col, row: row + 1 },
      ];
}

export function isAdjacent(c1: number, r1: number, c2: number, r2: number) {
  return getNeighbors(c1, r1).some(n => n.col === c2 && n.row === r2);
}

export function hexPixelDist(c1: number, r1: number, c2: number, r2: number): number {
  const a = hexCenter(c1, r1), b = hexCenter(c2, r2);
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// ─── Stronghold Config ────────────────────────────────────────────────────────
export const STRONGHOLD_MAX = 4;
export const STRONGHOLD_CONFIG = [
  { name: 'None',     def: 0,  cost: 0,    time: 0,   visionBonus: 0,   color: ''        },
  { name: 'Outpost',  def: 10, cost: 800,  time: 45,  visionBonus: 0.5, color: '#94a3b8' },
  { name: 'Fort',     def: 20, cost: 1800, time: 90,  visionBonus: 1.0, color: '#60a5fa' },
  { name: 'Fortress', def: 35, cost: 3500, time: 180, visionBonus: 1.5, color: '#a78bfa' },
  { name: 'Citadel',  def: 55, cost: 7000, time: 480, visionBonus: 2.0, color: '#f59e0b' },
] as const;

const SH_DEF = [0, 0.10, 0.20, 0.35, 0.55]; // DEF multiplier addend per level

// ─── Map Generation ───────────────────────────────────────────────────────────
function rng(col: number, row: number, salt = 0) {
  let h = (((col * 73856093) ^ (row * 19349663) ^ (salt * 83492791)) >>> 0);
  h ^= (h >>> 16); h = Math.imul(h, 0x45d9f3b); h ^= (h >>> 16);
  return (h >>> 0) / 0xffffffff;
}

function generateMap(): HexTile[] {
  const PLAYER_CAP  = { col: 4, row: 13 };
  const ENEMY_CAPS: { col: number; row: number; owner: Owner }[] = [
    { col: 1, row: 2,  owner: 'enemy_red' },
    { col: 7, row: 2,  owner: 'enemy_purple' },
    { col: 4, row: 2,  owner: 'enemy_gold' },
  ];
  const approxDist = (c1: number, r1: number, c2: number, r2: number) =>
    hexPixelDist(c1, r1, c2, r2) / COL_SPACING;

  const tiles: HexTile[] = [];
  for (let row = 0; row < HEX_ROWS; row++) {
    for (let col = 0; col < HEX_COLS; col++) {
      const r0 = rng(col, row, 0), r1 = rng(col, row, 1), r2 = rng(col, row, 2);
      const edge = col === 0 || col === HEX_COLS - 1 || row === 0 || row === HEX_ROWS - 1;
      let type: HexTile['type'] = 'plain';
      let owner: Owner = 'neutral';
      let troops = 0, isCapital = false, isCity = false;

      if (edge || r0 < 0.07) type = 'water';
      else if (r0 < 0.25) type = 'forest';
      else if (r0 < 0.40) type = 'mountain';
      else if (r0 < 0.46 && r1 > 0.55) { type = 'city'; isCity = true; }

      if (col === PLAYER_CAP.col && row === PLAYER_CAP.row) {
        type = 'city'; isCity = true; isCapital = true; owner = 'player'; troops = 280;
      } else if (type !== 'water' && approxDist(col, row, PLAYER_CAP.col, PLAYER_CAP.row) <= 3.0) {
        owner = 'player'; troops = Math.floor(r2 * 90 + 25);
      }
      for (const cap of ENEMY_CAPS) {
        if (col === cap.col && row === cap.row) {
          type = 'city'; isCity = true; isCapital = true; owner = cap.owner; troops = 220; break;
        } else if (type !== 'water' && owner !== 'player' && approxDist(col, row, cap.col, cap.row) <= 2.4) {
          owner = cap.owner; troops = Math.floor(r1 * 65 + 20);
        }
      }
      if (owner === 'neutral' && type !== 'water' && r0 > 0.62) troops = Math.floor(r1 * 30 + 5);
      tiles.push({ id: `${col}-${row}`, col, row, type, owner, troops, isCapital, isCity, strongholdLevel: 0 });
    }
  }
  return tiles;
}

// ─── Gear Pool ────────────────────────────────────────────────────────────────
type GearTemplate = Omit<GearItem, 'id'>;
const GEAR_POOL: GearTemplate[] = [
  // Weapons
  { name: 'Iron Sword',       slot: 'weapon',  rarity: 'common',    statType: 'atk',    statValue: 8,  description: 'A sturdy iron blade' },
  { name: 'Steel Broadsword', slot: 'weapon',  rarity: 'rare',      statType: 'atk',    statValue: 16, description: 'Forged in steel fires' },
  { name: 'Warbringer',       slot: 'weapon',  rarity: 'epic',      statType: 'atk',    statValue: 28, description: 'A blade born from war' },
  { name: 'Dragon Fang',      slot: 'weapon',  rarity: 'legendary', statType: 'atk',    statValue: 48, description: 'Carved from dragon bone' },
  // Helmets
  { name: 'Leather Cap',      slot: 'helmet',  rarity: 'common',    statType: 'def',    statValue: 6,  description: 'Basic head protection' },
  { name: 'Chain Coif',       slot: 'helmet',  rarity: 'rare',      statType: 'def',    statValue: 14, description: 'Woven chainmail hood' },
  { name: "Knight's Helm",    slot: 'helmet',  rarity: 'epic',      statType: 'def',    statValue: 24, description: 'Heavy plate helmet' },
  { name: 'Crown of Kings',   slot: 'helmet',  rarity: 'legendary', statType: 'power',  statValue: 65, description: 'A crown radiating power' },
  // Armor
  { name: 'Leather Vest',     slot: 'armor',   rarity: 'common',    statType: 'def',    statValue: 10, description: 'Hardened leather vest' },
  { name: 'Chainmail',        slot: 'armor',   rarity: 'rare',      statType: 'def',    statValue: 20, description: 'Rings of woven steel' },
  { name: 'Plate Armor',      slot: 'armor',   rarity: 'epic',      statType: 'def',    statValue: 36, description: 'Full plate coverage' },
  { name: 'Dragon Scale',     slot: 'armor',   rarity: 'legendary', statType: 'def',    statValue: 58, description: 'Scales of the ancient dragon' },
  // Shields
  { name: 'Wooden Buckler',   slot: 'shield',  rarity: 'common',    statType: 'def',    statValue: 7,  description: 'Simple wooden shield' },
  { name: 'Iron Bulwark',     slot: 'shield',  rarity: 'rare',      statType: 'def',    statValue: 16, description: 'Sturdy iron plate shield' },
  { name: 'Tower Shield',     slot: 'shield',  rarity: 'epic',      statType: 'hp',     statValue: 26, description: 'Massive full-body shield' },
  { name: 'Aegis Eternal',    slot: 'shield',  rarity: 'legendary', statType: 'def',    statValue: 48, description: 'A mythical defensive relic' },
  // Rings
  { name: 'Copper Ring',      slot: 'ring',    rarity: 'common',    statType: 'income', statValue: 5,  description: 'A simple copper band' },
  { name: 'Gold Ring',        slot: 'ring',    rarity: 'rare',      statType: 'income', statValue: 12, description: 'A finely gilded ring' },
  { name: 'Sapphire Ring',    slot: 'ring',    rarity: 'epic',      statType: 'income', statValue: 24, description: 'A sapphire-set ring' },
  { name: 'Ring of Eternity', slot: 'ring',    rarity: 'legendary', statType: 'income', statValue: 40, description: 'An eternal ring of fortune' },
  // Boots
  { name: 'Travel Boots',     slot: 'boots',   rarity: 'common',    statType: 'def',    statValue: 5,  description: 'Sturdy travel footwear' },
  { name: "Knight's Greaves", slot: 'boots',   rarity: 'rare',      statType: 'atk',    statValue: 10, description: 'Heavy war greaves' },
  { name: 'Swift Greaves',    slot: 'boots',   rarity: 'epic',      statType: 'atk',    statValue: 18, description: 'Speed-enchanted greaves' },
  { name: 'Phoenix Treads',   slot: 'boots',   rarity: 'legendary', statType: 'hp',     statValue: 42, description: 'Touched by the phoenix' },
];

const RARITY_WEIGHTS: Record<GearRarity, number> = { common: 55, rare: 28, epic: 12, legendary: 5 };

function rollGear(): GearItem {
  const roll = Math.random() * 100;
  let rarity: GearRarity;
  if (roll < RARITY_WEIGHTS.common) rarity = 'common';
  else if (roll < RARITY_WEIGHTS.common + RARITY_WEIGHTS.rare) rarity = 'rare';
  else if (roll < 100 - RARITY_WEIGHTS.legendary) rarity = 'epic';
  else rarity = 'legendary';
  const pool = GEAR_POOL.filter(g => g.rarity === rarity);
  const template = pool[Math.floor(Math.random() * pool.length)];
  return { ...template, id: `g_${Date.now()}_${Math.floor(Math.random() * 9999)}` };
}

// ─── Initial State ────────────────────────────────────────────────────────────
const INIT_SKILLS: HeroSkill[] = [
  { id: 'warlord_aura',    name: 'Warlord Aura',    description: '+5% troop ATK per level',  level: 3, maxLevel: 5, color: '#f87171', statType: 'atk',    statPerLevel: 5 },
  { id: 'iron_will',       name: 'Iron Will',       description: '+4% troop DEF per level',  level: 2, maxLevel: 5, color: '#60a5fa', statType: 'def',    statPerLevel: 4 },
  { id: 'golden_treasury', name: 'Golden Treasury', description: '+3% gold income per level', level: 4, maxLevel: 5, color: '#fcd34d', statType: 'income', statPerLevel: 3 },
  { id: 'land_baron',      name: 'Land Baron',      description: '+2% ATK per level',         level: 1, maxLevel: 3, color: '#4ade80', statType: 'atk',    statPerLevel: 2 },
];

const INIT_EQUIPPED: Partial<Record<GearSlot, GearItem>> = {
  weapon: { id: 'g_starter_sword', name: 'Steel Broadsword', slot: 'weapon', rarity: 'rare', statType: 'atk', statValue: 16, description: 'Forged in steel fires' },
  armor:  { id: 'g_starter_mail',  name: 'Chainmail',        slot: 'armor',  rarity: 'rare', statType: 'def', statValue: 20, description: 'Rings of woven steel' },
};

const INIT_INVENTORY: GearItem[] = [
  { id: 'g_inv_ring',   name: 'Gold Ring',    slot: 'ring',   rarity: 'rare',   statType: 'income', statValue: 12, description: 'A finely gilded ring' },
  { id: 'g_inv_boots',  name: 'Travel Boots', slot: 'boots',  rarity: 'common', statType: 'def',    statValue: 5,  description: 'Sturdy travel boots' },
  { id: 'g_inv_helm',   name: "Knight's Helm",slot: 'helmet', rarity: 'epic',   statType: 'def',    statValue: 24, description: 'Heavy plate helmet' },
];

const INIT_RESEARCH: ResearchBranch[] = [
  { id: 'war', name: 'War', color: '#ef4444', icon: '⚔️', nodes: [
    { id: 'iron_sword',    name: 'Iron Sword',     description: 'Increases troop attack power',  level: 2, maxLevel: 5, costBase: 800,  timeBase: 60,  bonus: '+5% ATK'    },
    { id: 'shield_wall',   name: 'Shield Wall',    description: 'Increases troop defense',       level: 1, maxLevel: 5, costBase: 1000, timeBase: 90,  bonus: '+5% DEF'    },
    { id: 'steel_armor',   name: 'Steel Armor',    description: 'Increases troop hit points',    level: 0, maxLevel: 5, costBase: 1500, timeBase: 150, bonus: '+10% HP'     },
    { id: 'tactics',       name: 'Battle Tactics', description: 'Improves march efficiency',    level: 0, maxLevel: 5, costBase: 2000, timeBase: 300, bonus: '+15% SPD'    },
    { id: 'siege',         name: 'Siege Weapons',  description: 'Bonus damage vs city tiles',   level: 0, maxLevel: 3, costBase: 3000, timeBase: 600, bonus: '+20% SIEGE'  },
  ]},
  { id: 'economy', name: 'Economy', color: '#f59e0b', icon: '🪙', nodes: [
    { id: 'tax_office',    name: 'Tax Office',     description: 'Increase gold income',         level: 3, maxLevel: 5, costBase: 600,  timeBase: 45,  bonus: '+10% GOLD'   },
    { id: 'granary',       name: 'Granary',        description: 'Increase food production',     level: 2, maxLevel: 5, costBase: 800,  timeBase: 60,  bonus: '+15% FOOD'   },
    { id: 'trade_routes',  name: 'Trade Routes',   description: 'Boost all resource income',    level: 1, maxLevel: 5, costBase: 1200, timeBase: 120, bonus: '+20% INC'    },
    { id: 'black_market',  name: 'Black Market',   description: 'Generates gems over time',     level: 0, maxLevel: 3, costBase: 2000, timeBase: 240, bonus: '+GEM/h'      },
    { id: 'treasury',      name: 'Treasury',       description: 'Raises resource storage cap',  level: 0, maxLevel: 5, costBase: 1800, timeBase: 180, bonus: '+50% CAP'    },
  ]},
  { id: 'territory', name: 'Territory', color: '#22c55e', icon: '🗺️', nodes: [
    { id: 'roads',         name: 'Roads',          description: 'Faster army movement',         level: 1, maxLevel: 5, costBase: 700,  timeBase: 60,  bonus: '+20% SPD'    },
    { id: 'expansion',     name: 'Expansion',      description: 'Extend tile capture range',    level: 2, maxLevel: 5, costBase: 900,  timeBase: 75,  bonus: '+RANGE'      },
    { id: 'watchtowers',   name: 'Watchtowers',    description: 'See further on the map',       level: 1, maxLevel: 5, costBase: 1100, timeBase: 100, bonus: '+2 VIS'      },
    { id: 'fortification', name: 'Fortification',  description: 'Stronger border defense',      level: 0, maxLevel: 5, costBase: 1600, timeBase: 150, bonus: '+25% BDEF'   },
    { id: 'imperial',      name: 'Imperial Domain',description: 'Boosts kingdom power rating',  level: 0, maxLevel: 3, costBase: 5000, timeBase: 600, bonus: '+500 PWR'    },
  ]},
];

const INIT_BUILDINGS: Building[] = [
  { id: 'barracks',   name: 'Barracks',   description: 'Train stronger troops & unlock tiers', level: 3, maxLevel: 5, costBase: 500, timeBase: 120, bonus: 'Troops +15%', icon: '⚔️' },
  { id: 'gold_mine',  name: 'Gold Mine',  description: 'Increases gold income per hour',       level: 4, maxLevel: 5, costBase: 400, timeBase: 90,  bonus: '+80 Gold/h',  icon: '🪙' },
  { id: 'wall',       name: 'City Wall',  description: 'Fortifies your capital city',          level: 2, maxLevel: 5, costBase: 600, timeBase: 150, bonus: 'DEF +20%',    icon: '🏰' },
  { id: 'academy',    name: 'Academy',    description: 'Reduces all research times',           level: 3, maxLevel: 5, costBase: 550, timeBase: 130, bonus: 'Research −15%',icon: '📜' },
  { id: 'watchtower', name: 'Watchtower', description: 'Expands vision on the map',            level: 2, maxLevel: 5, costBase: 350, timeBase: 100, bonus: '+3 Vision',    icon: '🔭' },
  { id: 'storehouse', name: 'Storehouse', description: 'Raises max resource storage cap',      level: 1, maxLevel: 5, costBase: 300, timeBase: 80,  bonus: '+30% Cap',     icon: '🏚️' },
];

const INIT_TROOPS: TroopTier[] = [
  { type: 'militia',    name: 'Militia',     count: 340, attack: 5,  defense: 4,  trainCost: 20,  unlocked: true,  color: '#94a3b8' },
  { type: 'soldiers',   name: 'Soldiers',    count: 180, attack: 12, defense: 10, trainCost: 50,  unlocked: true,  color: '#60a5fa' },
  { type: 'knights',    name: 'Knights',     count: 60,  attack: 28, defense: 24, trainCost: 120, unlocked: true,  color: '#a78bfa' },
  { type: 'royalGuard', name: 'Royal Guard', count: 12,  attack: 60, defense: 55, trainCost: 300, unlocked: false, color: '#fbbf24' },
];

const INIT_ALLIANCE: Alliance = {
  name: 'Iron Throne', tag: 'IRON', power: 2840000, rallyActive: false,
  members: [
    { id: '1', name: 'KingSlayer',   rank: 'R5', power: 580000, online: true,  color: '#f59e0b', contribution: 98200 },
    { id: '2', name: 'LordVarys',    rank: 'R4', power: 420000, online: true,  color: '#a855f7', contribution: 72400 },
    { id: '3', name: 'StormBorn',    rank: 'R3', power: 310000, online: false, color: '#3b82f6', contribution: 54100 },
    { id: '4', name: 'Dragonfire',   rank: 'R3', power: 280000, online: true,  color: '#ef4444', contribution: 48600 },
    { id: '5', name: 'ShadowWalker', rank: 'R2', power: 195000, online: false, color: '#22c55e', contribution: 31500 },
    { id: '6', name: 'IronFist',     rank: 'R2', power: 160000, online: true,  color: '#06b6d4', contribution: 27800 },
    { id: '7', name: 'NightRider',   rank: 'R1', power: 95000,  online: false, color: '#f97316', contribution: 12300 },
  ],
};

// ─── Context Interface ────────────────────────────────────────────────────────
interface GameCtx {
  hexes: HexTile[];
  resources: Resources;
  lord: Lord;
  researchBranches: ResearchBranch[];
  buildings: Building[];
  troops: TroopTier[];
  alliance: Alliance;
  worldEvent: WorldEvent;
  marchLines: MarchLine[];
  selectedHexId: string | null;
  attackSourceId: string | null;
  captureAnimIds: Set<string>;
  activeScreen: Screen;
  pendingChestGear: GearItem | null;
  visionRadius: number;

  selectHex: (id: string | null) => void;
  setAttackSource: (id: string | null) => void;
  initiateAttack: (sourceId: string, targetId: string) => void;
  initiateReinforce: (sourceId: string, targetId: string, troops: number) => void;
  completeMarch: (march: MarchLine) => void;
  setActiveScreen: (s: Screen) => void;
  startResearch: (branchId: string, nodeId: string) => void;
  startBuildingUpgrade: (id: string) => void;
  trainTroops: (type: string, count: number) => void;
  startRally: () => void;
  upgradeSkill: (skillId: string) => void;
  openChest: () => void;
  equipGear: (itemId: string) => void;
  unequipGear: (slot: GearSlot) => void;
  clearPendingChestGear: () => void;
  buildOrUpgradeStronghold: (hexId: string) => void;
}

const Ctx = createContext<GameCtx | null>(null);
export function useGame() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useGame outside GameProvider');
  return c;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function GameProvider({ children }: { children: React.ReactNode }) {
  const [hexes, setHexes]               = useState<HexTile[]>(() => generateMap());
  const [resources, setResources]       = useState<Resources>({ gold: 12400, food: 8200, gems: 340, army: 592, income: 120, power: 48200 });
  const [lord, setLord]                 = useState<Lord>({
    name: 'Lord Aldric', title: 'Warlord', level: 12, xp: 3400, xpNeeded: 5000,
    attackBonus: 18, defenseBonus: 12, incomeBonus: 8,
    skillPoints: 4,
    skills: INIT_SKILLS,
    equippedGear: INIT_EQUIPPED,
    inventory: INIT_INVENTORY,
    chests: 2,
  });
  const [researchBranches, setResearch] = useState<ResearchBranch[]>(INIT_RESEARCH);
  const [buildings, setBuildings]       = useState<Building[]>(INIT_BUILDINGS);
  const [troops, setTroops]             = useState<TroopTier[]>(INIT_TROOPS);
  const [alliance, setAlliance]         = useState<Alliance>(INIT_ALLIANCE);
  const [worldEvent, setWorldEvent]     = useState<WorldEvent>({
    title: 'Conquest Week', description: 'Capture 20 tiles to earn Legendary Chests',
    progress: 8, target: 20, reward: '3× Legendary Chest', timeLeftSecs: 28800,
  });
  const [marchLines, setMarchLines]     = useState<MarchLine[]>([]);
  const [selectedHexId, setSelectedHexId]   = useState<string | null>(null);
  const [attackSourceId, setAttackSourceId] = useState<string | null>(null);
  const [captureAnimIds, setCaptureAnimIds] = useState<Set<string>>(new Set());
  const [activeScreen, setActiveScreen]     = useState<Screen>('map');
  const [pendingChestGear, setPendingChestGear] = useState<GearItem | null>(null);

  const hexesRef = useRef(hexes);
  hexesRef.current = hexes;

  const lordRef = useRef(lord);
  lordRef.current = lord;

  // Vision radius from buildings + research
  const visionRadius = useMemo(() => {
    const wt = buildings.find(b => b.id === 'watchtower')?.level ?? 0;
    const wr = researchBranches.flatMap(b => b.nodes).find(n => n.id === 'watchtowers')?.level ?? 0;
    return 2.5 + wt * 0.65 + wr * 0.4;
  }, [buildings, researchBranches]);

  // Resource tick
  useEffect(() => {
    const t = setInterval(() => {
      setResources(r => ({ ...r, gold: r.gold + Math.floor(r.income / 20), food: r.food + 3 }));
      setWorldEvent(e => ({ ...e, timeLeftSecs: Math.max(0, e.timeLeftSecs - 3) }));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  // Timer countdowns
  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      setBuildings(prev => prev.map(b =>
        b.upgradeFinishAt && b.upgradeFinishAt <= now
          ? { ...b, level: Math.min(b.level + 1, b.maxLevel), upgradeFinishAt: undefined }
          : b
      ));
      setResearch(prev => prev.map(br => ({
        ...br,
        nodes: br.nodes.map(n =>
          n.activeUntil && n.activeUntil <= now
            ? { ...n, level: Math.min(n.level + 1, n.maxLevel), activeUntil: undefined }
            : n
        ),
      })));
      setAlliance(a => a.rallyActive && (a.rallyTimeLeft ?? 0) > 0
        ? { ...a, rallyTimeLeft: (a.rallyTimeLeft ?? 0) - 1 }
        : a.rallyActive ? { ...a, rallyActive: false } : a
      );
      // Complete stronghold builds
      setHexes(prev => prev.map(h =>
        h.strongholdBuilding && h.strongholdBuilding <= now
          ? { ...h, strongholdLevel: Math.min(h.strongholdLevel + 1, STRONGHOLD_MAX), strongholdBuilding: undefined }
          : h
      ));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // AI expansion
  const aiTick = useRef(0);
  useEffect(() => {
    const t = setInterval(() => {
      aiTick.current++;
      if (aiTick.current % 5 !== 0) return;
      setHexes(prev => {
        const map = new Map(prev.map(h => [h.id, h]));
        const enemies: Owner[] = ['enemy_red', 'enemy_purple', 'enemy_gold'];
        const eo = enemies[Math.floor(Math.random() * enemies.length)];
        const sources = prev.filter(h => h.owner === eo && h.troops > 20 && h.type !== 'water');
        if (!sources.length) return prev;
        const src = sources[Math.floor(Math.random() * sources.length)];
        const adj = getNeighbors(src.col, src.row)
          .map(n => map.get(`${n.col}-${n.row}`))
          .filter((h): h is HexTile => !!h && h.type !== 'water' && h.owner !== eo &&
            (h.owner === 'neutral' ||
             h.troops * (1 + (SH_DEF[h.strongholdLevel] ?? 0)) < src.troops * 0.55));
        if (!adj.length) return prev;
        const tgt = adj[Math.floor(Math.random() * adj.length)];
        const sent = Math.floor(src.troops * 0.5);
        return prev.map(h => {
          if (h.id === src.id) return { ...h, troops: h.troops - sent };
          if (h.id === tgt.id) {
            const shDef = SH_DEF[tgt.strongholdLevel] ?? 0;
            const effectiveDef = tgt.troops * (1 + shDef);
            return sent > effectiveDef
              ? { ...h, owner: eo, troops: Math.max(5, Math.floor(sent - effectiveDef)), strongholdLevel: 0, strongholdBuilding: undefined }
              : { ...h, troops: Math.max(1, tgt.troops - Math.floor(sent * 0.75)) };
          }
          return h;
        });
      });
    }, 2000);
    return () => clearInterval(t);
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const selectHex = useCallback((id: string | null) => {
    setSelectedHexId(id);
    if (!id) setAttackSourceId(null);
  }, []);

  const setAttackSource = useCallback((id: string | null) => setAttackSourceId(id), []);

  const initiateAttack = useCallback((sourceId: string, targetId: string) => {
    const src = hexesRef.current.find(h => h.id === sourceId);
    if (!src || src.troops < 2) return;
    const sent = Math.max(1, Math.floor(src.troops * 0.65));
    setHexes(p => p.map(h => h.id === sourceId ? { ...h, troops: h.troops - sent } : h));
    setMarchLines(p => [...p, { id: `m${Date.now()}`, sourceId, targetId, startTime: Date.now(), duration: 2200, troops: sent, isAttack: true, owner: 'player' }]);
    setAttackSourceId(null);
  }, []);

  const initiateReinforce = useCallback((sourceId: string, targetId: string, troopCount: number) => {
    setHexes(p => p.map(h => h.id === sourceId ? { ...h, troops: h.troops - troopCount } : h));
    setMarchLines(p => [...p, { id: `m${Date.now()}`, sourceId, targetId, startTime: Date.now(), duration: 1600, troops: troopCount, isAttack: false, owner: 'player' }]);
  }, []);

  const completeMarch = useCallback((march: MarchLine) => {
    setMarchLines(p => p.filter(m => m.id !== march.id));
    const tgt = hexesRef.current.find(h => h.id === march.targetId);
    if (!tgt) return;
    if (march.isAttack) {
      const win = march.troops > tgt.troops * 0.72;
      if (win) {
        const surviving = Math.max(1, Math.floor((march.troops - tgt.troops * 0.72) * 0.88));
        setHexes(p => p.map(h => h.id === march.targetId ? { ...h, owner: march.owner, troops: surviving } : h));
        setCaptureAnimIds(p => new Set([...p, march.targetId]));
        setTimeout(() => setCaptureAnimIds(p => { const n = new Set(p); n.delete(march.targetId); return n; }), 1100);
        if (tgt.owner !== march.owner) {
          setWorldEvent(e => ({ ...e, progress: Math.min(e.target, e.progress + 1) }));
          setResources(r => ({ ...r, gold: r.gold + 160, power: r.power + 220 }));
          setLord(prev => {
            const xp = prev.xp + 55;
            return xp >= prev.xpNeeded
              ? { ...prev, xp: xp - prev.xpNeeded, level: prev.level + 1, xpNeeded: Math.floor(prev.xpNeeded * 1.45), skillPoints: prev.skillPoints + 1 }
              : { ...prev, xp };
          });
        }
      } else {
        setHexes(p => p.map(h => h.id === march.targetId ? { ...h, troops: Math.max(1, Math.floor(tgt.troops - march.troops * 0.75)) } : h));
      }
    } else {
      setHexes(p => p.map(h => h.id === march.targetId ? { ...h, troops: h.troops + march.troops } : h));
    }
  }, []);

  const startResearch = useCallback((branchId: string, nodeId: string) => {
    const node = researchBranches.find(b => b.id === branchId)?.nodes.find(n => n.id === nodeId);
    if (!node || node.activeUntil || node.level >= node.maxLevel) return;
    const cost = node.costBase * (node.level + 1);
    if (resources.gold < cost) return;
    setResources(r => ({ ...r, gold: r.gold - cost }));
    setResearch(p => p.map(b => b.id !== branchId ? b : {
      ...b, nodes: b.nodes.map(n => n.id === nodeId ? { ...n, activeUntil: Date.now() + n.timeBase * (n.level + 1) * 1000 } : n),
    }));
  }, [researchBranches, resources.gold]);

  const startBuildingUpgrade = useCallback((id: string) => {
    const b = buildings.find(x => x.id === id);
    if (!b || b.upgradeFinishAt || b.level >= b.maxLevel) return;
    const cost = b.costBase * (b.level + 1);
    if (resources.gold < cost) return;
    setResources(r => ({ ...r, gold: r.gold - cost }));
    setBuildings(p => p.map(x => x.id === id ? { ...x, upgradeFinishAt: Date.now() + x.timeBase * (x.level + 1) * 1000 } : x));
  }, [buildings, resources.gold]);

  const trainTroops = useCallback((type: string, count: number) => {
    const tier = troops.find(t => t.type === type);
    if (!tier?.unlocked) return;
    const cost = tier.trainCost * count;
    if (resources.gold < cost) return;
    setResources(r => ({ ...r, gold: r.gold - cost }));
    setTroops(p => p.map(t => t.type === type ? { ...t, count: t.count + count } : t));
  }, [troops, resources.gold]);

  const startRally = useCallback(() => {
    setAlliance(a => ({ ...a, rallyActive: true, rallyTimeLeft: 300, rallyTroops: 4200 + Math.floor(Math.random() * 2000) }));
  }, []);

  const upgradeSkill = useCallback((skillId: string) => {
    setLord(prev => {
      if (prev.skillPoints < 1) return prev;
      const skill = prev.skills.find(s => s.id === skillId);
      if (!skill || skill.level >= skill.maxLevel) return prev;
      const bonusDelta = skill.statPerLevel;
      return {
        ...prev,
        skillPoints: prev.skillPoints - 1,
        skills: prev.skills.map(s => s.id === skillId ? { ...s, level: s.level + 1 } : s),
        attackBonus:  skill.statType === 'atk'    ? prev.attackBonus  + bonusDelta : prev.attackBonus,
        defenseBonus: skill.statType === 'def'    ? prev.defenseBonus + bonusDelta : prev.defenseBonus,
        incomeBonus:  skill.statType === 'income' ? prev.incomeBonus  + bonusDelta : prev.incomeBonus,
      };
    });
  }, []);

  const openChest = useCallback(() => {
    if (lordRef.current.chests <= 0) return;
    const gear = rollGear();
    setLord(prev => prev.chests <= 0 ? prev : {
      ...prev, chests: prev.chests - 1, inventory: [...prev.inventory, gear],
    });
    setPendingChestGear(gear);
  }, []);

  const equipGear = useCallback((itemId: string) => {
    setLord(prev => {
      const item = prev.inventory.find(i => i.id === itemId);
      if (!item) return prev;
      const existing = prev.equippedGear[item.slot];
      const newInventory = prev.inventory.filter(i => i.id !== itemId);
      if (existing) newInventory.push(existing);
      return { ...prev, equippedGear: { ...prev.equippedGear, [item.slot]: item }, inventory: newInventory };
    });
  }, []);

  const unequipGear = useCallback((slot: GearSlot) => {
    setLord(prev => {
      const item = prev.equippedGear[slot];
      if (!item) return prev;
      const { [slot]: _, ...rest } = prev.equippedGear;
      return { ...prev, equippedGear: rest, inventory: [...prev.inventory, item] };
    });
  }, []);

  const clearPendingChestGear = useCallback(() => setPendingChestGear(null), []);

  const buildOrUpgradeStronghold = useCallback((hexId: string) => {
    const hex = hexesRef.current.find(h => h.id === hexId);
    if (!hex || hex.owner !== 'player' || hex.type === 'water') return;
    if (hex.strongholdBuilding) return; // already queued
    const currentLevel = hex.strongholdLevel;
    if (currentLevel >= STRONGHOLD_MAX) return;
    const nextLevel = currentLevel + 1;
    const config = STRONGHOLD_CONFIG[nextLevel];
    if (resources.gold < config.cost) return;
    setResources(r => ({ ...r, gold: r.gold - config.cost }));
    setHexes(p => p.map(h => h.id === hexId
      ? { ...h, strongholdBuilding: Date.now() + config.time * 1000 }
      : h
    ));
  }, [resources.gold]);

  return (
    <Ctx.Provider value={{
      hexes, resources, lord, researchBranches, buildings, troops,
      alliance, worldEvent, marchLines, selectedHexId, attackSourceId,
      captureAnimIds, activeScreen, pendingChestGear, visionRadius,
      selectHex, setAttackSource, initiateAttack, initiateReinforce,
      completeMarch, setActiveScreen, startResearch, startBuildingUpgrade,
      trainTroops, startRally, upgradeSkill, openChest, equipGear,
      unequipGear, clearPendingChestGear,
      buildOrUpgradeStronghold,
    }}>
      {children}
    </Ctx.Provider>
  );
}
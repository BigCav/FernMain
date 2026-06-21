export type TileType    = 'water' | 'plain' | 'forest' | 'mountain' | 'city';
export type Owner       = 'player' | 'enemy_red' | 'enemy_purple' | 'enemy_gold' | 'neutral';
export type Screen      = 'map' | 'lord' | 'research' | 'city' | 'alliance';
export type GearRarity  = 'common' | 'rare' | 'epic' | 'legendary';
export type GearSlot    = 'weapon' | 'helmet' | 'armor' | 'shield' | 'ring' | 'boots';
export type GearStat    = 'atk' | 'def' | 'hp' | 'income' | 'power';

export interface HexTile {
  id: string;
  col: number;
  row: number;
  type: TileType;
  owner: Owner;
  troops: number;
  isCapital: boolean;
  isCity: boolean;
  strongholdLevel: number;       // 0 = none, 1–4 = Outpost/Fort/Fortress/Citadel
  strongholdBuilding?: number;   // unix ms when next level completes
}

export interface Resources {
  gold: number;
  food: number;
  gems: number;
  army: number;
  income: number;
  power: number;
}

export interface HeroSkill {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  color: string;
  statType: 'atk' | 'def' | 'income';
  statPerLevel: number;
}

export interface GearItem {
  id: string;
  name: string;
  slot: GearSlot;
  rarity: GearRarity;
  statType: GearStat;
  statValue: number;
  description: string;
}

export interface Lord {
  name: string;
  title: string;
  level: number;
  xp: number;
  xpNeeded: number;
  attackBonus: number;
  defenseBonus: number;
  incomeBonus: number;
  skillPoints: number;
  skills: HeroSkill[];
  equippedGear: Partial<Record<GearSlot, GearItem>>;
  inventory: GearItem[];
  chests: number;
}

export interface ResearchNode {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  costBase: number;
  timeBase: number;
  bonus: string;
  activeUntil?: number;
}

export interface ResearchBranch {
  id: string;
  name: string;
  color: string;
  icon: string;
  nodes: ResearchNode[];
}

export interface Building {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  costBase: number;
  timeBase: number;
  bonus: string;
  icon: string;
  upgradeFinishAt?: number;
}

export interface TroopTier {
  type: string;
  name: string;
  count: number;
  attack: number;
  defense: number;
  trainCost: number;
  unlocked: boolean;
  color: string;
}

export interface AllianceMember {
  id: string;
  name: string;
  rank: 'R1' | 'R2' | 'R3' | 'R4' | 'R5';
  power: number;
  online: boolean;
  color: string;
  contribution: number;
}

export interface Alliance {
  name: string;
  tag: string;
  power: number;
  members: AllianceMember[];
  rallyActive: boolean;
  rallyTarget?: string;
  rallyTimeLeft?: number;
  rallyTroops?: number;
}

export interface WorldEvent {
  title: string;
  description: string;
  progress: number;
  target: number;
  reward: string;
  timeLeftSecs: number;
}

export interface MarchLine {
  id: string;
  sourceId: string;
  targetId: string;
  startTime: number;
  duration: number;
  troops: number;
  isAttack: boolean;
  owner: Owner;
}
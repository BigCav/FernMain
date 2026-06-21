// ─── Constants ─────────────────────────────────────────────────────────────
export const TODAY = (() => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
})();

export const OWNER = {
  name: 'Sarah Mackenzie',
  initials: 'SM',
  property: 'Tui Ridge',
  location: 'Wairarapa',
  hectares: 12.5,
  email: 'sarah@tuiridge.co.nz',
  phone: '027 345 6789',
};

// ─── Types ──────────────────────────────────────────────────────────────────
export type Species = string;
export type HealthStatus = 'healthy' | 'monitor' | 'sick';
export type Sex = 'male' | 'female';
export type HealthEventType = 'vaccination' | 'treatment' | 'worming' | 'checkup' | 'injury';
export type FeedType = 'hay' | 'grain' | 'pellet' | 'supplement' | 'mineral';
export type TaskCategory = 'feeding' | 'health' | 'maintenance' | 'fencing' | 'pasture' | 'other';
export type TaskPriority = 'high' | 'medium' | 'low';
export type PaddockStatus   = 'grazing' | 'resting' | 'reseeding' | 'cutting';
export type GrassCover      = 'excellent' | 'good' | 'fair' | 'low';
export type FenceCondition  = 'good' | 'fair' | 'poor' | 'none';
export type TransferPurpose = 'sale' | 'loan' | 'breeding' | 'slaughter' | 'gifted' | 'other';

export interface TransferRecord {
  id: string;
  date: string;
  fromName: string;
  fromProperty: string;
  fromLocation: string;
  toName?: string;
  toProperty?: string;
  toEmail?: string;
  destNaitLocation?: string;
  price?: number;
  purpose: TransferPurpose;
  notes?: string;
}

export interface Animal {
  id: string;
  name: string;
  tag: string;
  species: Species;
  breed: string;
  sex: Sex;
  dob: string;
  paddock: string;
  weight?: number;
  status: HealthStatus;
  notes?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  naitTag?: string;
  transfers?: TransferRecord[];
}

export interface HealthEvent {
  id: string;
  animalId: string;
  date: string;
  type: HealthEventType;
  description: string;
  vet?: string;
  cost?: number;
  nextDue?: string;
}

export interface FeedItem {
  id: string;
  name: string;
  type: FeedType;
  stockKg: number;
  initialStockKg?: number;  // original quantity when first added — denominator for the stock bar
  dailyUseKg: number;
  costPerKg: number;
  reorderAtKg: number;
  supplier?: string;
  location?: string;
}

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  dueDate: string;
  completed: boolean;
  completedDate?: string;
  priority: TaskPriority;
  notes?: string;
  recurring?: 'daily' | 'weekly' | 'monthly' | null;
}

export interface Paddock {
  id:             string;
  name:           string;
  hectares:       number;
  status:         PaddockStatus;
  grassCover:     GrassCover;
  fenceCondition: FenceCondition;
  waterSource:    string;
  notes?:         string;
  lastRotated?:   string;
}

// ─── Config ─────────────────────────────────────────────────────────────────
const _SPECIES_CONFIG_BASE: Record<string, { label: string; color: string; bg: string; border: string }> = {
  sheep:   { label: 'Sheep',   color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
  cattle:  { label: 'Cattle',  color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  chicken: { label: 'Chicken', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
  goat:    { label: 'Goat',    color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  horse:   { label: 'Horse',   color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  alpaca:  { label: 'Alpaca',  color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  pig:     { label: 'Pig',     color: '#db2777', bg: '#fdf2f8', border: '#fbcfe8' },
};
// Proxy so SPECIES_CONFIG[unknownKey] never returns undefined — custom species get a neutral fallback.
export const SPECIES_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = new Proxy(
  _SPECIES_CONFIG_BASE,
  { get: (t, k: string) => t[k] ?? { label: k.charAt(0).toUpperCase() + k.slice(1), color: '#6b7280', bg: '#f5f5f5', border: '#e5e7eb' } }
);

export const BUILTIN_SPECIES_KEYS = ['sheep', 'cattle', 'chicken', 'goat', 'horse', 'alpaca', 'pig'] as const;

/** Always returns a valid config — falls back to a neutral style for unknown species. */
export function getSpeciesConfig(key: string) {
  return SPECIES_CONFIG[key] ?? { label: key.charAt(0).toUpperCase() + key.slice(1), color: '#6b7280', bg: '#f5f5f5', border: '#e5e7eb' };
}

export const HEALTH_STATUS_CONFIG: Record<HealthStatus, { label: string; color: string; bg: string; border: string }> = {
  healthy: { label: 'Healthy', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  monitor: { label: 'Monitor', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  sick:    { label: 'Sick',    color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
};

export const FEED_TYPE_CONFIG: Record<FeedType, { label: string; color: string; bg: string; border: string }> = {
  hay:        { label: 'Hay',        color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  grain:      { label: 'Grain',      color: '#ca8a04', bg: '#fefce8', border: '#fef08a' },
  pellet:     { label: 'Pellet',     color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  supplement: { label: 'Supplement', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  mineral:    { label: 'Mineral',    color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
};

export const TASK_CATEGORY_CONFIG: Record<TaskCategory, { label: string; color: string; bg: string; border: string }> = {
  feeding:     { label: 'Feeding',     color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  health:      { label: 'Health',      color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  maintenance: { label: 'Maintenance', color: '#6b7280', bg: '#f5f5f5', border: '#e5e7eb' },
  fencing:     { label: 'Fencing',     color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  pasture:     { label: 'Pasture',     color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  other:       { label: 'Other',       color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
};

export const HEALTH_EVENT_CONFIG: Record<HealthEventType, { label: string; color: string }> = {
  vaccination: { label: 'Vaccination', color: '#2563eb' },
  treatment:   { label: 'Treatment',   color: '#dc2626' },
  worming:     { label: 'Worming',     color: '#7c3aed' },
  checkup:     { label: 'Check-up',    color: '#15803d' },
  injury:      { label: 'Injury',      color: '#ea580c' },
};

export const PADDOCK_STATUS_CONFIG: Record<PaddockStatus, {
  label: string; fill: string; stroke: string; activeFill: string; color: string;
}> = {
  grazing:   { label: 'Grazing',   fill: '#dcfce7', stroke: '#16a34a', activeFill: '#bbf7d0', color: '#15803d' },
  resting:   { label: 'Resting',   fill: '#fef9c3', stroke: '#ca8a04', activeFill: '#fef08a', color: '#92400e' },
  reseeding: { label: 'Reseeding', fill: '#dbeafe', stroke: '#2563eb', activeFill: '#bfdbfe', color: '#1d4ed8' },
  cutting:   { label: 'Cutting',   fill: '#ffedd5', stroke: '#ea580c', activeFill: '#fed7aa', color: '#c2410c' },
};

export const GRASS_COVER_CONFIG: Record<GrassCover, { label: string; pct: number; color: string }> = {
  excellent: { label: 'Excellent', pct: 95, color: '#16a34a' },
  good:      { label: 'Good',      pct: 70, color: '#16a34a' },
  fair:      { label: 'Fair',      pct: 45, color: '#d97706' },
  low:       { label: 'Low',       pct: 15, color: '#dc2626' },
};

export const FENCE_CONDITION_CONFIG: Record<FenceCondition, { label: string; color: string }> = {
  good: { label: 'Good', color: '#16a34a' },
  fair: { label: 'Fair', color: '#d97706' },
  poor: { label: 'Poor', color: '#dc2626' },
  none: { label: 'No fence', color: '#9ca3af' },
};

export const TRANSFER_PURPOSE_CONFIG: Record<TransferPurpose, { label: string; color: string; bg: string; border: string }> = {
  sale:      { label: 'Sale',             color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  loan:      { label: 'Loan / Agistment', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  breeding:  { label: 'Breeding / Stud',  color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  slaughter: { label: 'Slaughter / Works',color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  gifted:    { label: 'Gifted',           color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  other:     { label: 'Other',            color: '#6b7280', bg: '#f5f5f5', border: '#e5e7eb' },
};

// ─── Mock Animals ────────────────────────────────────────────────────────────
export const ANIMALS: Animal[] = [
  // Sheep
  { id: 'a1',  name: 'Dolly',       tag: '#001',  species: 'sheep',   breed: 'Romney',        sex: 'female', dob: '2023-09-15', paddock: 'North Paddock',  weight: 62,  status: 'healthy' },
  { id: 'a2',  name: 'Maui',        tag: '#002',  species: 'sheep',   breed: 'Romney',        sex: 'male',   dob: '2022-08-20', paddock: 'North Paddock',  weight: 78,  status: 'healthy' },
  { id: 'a3',  name: 'Tui',         tag: '#003',  species: 'sheep',   breed: 'Romney',        sex: 'female', dob: '2024-09-10', paddock: 'South Paddock',  weight: 48,  status: 'monitor', notes: 'Limping on left rear hoof since 5 May. Zinc sulphate foot bath applied. Review 13 May.' },
  { id: 'a4',  name: 'Kea',         tag: '#004',  species: 'sheep',   breed: 'Perendale',     sex: 'female', dob: '2023-08-30', paddock: 'South Paddock',  weight: 55,  status: 'healthy' },
  { id: 'a5',  name: 'Hoani',       tag: '#005',  species: 'sheep',   breed: 'Romney',        sex: 'male',   dob: '2024-09-05', paddock: 'North Paddock',  weight: 45,  status: 'healthy' },
  // Cattle
  { id: 'a6',  name: 'Bella',       tag: '#C01',  species: 'cattle',  breed: 'Angus',         sex: 'female', dob: '2021-10-05', paddock: 'Back Bush',      weight: 520, status: 'healthy' },
  { id: 'a7',  name: 'Rex',         tag: '#C02',  species: 'cattle',  breed: 'Angus',         sex: 'male',   dob: '2025-11-20', paddock: 'Back Bush',      weight: 210, status: 'healthy', notes: 'Second Clostridial vaccination due 18 May.' },
  // Chickens
  { id: 'a8',  name: 'Henny Penny', tag: '#CH01', species: 'chicken', breed: 'ISA Brown',     sex: 'female', dob: '2025-03-01', paddock: 'Chicken Run',    status: 'healthy' },
  { id: 'a9',  name: 'Moa',         tag: '#CH02', species: 'chicken', breed: 'ISA Brown',     sex: 'female', dob: '2025-03-01', paddock: 'Chicken Run',    status: 'healthy' },
  { id: 'a10', name: 'Chook',       tag: '#CH03', species: 'chicken', breed: 'Australorp',    sex: 'female', dob: '2025-02-10', paddock: 'Chicken Run',    status: 'monitor', notes: 'Not laying for 2 weeks. Possible moult or stress.' },
  { id: 'a11', name: 'Nugget',      tag: '#CH04', species: 'chicken', breed: 'ISA Brown',     sex: 'female', dob: '2025-03-01', paddock: 'Chicken Run',    status: 'healthy' },
  // Goats
  { id: 'a12', name: 'Coco',        tag: '#G01',  species: 'goat',    breed: 'Boer',          sex: 'female', dob: '2023-05-12', paddock: 'House Paddock',  weight: 48,  status: 'healthy' },
  { id: 'a13', name: 'Billy',       tag: '#G02',  species: 'goat',    breed: 'Boer',          sex: 'male',   dob: '2023-05-15', paddock: 'House Paddock',  weight: 62,  status: 'monitor', notes: 'Eye discharge both eyes. Oxytetracycline ointment started 1 May. Review 8 May.' },
  // Horse
  { id: 'a14', name: 'Starlight',   tag: '#H01',  species: 'horse',   breed: 'Quarter Horse', sex: 'female', dob: '2018-09-14', paddock: 'South Paddock',  weight: 480, status: 'healthy' },
  // Alpacas
  { id: 'a15', name: 'Luna',        tag: '#AL01', species: 'alpaca',  breed: 'Huacaya',       sex: 'female', dob: '2022-11-08', paddock: 'North Paddock',  weight: 65,  status: 'healthy' },
  { id: 'a16', name: 'Orbit',       tag: '#AL02', species: 'alpaca',  breed: 'Huacaya',       sex: 'male',   dob: '2023-02-14', paddock: 'North Paddock',  weight: 60,  status: 'healthy' },
];

// ─── Mock Health Events ──────────────────────────────────────────────────────
export const HEALTH_EVENTS: HealthEvent[] = [
  { id: 'h1',  animalId: 'a3',  date: '2026-05-06', type: 'treatment',   description: 'Limping left rear hoof. Cleaned, checked for footrot. Zinc sulphate foot bath applied. No abscess found.', nextDue: '2026-05-13' },
  { id: 'h2',  animalId: 'a13', date: '2026-05-01', type: 'treatment',   description: 'Bilateral eye discharge. Pink eye (infectious keratoconjunctivitis). Oxytetracycline ointment applied to both eyes. Review in 1 week.', vet: 'Wairarapa Vets', cost: 65, nextDue: '2026-05-08' },
  { id: 'h3',  animalId: 'a14', date: '2026-04-28', type: 'vaccination', description: 'Annual Tetanus and Strangles booster.', vet: 'Equine Vets NZ', cost: 120, nextDue: '2027-04-28' },
  { id: 'h4',  animalId: 'a7',  date: '2026-04-20', type: 'vaccination', description: 'First Clostridial 3-in-1 vaccination. Second dose required in 4 weeks.', vet: 'Wairarapa Vets', cost: 35, nextDue: '2026-05-18' },
  { id: 'h5',  animalId: 'a12', date: '2026-04-20', type: 'checkup',     description: 'Hoof trimming and inspection. All four hooves in good condition. No issues found.', cost: 0 },
  { id: 'h6',  animalId: 'a15', date: '2026-04-10', type: 'checkup',     description: 'Annual shearing. Fleece weight 2.8kg. Good fibre quality. Nails trimmed.', cost: 45 },
  { id: 'h7',  animalId: 'a6',  date: '2026-04-15', type: 'vaccination', description: 'Annual Clostridial 5-in-1 (Covexin 8) vaccination.', vet: 'Wairarapa Vets', cost: 45, nextDue: '2027-04-15' },
  { id: 'h8',  animalId: 'a1',  date: '2026-04-01', type: 'worming',     description: 'Oral drench with Triguard Plus. Weight 62kg. Dose 6.2ml. FEC done prior, elevated worm count.', cost: 8 },
  { id: 'h9',  animalId: 'a14', date: '2026-03-20', type: 'checkup',     description: 'Dental float. All teeth in good condition. Next float recommended in 18 months.', vet: 'Equine Vets NZ', cost: 180 },
  { id: 'h10', animalId: 'a2',  date: '2026-03-15', type: 'worming',     description: 'Oral drench with Triguard Plus. Weight 78kg. Dose 7.8ml.', cost: 10 },
];

// ─── Mock Feed ───────────────────────────────────────────────────────────────
export const FEED_ITEMS: FeedItem[] = [
  { id: 'f1', name: 'Meadow Hay',      type: 'hay',        stockKg: 850,  initialStockKg: 1000, dailyUseKg: 25,   costPerKg: 0.28, reorderAtKg: 200,  supplier: 'Rangitane Feeds',    location: 'Main Barn' },
  { id: 'f2', name: 'Sheep Nuts',      type: 'pellet',     stockKg: 120,  initialStockKg: 200,  dailyUseKg: 8,    costPerKg: 0.95, reorderAtKg: 50,   supplier: 'Farmlands Te Ore Ore', location: 'Feed Shed' },
  { id: 'f3', name: 'Cattle Blend',    type: 'grain',      stockKg: 280,  initialStockKg: 400,  dailyUseKg: 12,   costPerKg: 0.72, reorderAtKg: 100,  supplier: 'Farmlands Te Ore Ore', location: 'Feed Shed' },
  { id: 'f4', name: 'Layer Pellets',   type: 'pellet',     stockKg: 45,   initialStockKg: 50,   dailyUseKg: 2.5,  costPerKg: 1.10, reorderAtKg: 20,   supplier: 'Mitre 10 Masterton',   location: 'Chicken Shed' },
  { id: 'f5', name: 'Horse Chaff',     type: 'hay',        stockKg: 180,  initialStockKg: 250,  dailyUseKg: 5,    costPerKg: 0.55, reorderAtKg: 40,   supplier: 'Equine Essentials NZ', location: 'Horse Stable' },
  { id: 'f6', name: 'Goat Mix',        type: 'grain',      stockKg: 38,   initialStockKg: 50,   dailyUseKg: 3,    costPerKg: 1.20, reorderAtKg: 30,   supplier: 'Farmlands Te Ore Ore', location: 'Feed Shed' },
  { id: 'f7', name: 'Limestone Flour', type: 'mineral',    stockKg: 60,   initialStockKg: 60,   dailyUseKg: 0.5,  costPerKg: 0.45, reorderAtKg: 15,   supplier: 'Farmlands Te Ore Ore', location: 'Feed Shed' },
  { id: 'f8', name: 'Alpaca Pellets',  type: 'supplement', stockKg: 75,   initialStockKg: 100,  dailyUseKg: 1.5,  costPerKg: 2.20, reorderAtKg: 25,   supplier: 'Alpaca NZ Supplies',   location: 'Feed Shed' },
];

// ─── Mock Tasks ──────────────────────────────────────────────────────────────
export const TASKS: Task[] = [
  // Overdue
  { id: 't1', title: 'Drench all sheep, overdue',              category: 'health',      dueDate: '2026-05-01', completed: false, priority: 'high',   notes: 'All 5 sheep due for oral drench with Triguard Plus. FEC first.' },
  { id: 't2', title: 'Check North Paddock boundary fence',     category: 'fencing',     dueDate: '2026-05-03', completed: false, priority: 'medium', notes: 'Possible gap spotted near the creek crossing.' },
  // Today
  { id: 't3', title: 'Morning feed, all stock',                category: 'feeding',     dueDate: '2026-05-08', completed: false, priority: 'high',   recurring: 'daily' },
  { id: 't4', title: 'Check all water troughs',                category: 'maintenance', dueDate: '2026-05-08', completed: false, priority: 'medium', recurring: 'daily' },
  { id: 't5', title: 'Billy: review pink eye treatment',       category: 'health',      dueDate: '2026-05-08', completed: false, priority: 'high',   notes: 'Review oxytetracycline ointment started 1 May. Call vet if no improvement.' },
  // Upcoming
  { id: 't6', title: 'Order sheep nuts, stock low',            category: 'feeding',     dueDate: '2026-05-09', completed: false, priority: 'high',   notes: 'Only 15 days supply remaining. Ring Farmlands.' },
  { id: 't7', title: 'Order goat mix, running low',            category: 'feeding',     dueDate: '2026-05-10', completed: false, priority: 'medium', notes: 'About 13 days left. Ring Farmlands Te Ore Ore.' },
  { id: 't8', title: 'Rotate cattle to South Paddock',         category: 'pasture',     dueDate: '2026-05-13', completed: false, priority: 'medium', notes: 'Back Bush grass getting short. Let it recover.' },
  { id: 't9', title: 'Clean out chicken coop',                 category: 'maintenance', dueDate: '2026-05-14', completed: false, priority: 'low',    recurring: 'weekly' },
  { id: 't10', title: 'Rex: second Clostridial vaccination',   category: 'health',      dueDate: '2026-05-18', completed: false, priority: 'high',   notes: 'Second 3-in-1 dose. Book with Wairarapa Vets. Due date from vet card.' },
  { id: 't11', title: 'Hay delivery, ring Rangitane Feeds',    category: 'feeding',     dueDate: '2026-05-20', completed: false, priority: 'medium', notes: 'Order 20+ bales large round. Current stock ok for 34 days but good to plan ahead.' },
  { id: 't12', title: 'Farrier visit, Starlight',              category: 'health',      dueDate: '2026-05-22', completed: false, priority: 'high',   notes: 'Booked with Tom Farrier 022 456 7890. 6-week trim cycle.' },
  { id: 't13', title: 'Tui hoof re-check',                     category: 'health',      dueDate: '2026-05-13', completed: false, priority: 'high',   notes: 'Follow up on zinc sulphate foot bath treatment from 6 May.' },
  // Completed
  { id: 't14', title: 'Vaccinate Bella, annual 5-in-1',        category: 'health',      dueDate: '2026-04-15', completed: true,  completedDate: '2026-04-15', priority: 'high' },
  { id: 't15', title: 'Shear alpacas',                         category: 'other',       dueDate: '2026-04-10', completed: true,  completedDate: '2026-04-10', priority: 'medium' },
  { id: 't16', title: 'Drench Dolly, Romney #001',             category: 'health',      dueDate: '2026-04-01', completed: true,  completedDate: '2026-04-01', priority: 'high' },
  { id: 't17', title: 'Trim Coco hooves',                      category: 'health',      dueDate: '2026-04-20', completed: true,  completedDate: '2026-04-20', priority: 'low' },
  { id: 't18', title: 'Starlight annual vaccinations',         category: 'health',      dueDate: '2026-04-28', completed: true,  completedDate: '2026-04-28', priority: 'high' },
];

// ─── Monthly Feed Spend ──────────────────────────────────────────────────────
export const MONTHLY_FEED_SPEND = [
  { month: 'Nov', cost: 295 },
  { month: 'Dec', cost: 315 },
  { month: 'Jan', cost: 370 },
  { month: 'Feb', cost: 405 },
  { month: 'Mar', cost: 440 },
  { month: 'Apr', cost: 480 },
  { month: 'May', cost: 210 },
];

// ─── Mock Paddocks ───────────────────────────────────────────────────────────
export const PADDOCKS: Paddock[] = [
  {
    id: 'p-chicken',
    name: 'Chicken Run',
    hectares: 0.1,
    status: 'grazing',
    grassCover: 'fair',
    fenceCondition: 'good',
    waterSource: 'Automatic drinker',
    notes: 'Chicken wire perimeter. Inspect for holes monthly. Lay mash replenished in feeder at north end.',
    lastRotated: '2026-03-01',
  },
  {
    id: 'p-house',
    name: 'House Paddock',
    hectares: 1.8,
    status: 'grazing',
    grassCover: 'good',
    fenceCondition: 'good',
    waterSource: 'Trough (mains feed)',
    notes: 'Close to house, easy daily monitoring. Billy showing eye issue, being checked daily.',
    lastRotated: '2026-03-01',
  },
  {
    id: 'p-north',
    name: 'North Paddock',
    hectares: 3.2,
    status: 'grazing',
    grassCover: 'good',
    fenceCondition: 'fair',
    waterSource: 'Trough (mains feed)',
    notes: 'Possible gap in south-east fence near creek crossing, inspect this week. Sheep and alpacas grazing well.',
    lastRotated: '2026-02-15',
  },
  {
    id: 'p-backbush',
    name: 'Back Bush',
    hectares: 2.4,
    status: 'grazing',
    grassCover: 'excellent',
    fenceCondition: 'fair',
    waterSource: 'Natural stream + supplemental trough',
    notes: 'Native bush regenerating in rear third. Good grass cover. Check stream-crossing fence after heavy rain. Possum trap line runs along eastern boundary.',
    lastRotated: '2026-01-20',
  },
  {
    id: 'p-south',
    name: 'South Paddock',
    hectares: 3.5,
    status: 'grazing',
    grassCover: 'fair',
    fenceCondition: 'good',
    waterSource: 'Trough (mains feed)',
    notes: 'Grass cover getting short, plan rotation to Back Bush in 2 weeks. Horse shelter in SW corner.',
    lastRotated: '2026-01-10',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function getAnimalAge(dob: string): string {
  const birth = new Date(dob + 'T00:00:00');
  const now   = new Date(TODAY + 'T00:00:00');
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (months < 1)  return '< 1mo';
  if (months < 12) return `${months}mo`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y}y ${m}mo` : `${y}y`;
}

export function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function daysDiff(dateStr: string): number {
  const then = new Date(dateStr + 'T00:00:00').getTime();
  const now  = new Date(TODAY  + 'T00:00:00').getTime();
  return Math.round((then - now) / 86400000);
}

export function feedDaysRemaining(item: FeedItem): number {
  return Math.floor(item.stockKg / item.dailyUseKg);
}

export function feedStockPct(item: FeedItem): number {
  // Fallback: 90 days of supply = full. Never use stockKg as denominator (gives 100% always).
  const full = item.initialStockKg || (item.dailyUseKg * 90) || 1;
  return Math.min(100, Math.max(0, Math.round((item.stockKg / full) * 100)));
}

export function isLowStock(item: FeedItem): boolean {
  return item.stockKg <= item.reorderAtKg;
}
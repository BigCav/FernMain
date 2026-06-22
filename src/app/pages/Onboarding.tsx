import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowRight, ArrowLeft, Check,
  PawPrint, Wheat, ClipboardCheck, CloudRain, DollarSign,
  Heart, Scale, Baby, ShieldCheck, Cake, Users,
  Leaf, BookOpen, Sprout, Home, Lock, Zap,
} from 'lucide-react';
import { DropdownSelect } from '../components/DropdownSelect';
import { useProfile } from '../context/ProfileContext';
import { DASHBOARD_WIDGETS, PLUS_WIDGET_KEYS } from '../hooks/useDashboardPrefs';
import { apiSet } from '../lib/api';

const TOTAL_STEPS = 7;
const STEP_LABELS = ['Welcome', 'Your block', 'Animals', 'Features', 'Dashboard', 'NZ info', 'Done'];

const NZ_REGIONS = [
  'Northland', 'Auckland', 'Waikato', 'Bay of Plenty', 'Gisborne',
  "Hawke's Bay", 'Taranaki', 'Manawatū-Whanganui', 'Wellington',
  'Tasman', 'Nelson', 'Marlborough', 'West Coast', 'Canterbury',
  'Otago', 'Southland',
];

const NZ_CITIES: Record<string, string[]> = {
  'Northland':           ['Whangarei', 'Kerikeri', 'Kaitaia', 'Dargaville', 'Paihia', 'Mangawhai', 'Wellsford'],
  'Auckland':            ['Auckland City', 'Manukau', 'North Shore', 'Waitakere', 'Pukekohe', 'Warkworth', 'Helensville', 'Papakura'],
  'Waikato':             ['Hamilton', 'Cambridge', 'Te Awamutu', 'Huntly', 'Matamata', 'Te Kuiti', 'Tokoroa', 'Morrinsville', 'Raglan'],
  'Bay of Plenty':       ['Tauranga', 'Rotorua', 'Whakatane', 'Opotiki', 'Te Puke', 'Katikati', 'Edgecumbe', 'Kawerau'],
  'Gisborne':            ['Gisborne', 'Ruatoria', 'Tolaga Bay', 'Whatatutu'],
  "Hawke's Bay":         ['Napier', 'Hastings', 'Havelock North', 'Waipawa', 'Waipukurau', 'Wairoa', 'Taradale'],
  'Taranaki':            ['New Plymouth', 'Hawera', 'Stratford', 'Inglewood', 'Opunake', 'Eltham', 'Waitara'],
  'Manawatū-Whanganui':  ['Palmerston North', 'Whanganui', 'Levin', 'Feilding', 'Bulls', 'Marton', 'Dannevirke', 'Foxton', 'Pahiatua'],
  'Wellington':          ['Wellington', 'Lower Hutt', 'Upper Hutt', 'Porirua', 'Masterton', 'Kapiti', 'Carterton', 'Martinborough'],
  'Tasman':              ['Nelson', 'Richmond', 'Motueka', 'Takaka', 'Murchison', 'Brightwater'],
  'Nelson':              ['Nelson', 'Richmond', 'Stoke', 'Wakefield'],
  'Marlborough':         ['Blenheim', 'Picton', 'Renwick', 'Seddon', 'Havelock', 'Ward'],
  'West Coast':          ['Greymouth', 'Westport', 'Hokitika', 'Reefton', 'Karamea', 'Ross'],
  'Canterbury':          ['Christchurch', 'Rangiora', 'Rolleston', 'Ashburton', 'Timaru', 'Kaikoura', 'Darfield', 'Oxford', 'Methven', 'Geraldine'],
  'Otago':               ['Dunedin', 'Queenstown', 'Alexandra', 'Cromwell', 'Wanaka', 'Oamaru', 'Balclutha', 'Milton', 'Mosgiel', 'Clyde'],
  'Southland':           ['Invercargill', 'Gore', 'Winton', 'Riverton', 'Lumsden', 'Te Anau', 'Bluff', 'Otautau'],
};

const SPECIES_OPTIONS = [
  { key: 'sheep',   label: 'Sheep',    emoji: '🐑', desc: 'Ewes, rams, lambs' },
  { key: 'cattle',  label: 'Cattle',   emoji: '🐄', desc: 'Cows, bulls, calves' },
  { key: 'goat',    label: 'Goats',    emoji: '🐐', desc: 'Dairy or meat goats' },
  { key: 'pig',     label: 'Pigs',     emoji: '🐷', desc: 'Sows, boars, weaners' },
  { key: 'chicken', label: 'Chickens', emoji: '🐔', desc: 'Layers, meat birds' },
  { key: 'horse',   label: 'Horses',   emoji: '🐴', desc: 'Horses & ponies' },
  { key: 'alpaca',  label: 'Alpacas',  emoji: '🦙', desc: 'Alpacas & llamas' },
  { key: 'deer',    label: 'Deer',     emoji: '🦌', desc: 'Red, fallow, wapiti' },
];

const BLOCK_TYPES = [
  { key: 'lifestyle', label: 'Lifestyle Block',         desc: 'Mixed animals, personal use',     Icon: Home   },
  { key: 'farm',      label: 'Small Farm',              desc: 'Commercial or semi-commercial',   Icon: Wheat  },
  { key: 'hobby',     label: 'Hobby Farm',              desc: 'Passion project, pets & produce', Icon: Sprout },
  { key: 'orchard',   label: 'Orchard / Market Garden', desc: 'Primarily horticulture',          Icon: Leaf   },
];

const FEATURES = [
  { key: 'health',      label: 'Health & vet records', Icon: Heart,          desc: 'Treatments, injuries, vet visits',  plus: false },
  { key: 'weights',     label: 'Weight tracking',      Icon: Scale,          desc: 'Monitor growth & condition',        plus: false },
  { key: 'breeding',    label: 'Breeding records',     Icon: Baby,           desc: 'Matings, due dates, offspring',     plus: false },
  { key: 'withholding', label: 'Withholding periods',  Icon: ShieldCheck,    desc: 'WHP compliance for meat & milk',    plus: false },
  { key: 'feed',        label: 'Feed & pasture',       Icon: Wheat,          desc: 'Feed orders, paddock consumption',  plus: false },
  { key: 'tasks',       label: 'Tasks & reminders',    Icon: ClipboardCheck, desc: 'Seasonal to-dos & alerts',          plus: false },
  { key: 'finance',     label: 'Income & expenses',    Icon: DollarSign,     desc: 'Livestock sales, vet costs',        plus: true  },
  { key: 'rainfall',    label: 'Rainfall & water',     Icon: CloudRain,      desc: 'Dry spell tracking, tank levels',   plus: true  },
];

const NZ_TIPS = [
  { Icon: ShieldCheck, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', title: 'NAIT compliance',        body: 'Cattle and deer must be registered with NAIT. Fern helps you track movements and keep records ready for reporting.' },
  { Icon: Leaf,        color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', title: 'Withholding periods',    body: 'After drenching or treating, Fern counts down WHP automatically so you never sell or milk too early.' },
  { Icon: Cake,        color: '#9333ea', bg: '#fdf4ff', border: '#e9d5ff', title: 'Birthdays & due dates', body: 'Fern alerts you to upcoming birthdays, lambing dates, and seasonal events so nothing slips in a busy week.' },
  { Icon: Users,       color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', title: 'Mob management',        body: 'Group animals into mobs for bulk treatments, grazing rotation planning, and easier record-keeping.' },
];

// Initial dashboard widget state — first 4 on, rest off
const INITIAL_WIDGET_PREFS: Record<string, boolean> = {
  birthday:     true,
  weather:      true,
  tasks:        true,
  animalHealth: true,
  idleAlerts:   false,
  weightAlerts: false,
  breeding:     false,
  withholding:  false,
  healthChecks: false,
  recentEvents: false,
  rainfall:     false,
  finance:      false,
};

const INPUT = 'w-full px-4 py-3 rounded-xl border border-gray-200 outline-none bg-white text-gray-900 transition-colors focus:border-orange-400 text-[14px]';

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
        const done    = i < step - 1;
        const current = i === step - 1;
        return (
          <div key={i} className="rounded-full transition-all duration-500" style={{
            height: '3px', flex: current ? 2.5 : 1,
            background: done ? '#ea580c' : current ? '#ea580c' : '#e5e7eb',
            opacity: done ? 0.45 : 1,
          }} />
        );
      })}
    </div>
  );
}

export function Onboarding() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useProfile();

  const [step,      setStep]      = useState(1);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [animKey,   setAnimKey]   = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [ownerName, setOwnerName] = useState(profile.name     !== 'Sarah Johnson'  ? profile.name     : '');
  const [blockName, setBlockName] = useState(profile.property !== 'Fernside Block' ? profile.property : '');
  const [region,    setRegion]    = useState('');
  const [city,      setCity]      = useState('');
  const [blockType, setBlockType] = useState('');

  const [selectedSpecies,  setSelectedSpecies]  = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [widgetPrefs,      setWidgetPrefs]      = useState<Record<string, boolean>>(INITIAL_WIDGET_PREFS);

  function toggleSpecies(key: string) { setSelectedSpecies(s => s.includes(key) ? s.filter(k => k !== key) : [...s, key]); }
  function toggleFeature(key: string) { setSelectedFeatures(s => s.includes(key) ? s.filter(k => k !== key) : [...s, key]); }
  function toggleWidget(key: string)  { setWidgetPrefs(p => ({ ...p, [key]: !p[key] })); }

  function go(next: number) {
    setDirection(next > step ? 'forward' : 'back');
    setStep(next);
    setAnimKey(k => k + 1);
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }

  function handleNext() {
    if (step === 2 && ownerName.trim()) {
      updateProfile({
        name:     ownerName.trim(),
        property: blockName.trim() || profile.property,
        location: city && region ? `${city}, ${region}` : region || profile.location,
        region, city,
      });
    }
    if (step === 5) {
      apiSet('dashboardPrefs', widgetPrefs);
    }
    go(step + 1);
  }

  function handleBack()   { go(step - 1); }
  function handleFinish(to = '/') {
    updateProfile({ onboardingComplete: true });
    localStorage.setItem('fern_nav_tour_pending', '1');
    navigate(to);
  }

  const canNext = step !== 2 || (
    ownerName.trim().length > 0 &&
    blockName.trim().length > 0 &&
    blockType.length > 0 &&
    region.length > 0 &&
    city.length > 0
  );

  const slideStyle: React.CSSProperties = {
    animation: `${direction === 'forward' ? 'stepSlideIn' : 'stepSlideInBack'} 0.3s cubic-bezier(0.4,0,0.2,1) forwards`,
  };

  return (
    <div className="flex flex-col" style={{ height: '100dvh', background: '#f7f5f2', fontFamily: "'Inter', system-ui, sans-serif" }}>

      <style>{`
        @keyframes stepSlideIn     { from { opacity:0; transform:translateX(28px);  } to { opacity:1; transform:translateX(0); } }
        @keyframes stepSlideInBack { from { opacity:0; transform:translateX(-28px); } to { opacity:1; transform:translateX(0); } }
        @keyframes popIn           { 0%{opacity:0;transform:scale(0.85)} 60%{transform:scale(1.06)} 100%{opacity:1;transform:scale(1)} }
      `}</style>

      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-4 pb-3 md:px-8 md:pt-5" style={{ background: '#f7f5f2', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="max-w-lg md:max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#ea580c' }}>
              <Leaf width={13} height={13} style={{ color: '#fff' }} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.02em' }}>
              {STEP_LABELS[step - 1]}
            </span>
          </div>
          <ProgressBar step={step} />
        </div>
      </div>

      {/* Scrollable content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-lg md:max-w-2xl mx-auto px-5 pt-8 pb-6 md:px-6">
          <div key={animKey} style={slideStyle}>

            {/* Step 1: Welcome */}
            {step === 1 && (
              <div>
                <div className="rounded-3xl px-6 pt-8 pb-7 mb-6"
                  style={{ background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)', boxShadow: '0 8px 32px rgba(234,88,12,0.28)' }}>
                  <p style={{ fontSize: '26px', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '10px' }}>
                    Your lifestyle block,<br />beautifully managed.
                  </p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.80)', lineHeight: 1.6 }}>
                    Built for New Zealand. From animals and tasks<br />to finance and weather, all in one place.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { Icon: PawPrint,       color: '#ea580c', bg: '#fff7ed', label: 'Animal records',  desc: 'Health, weight & breeding' },
                    { Icon: ClipboardCheck, color: '#16a34a', bg: '#f0fdf4', label: 'Smart tasks',      desc: 'Seasonal reminders & alerts' },
                    { Icon: ShieldCheck,    color: '#0284c7', bg: '#f0f9ff', label: 'WHP compliance',   desc: 'Withholding period tracking' },
                    { Icon: CloudRain,      color: '#9333ea', bg: '#fdf4ff', label: 'NZ-first design',  desc: 'Built for Kiwi conditions' },
                  ].map(({ Icon, color, bg, label, desc }) => (
                    <div key={label} className="p-4 rounded-2xl" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
                        <Icon width={15} height={15} style={{ color }} />
                      </div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginBottom: '2px' }}>{label}</p>
                      <p style={{ fontSize: '11px', color: '#9ca3af', lineHeight: 1.5 }}>{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Your block */}
            {step === 2 && (
              <div>
                <p style={{ fontSize: '24px', fontWeight: 900, color: '#111', letterSpacing: '-0.03em', marginBottom: '4px' }}>About you & your block</p>
                <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '28px', lineHeight: 1.55 }}>Helps Fern personalise your dashboard and reminders.</p>
                <div className="space-y-4">
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your name *</label>
                    <input className={INPUT} placeholder="e.g. Sarah Johnson" value={ownerName} onChange={e => setOwnerName(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Block / property name *</label>
                    <input className={INPUT} placeholder="e.g. Home, Fernside Block" value={blockName} onChange={e => setBlockName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Region *</label>
                      <DropdownSelect value={region} onChange={v => { setRegion(v); setCity(''); }} options={NZ_REGIONS} placeholder="Select…" />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>City / Town *</label>
                      <DropdownSelect value={city} onChange={setCity} options={NZ_CITIES[region] ?? []} placeholder={region ? 'Select…' : 'Select region first'} disabled={!region} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Block type *</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {BLOCK_TYPES.map(bt => {
                        const active = blockType === bt.key;
                        return (
                          <button key={bt.key} onClick={() => setBlockType(bt.key)} className="p-3.5 rounded-2xl text-left transition-all relative"
                            style={{ border: `2px solid ${active ? '#ea580c' : '#ebebeb'}`, background: active ? '#fff7ed' : '#fff' }}>
                            {active && (
                              <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#ea580c', animation: 'popIn 0.25s ease forwards' }}>
                                <Check width={10} height={10} strokeWidth={2.5} style={{ color: '#fff' }} />
                              </div>
                            )}
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2" style={{ background: active ? '#fed7aa' : '#f5f5f4' }}>
                              <bt.Icon width={13} height={13} style={{ color: active ? '#ea580c' : '#9ca3af' }} />
                            </div>
                            <p style={{ fontSize: '12px', fontWeight: 700, color: active ? '#c2410c' : '#111' }}>{bt.label}</p>
                            <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px', lineHeight: 1.4 }}>{bt.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Animals */}
            {step === 3 && (
              <div>
                <p style={{ fontSize: '24px', fontWeight: 900, color: '#111', letterSpacing: '-0.03em', marginBottom: '4px' }}>What animals do you have?</p>
                <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '24px', lineHeight: 1.55 }}>Select all that apply, you can always add more later.</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {SPECIES_OPTIONS.map(s => {
                    const active = selectedSpecies.includes(s.key);
                    return (
                      <button key={s.key} onClick={() => toggleSpecies(s.key)} className="p-4 rounded-2xl text-left transition-all relative"
                        style={{ border: `2px solid ${active ? '#ea580c' : '#ebebeb'}`, background: active ? '#fff7ed' : '#fff' }}>
                        {active && (
                          <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#ea580c', animation: 'popIn 0.25s ease forwards' }}>
                            <Check width={11} height={11} strokeWidth={2.5} style={{ color: '#fff' }} />
                          </div>
                        )}
                        <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px', lineHeight: 1 }}>{s.emoji}</span>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: active ? '#c2410c' : '#111' }}>{s.label}</p>
                        <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{s.desc}</p>
                      </button>
                    );
                  })}
                </div>
                {selectedSpecies.length > 0 && (
                  <div className="flex items-center gap-2 mt-4 p-3.5 rounded-2xl" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#ea580c' }}>
                      <Check width={11} height={11} strokeWidth={2.5} style={{ color: '#fff' }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#9a3412' }}>{selectedSpecies.length} species selected</span>
                    <span style={{ fontSize: '11px', color: '#c2410c', marginLeft: 'auto' }}>
                      {selectedSpecies.map(k => SPECIES_OPTIONS.find(s => s.key === k)?.emoji).join(' ')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Features */}
            {step === 4 && (
              <div>
                <p style={{ fontSize: '24px', fontWeight: 900, color: '#111', letterSpacing: '-0.03em', marginBottom: '4px' }}>What matters most to you?</p>
                <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '24px', lineHeight: 1.55 }}>Select the features you care about most. This helps Fern surface the right things first.</p>
                <div className="space-y-2">
                  {FEATURES.filter(f => !f.plus).map(({ key, label, Icon, desc }) => {
                    const active = selectedFeatures.includes(key);
                    return (
                      <button key={key} onClick={() => toggleFeature(key)} className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
                        style={{ border: `1.5px solid ${active ? '#ea580c50' : '#ebebeb'}`, background: active ? '#fff7ed' : '#fff' }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all" style={{ background: active ? '#fed7aa' : '#f5f5f4' }}>
                          <Icon width={16} height={16} style={{ color: active ? '#ea580c' : '#9ca3af' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p style={{ fontSize: '13px', fontWeight: 700, color: active ? '#111' : '#374151' }}>{label}</p>
                          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>{desc}</p>
                        </div>
                        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200"
                          style={{ borderColor: active ? '#ea580c' : '#d1d5db', background: active ? '#ea580c' : 'transparent' }}>
                          {active && <Check width={10} height={10} strokeWidth={3} style={{ color: '#fff' }} />}
                        </div>
                      </button>
                    );
                  })}

                  {!profile.fernPlus && (
                    <div className="mt-3 pt-3" style={{ borderTop: '1px dashed #e5e7eb' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Zap width={11} height={11} style={{ color: '#ea580c' }} />
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Fern Plus features</span>
                      </div>
                      {FEATURES.filter(f => f.plus).map(({ key, label, Icon, desc }) => (
                        <div key={key} className="w-full flex items-center gap-4 p-4 rounded-2xl mb-2 opacity-60" style={{ border: '1.5px solid #ebebeb', background: '#fafaf9' }}>
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#f5f5f4' }}>
                            <Icon width={16} height={16} style={{ color: '#9ca3af' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>{label}</p>
                            <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>{desc}</p>
                          </div>
                          <Lock width={14} height={14} style={{ color: '#d1d5db', flexShrink: 0 }} />
                        </div>
                      ))}
                    </div>
                  )}

                  {profile.fernPlus && FEATURES.filter(f => f.plus).map(({ key, label, Icon, desc }) => {
                    const active = selectedFeatures.includes(key);
                    return (
                      <button key={key} onClick={() => toggleFeature(key)} className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
                        style={{ border: `1.5px solid ${active ? '#ea580c50' : '#ebebeb'}`, background: active ? '#fff7ed' : '#fff' }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all" style={{ background: active ? '#fed7aa' : '#f5f5f4' }}>
                          <Icon width={16} height={16} style={{ color: active ? '#ea580c' : '#9ca3af' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p style={{ fontSize: '13px', fontWeight: 700, color: active ? '#111' : '#374151' }}>{label}</p>
                          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>{desc}</p>
                        </div>
                        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200"
                          style={{ borderColor: active ? '#ea580c' : '#d1d5db', background: active ? '#ea580c' : 'transparent' }}>
                          {active && <Check width={10} height={10} strokeWidth={3} style={{ color: '#fff' }} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 5: Dashboard widgets — uses LOCAL state, not stored prefs */}
            {step === 5 && (
              <div>
                <p style={{ fontSize: '24px', fontWeight: 900, color: '#111', letterSpacing: '-0.03em', marginBottom: '4px' }}>Customise your dashboard</p>
                <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '24px', lineHeight: 1.55 }}>Pick the widgets you want to see. You can change these anytime in Settings.</p>
                <div className="space-y-2">
                  {DASHBOARD_WIDGETS
                    .filter(w => profile.fernPlus || !PLUS_WIDGET_KEYS.has(w.key))
                    .map(({ key, label, desc }) => {
                      const active = widgetPrefs[key] ?? false;
                      return (
                        <button key={key} onClick={() => toggleWidget(key)} className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
                          style={{ border: `1.5px solid ${active ? '#ea580c50' : '#ebebeb'}`, background: active ? '#fff7ed' : '#fff' }}>
                          <div className="flex-1 min-w-0">
                            <p style={{ fontSize: '13px', fontWeight: 700, color: active ? '#111' : '#374151' }}>{label}</p>
                            <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>{desc}</p>
                          </div>
                          <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200"
                            style={{ borderColor: active ? '#ea580c' : '#d1d5db', background: active ? '#ea580c' : 'transparent' }}>
                            {active && <Check width={10} height={10} strokeWidth={3} style={{ color: '#fff' }} />}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Step 6: NZ tips */}
            {step === 6 && (
              <div>
                <p style={{ fontSize: '24px', fontWeight: 900, color: '#111', letterSpacing: '-0.03em', marginBottom: '4px' }}>Built for NZ farmers</p>
                <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '28px', lineHeight: 1.55 }}>A few things Fern helps you stay on top of that matter in New Zealand.</p>
                <div className="space-y-3">
                  {NZ_TIPS.map(({ Icon, color, bg, border, title, body }, idx) => (
                    <div key={title} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${border}`, animationDelay: `${idx * 0.06}s` }}>
                      <div className="px-4 pt-4 pb-3.5 flex gap-3.5" style={{ background: bg }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: color + '22' }}>
                          <Icon width={18} height={18} style={{ color }} />
                        </div>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginBottom: '5px' }}>{title}</p>
                          <p style={{ fontSize: '12px', color: '#4b5563', lineHeight: 1.6 }}>{body}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 p-4 rounded-2xl flex items-center gap-3" style={{ background: '#111', border: '1px solid #1f2937' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#ea580c' }}>
                    <Leaf width={14} height={14} style={{ color: '#fff' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '1px' }}>Free to use, always</p>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>Core features are free forever. Fern Plus ($16/mo) adds finance, rainfall, season planning & more.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 7: Done */}
            {step === 7 && (
              <div>
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#16a34a' }}>
                      <Check width={9} height={9} strokeWidth={3} style={{ color: '#fff' }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#15803d' }}>Setup complete</span>
                  </div>
                  <p style={{ fontSize: '26px', fontWeight: 900, color: '#111', letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: '8px' }}>
                    {ownerName ? `Welcome, ${ownerName.split(' ')[0]}.` : 'You\'re all set!'}
                  </p>
                  <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: 1.6 }}>
                    Fern is ready to go. A good place to start:
                  </p>
                </div>

                <div className="space-y-2">
                  {[
                    { Icon: PawPrint,       color: '#ea580c', bg: '#fff7ed', label: 'Add your animals',      desc: 'Register your stock with age, breed and status', to: '/animals' },
                    { Icon: ClipboardCheck, color: '#16a34a', bg: '#f0fdf4', label: 'Create your first task', desc: 'Set a seasonal reminder or to-do',               to: '/tasks'   },
                    { Icon: BookOpen,       color: '#9333ea', bg: '#fdf4ff', label: 'Start your journal',     desc: 'Log notes, observations and weather events',      to: '/journal' },
                  ].map(({ Icon, color, bg, label, desc, to }) => (
                    <button key={label} onClick={() => handleFinish(to)} className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all group hover:brightness-[0.97]"
                      style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                        <Icon width={16} height={16} style={{ color }} />
                      </div>
                      <div className="flex-1 text-left">
                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>{label}</p>
                        <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>{desc}</p>
                      </div>
                      <ArrowRight width={14} height={14} style={{ color: '#d1d5db', flexShrink: 0 }} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-5 py-4 md:px-8" style={{ background: '#f7f5f2', borderTop: '1px solid rgba(0,0,0,0.06)', paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
        <div className="max-w-lg md:max-w-2xl mx-auto flex gap-3">
          {step > 1 && (
            <button onClick={handleBack} className="flex items-center gap-2 px-5 py-3.5 rounded-xl transition-all flex-shrink-0 hover:bg-gray-200"
              style={{ background: '#ebebeb', color: '#374151', fontSize: '14px', fontWeight: 600 }}>
              <ArrowLeft width={14} height={14} />
              Back
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button onClick={handleNext} disabled={!canNext} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#ea580c', color: '#fff', fontSize: '14px', fontWeight: 700 }}>
              {step === 1 ? "Let's get started" : step === 6 ? 'Almost done' : 'Continue'}
              <ArrowRight width={15} height={15} />
            </button>
          ) : (
            <button onClick={() => handleFinish()} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl transition-all active:scale-[0.98]"
              style={{ background: '#ea580c', color: '#fff', fontSize: '14px', fontWeight: 700 }}>
              Go to dashboard
              <ArrowRight width={15} height={15} />
            </button>
          )}
        </div>
      </div>

    </div>
  );
}

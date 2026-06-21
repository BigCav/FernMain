import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useAnimals } from '../context/AnimalsContext';
import { useFeed } from '../context/FeedContext';
import { useTasks } from '../context/TasksContext';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';
import { DropdownSelect } from '../components/DropdownSelect';
import {
  SPECIES_CONFIG, HEALTH_STATUS_CONFIG, isLowStock, daysDiff,
} from '../data/blockData';
import { usePaddocks } from '../context/PaddocksContext';
import {
  MapPin, PawPrint, Map, Wheat, ClipboardCheck,
  ArrowRight, AlertTriangle, Pencil, Check, X, LogOut, Shield, Zap, Star,
} from 'lucide-react';

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

const INPUT = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none bg-white text-gray-900 transition-colors focus:border-orange-400 text-[13px]';

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className="flex items-center justify-between py-3"
      style={last ? {} : { borderBottom: '1px solid #f5f4f0' }}
    >
      <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '13px', color: '#111', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, sub, accent, to,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
  to?: string;
}) {
  const inner = (
    <div
      className="rounded-2xl p-4 flex flex-col gap-1 h-full"
      style={{ background: '#fefefe', border: accent ? '1px solid #fed7aa' : '1px solid #ebebeb' }}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon width={13} height={13} style={{ color: accent ? '#ea580c' : '#9ca3af' }} />
        <p style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {label}
        </p>
      </div>
      <p style={{ fontSize: '26px', fontWeight: 800, color: accent ? '#ea580c' : '#111', letterSpacing: '-0.04em', lineHeight: 1 }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{sub}</p>}
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        style={{ textDecoration: 'none', display: 'block' }}
        className="rounded-2xl transition-all hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
      >
        {inner}
      </Link>
    );
  }
  return inner;
}

export function Profile() {
  const { animals } = useAnimals();
  const { feedItems } = useFeed();
  const { tasks } = useTasks();
  const { profile, updateProfile } = useProfile();
  const { user, signOut } = useAuth();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  async function handleLogout() {
    setShowLogoutConfirm(true);
  }

  async function confirmLogout() {
    setShowLogoutConfirm(false);
    await signOut();
  }
  const { paddocks } = usePaddocks();

  // ── Edit state ──
  const [editing, setEditing] = useState(false);
  const [draftName,     setDraftName]     = useState('');
  const [draftProperty, setDraftProperty] = useState('');
  const [draftRegion,   setDraftRegion]   = useState('');
  const [draftCity,     setDraftCity]     = useState('');

  function startEdit() {
    setDraftName(profile.name);
    setDraftProperty(profile.property);
    setDraftRegion(profile.region || '');
    setDraftCity(profile.city || '');
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  function saveEdit() {
    updateProfile({
      name:     draftName.trim()     || profile.name,
      property: draftProperty.trim() || profile.property,
      region:   draftRegion,
      city:     draftCity,
      location: draftCity && draftRegion ? `${draftCity}, ${draftRegion}` : draftRegion || profile.location,
    });
    setEditing(false);
  }

  // ── Derived stats ──
  const totalHa      = useMemo(() => paddocks.reduce((s, p) => s + p.hectares, 0), [paddocks]);
  const pendingTasks = tasks.filter((t) => !t.completed).length;
  const overdueTasks = tasks.filter((t) => !t.completed && daysDiff(t.dueDate) < 0).length;
  const monitorCount = animals.filter((a) => a.status !== 'healthy').length;
  const lowFeedCount = feedItems.filter(isLowStock).length;

  const speciesCounts = useMemo(() => {
    const map: Record<string, number> = {};
    animals.forEach((a) => { map[a.species] = (map[a.species] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [animals]);

  const completedTasks = tasks.filter((t) => t.completed).length;
  const completionRate = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <>
    <div className="px-4 pt-6 md:px-8 md:pt-8 max-w-5xl mx-auto">

      {/* ── Profile hero ── */}
      <div
        className="rounded-2xl p-6 mb-5"
        style={{ background: '#111111' }}
      >
        {!editing ? (
          /* ── View mode ── */
          <div className="flex flex-col items-center sm:flex-row sm:items-center gap-4 sm:gap-5">
            {/* Avatar */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#ea580c' }}
            >
              <span style={{ fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
                {profile.initials}
              </span>
            </div>

            {/* Name + property */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <p style={{ fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
                {profile.name}
              </p>
              {/* Property + ha pill on same row */}
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-1 flex-wrap">
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#ea580c' }}>{profile.property}</span>
                <span
                  className="px-2 py-0.5 rounded-lg"
                  style={{ fontSize: '11px', fontWeight: 700, color: '#ea580c', background: 'rgba(234,88,12,0.15)', border: '1px solid rgba(234,88,12,0.3)' }}
                >
                  {totalHa.toFixed(1)}ha
                </span>
              </div>
              {/* Location on its own row */}
              <div className="flex items-center justify-center sm:justify-start gap-1 mt-1">
                <MapPin width={11} height={11} style={{ color: 'rgba(255,255,255,0.45)' }} />
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>{profile.location}</span>
              </div>
            </div>

            {/* Edit + Logout */}
            <div className="flex items-center justify-center gap-2 sm:flex-shrink-0">
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all hover:opacity-80 active:scale-[0.97]"
                style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600 }}
              >
                <Pencil width={12} height={12} />
                Edit
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all hover:opacity-90 active:scale-[0.97]"
                style={{ background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.35)', color: '#fecaca', fontSize: '12px', fontWeight: 600 }}
              >
                <LogOut width={12} height={12} />
                Log out
              </button>
            </div>
          </div>
        ) : (
          /* ── Edit mode ── */
          <div>
            <div className="flex items-center justify-between mb-4">
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>Edit Profile</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)', fontSize: '12px', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <X width={12} height={12} /> Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all hover:opacity-90 active:scale-[0.97]"
                  style={{ background: '#ea580c', color: '#fff', fontSize: '12px', fontWeight: 600 }}
                >
                  <Check width={12} height={12} /> Save
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginBottom: '5px' }}>Your name</p>
                <input
                  className={INPUT}
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="e.g. Sarah Mackenzie"
                />
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginBottom: '5px' }}>Farm / property name</p>
                <input
                  className={INPUT}
                  value={draftProperty}
                  onChange={(e) => setDraftProperty(e.target.value)}
                  placeholder="e.g. Tui Ridge"
                />
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginBottom: '5px' }}>Region</p>
                <DropdownSelect
                  value={draftRegion}
                  onChange={v => { setDraftRegion(v); setDraftCity(''); }}
                  options={NZ_REGIONS}
                  placeholder="Select region…"
                />
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginBottom: '5px' }}>City / Town</p>
                <DropdownSelect
                  value={draftCity}
                  onChange={setDraftCity}
                  options={NZ_CITIES[draftRegion] ?? []}
                  placeholder={draftRegion ? 'Select city…' : 'Select region first'}
                  disabled={!draftRegion}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Plan status — sits directly under hero ── */}
      {profile.fernPlus ? (
        <Link
          to="/fern-plus"
          className="flex items-center gap-3 px-4 py-3.5 rounded-2xl mb-5 transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #fff 80%)', border: '1.5px solid #fed7aa', textDecoration: 'none' }}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#ea580c' }}>
            <Zap width={14} height={14} style={{ color: '#fff' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>Fern Plus</p>
              <span className="px-1.5 py-0.5 rounded" style={{ fontSize: '9px', fontWeight: 700, color: '#ea580c', background: '#fff7ed', border: '1px solid #fed7aa' }}>ACTIVE</span>
            </div>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>
              {!profile.fernPlusExpiry
                ? profile.fernPlusSource === 'paid'
                  ? profile.fernPlusRenewalDate
                    ? `Renews on ${new Date(profile.fernPlusRenewalDate).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}`
                    : 'Active subscription · renews via Stripe'
                  : 'Lifetime access · no expiry'
                : (() => {
                    const days = Math.ceil((new Date(profile.fernPlusExpiry).getTime() - Date.now()) / 86400000);
                    if (days <= 0) return 'Expired';
                    if (days === 1) return 'Expires tomorrow';
                    if (days <= 30) return `${days} days remaining`;
                    return `Active until ${new Date(profile.fernPlusExpiry).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}`;
                  })()
              }
            </p>
          </div>
          <ArrowRight width={13} height={13} style={{ color: '#f97316', flexShrink: 0 }} />
        </Link>
      ) : (
        <Link
          to="/fern-plus"
          className="flex items-center gap-3 px-4 py-4 rounded-2xl mb-5 transition-all hover:opacity-95 active:scale-[0.99]"
          style={{ background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)', textDecoration: 'none', boxShadow: '0 4px 16px rgba(234,88,12,0.25)' }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <Zap width={16} height={16} style={{ color: '#fff' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>Upgrade to Fern Plus</p>
              <span className="px-1.5 py-0.5 rounded" style={{ fontSize: '9px', fontWeight: 700, background: 'rgba(255,255,255,0.25)', color: '#fff' }}>$16/mo</span>
            </div>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>Unlimited animals, finance, rainfall & more</p>
          </div>
          <ArrowRight width={14} height={14} style={{ color: 'rgba(255,255,255,0.8)', flexShrink: 0 }} />
        </Link>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard icon={PawPrint}       label="Animals"   value={animals.length}  sub={`${monitorCount} need attention`}  accent={monitorCount > 0}  to="/animals"   />
        <StatCard icon={Map}            label="Paddocks"  value={paddocks.length} sub={`${totalHa.toFixed(1)}ha mapped`}                              to="/paddocks"  />
        <StatCard icon={ClipboardCheck} label="Tasks"     value={pendingTasks}    sub={`${overdueTasks} overdue`}         accent={overdueTasks > 0}  to="/tasks"     />
        <StatCard icon={Wheat}          label="Low Stock" value={lowFeedCount}    sub="items to reorder"                  accent={lowFeedCount > 0}  to="/feed"      />
      </div>

      {/* ── Detail columns ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

        {/* Property details */}
        <div className="rounded-2xl p-5" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginBottom: '4px' }}>Property Details</p>
          <InfoRow label="Property name" value={profile.property} />
          <InfoRow label="Region"        value={profile.region || 'Not set'} />
          <InfoRow label="City / Town"   value={profile.city   || 'Not set'} />
          <InfoRow label="Total area"    value={`${totalHa.toFixed(1)} hectares`} />
          <InfoRow label="Paddocks"      value={`${paddocks.length} mapped`} />
          <div className="flex items-center justify-between pt-3">
            <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 500 }}>Task completion</span>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: '#f0f0f0' }}>
                <div className="h-full rounded-full" style={{ width: `${completionRate}%`, background: '#16a34a' }} />
              </div>
              <span style={{ fontSize: '13px', color: '#111', fontWeight: 600 }}>{completionRate}%</span>
            </div>
          </div>
        </div>

        {/* Livestock breakdown */}
        <div className="rounded-2xl p-5" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
          <div className="flex items-center justify-between mb-4">
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>Livestock</p>
            <Link to="/animals" className="flex items-center gap-1" style={{ fontSize: '12px', color: '#ea580c', textDecoration: 'none' }}>
              View all <ArrowRight width={12} height={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {speciesCounts.map(([species, count]) => {
              const cfg = SPECIES_CONFIG[species as keyof typeof SPECIES_CONFIG];
              const pct = Math.round((count / animals.length) * 100);
              const attn = animals.filter((a) => a.species === species && a.status !== 'healthy').length;
              return (
                <div key={species}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full"
                        style={{ fontSize: '10px', fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
                      >
                        {cfg.label}
                      </span>
                      {attn > 0 && <AlertTriangle width={11} height={11} style={{ color: '#d97706' }} />}
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#111' }}>{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#f0f0f0' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cfg.color, opacity: 0.7 }} />
                  </div>
                </div>
              );
            })}
            {speciesCounts.length === 0 && (
              <p style={{ fontSize: '13px', color: '#9ca3af' }}>No animals registered yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Admin link (only for admin account) ── */}
      {user?.email === 'cavauk636@gmail.com' && (
        <div className="mb-4">
          <Link
            to="/admin"
            className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all hover:opacity-90"
            style={{ background: '#111', border: '1px solid #1f2937', textDecoration: 'none' }}
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(234,88,12,0.2)' }}>
              <Shield width={13} height={13} style={{ color: '#ea580c' }} />
            </div>
            <div className="flex-1">
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>Admin Panel</p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Users, MRR, feature usage & more</p>
            </div>
            <ArrowRight width={13} height={13} style={{ color: 'rgba(255,255,255,0.3)' }} />
          </Link>
        </div>
      )}

      {/* ── Health at a glance ── */}
      <div className="rounded-2xl p-5 mb-8" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginBottom: '16px' }}>Health Status</p>
        <div className="grid grid-cols-3 gap-3">
          {(['healthy', 'monitor', 'sick'] as const).map((status) => {
            const cfg   = HEALTH_STATUS_CONFIG[status];
            const count = animals.filter((a) => a.status === status).length;
            return (
              <Link
                key={status}
                to={status === 'healthy' ? '/animals' : '/animals?attention=1'}
                className="rounded-xl p-4 flex flex-col items-center gap-1 transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ textDecoration: 'none', background: cfg.bg, border: `1px solid ${cfg.border}` }}
              >
                <span style={{ fontSize: '28px', fontWeight: 800, color: cfg.color, letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {count}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

    </div>

    {/* ── Logout confirm modal ── */}
    {showLogoutConfirm && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.45)' }}
        onClick={() => setShowLogoutConfirm(false)}
      >
        <div
          className="w-full max-w-sm rounded-2xl p-6"
          style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fff7ed' }}>
              <LogOut width={16} height={16} style={{ color: '#ea580c' }} />
            </div>
            <div>
              <p style={{ fontSize: '15px', fontWeight: 700, color: '#111', letterSpacing: '-0.02em' }}>Sign out of Fern?</p>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>You'll need to sign back in to access your farm.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 py-2.5 rounded-xl transition-all active:scale-[0.97]"
              style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', fontSize: '13px', fontWeight: 600, color: '#374151' }}
            >
              Cancel
            </button>
            <button
              onClick={confirmLogout}
              className="flex-1 py-2.5 rounded-xl transition-all active:scale-[0.97]"
              style={{ background: '#ea580c', fontSize: '13px', fontWeight: 600, color: '#fff' }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
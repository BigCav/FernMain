import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  Users, Zap, DollarSign, TrendingUp, PawPrint,
  Search, ArrowUpDown, ChevronUp, ChevronDown, ArrowLeft,
  Activity, RefreshCw, X,
  CheckCircle, Calendar, Shield, AlertCircle, UserCheck,
  ChevronRight, XCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { projectId } from '../../../utils/supabase/info';

const ADMIN_EMAIL = 'cavauk636@gmail.com';

// ── Data types ────────────────────────────────────────────────────────────────
interface RealUser {
  userId:          string;
  email:           string;
  name:            string;
  property:        string;
  region:          string;
  fernPlus:         boolean;
  fernPlusExpiry?:  string | null;
  fernPlusSource?:  'paid' | 'grant' | null;
  createdAt:        string;
  lastSignIn:      string;
  animalCount:     number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  const diff = Math.round((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 30)  return `${diff}d ago`;
  if (diff < 365) return `${Math.floor(diff / 30)}mo ago`;
  return d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtExpiry(iso?: string | null) {
  if (!iso) return 'Lifetime';
  const d = new Date(iso);
  const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
  if (diff < 0) return 'Expired';
  if (diff === 0) return 'Expires today';
  if (diff === 1) return 'Expires tomorrow';
  return `Expires in ${diff}d`;
}

type SortKey = 'email' | 'plan' | 'animals' | 'joined' | 'active';

// ── Small components ──────────────────────────────────────────────────────────
function KpiCard({
  icon: Icon, label, value, sub, accent = false, iconBg,
}: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; accent?: boolean; iconBg?: string;
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-1 transition-all duration-200"
      style={{
        background: accent ? '#111' : '#fefefe',
        border: accent ? '1px solid #1f2937' : '1px solid #ebebeb',
        cursor: 'default',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
    >
      <div className="flex items-center justify-between mb-1">
        <span style={{ fontSize: '11px', fontWeight: 700, color: accent ? 'rgba(255,255,255,0.4)' : '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: iconBg ?? '#f5f5f4' }}>
          <Icon width={13} height={13} style={{ color: accent ? '#ea580c' : '#6b7280' }} />
        </div>
      </div>
      <p style={{ fontSize: '28px', fontWeight: 800, color: accent ? '#fff' : '#111', letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: '11px', color: accent ? 'rgba(255,255,255,0.4)' : '#9ca3af', marginTop: '2px' }}>{sub}</p>}
    </div>
  );
}

function ChartTip({ active, payload, label, prefix = '' }: {
  active?: boolean; payload?: { value: number }[]; label?: string; prefix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 shadow-lg" style={{ background: '#111', border: '1px solid #333' }}>
      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>{label}</p>
      <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{prefix}{payload[0].value.toLocaleString()}</p>
    </div>
  );
}

// ── Grant Plus modal ──────────────────────────────────────────────────────────
function GrantPlusModal({
  user, onClose, onGrant,
}: {
  user: RealUser;
  onClose: () => void;
  onGrant: (days: number) => Promise<void>;
}) {
  const [days, setDays]       = useState(30);
  const [custom, setCustom]   = useState('');
  const [mode, setMode]       = useState<'preset' | 'custom'>('preset');
  const [saving, setSaving]   = useState(false);
  const [done, setDone]       = useState(false);

  const PRESETS = [
    { label: '7 days',    days: 7   },
    { label: '30 days',   days: 30  },
    { label: '90 days',   days: 90  },
    { label: '1 year',    days: 365 },
    { label: 'Lifetime',  days: 0   },
  ];

  const effectiveDays = mode === 'custom' ? (parseInt(custom) || 0) : days;
  const expiryLabel   = effectiveDays === 0 ? 'No expiry — lifetime access' : (() => {
    const d = new Date(Date.now() + effectiveDays * 86400000);
    return `Expires ${d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  })();

  async function handleGrant() {
    setSaving(true);
    await onGrant(effectiveDays);
    setDone(true);
    setSaving(false);
    setTimeout(onClose, 1200);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: '#fff', border: '1px solid #ebebeb', boxShadow: '0 24px 80px rgba(0,0,0,0.18)', animation: 'popIn 0.2s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
      >
        <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }`}</style>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: '1px solid #f5f5f5' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#fff7ed' }}>
              <Zap width={14} height={14} style={{ color: '#ea580c' }} />
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#111' }}>Grant Fern Plus</p>
              <p style={{ fontSize: '11px', color: '#9ca3af' }}>{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100">
            <X width={14} height={14} style={{ color: '#6b7280' }} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Duration presets */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Duration</p>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {PRESETS.map(p => {
                const active = mode === 'preset' && days === p.days;
                return (
                  <button
                    key={p.days}
                    onClick={() => { setMode('preset'); setDays(p.days); }}
                    className="py-2 rounded-xl transition-all"
                    style={{
                      fontSize: '12px', fontWeight: 600,
                      background: active ? '#ea580c' : '#f5f5f4',
                      color: active ? '#fff' : '#374151',
                      border: active ? '1px solid #ea580c' : '1px solid transparent',
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode('custom')}
                className="px-3 py-2 rounded-xl text-left flex-shrink-0 transition-all"
                style={{
                  fontSize: '11px', fontWeight: 600,
                  background: mode === 'custom' ? '#111' : '#f5f5f4',
                  color: mode === 'custom' ? '#fff' : '#6b7280',
                }}
              >
                Custom
              </button>
              {mode === 'custom' && (
                <div className="flex items-center gap-1.5 flex-1">
                  <input
                    autoFocus
                    type="number"
                    min="1"
                    value={custom}
                    onChange={e => setCustom(e.target.value)}
                    placeholder="e.g. 45"
                    className="flex-1 px-3 py-2 rounded-xl border outline-none text-[13px]"
                    style={{ borderColor: '#e5e7eb', background: '#fff' }}
                  />
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>days</span>
                </div>
              )}
            </div>
          </div>

          {/* Expiry preview */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <Calendar width={13} height={13} style={{ color: '#16a34a', flexShrink: 0 }} />
            <p style={{ fontSize: '12px', color: '#15803d', fontWeight: 500 }}>{expiryLabel}</p>
          </div>

          {/* Action */}
          {done ? (
            <div className="flex items-center justify-center gap-2 py-3.5 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <CheckCircle width={16} height={16} style={{ color: '#16a34a' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#15803d' }}>Fern Plus granted!</span>
            </div>
          ) : (
            <button
              onClick={handleGrant}
              disabled={saving || (mode === 'custom' && !parseInt(custom))}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-40"
              style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 700 }}
            >
              {saving ? <RefreshCw width={14} height={14} className="animate-spin" /> : <Zap width={14} height={14} />}
              {saving ? 'Granting…' : 'Grant Fern Plus'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


// ── Main admin component ──────────────────────────────────────────────────────
export function Admin() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [users,     setUsers]     = useState<RealUser[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [loadErr,   setLoadErr]   = useState('');
  const [search,    setSearch]    = useState('');
  const [planTab,   setPlanTab]   = useState<'all' | 'free' | 'plus'>('all');
  const [sortKey,   setSortKey]   = useState<SortKey>('joined');
  const [sortDir,   setSortDir]   = useState<'asc' | 'desc'>('asc');
  const [grantUser,  setGrantUser]  = useState<RealUser | null>(null);
  const [revokeUser, setRevokeUser] = useState<RealUser | null>(null);
  const [revoking,   setRevoking]   = useState(false);
  const [hovRow,     setHovRow]     = useState<string | null>(null);

  // Guard
  if (user?.email !== ADMIN_EMAIL) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Shield width={40} height={40} style={{ color: '#d1d5db' }} />
        <p style={{ fontSize: '16px', fontWeight: 700, color: '#111' }}>Access denied</p>
        <button onClick={() => navigate('/')} style={{ fontSize: '13px', color: '#ea580c' }}>Back to dashboard</button>
      </div>
    );
  }

  // ── Fetch real data via authenticated session (requires admin RLS policy) ─────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadErr('');
    try {
      const [
        { data: profileRows, error: profErr },
        { data: animalRows },
        { data: authRows },
      ] = await Promise.all([
        supabase.from('kv_store_4e6b560b').select('key, value').like('key', '%:profile'),
        supabase.from('kv_store_4e6b560b').select('key, value').like('key', '%:animals'),
        supabase.rpc('get_admin_users'),
      ]);
      if (profErr) throw profErr;

      const animalCounts: Record<string, number> = {};
      for (const row of animalRows ?? []) {
        const uid = (row.key as string).split(':')[1];
        animalCounts[uid] = Array.isArray(row.value) ? (row.value as unknown[]).length : 0;
      }

      const authByUid: Record<string, { created_at: string; last_sign_in_at: string }> = {};
      for (const row of (authRows as { id: string; created_at: string; last_sign_in_at: string }[] | null) ?? []) {
        authByUid[row.id] = { created_at: row.created_at, last_sign_in_at: row.last_sign_in_at };
      }

      const realUsers: RealUser[] = (profileRows ?? [])
        .map(row => {
          const uid  = (row.key as string).split(':')[1];
          const prof = (row.value ?? {}) as Record<string, unknown>;
          const auth = authByUid[uid];
          return {
            userId:         uid,
            email:          (prof.email    as string)  ?? '',
            name:           (prof.name     as string)  ?? '',
            property:       (prof.property as string)  ?? '',
            region:         (prof.region   as string)  ?? '',
            fernPlus:       (prof.fernPlus       as boolean) ?? false,
            fernPlusExpiry: (prof.fernPlusExpiry  as string)  ?? null,
            fernPlusSource: (prof.fernPlusSource  as 'paid' | 'grant') ?? null,
            createdAt:      auth?.created_at      ?? '',
            lastSignIn:     auth?.last_sign_in_at ?? '',
            animalCount:    animalCounts[uid] ?? 0,
          };
        })
        .filter(u => u.email);

      setUsers(realUsers);
    } catch (e: unknown) {
      setLoadErr((e as Error).message ?? 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Grant Plus ───────────────────────────────────────────────────────────────
  async function handleGrant(targetUser: RealUser, days: number) {
    const expiry = days === 0 ? null : new Date(Date.now() + days * 86400000).toISOString();

    const { error } = await supabase.rpc('admin_grant_fern_plus', {
      target_user_id:    targetUser.userId,
      fern_plus_expiry:  expiry,
    });

    if (error) throw new Error(error.message);

    setUsers(prev => prev.map(u =>
      u.userId === targetUser.userId ? { ...u, fernPlus: true, fernPlusExpiry: expiry } : u
    ));
  }

  async function handleRevoke(targetUser: RealUser) {
    setRevoking(true);
    const { error } = await supabase.rpc('admin_revoke_fern_plus', {
      target_user_id: targetUser.userId,
    });
    setRevoking(false);
    if (error) { setRevokeUser(null); alert(`Failed: ${error.message}`); return; }
    setUsers(prev => prev.map(u =>
      u.userId === targetUser.userId ? { ...u, fernPlus: false, fernPlusExpiry: null } : u
    ));
    setRevokeUser(null);
  }

  // ── Derived stats ────────────────────────────────────────────────────────────
  const totalUsers   = users.length;
  const plusUsers    = users.filter(u => u.fernPlus).length;
  const freeUsers    = totalUsers - plusUsers;
  const mrr          = plusUsers * 16;
  const convRate     = totalUsers ? Math.round((plusUsers / totalUsers) * 100) : 0;
  const totalAnimals = users.reduce((s, u) => s + u.animalCount, 0);
  const activeToday  = users.filter(u => u.lastSignIn && new Date(u.lastSignIn).toDateString() === new Date().toDateString()).length;
  const newThisWeek  = users.filter(u => {
    const diff = (Date.now() - new Date(u.createdAt).getTime()) / 86400000;
    return diff <= 7;
  }).length;

  // Growth sparklines — bucket real users by month
  const growthData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const m = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const label = m.toLocaleDateString('en-NZ', { month: 'short' });
      const cutoff = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 1);
      const total = users.filter(u => new Date(u.createdAt) < cutoff).length;
      const plus  = users.filter(u => u.fernPlus && new Date(u.createdAt) < cutoff).length;
      return { month: label, users: total, plus };
    });
  }, [users]);

  const mrrData = useMemo(() => {
    return growthData.map(g => ({ month: g.month, mrr: g.plus * 16 }));
  }, [growthData]);

  // ── Filtered & sorted table ──────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    let list = users.filter(u => {
      const q = search.toLowerCase();
      if (q && !u.email.toLowerCase().includes(q) && !u.name.toLowerCase().includes(q) && !u.region.toLowerCase().includes(q)) return false;
      if (planTab === 'plus' && !u.fernPlus) return false;
      if (planTab === 'free' && u.fernPlus)  return false;
      return true;
    });
    return [...list].sort((a, b) => {
      let av: number | string = 0, bv: number | string = 0;
      if (sortKey === 'email')   { av = a.email;       bv = b.email;       }
      if (sortKey === 'plan')    { av = a.fernPlus ? 1 : 0; bv = b.fernPlus ? 1 : 0; }
      if (sortKey === 'animals') { av = a.animalCount; bv = b.animalCount; }
      if (sortKey === 'joined')  { av = a.createdAt;   bv = b.createdAt;   }
      if (sortKey === 'active')  { av = a.lastSignIn;  bv = b.lastSignIn;  }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [users, search, planTab, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ArrowUpDown width={11} height={11} style={{ color: '#d1d5db' }} />;
    return sortDir === 'asc'
      ? <ChevronUp   width={11} height={11} style={{ color: '#ea580c' }} />
      : <ChevronDown width={11} height={11} style={{ color: '#ea580c' }} />;
  }

  const PIE_DATA = [
    { name: 'Free', value: freeUsers, color: '#e5e7eb' },
    { name: 'Plus', value: plusUsers, color: '#ea580c' },
  ];

  // ── Render: loading ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw width={24} height={24} style={{ color: '#ea580c' }} className="animate-spin" />
        <p style={{ fontSize: '13px', color: '#9ca3af' }}>Loading user data from Supabase…</p>
      </div>
    );
  }

  // ── Render: error ─────────────────────────────────────────────────────────────
  if (loadErr) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
        <AlertCircle width={32} height={32} style={{ color: '#f87171' }} />
        <p style={{ fontSize: '15px', fontWeight: 700, color: '#111' }}>Failed to load data</p>
        <p style={{ fontSize: '12px', color: '#9ca3af', maxWidth: '360px' }}>{loadErr}</p>
        <div className="flex gap-2">
          <button
            onClick={() => fetchData()}
            className="px-4 py-2 rounded-xl text-[12px] font-[600]"
            style={{ background: '#ea580c', color: '#fff' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Render: main dashboard ────────────────────────────────────────────────────
  return (
    <div className="px-4 pt-6 md:px-8 md:pt-8 pb-12 max-w-7xl mx-auto">

      {/* Grant Plus modal */}
      {grantUser && (
        <GrantPlusModal
          user={grantUser}
          onClose={() => setGrantUser(null)}
          onGrant={async (days) => { await handleGrant(grantUser, days); }}
        />
      )}

      {/* Revoke confirm modal */}
      {revokeUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget && !revoking) setRevokeUser(null); }}
        >
          <div
            className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: '#fff', border: '1px solid #ebebeb', boxShadow: '0 24px 80px rgba(0,0,0,0.18)', animation: 'popIn 0.2s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
          >
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fef2f2' }}>
                  <XCircle width={16} height={16} style={{ color: '#dc2626' }} />
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#111' }}>Revoke Fern Plus</p>
                  <p style={{ fontSize: '11px', color: '#9ca3af' }}>{revokeUser.email}</p>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6, marginBottom: '20px' }}>
                This will remove Fern Plus access immediately. The account will revert to the free plan and lose access to Plus features.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setRevokeUser(null)}
                  disabled={revoking}
                  className="flex-1 py-2.5 rounded-xl transition-all"
                  style={{ fontSize: '13px', fontWeight: 600, background: '#f5f5f4', color: '#6b7280', border: '1px solid #e5e7eb' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRevoke(revokeUser)}
                  disabled={revoking}
                  className="flex-1 py-2.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ fontSize: '13px', fontWeight: 700, background: '#dc2626', color: '#fff' }}
                >
                  {revoking ? <RefreshCw width={13} height={13} className="animate-spin" /> : <XCircle width={13} height={13} />}
                  {revoking ? 'Revoking…' : 'Revoke access'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-gray-100"
            style={{ border: '1px solid #ebebeb' }}
          >
            <ArrowLeft width={14} height={14} style={{ color: '#6b7280' }} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <p style={{ fontSize: '22px', fontWeight: 800, color: '#111', letterSpacing: '-0.03em' }}>Admin Panel</p>
              <span className="px-2 py-0.5 rounded-lg" style={{ fontSize: '10px', fontWeight: 700, background: '#111', color: '#ea580c', border: '1px solid #333' }}>LIVE</span>
            </div>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '1px' }}>
              {totalUsers} users · Supabase project {projectId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all hover:bg-gray-50"
            style={{ border: '1px solid #e5e7eb', fontSize: '12px', color: '#6b7280', fontWeight: 600 }}
          >
            <RefreshCw width={12} height={12} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="col-span-2 md:col-span-3 lg:col-span-2">
          <KpiCard icon={DollarSign} label="MRR (NZD)" value={`$${mrr}`} sub={`${plusUsers} × $16/mo`} accent iconBg="rgba(234,88,12,0.18)" />
        </div>
        <KpiCard icon={Users}       label="Total users"   value={totalUsers}       sub={`+${newThisWeek} this week`}   iconBg="#f0f9ff" />
        <KpiCard icon={Zap}         label="Fern Plus"     value={plusUsers}         sub={`${freeUsers} on free`}       iconBg="#fff7ed" />
        <KpiCard icon={TrendingUp}  label="Conversion"    value={`${convRate}%`}    sub="free → plus"                 iconBg="#f0fdf4" />
        <KpiCard icon={Activity}    label="Active today"  value={activeToday}       sub="sign-ins today"              iconBg="#fdf4ff" />
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

        {/* User growth */}
        <div
          className="md:col-span-2 rounded-2xl p-5 transition-all duration-200"
          style={{ background: '#fefefe', border: '1px solid #ebebeb' }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>User growth</p>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>Total vs Fern Plus · last 6 months</p>
            </div>
            <div className="flex items-center gap-3">
              {[{ color: '#e5e7eb', label: 'Free' }, { color: '#ea580c', label: 'Plus' }].map(d => (
                <div key={d.label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>{d.label}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={growthData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e5e7eb" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#e5e7eb" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ea580c" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#ea580c" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="users" stroke="#d1d5db" strokeWidth={2} fill="url(#gU)" name="Total" />
              <Area type="monotone" dataKey="plus"  stroke="#ea580c" strokeWidth={2} fill="url(#gP)" name="Plus"  />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Plan split + MRR */}
        <div className="flex flex-col gap-4">
          <div
            className="rounded-2xl p-5 flex-1 transition-all duration-200"
            style={{ background: '#fefefe', border: '1px solid #ebebeb' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
          >
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginBottom: '12px' }}>Plan split</p>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={80} height={80}>
                <PieChart>
                  <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={24} outerRadius={36} dataKey="value" strokeWidth={0}>
                    {PIE_DATA.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2">
                {PIE_DATA.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span style={{ fontSize: '12px', color: '#374151' }}>{d.name}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginLeft: 'auto' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl p-5 flex-1 transition-all duration-200"
            style={{ background: '#fefefe', border: '1px solid #ebebeb' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
          >
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginBottom: '12px' }}>MRR trend</p>
            <ResponsiveContainer width="100%" height={70}>
              <AreaChart data={mrrData} margin={{ top: 2, right: 2, left: -30, bottom: 0 }}>
                <defs>
                  <linearGradient id="gM" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ea580c" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#ea580c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip prefix="$" />} />
                <Area type="monotone" dataKey="mrr" stroke="#ea580c" strokeWidth={2} fill="url(#gM)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── User table ── */}
      <div className="rounded-2xl overflow-hidden transition-all duration-200" style={{ border: '1px solid #ebebeb' }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
      >
        {/* Table header */}
        <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3" style={{ background: '#f9f8f6', borderBottom: '1px solid #ebebeb' }}>
          <div className="flex-1">
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>Users ({filteredUsers.length})</p>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>Real accounts from Supabase auth</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {(['all', 'free', 'plus'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setPlanTab(tab)}
                className="px-3 py-1.5 rounded-xl transition-all"
                style={{
                  fontSize: '11px', fontWeight: 600,
                  background: planTab === tab ? (tab === 'plus' ? '#ea580c' : '#111') : '#efefef',
                  color: planTab === tab ? '#fff' : '#6b7280',
                }}
              >
                {tab === 'plus' ? 'Fern Plus' : tab === 'free' ? 'Free' : 'All'}
              </button>
            ))}
            <div className="relative">
              <Search width={13} height={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                style={{
                  paddingLeft: '30px', paddingRight: '12px', paddingTop: '7px', paddingBottom: '7px',
                  borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fff',
                  fontSize: '12px', color: '#111', outline: 'none', width: '150px',
                }}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafaf9' }}>
                {([
                  { label: 'User',    key: 'email'   as SortKey },
                  { label: 'Plan',    key: 'plan'    as SortKey },
                  { label: 'Animals',     key: 'animals' as SortKey },
                  { label: 'Joined',      key: 'joined'  as SortKey },
                  { label: 'Last active', key: 'active'  as SortKey },
                  { label: 'Actions',     key: null },
                ] as { label: string; key: SortKey | null }[]).map(col => (
                  <th
                    key={col.label}
                    onClick={() => col.key && toggleSort(col.key)}
                    style={{
                      padding: '10px 16px', textAlign: 'left',
                      fontSize: '10px', fontWeight: 700, color: '#9ca3af',
                      textTransform: 'uppercase', letterSpacing: '0.07em',
                      borderBottom: '1px solid #f0f0f0',
                      cursor: col.key ? 'pointer' : 'default',
                      userSelect: 'none', whiteSpace: 'nowrap',
                    }}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.key && <SortIcon k={col.key} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, idx) => {
                const isHovered = hovRow === u.userId;
                return (
                  <tr
                    key={u.userId}
                    onMouseEnter={() => setHovRow(u.userId)}
                    onMouseLeave={() => setHovRow(null)}
                    style={{
                      background: isHovered ? '#fdf8f5' : idx % 2 === 0 ? '#fefefe' : '#fafaf9',
                      borderBottom: '1px solid #f5f5f5',
                      transition: 'background 0.15s',
                    }}
                  >
                    {/* User */}
                    <td style={{ padding: '12px 16px' }}>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-150"
                          style={{
                            background: u.fernPlus ? '#ea580c' : '#e5e7eb',
                            transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                          }}
                        >
                          <span style={{ fontSize: '10px', fontWeight: 800, color: u.fernPlus ? '#fff' : '#6b7280' }}>
                            {(u.name || u.email).split(/[\s@]/)[0].slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p style={{ fontSize: '12px', fontWeight: 600, color: '#111', lineHeight: 1.3 }}>
                            {u.name || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No name set</span>}
                          </p>
                          <p style={{ fontSize: '10px', color: '#9ca3af' }}>{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Plan */}
                    <td style={{ padding: '12px 16px' }}>
                      {u.fernPlus ? (
                        <div>
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg" style={{ fontSize: '10px', fontWeight: 700, background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa' }}>
                              <Zap width={9} height={9} />
                              Plus
                            </span>
                            {u.fernPlusSource === 'paid' && (
                              <span className="px-1.5 py-0.5 rounded" style={{ fontSize: '9px', fontWeight: 700, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>Stripe</span>
                            )}
                            {u.fernPlusSource !== 'paid' && (
                              <span className="px-1.5 py-0.5 rounded" style={{ fontSize: '9px', fontWeight: 700, background: '#f5f5f4', color: '#9ca3af', border: '1px solid #e5e7eb' }}>Grant</span>
                            )}
                          </div>
                          {u.fernPlusExpiry && (
                            <p style={{ fontSize: '10px', color: new Date(u.fernPlusExpiry) < new Date() ? '#f87171' : '#9ca3af', marginTop: '2px' }}>
                              {fmtExpiry(u.fernPlusExpiry)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg" style={{ fontSize: '10px', fontWeight: 700, background: '#f5f5f4', color: '#9ca3af', border: '1px solid #e5e7eb' }}>
                          Free
                        </span>
                      )}
                    </td>

                    {/* Animals */}
                    <td style={{ padding: '12px 16px' }}>
                      <div className="flex items-center gap-1.5">
                        <PawPrint width={11} height={11} style={{ color: '#d1d5db' }} />
                        <span style={{ fontSize: '13px', fontWeight: 700, color: u.animalCount >= 30 && !u.fernPlus ? '#f97316' : '#111' }}>
                          {u.animalCount}
                        </span>
                        {u.animalCount >= 30 && !u.fernPlus && (
                          <span title="At free limit" style={{ fontSize: '10px', color: '#f97316' }}>limit</span>
                        )}
                      </div>
                    </td>

                    {/* Joined */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '12px', color: '#374151' }}>{fmtDate(u.createdAt)}</span>
                    </td>

                    {/* Last active */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: 600,
                        color: !u.lastSignIn ? '#d1d5db'
                          : new Date(u.lastSignIn).toDateString() === new Date().toDateString() ? '#16a34a'
                          : (Date.now() - new Date(u.lastSignIn).getTime()) < 3 * 86400000 ? '#6b7280' : '#d1d5db',
                      }}>
                        {u.lastSignIn ? fmtDate(u.lastSignIn) : '—'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px' }}>
                      <div className="flex items-center gap-1.5" style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.15s' }}>
                        <button
                          onClick={() => setGrantUser(u)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all hover:scale-[1.03]"
                          style={{
                            fontSize: '11px', fontWeight: 600,
                            background: u.fernPlus ? '#f5f5f4' : '#fff7ed',
                            color: u.fernPlus ? '#6b7280' : '#ea580c',
                            border: `1px solid ${u.fernPlus ? '#e5e7eb' : '#fed7aa'}`,
                          }}
                        >
                          {u.fernPlus ? <UserCheck width={11} height={11} /> : <Zap width={11} height={11} />}
                          {u.fernPlus ? 'Extend' : 'Grant Plus'}
                        </button>
                        {u.fernPlus && u.fernPlusSource !== 'paid' && (
                          <button
                            onClick={() => setRevokeUser(u)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all hover:scale-[1.03]"
                            style={{ fontSize: '11px', fontWeight: 600, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                            title="Remove Fern Plus (admin grants only)"
                          >
                            <XCircle width={11} height={11} />
                            Revoke
                          </button>
                        )}
                        <button
                          onClick={() => { window.location.href = `mailto:${u.email}`; }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-gray-100"
                          style={{ border: '1px solid #e5e7eb' }}
                          title="Email user"
                        >
                          <ChevronRight width={12} height={12} style={{ color: '#9ca3af' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                    {totalUsers === 0 ? 'No users found in Supabase.' : 'No users match your search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 flex items-center justify-between" style={{ background: '#f9f8f6', borderTop: '1px solid #ebebeb' }}>
          <p style={{ fontSize: '11px', color: '#9ca3af' }}>
            Showing {filteredUsers.length} of {totalUsers} users · {totalAnimals} animals total
          </p>
          <p style={{ fontSize: '11px', color: '#9ca3af' }}>Live · Supabase</p>
        </div>
      </div>

    </div>
  );
}

import { useState } from 'react';
import { useSpecies } from '../context/SpeciesContext';
import { useDashboardPrefs, DASHBOARD_WIDGETS, PLUS_WIDGET_KEYS } from '../hooks/useDashboardPrefs';
import { useProfile } from '../context/ProfileContext';
import { supabase } from '../lib/supabase';
import { projectId } from '../../../utils/supabase/info';
import { Plus, X, Lock, LayoutDashboard, Zap, ExternalLink, Loader } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';

const FUNCTIONS_URL = `https://${projectId}.functions.supabase.co`;

const INPUT = 'flex-1 px-3 py-2 rounded-xl border border-gray-200 outline-none bg-white text-gray-900 transition-colors focus:border-orange-400 text-[13px] min-w-0';

export function Settings() {
  const { allSpecies, addSpecies, removeSpecies } = useSpecies();
  const { prefs, toggle } = useDashboardPrefs();
  const { profile, updateProfile } = useProfile();

  const [newLabel,       setNewLabel]       = useState('');
  const [naitLocation,   setNaitLocation]   = useState(profile.naitLocationNumber ?? '');
  const [naitSaved,      setNaitSaved]      = useState(false);
  const [portalLoading,  setPortalLoading]  = useState(false);
  const [portalError,    setPortalError]    = useState('');

  async function handleManageSubscription() {
    setPortalLoading(true);
    setPortalError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${FUNCTIONS_URL}/create-portal-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ origin: window.location.origin }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      window.location.href = json.url;
    } catch (err) {
      setPortalError((err as Error).message);
    } finally {
      setPortalLoading(false);
    }
  }

  function handleSaveNait(e: React.FormEvent) {
    e.preventDefault();
    updateProfile({ naitLocationNumber: naitLocation.trim() || undefined });
    setNaitSaved(true);
    setTimeout(() => setNaitSaved(false), 2000);
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabel.trim()) return;
    addSpecies(newLabel.trim());
    setNewLabel('');
  }

  return (
    <div className="pb-8">

      <PageHeader
        title="Settings"
        chips={[{ label: 'Animal types, widgets & preferences', variant: 'neutral' }]}
      />

      <div className="max-w-5xl mx-auto px-4 md:px-8">

      {/* ── Animal Types ── */}
      <div className="rounded-2xl overflow-hidden mb-4" style={{ border: '1px solid #ebebeb' }}>
        {/* Section header */}
        <div className="px-5 py-4" style={{ background: '#f9f8f6', borderBottom: '1px solid #ebebeb' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>Animal Types</p>
          <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
            Add new types of animal to use on the Animals page. Built-in types cannot be removed.
          </p>
        </div>

        <div className="p-5" style={{ background: '#fefefe' }}>
          {/* All types as chips */}
          <div className="flex flex-wrap gap-2 mb-5">
            {allSpecies.map((s) => (
              <span
                key={s.key}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color:      s.color,
                  background: s.bg,
                  border:     `1px solid ${s.border}`,
                }}
              >
                {s.label}
                {s.custom ? (
                  <button
                    onClick={() => removeSpecies(s.key)}
                    className="ml-0.5 transition-opacity hover:opacity-60"
                    title={`Remove ${s.label}`}
                  >
                    <X width={11} height={11} />
                  </button>
                ) : (
                  <Lock
                    width={10} height={10}
                    style={{ opacity: 0.35, marginLeft: '1px' }}
                    title="Built-in type"
                  />
                )}
              </span>
            ))}
          </div>

          {/* Add new type */}
          <form onSubmit={handleAdd} className="flex items-center gap-2">
            <input
              className={INPUT}
              placeholder="e.g. Donkey, Red Deer, Llama…"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />
            <button
              type="submit"
              disabled={!newLabel.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl flex-shrink-0 transition-all active:scale-[0.97] disabled:opacity-40"
              style={{ background: '#ea580c', color: '#fff', fontSize: '12px', fontWeight: 600 }}
            >
              <Plus width={13} height={13} />
              Add
            </button>
          </form>

          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '10px' }}>
            New types appear immediately in the animal type selector when adding or editing animals.
            Custom types are saved to your device.
          </p>
        </div>
      </div>

      {/* ── Dashboard Widgets ── */}
      <div className="rounded-2xl overflow-hidden mb-4" style={{ border: '1px solid #ebebeb' }}>
        <div className="px-5 py-4 flex items-center gap-3" style={{ background: '#f9f8f6', borderBottom: '1px solid #ebebeb' }}>
          <LayoutDashboard width={14} height={14} style={{ color: '#6b7280' }} />
          <div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>Dashboard Widgets</p>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '1px' }}>
              Show or hide sections on your dashboard. The 4 stat cards are always visible.
            </p>
          </div>
        </div>
        <div className="divide-y" style={{ background: '#fefefe', borderColor: '#f5f5f5' }}>
          {DASHBOARD_WIDGETS.map(w => {
            const isPlus   = PLUS_WIDGET_KEYS.has(w.key);
            const locked   = isPlus && !profile.fernPlus;
            const on       = !locked && (prefs[w.key] ?? true);
            return (
              <div
                key={w.key}
                className="flex items-center gap-4 px-5 py-3.5"
                style={{ opacity: locked ? 0.55 : 1 }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>{w.label}</p>
                    {isPlus && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md" style={{ fontSize: '9px', fontWeight: 700, background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa' }}>
                        <Zap width={8} height={8} />
                        Plus
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>{w.desc}</p>
                </div>
                {locked ? (
                  <Lock width={14} height={14} style={{ color: '#d1d5db', flexShrink: 0 }} />
                ) : (
                  <button
                    onClick={() => toggle(w.key)}
                    className="flex-shrink-0 transition-all"
                    style={{
                      width: '44px',
                      height: '24px',
                      borderRadius: '12px',
                      background: on ? '#ea580c' : '#e5e7eb',
                      position: 'relative',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '3px',
                        left: on ? '23px' : '3px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: '#fefefe',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
                        transition: 'left 0.2s',
                      }}
                    />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── NAIT ── */}
      <div className="rounded-2xl overflow-hidden mb-4" style={{ border: '1px solid #ebebeb' }}>
        <div className="px-5 py-4" style={{ background: '#f9f8f6', borderBottom: '1px solid #ebebeb' }}>
          <div className="flex items-center gap-2">
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>NAIT</p>
            <span className="px-1.5 py-0.5 rounded-md" style={{ fontSize: '9px', fontWeight: 700, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>NZ Cattle</span>
          </div>
          <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
            National Animal Identification and Tracing. Required for all cattle movements in New Zealand.
          </p>
        </div>
        <form onSubmit={handleSaveNait} className="p-5 space-y-3" style={{ background: '#fefefe' }}>
          <div>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Your NAIT location number</p>
            <div className="flex gap-2">
              <input
                className={INPUT}
                placeholder="e.g. 123456"
                value={naitLocation}
                onChange={(e) => { setNaitLocation(e.target.value); setNaitSaved(false); }}
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl flex-shrink-0 transition-all active:scale-[0.97]"
                style={{ background: naitSaved ? '#16a34a' : '#ea580c', color: '#fff', fontSize: '12px', fontWeight: 600 }}
              >
                {naitSaved ? 'Saved' : 'Save'}
              </button>
            </div>
            <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>
              Found in your NAIT account under Location Details. Used when recording cattle movements.
            </p>
          </div>
        </form>
      </div>

      {/* ── Subscription management (paid Plus only, tucked away) ── */}
      {profile.fernPlusSource === 'paid' && (
        <div className="rounded-2xl overflow-hidden mb-4" style={{ border: '1px solid #ebebeb' }}>
          <div className="px-5 py-4" style={{ background: '#f9f8f6', borderBottom: '1px solid #ebebeb' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>Subscription</p>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
              Manage your Fern Plus billing, update your payment method, or cancel your subscription.
            </p>
          </div>
          <div className="p-5" style={{ background: '#fefefe' }}>
            <button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all active:scale-[0.97] disabled:opacity-60"
              style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', fontSize: '12px', fontWeight: 600, color: '#374151' }}
            >
              {portalLoading
                ? <Loader width={13} height={13} className="animate-spin" />
                : <ExternalLink width={13} height={13} />}
              Manage subscription
            </button>
            {portalError && (
              <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '6px' }}>{portalError}</p>
            )}
          </div>
        </div>
      )}

      {/* ── Coming soon placeholders ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {[
          { title: 'Notifications',   desc: 'Set reminders for tasks, vaccinations and feed reorders.' },
          { title: 'Units & Display', desc: 'Choose kg/lb, date format and currency symbol.' },
          { title: 'Data Export',     desc: 'Export animal records, health events and tasks as CSV.' },
          { title: 'Backup & Sync',   desc: 'Connect to the cloud to back up your block data.' },
        ].map(({ title, desc }) => (
          <div
            key={title}
            className="rounded-2xl p-4 flex items-center gap-4 opacity-50"
            style={{ background: '#fefefe', border: '1px solid #ebebeb' }}
          >
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>{title}</p>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{desc}</p>
            </div>
            <span
              className="px-2 py-0.5 rounded-lg flex-shrink-0"
              style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', background: '#f5f5f5', border: '1px solid #e5e7eb' }}
            >
              Coming soon
            </span>
          </div>
        ))}
      </div>

      </div>
    </div>
  );
}

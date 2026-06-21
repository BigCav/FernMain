import { useState } from 'react';
import {
  Star, Check, Lock, Zap,
  PawPrint, ClipboardCheck, Wheat, Map, BookOpen,
  Leaf, HeartPulse, Baby, Weight, ShieldCheck,
  DollarSign, CloudRain, ArrowRight, LayoutGrid,
  CalendarDays, Package, Loader,
} from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { supabase } from '../lib/supabase';
import { projectId } from '../../../utils/supabase/info';
import { PageHeader } from '../components/PageHeader';

const FUNCTIONS_URL = `https://${projectId}.functions.supabase.co`;

const FREE_FEATURES = [
  { Icon: PawPrint,      label: 'Up to 30 animals',             desc: 'Health records, treatments, notes & status flags' },
  { Icon: HeartPulse,    label: 'Animal health & withholding',  desc: 'Log health events, treatments & withholding periods' },
  { Icon: Weight,        label: 'Weight tracking',              desc: 'Record weights and monitor trends over time' },
  { Icon: Baby,          label: 'Breeding records',             desc: 'Mating dates, expected births & outcomes' },
  { Icon: ClipboardCheck,label: 'Tasks & reminders',            desc: 'Recurring tasks, categories & priorities' },
  { Icon: Map,           label: 'Paddock map',                  desc: 'Draw paddocks, log rotations & assign animals' },
  { Icon: Wheat,         label: 'Feed management',              desc: 'Stock levels, supplier contacts & reorder alerts' },
  { Icon: CalendarDays,  label: 'Farm calendar',                desc: 'Unified view of tasks, events & seasonal dates' },
  { Icon: Package,       label: 'Inventory',                    desc: 'Track non-feed items like chemicals & equipment' },
  { Icon: BookOpen,      label: 'Farm journal',                 desc: 'Daily notes, observations & farm diary' },
  { Icon: Leaf,          label: '4-day weather forecast',       desc: 'Live conditions and outlook for your location' },
];

const PLUS_FEATURES = [
  { Icon: PawPrint,    label: 'Unlimited animals',           desc: 'No cap on herd size. Scale your operation without limits.',                                                      highlight: true  },
  { Icon: DollarSign,  label: 'Finance tracking',            desc: "Log income and expenses, view monthly P&L summaries and keep on top of your block's cash flow.",               highlight: true  },
  { Icon: CloudRain,   label: 'Rainfall & water tanks',      desc: 'Record rainfall, monitor tank levels and track dry spells across your property.',                              highlight: false },
  { Icon: ArrowRight,  label: 'Animal transfers',            desc: 'Record ownership transfers, sale records and movement history for each animal.',                               highlight: false },
  { Icon: LayoutGrid,  label: 'Task board view & stats',     desc: 'Kanban-style board view and a stats strip showing task completion rates.',                                     highlight: false },
  { Icon: Leaf,        label: 'Season planner & pasture',    desc: 'Plan your season, log pasture cover readings, soil tests and fertiliser records.',                            highlight: false },
  { Icon: ShieldCheck, label: 'Priority support',            desc: 'Jump the queue with responses within a few hours, not days.',                                                  highlight: false },
];

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

function expiryLabel(
  iso: string | null | undefined,
  source?: string | null,
  renewalDate?: string | null,
): string {
  const days = daysUntil(iso);
  if (days === null) {
    if (source === 'paid') {
      return renewalDate ? `Renews on ${formatDate(renewalDate)}` : 'Active subscription · renews via Stripe';
    }
    return 'Lifetime access · no expiry';
  }
  if (days <= 0) return 'Expired';
  if (days === 1) return 'Expires tomorrow';
  if (days <= 30) return `${days} days remaining`;
  return `Active until ${formatDate(iso!)}`;
}

export function FernPlus() {
  const { profile } = useProfile();
  const isPlus = !!profile.fernPlus;
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError,   setCheckoutError]   = useState('');

  async function handleUpgrade() {
    setCheckoutLoading(true);
    setCheckoutError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${FUNCTIONS_URL}/create-checkout-session`, {
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
      setCheckoutError((err as Error).message);
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="pb-12">

      <PageHeader
        title="Fern Plus"
        titleIcon={
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#ea580c' }}>
            <Star width={13} height={13} style={{ color: '#fff' }} />
          </div>
        }
        chips={[
          { label: isPlus ? 'All features unlocked' : 'Free plan — upgrade to unlock more', variant: isPlus ? 'success' : 'neutral' },
        ]}
      />

      <div className="max-w-5xl mx-auto px-4 md:px-8">

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">

        {/* Free card */}
        <div
          className="rounded-2xl p-5 flex flex-col"
          style={{ background: '#f9fafb', border: '1.5px solid #e5e7eb', position: 'relative', overflow: 'hidden' }}
        >
          {!isPlus && (
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full"
              style={{ background: '#f3f4f6', fontSize: '10px', fontWeight: 700, color: '#6b7280', letterSpacing: '0.04em' }}>
              CURRENT
            </div>
          )}
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: 8 }}>Free</p>
          <div className="flex items-end gap-1 mb-4">
            <p style={{ fontSize: '32px', fontWeight: 900, color: '#111', letterSpacing: '-0.04em', lineHeight: 1 }}>$0</p>
            <p style={{ fontSize: '12px', color: '#9ca3af', paddingBottom: 4 }}>/forever</p>
          </div>
          <div className="space-y-2 mb-5 flex-1">
            {['Up to 30 animals', 'Tasks, paddocks & feed', 'Calendar & inventory', 'Weight & breeding records', 'Community support'].map(perk => (
              <div key={perk} className="flex items-center gap-2">
                <Check width={13} height={13} style={{ color: '#374151', flexShrink: 0 }} strokeWidth={2.5} />
                <span style={{ fontSize: '12px', color: '#374151' }}>{perk}</span>
              </div>
            ))}
          </div>
          <div className="w-full py-2.5 rounded-xl text-center"
            style={{ background: '#f3f4f6', fontSize: '12px', fontWeight: 600, color: '#9ca3af' }}>
            {isPlus ? 'Free plan' : 'Your current plan'}
          </div>
        </div>

        {/* Fern Plus card */}
        <div
          className="rounded-2xl p-5 flex flex-col"
          style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #fff 60%)', border: `1.5px solid ${isPlus ? '#ea580c' : '#fed7aa'}`, position: 'relative', overflow: 'hidden' }}
        >
          {isPlus && (
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full"
              style={{ background: '#fff7ed', fontSize: '10px', fontWeight: 700, color: '#ea580c', letterSpacing: '0.04em', border: '1px solid #fed7aa' }}>
              CURRENT
            </div>
          )}
          {!isPlus && (
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full"
              style={{ background: '#fff7ed', fontSize: '10px', fontWeight: 700, color: '#ea580c', letterSpacing: '0.04em', border: '1px solid #fed7aa' }}>
              UPGRADE
            </div>
          )}
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#ea580c', marginBottom: 8 }}>Fern Plus</p>
          <div className="flex items-end gap-1 mb-4">
            <p style={{ fontSize: '32px', fontWeight: 900, color: '#111', letterSpacing: '-0.04em', lineHeight: 1 }}>$16</p>
            <p style={{ fontSize: '12px', color: '#9ca3af', paddingBottom: 4 }}>/NZD / month</p>
          </div>
          <div className="space-y-2 mb-5 flex-1">
            {['Unlimited animals', 'Finance tracking & P&L', 'Rainfall & water tanks', 'Animal transfers', 'Season planner & pasture', 'Priority support'].map(perk => (
              <div key={perk} className="flex items-center gap-2">
                <Check width={13} height={13} style={{ color: '#ea580c', flexShrink: 0 }} strokeWidth={2.5} />
                <span style={{ fontSize: '12px', color: '#374151' }}>{perk}</span>
              </div>
            ))}
          </div>

          {isPlus ? (
            <div>
              <div className="w-full py-2.5 rounded-xl text-center mb-2"
                style={{ background: '#ea580c', fontSize: '12px', fontWeight: 600, color: '#fff' }}>
                ✓ Your current plan
              </div>
              <p style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center' }}>
                {expiryLabel(profile.fernPlusExpiry, profile.fernPlusSource, profile.fernPlusRenewalDate)}
              </p>
            </div>
          ) : (
            <div>
              <button
                onClick={handleUpgrade}
                disabled={checkoutLoading}
                className="w-full py-2.5 rounded-xl text-center flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70"
                style={{ background: '#ea580c', fontSize: '12px', fontWeight: 600, color: '#fff' }}
              >
                {checkoutLoading
                  ? <><Loader width={13} height={13} className="animate-spin" /> Generating link…</>
                  : <><Zap width={13} height={13} /> Upgrade to Fern Plus</>}
              </button>
              {checkoutError && (
                <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '6px', textAlign: 'center' }}>{checkoutError}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* What's included free */}
      <div className="rounded-2xl overflow-hidden mb-5" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2 mb-0.5">
            <Check width={13} height={13} style={{ color: '#16a34a' }} strokeWidth={2.5} />
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>Included in the free plan</p>
          </div>
          <p style={{ fontSize: '12px', color: '#9ca3af' }}>Everything below is available at no cost.</p>
        </div>
        <div className="divide-y" style={{ borderColor: '#f5f5f5' }}>
          {FREE_FEATURES.map(({ Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3 px-5 py-3.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#f0fdf4' }}>
                <Icon width={14} height={14} style={{ color: '#16a34a' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#111', marginBottom: 1 }}>{label}</p>
                <p style={{ fontSize: '11px', color: '#6b7280', lineHeight: 1.5 }}>{desc}</p>
              </div>
              <Check width={13} height={13} style={{ color: '#16a34a', flexShrink: 0, marginTop: 3 }} strokeWidth={2.5} />
            </div>
          ))}
        </div>
      </div>

      {/* Plus features */}
      <div className="rounded-2xl overflow-hidden mb-5" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2 mb-0.5">
            <Star width={13} height={13} style={{ color: '#ea580c' }} />
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>
              {isPlus ? 'Your Plus features' : 'Unlocked with Fern Plus'}
            </p>
          </div>
          <p style={{ fontSize: '12px', color: '#9ca3af' }}>
            {isPlus ? 'All features below are active on your account.' : 'Subscribe for $16/month NZD. Cancel any time.'}
          </p>
        </div>
        <div className="divide-y" style={{ borderColor: '#f5f5f5' }}>
          {PLUS_FEATURES.map(({ Icon, label, desc, highlight }) => (
            <div key={label} className="flex items-start gap-3 px-5 py-3.5"
              style={{ background: highlight ? '#fffbf7' : 'transparent' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#fff7ed' }}>
                <Icon width={14} height={14} style={{ color: '#ea580c' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#111' }}>{label}</p>
                  {highlight && (
                    <span className="px-1.5 py-0.5 rounded" style={{ fontSize: '9px', fontWeight: 700, color: '#ea580c', background: '#fff7ed', border: '1px solid #fed7aa' }}>
                      POPULAR
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '11px', color: '#6b7280', lineHeight: 1.5 }}>{desc}</p>
              </div>
              {isPlus
                ? <Check width={13} height={13} style={{ color: '#ea580c', flexShrink: 0, marginTop: 4 }} strokeWidth={2.5} />
                : <Lock width={12} height={12} style={{ color: '#d1d5db', flexShrink: 0, marginTop: 4 }} />
              }
            </div>
          ))}
        </div>

        {!isPlus && (
          <div className="px-5 py-4" style={{ borderTop: '1px solid #f5f5f5', background: '#fffbf7' }}>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#111' }}>Ready to unlock everything?</p>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: 2 }}>$16 NZD/month. Cancel any time.</p>
              </div>
              <button
                onClick={handleUpgrade}
                disabled={checkoutLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl flex-shrink-0 transition-all active:scale-[0.97] disabled:opacity-70"
                style={{ background: '#ea580c', color: '#fff', fontSize: '12px', fontWeight: 600 }}
              >
                {checkoutLoading ? <Loader width={12} height={12} className="animate-spin" /> : <Zap width={12} height={12} />}
                Upgrade to Plus
              </button>
            </div>
          </div>
        )}
      </div>

      <p style={{ fontSize: '11px', color: '#9ca3af', lineHeight: 1.7, textAlign: 'center' }}>
        Fern Plus is $16 NZD/month. Cancel any time.<br />
        Free plan features remain available always.
      </p>

      </div>
    </div>
  );
}

import { Link } from 'react-router';
import { Lock, Zap, Check, ArrowRight } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';

interface PlusGateProps {
  feature: string;
  tagline: string;
  perks: string[];
  icon: React.ReactNode;
  children: React.ReactNode;
}

export function PlusGate({ feature, tagline, perks, icon, children }: PlusGateProps) {
  const { profile } = useProfile();
  if (profile.fernPlus) return <>{children}</>;

  return (
    <div className="px-4 pt-6 md:px-8 md:pt-8 max-w-2xl mx-auto pb-12">

      {/* Lock badge */}
      <div className="flex flex-col items-center text-center mb-8">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 relative"
          style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', border: '1px solid #fed7aa' }}
        >
          <div style={{ color: '#ea580c', opacity: 0.35 }}>
            {icon}
          </div>
          <div
            className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: '#111', border: '2px solid #f0eeeb' }}
          >
            <Lock width={12} height={12} style={{ color: '#fff' }} />
          </div>
        </div>

        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3"
          style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}
        >
          <Zap width={10} height={10} style={{ color: '#ea580c' }} />
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#ea580c', letterSpacing: '0.06em' }}>
            FERN PLUS
          </span>
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#111', letterSpacing: '-0.03em', marginBottom: '8px' }}>
          {feature}
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.65, maxWidth: '380px' }}>
          {tagline}
        </p>
      </div>

      {/* Perks card */}
      <div
        className="rounded-2xl overflow-hidden mb-5"
        style={{ background: '#fefefe', border: '1px solid #ebebeb' }}
      >
        <div className="px-5 pt-5 pb-1">
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '12px' }}>
            What you get with {feature}
          </p>
        </div>
        <div className="divide-y" style={{ borderColor: '#f5f5f5' }}>
          {perks.map((perk) => (
            <div key={perk} className="flex items-center gap-3 px-5 py-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: '#fff7ed' }}
              >
                <Check width={11} height={11} style={{ color: '#ea580c' }} strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: '13px', color: '#374151' }}>{perk}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade card */}
      <div
        className="rounded-2xl p-6"
        style={{ background: '#111', border: '1px solid #222' }}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#e5e7eb', marginBottom: '4px' }}>Fern Plus</p>
            <div className="flex items-end gap-1">
              <span style={{ fontSize: '32px', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>$16</span>
              <span style={{ fontSize: '12px', color: '#6b7280', paddingBottom: '4px' }}>NZD/month</span>
            </div>
          </div>
          <div
            className="px-2.5 py-1 rounded-full flex-shrink-0"
            style={{ background: '#ea580c', fontSize: '10px', fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}
          >
            UPGRADE
          </div>
        </div>

        <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px', lineHeight: 1.6 }}>
          Unlock Finance, Rainfall & water, Animal transfers, Season planner, and more.
          Cancel any time.
        </p>

        <Link
          to="/fern-plus"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all active:scale-[0.98]"
          style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}
        >
          <Zap width={14} height={14} />
          Upgrade to Fern Plus
        </Link>

        <p style={{ fontSize: '11px', color: '#6b7280', textAlign: 'center', marginTop: '10px' }}>
          Cancel any time · Billed monthly via Stripe
        </p>
      </div>

      {/* Already a member note */}
      <p style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center', marginTop: '16px', lineHeight: 1.6 }}>
        See full feature breakdown on the{' '}
        <Link to="/fern-plus" style={{ color: '#ea580c', fontWeight: 600, textDecoration: 'none' }}>
          Fern Plus page <ArrowRight width={10} height={10} style={{ display: 'inline', verticalAlign: 'middle' }} />
        </Link>
      </p>
    </div>
  );
}

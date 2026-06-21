import { useState, useMemo } from 'react';
import { Copy, Check, Gift, Users, Star, Zap, BarChart2, Download, Cloud, Shield, Clock, ChevronRight, Share2 } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';

const PLUS_FEATURES = [
  { Icon: BarChart2, label: 'Advanced analytics',    desc: 'Detailed herd trends, weight charts & farm performance reports' },
  { Icon: Download,  label: 'Export everything',     desc: 'Export animals, finance & tasks to CSV or PDF any time' },
  { Icon: Cloud,     label: 'Cloud backup & sync',   desc: 'Your data synced and backed up across all your devices' },
  { Icon: Zap,       label: 'Unlimited records',     desc: 'No limits on animals, paddocks, health events or tasks' },
  { Icon: Shield,    label: 'Priority support',      desc: 'Jump the queue, responses within a few hours' },
  { Icon: Clock,     label: '14-day weather',        desc: 'Extended 14-day forecasts tuned to your block location' },
];

const STEPS = [
  { n: '1', label: 'Share your link', desc: 'Send your unique referral link to farming friends or whānau.' },
  { n: '2', label: 'They sign up',    desc: 'Your friend creates their Fern account using your link.' },
  { n: '3', label: 'They stick around', desc: 'Once they\'ve been active for 30 days, they count toward your reward.' },
];

const MOCK_REFERRALS = [
  { name: 'Mike T.',   status: 'active',  daysAgo: 18 },
  { name: 'Brooke H.', status: 'pending', daysAgo: 6  },
];

function makeCode(name: string): string {
  const slug = name.trim().split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8);
  return `FERN-${slug || 'FRIEND'}`;
}

export function Referral() {
  const { profile } = useProfile();
  const [copied, setCopied] = useState(false);
  const [referrals] = useState(MOCK_REFERRALS);

  const code    = useMemo(() => makeCode(profile.name), [profile.name]);
  const link    = `https://fernapp.nz/join?ref=${code}`;
  const active  = referrals.filter(r => r.status === 'active').length;
  const pending = referrals.filter(r => r.status === 'pending').length;
  const goal    = 3;
  const earned  = active >= goal;

  function copy() {
    navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function share() {
    if (navigator.share) {
      navigator.share({
        title: 'Join me on Fern',
        text: 'I\'ve been using Fern to manage my lifestyle block. Animals, paddocks, tasks and more. Join with my link and we both benefit!',
        url: link,
      }).catch(() => {});
    } else {
      copy();
    }
  }

  return (
    <div className="px-4 pt-6 md:px-8 md:pt-8 max-w-5xl mx-auto pb-12">

      {/* Hero */}
      <div
        className="rounded-3xl px-6 pt-8 pb-7 mb-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 55%, #9a3412 100%)' }}
      >
        {/* Decorative rings */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />

        <div className="relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4"
            style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}>
            <Star width={11} height={11} style={{ color: '#fde68a' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}>FERN PLUS</span>
          </div>

          <p style={{ fontSize: '26px', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '10px' }}>
            Invite friends,<br />earn 6 months free.
          </p>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, maxWidth: '320px' }}>
            Refer 3 friends who become active Fern users and we'll unlock Fern Plus for you, completely free for 6 months.
          </p>
        </div>
      </div>

      {/* Progress + link */}
      <div className="rounded-2xl p-5 mb-5" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>

        {/* Progress bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>Your progress</p>
            <span style={{ fontSize: '12px', fontWeight: 700, color: active >= goal ? '#15803d' : '#ea580c' }}>
              {active} / {goal} friends
            </span>
          </div>

          {/* Step dots */}
          <div className="flex items-center gap-0">
            {Array.from({ length: goal }).map((_, i) => {
              const filled = i < active;
              const isCurrent = i === active && !earned;
              return (
                <div key={i} className="flex items-center flex-1">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      background: filled ? '#ea580c' : isCurrent ? '#fff7ed' : '#f3f4f6',
                      border: `2px solid ${filled ? '#ea580c' : isCurrent ? '#fed7aa' : '#e5e7eb'}`,
                    }}
                  >
                    {filled
                      ? <Check width={14} height={14} style={{ color: '#fff' }} strokeWidth={2.5} />
                      : <Users width={13} height={13} style={{ color: isCurrent ? '#ea580c' : '#9ca3af' }} />
                    }
                  </div>
                  {i < goal - 1 && (
                    <div className="flex-1 h-0.5 mx-1" style={{ background: filled ? '#ea580c' : '#e5e7eb' }} />
                  )}
                </div>
              );
            })}
            <div className="flex items-center ml-1">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: earned ? 'linear-gradient(135deg, #ea580c, #c2410c)' : '#f3f4f6',
                  border: `2px solid ${earned ? '#ea580c' : '#e5e7eb'}`,
                }}
              >
                <Gift width={13} height={13} style={{ color: earned ? '#fff' : '#9ca3af' }} />
              </div>
            </div>
          </div>

          {/* Status line */}
          <div className="mt-3">
            {earned ? (
              <p style={{ fontSize: '12px', color: '#15803d', fontWeight: 600 }}>
                🎉 You've earned 6 months of Fern Plus! We'll be in touch shortly.
              </p>
            ) : active > 0 ? (
              <p style={{ fontSize: '12px', color: '#6b7280' }}>
                {goal - active} more active friend{goal - active !== 1 ? 's' : ''} to go
                {pending > 0 && ` · ${pending} pending`}
              </p>
            ) : (
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                Share your link below to get started
              </p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: '#f0f0f0', marginBottom: '16px' }} />

        {/* Referral link */}
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
          Your referral link
        </p>
        <div className="flex items-center gap-2 p-3 rounded-xl mb-3" style={{ background: '#f9f9f8', border: '1px solid #e5e7eb' }}>
          <p className="flex-1 truncate" style={{ fontSize: '12px', color: '#374151', fontFamily: 'monospace' }}>{link}</p>
          <button
            onClick={copy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all active:scale-95 flex-shrink-0"
            style={{ background: copied ? '#f0fdf4' : '#ea580c', color: copied ? '#15803d' : '#fff', fontSize: '11px', fontWeight: 600 }}
          >
            {copied ? <Check width={11} height={11} /> : <Copy width={11} height={11} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

      </div>

      {/* Your code + Share */}
      <div className="rounded-2xl p-5 mb-5 flex items-center justify-between" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
        <div>
          <p style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>Your code</p>
          <p style={{ fontSize: '17px', fontWeight: 800, color: '#111', letterSpacing: '0.06em', fontFamily: 'monospace' }}>{code}</p>
        </div>
        <button
          onClick={share}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all active:scale-[0.97]"
          style={{ background: '#111', color: '#fff', fontSize: '12px', fontWeight: 600 }}
        >
          <Share2 width={13} height={13} />
          Share
        </button>
      </div>

      {/* Referred friends list */}
      {referrals.length > 0 && (
        <div className="rounded-2xl overflow-hidden mb-5" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
          <div className="px-5 pt-5 pb-3">
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>People you've referred</p>
          </div>
          <div className="divide-y" style={{ borderColor: '#f5f5f5' }}>
            {referrals.map((r, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: r.status === 'active' ? '#f0fdf4' : '#fff7ed' }}>
                  <Users width={13} height={13} style={{ color: r.status === 'active' ? '#15803d' : '#ea580c' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#111' }}>{r.name}</p>
                  <p style={{ fontSize: '11px', color: '#9ca3af' }}>Joined {r.daysAgo} days ago</p>
                </div>
                <span
                  className="px-2.5 py-1 rounded-lg"
                  style={{
                    fontSize: '10px', fontWeight: 700,
                    background: r.status === 'active' ? '#f0fdf4' : '#fff7ed',
                    color: r.status === 'active' ? '#15803d' : '#ea580c',
                    border: `1px solid ${r.status === 'active' ? '#bbf7d0' : '#fed7aa'}`,
                  }}
                >
                  {r.status === 'active' ? '✓ Active' : `Pending · ${30 - r.daysAgo}d left`}
                </span>
              </div>
            ))}
          </div>
          <div className="px-5 py-3" style={{ borderTop: '1px solid #f5f5f5' }}>
            <p style={{ fontSize: '11px', color: '#9ca3af' }}>
              Friends become "active" after 30 days of using Fern.
            </p>
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="rounded-2xl p-5 mb-5" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginBottom: '16px' }}>How it works</p>
        <div className="space-y-4">
          {STEPS.map((step) => (
            <div key={step.n} className="flex items-start gap-4">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}
              >
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#ea580c' }}>{step.n}</span>
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginBottom: '2px' }}>{step.label}</p>
                <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.55 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fern Plus benefits */}
      <div className="rounded-2xl overflow-hidden mb-5" style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <Star width={13} height={13} style={{ color: '#ea580c' }} />
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>What you unlock with Fern Plus</p>
          </div>
          <p style={{ fontSize: '12px', color: '#9ca3af' }}>Everything in free, plus:</p>
        </div>
        <div className="divide-y" style={{ borderColor: '#f5f5f5' }}>
          {PLUS_FEATURES.map(({ Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3 px-5 py-3.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: '#fff7ed' }}>
                <Icon width={14} height={14} style={{ color: '#ea580c' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#111', marginBottom: '1px' }}>{label}</p>
                <p style={{ fontSize: '11px', color: '#6b7280', lineHeight: 1.5 }}>{desc}</p>
              </div>
              <ChevronRight width={13} height={13} style={{ color: '#d1d5db', flexShrink: 0, marginTop: '3px' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Fine print */}
      <p style={{ fontSize: '11px', color: '#9ca3af', lineHeight: 1.6, textAlign: 'center' }}>
        Referral rewards are applied once 3 friends have been active for 30+ days.
        Fern Plus reward is non-transferable and expires 6 months after activation.
        Friends must be new to Fern and sign up using your link or code.
      </p>

    </div>
  );
}

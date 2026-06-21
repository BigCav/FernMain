import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Zap, Check, ArrowRight } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';

const PERKS = [
  'Unlimited animals',
  'Finance tracking & P&L',
  'Rainfall & water tanks',
  'Animal transfers',
  'Season planner & pasture notes',
  'Priority support',
];

export function FernPlusSuccess() {
  const navigate   = useNavigate();
  const { profile } = useProfile();
  const [dots, setDots] = useState('');

  // Animate dots while waiting for webhook to activate the account
  useEffect(() => {
    if (profile.fernPlus) return;
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(id);
  }, [profile.fernPlus]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #fff 60%)' }}>
      <div className="w-full max-w-md">

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: '#ea580c', boxShadow: '0 12px 32px rgba(234,88,12,0.3)' }}
          >
            <Zap width={28} height={28} style={{ color: '#fff' }} />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-6">
          <p style={{ fontSize: '28px', fontWeight: 900, color: '#111', letterSpacing: '-0.04em', lineHeight: 1.2 }}>
            Welcome to Fern Plus!
          </p>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '8px' }}>
            {profile.fernPlus
              ? 'Your account is active. All features are now unlocked.'
              : `Activating your account${dots}`}
          </p>
        </div>

        {/* Perks */}
        <div className="rounded-2xl p-5 mb-5"
          style={{ background: '#fff', border: '1px solid #fed7aa', boxShadow: '0 4px 24px rgba(234,88,12,0.08)' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>
            Now unlocked
          </p>
          <div className="space-y-3">
            {PERKS.map(perk => (
              <div key={perk} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
                  <Check width={11} height={11} style={{ color: '#ea580c' }} strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{perk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate('/')}
          className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          style={{ background: '#ea580c', color: '#fff', fontSize: '14px', fontWeight: 700 }}
        >
          Go to dashboard
          <ArrowRight width={15} height={15} />
        </button>

        <p style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center', marginTop: '16px' }}>
          A receipt has been sent to {profile.email || 'your email'}.
        </p>
      </div>
    </div>
  );
}

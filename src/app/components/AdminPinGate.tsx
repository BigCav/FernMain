import { useState, useEffect, useCallback } from 'react';
import { Leaf, Delete } from 'lucide-react';

// SHA-256 of the PIN — plaintext never stored here
const PIN_HASH = '5a847bae55cfd47868fe64536427c60cb3970a0f6d6d3c61451458d77324b687';
const SESSION_KEY = 'fern_admin_unlocked';
const PIN_LENGTH = 8;

async function sha256(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

interface Props { children: React.ReactNode; }

export function AdminPinGate({ children }: Props) {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');
  const [pin,     setPin]     = useState('');
  const [shake,   setShake]   = useState(false);
  const [checking, setChecking] = useState(false);

  const check = useCallback(async (value: string) => {
    if (value.length < PIN_LENGTH) return;
    setChecking(true);
    const hash = await sha256(value);
    if (hash === PIN_HASH) {
      sessionStorage.setItem(SESSION_KEY, '1');
      setUnlocked(true);
    } else {
      setShake(true);
      setTimeout(() => { setShake(false); setPin(''); setChecking(false); }, 700);
    }
    setChecking(false);
  }, []);

  useEffect(() => {
    if (pin.length === PIN_LENGTH) { check(pin); }
  }, [pin, check]);

  const press = (d: string) => {
    if (checking || pin.length >= PIN_LENGTH) return;
    setPin(p => p + d);
  };

  const backspace = () => {
    if (checking) return;
    setPin(p => p.slice(0, -1));
  };

  if (unlocked) return <>{children}</>;

  const KEYS = [
    ['1','2','3'],
    ['4','5','6'],
    ['7','8','9'],
    ['',  '0', '⌫'],
  ];

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{ background: '#f0eeeb', fontFamily: "'Inter', system-ui, sans-serif" }}
      // block all keyboard input
      onKeyDown={e => e.preventDefault()}
    >
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%,60%  { transform: translateX(-6px); }
          40%,80%  { transform: translateX(6px); }
        }
        .pin-shake { animation: shake 0.6s ease; }
      `}</style>

      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: '#ea580c' }}>
          <Leaf width={18} height={18} style={{ color: '#fff' }} />
        </div>
        <span style={{ fontSize: '20px', fontWeight: 800, color: '#111', letterSpacing: '-0.03em' }}>Fern Admin</span>
      </div>

      {/* PIN dots */}
      <div className={`flex items-center gap-3 mb-8 ${shake ? 'pin-shake' : ''}`}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div
            key={i}
            style={{
              width: '12px', height: '12px', borderRadius: '50%',
              background: i < pin.length ? '#ea580c' : 'rgba(0,0,0,0.15)',
              transition: 'background 0.15s',
            }}
          />
        ))}
      </div>

      {/* Keypad */}
      <div
        className="rounded-3xl p-5"
        style={{ background: '#fefefe', border: '1px solid #ebebeb', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}
      >
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)', width: '216px' }}>
          {KEYS.flat().map((k, i) => {
            if (k === '') return <div key={i} />;
            const isBack = k === '⌫';
            return (
              <button
                key={i}
                onPointerDown={e => { e.preventDefault(); isBack ? backspace() : press(k); }}
                style={{
                  width: '64px', height: '64px',
                  borderRadius: '18px',
                  border: 'none',
                  background: isBack ? '#f5f5f4' : '#fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  fontSize: isBack ? '13px' : '22px',
                  fontWeight: 700,
                  color: isBack ? '#6b7280' : '#111',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'transform 0.08s, background 0.08s',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                }}
                onPointerEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = isBack ? '#ebebeb' : '#fff7ed'; }}
                onPointerLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = isBack ? '#f5f5f4' : '#fff'; }}
              >
                {isBack ? <Delete width={18} height={18} /> : k}
              </button>
            );
          })}
        </div>
      </div>

      <p style={{ fontSize: '12px', color: '#d1d5db', marginTop: '28px' }}>
        Restricted access
      </p>
    </div>
  );
}

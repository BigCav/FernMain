import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Eye, EyeOff, Leaf, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address.');
      valid = false;
    }
    if (password.length < 1) {
      setPasswordError('Please enter your password.');
      valid = false;
    }
    if (!valid) return;
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      setPasswordError('Incorrect email or password.');
      return;
    }
    navigate('/');
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: '#f0eeeb', fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#ea580c' }}>
          <Leaf width={18} height={18} style={{ color: '#fff' }} />
        </div>
        <span style={{ fontSize: '22px', fontWeight: 800, color: '#111', letterSpacing: '-0.03em' }}>Fern</span>
      </div>

      <div
        className="w-full max-w-sm rounded-2xl p-7"
        style={{ background: '#fefefe', border: '1px solid #e5e7eb', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
      >
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#111', letterSpacing: '-0.03em', marginBottom: 4 }}>
          Welcome back
        </h1>
        <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: 24 }}>
          Sign in to your Fern account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setEmailError(''); }}
              placeholder="you@example.com"
              autoFocus
              className="w-full px-3.5 py-3 rounded-xl outline-none transition-all"
              style={{
                fontSize: '13px',
                border: emailError ? '1.5px solid #ef4444' : '1.5px solid #e5e7eb',
                background: '#fafafa',
                color: '#111',
              }}
              onFocus={e => (e.target.style.borderColor = emailError ? '#ef4444' : '#ea580c')}
              onBlur={e => (e.target.style.borderColor = emailError ? '#ef4444' : '#e5e7eb')}
            />
            {emailError && (
              <p style={{ fontSize: '11px', color: '#ef4444', marginTop: 4 }}>{emailError}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>
                Password
              </label>
              <button
                type="button"
                tabIndex={-1}
                onClick={() => {}}
                style={{ fontSize: '11px', color: '#ea580c', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setPasswordError(''); }}
                placeholder="Your password"
                className="w-full px-3.5 py-3 pr-10 rounded-xl outline-none transition-all"
                style={{
                  fontSize: '13px',
                  border: passwordError ? '1.5px solid #ef4444' : '1.5px solid #e5e7eb',
                  background: '#fafafa',
                  color: '#111',
                }}
                onFocus={e => (e.target.style.borderColor = passwordError ? '#ef4444' : '#ea580c')}
                onBlur={e => (e.target.style.borderColor = passwordError ? '#ef4444' : '#e5e7eb')}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: '#9ca3af' }}
              >
                {showPassword ? <EyeOff width={15} height={15} /> : <Eye width={15} height={15} />}
              </button>
            </div>
            {passwordError && (
              <p style={{ fontSize: '11px', color: '#ef4444', marginTop: 4 }}>{passwordError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 600 }}
          >
            {submitting ? 'Signing in…' : <><span>Sign in</span><ArrowRight width={14} height={14} /></>}
          </button>
        </form>

        <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', marginTop: 20 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#ea580c', fontWeight: 600, textDecoration: 'none' }}>
            Create one free
          </Link>
        </p>
      </div>

      <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: 24, textAlign: 'center', lineHeight: 1.7 }}>
        <Link to="/terms" style={{ color: '#6b7280', textDecoration: 'underline' }}>Terms of Service</Link>
        {' · '}
        <Link to="/privacy" style={{ color: '#6b7280', textDecoration: 'underline' }}>Privacy Policy</Link>
      </p>
    </div>
  );
}

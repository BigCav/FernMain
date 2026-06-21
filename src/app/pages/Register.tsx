import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { ArrowRight, Eye, EyeOff, Leaf, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Step = 'email' | 'password';

export function Register() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [visible, setVisible] = useState(true);
  const directionRef = useRef<'forward' | 'back'>('forward');

  function animateTo(nextStep: Step, direction: 'forward' | 'back') {
    directionRef.current = direction;
    setVisible(false);
    setTimeout(() => { setStep(nextStep); setVisible(true); }, 180);
  }

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailError('');
    animateTo('password', 'forward');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    if (!agreedToTerms) {
      setTermsError(true);
      return;
    }
    setSubmitting(true);
    const { error } = await signUp(email, password);
    setSubmitting(false);
    if (error) {
      const msg = error.toLowerCase();
      if (msg.includes('rate limit')) {
        setPasswordError('Too many attempts — please wait a few minutes and try again.');
      } else if (msg.includes('already') || msg.includes('exists')) {
        setPasswordError('An account with this email already exists. Try signing in instead.');
      } else {
        setPasswordError(error);
      }
      return;
    }
    navigate('/onboarding');
  };

  const passwordStrength = (() => {
    if (password.length === 0) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength];
  const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#16a34a'][passwordStrength];

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
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div
            className="flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0"
            style={{ background: '#ea580c' }}
          >
            {step === 'password' ? (
              <Check width={12} height={12} style={{ color: '#fff' }} strokeWidth={2.5} />
            ) : (
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>1</span>
            )}
          </div>
          <div className="h-px flex-1" style={{ background: step === 'password' ? '#ea580c' : '#e5e7eb' }} />
          <div
            className="flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0"
            style={{ background: step === 'password' ? '#ea580c' : '#e5e7eb' }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, color: step === 'password' ? '#fff' : '#9ca3af' }}>2</span>
          </div>
        </div>

        <div style={{
          transition: 'opacity 180ms ease, transform 180ms ease',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateX(0)' : directionRef.current === 'forward' ? 'translateX(14px)' : 'translateX(-14px)',
        }}>
        {step === 'email' ? (
          <>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#111', letterSpacing: '-0.03em', marginBottom: 4 }}>
              Create your account
            </h1>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: 24 }}>
              Start managing your block for free.
            </p>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
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

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all active:scale-[0.98]"
                style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 600 }}
              >
                Continue
                <ArrowRight width={14} height={14} />
              </button>
            </form>

            <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', marginTop: 20 }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#ea580c', fontWeight: 600, textDecoration: 'none' }}>
                Sign in
              </Link>
            </p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#111', letterSpacing: '-0.03em', marginBottom: 4 }}>
              Set your password
            </h1>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: 24 }}>
              For <span style={{ color: '#374151', fontWeight: 600 }}>{email}</span>
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setPasswordError(''); }}
                    placeholder="At least 8 characters"
                    autoFocus
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

                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className="flex-1 h-1 rounded-full transition-all"
                          style={{ background: i <= passwordStrength ? strengthColor : '#e5e7eb' }}
                        />
                      ))}
                    </div>
                    <p style={{ fontSize: '11px', color: strengthColor, fontWeight: 600 }}>{strengthLabel}</p>
                  </div>
                )}

                {passwordError && (
                  <p style={{ fontSize: '11px', color: '#ef4444', marginTop: 4 }}>{passwordError}</p>
                )}
              </div>

              <label
                className="flex items-start gap-2.5 cursor-pointer"
                onClick={() => { setAgreedToTerms(v => !v); setTermsError(false); }}
              >
                <div
                  className="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center mt-0.5 transition-all"
                  style={{
                    background: agreedToTerms ? '#ea580c' : '#fff',
                    border: termsError ? '1.5px solid #ef4444' : agreedToTerms ? '1.5px solid #ea580c' : '1.5px solid #d1d5db',
                  }}
                >
                  {agreedToTerms && <Check width={10} height={10} style={{ color: '#fff' }} strokeWidth={3} />}
                </div>
                <span style={{ fontSize: '12px', color: termsError ? '#ef4444' : '#6b7280', lineHeight: 1.5 }}>
                  I agree to the{' '}
                  <Link
                    to="/terms"
                    target="_blank"
                    onClick={e => e.stopPropagation()}
                    style={{ color: '#ea580c', fontWeight: 600, textDecoration: 'none' }}
                  >
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link
                    to="/privacy"
                    target="_blank"
                    onClick={e => e.stopPropagation()}
                    style={{ color: '#ea580c', fontWeight: 600, textDecoration: 'none' }}
                  >
                    Privacy Policy
                  </Link>
                  {termsError && <span style={{ display: 'block', fontSize: '11px', color: '#ef4444', marginTop: '2px' }}>You must agree to continue.</span>}
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-60"
                style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 600 }}
              >
                {submitting ? 'Creating account…' : <><span>Create account</span><ArrowRight width={14} height={14} /></>}
              </button>
            </form>

            <button
              onClick={() => animateTo('email', 'back')}
              style={{ fontSize: '12px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', display: 'block', margin: '16px auto 0', textDecoration: 'underline' }}
            >
              Back
            </button>
          </>
        )}
        </div>
      </div>

    </div>
  );
}

import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';

const PUBLIC = ['/login', '/register', '/terms', '/privacy', '/home'];

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0eeeb' }}>
      <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
    </div>
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { profile, profileLoading } = useProfile();
  const { pathname } = useLocation();

  // Wait for auth to resolve
  if (loading) return <Spinner />;

  const isPublic = PUBLIC.some(p => pathname.startsWith(p));

  // Not logged in — send to landing page unless on a public page
  if (!user && !isPublic) return <Navigate to="/home" replace />;

  // Logged in but profile still loading — wait before making onboarding decision
  if (user && profileLoading) return <Spinner />;

  // Logged in — redirect away from login/register
  if (user && (pathname === '/login' || pathname === '/register')) {
    return <Navigate to={profile.onboardingComplete ? '/' : '/onboarding'} replace />;
  }

  // Logged in but onboarding not done — force onboarding for any non-public, non-onboarding route
  if (user && !profile.onboardingComplete && !isPublic && pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Onboarding already done — block access to /onboarding
  if (user && profile.onboardingComplete && pathname === '/onboarding') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

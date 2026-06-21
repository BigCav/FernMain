import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { apiGet, apiSet, apiSubscribe } from '../lib/api';
import { supabase } from '../lib/supabase';

export interface OwnerProfile {
  name: string;
  initials: string;
  property: string;
  location: string;
  region: string;
  city: string;
  email: string;
  phone: string;
  naitLocationNumber?: string;
  onboardingComplete: boolean;
  fernPlus?: boolean;
  fernPlusExpiry?: string | null;
  fernPlusSource?: 'paid' | 'grant' | null;
  stripeSubscriptionId?: string | null;
}

interface ProfileContextValue {
  profile: OwnerProfile;
  profileLoading: boolean;
  updateProfile: (patch: Partial<OwnerProfile>) => void;
}

function getInitials(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

export function resolvePlus(data: OwnerProfile): boolean {
  if (!data.fernPlus) return false;
  if (!data.fernPlusExpiry) return true;
  return new Date(data.fernPlusExpiry) > new Date();
}

const DEFAULT: OwnerProfile = {
  name: '', initials: '', property: '', location: '', region: '', city: '', email: '', phone: '',
  onboardingComplete: false,
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<OwnerProfile>(DEFAULT);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!user) { setProfile(DEFAULT); setProfileLoading(false); return; }
    setProfileLoading(true);

    function applyData(data: OwnerProfile) {
      setProfile({ ...data, fernPlus: resolvePlus(data) });
    }

    apiGet<OwnerProfile>('profile').then(data => {
      if (data) applyData(data);
      else setProfile({ ...DEFAULT, email: user.email ?? '' });
      setProfileLoading(false);
    });

    // Realtime subscription — fires instantly when kv_store row changes
    // (webhook grant, admin grant, etc.) — no refresh needed
    const channel = supabase
      .channel(`profile:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'kv_store_4e6b560b',
          filter: `key=eq.user:${user.id}:profile`,
        },
        (payload) => {
          const data = (payload.new as { value: OwnerProfile }).value;
          if (data) applyData(data);
        },
      )
      .subscribe();

    const unsub = apiSubscribe('profile', (d) => {
      const data = d as OwnerProfile | null;
      if (data) applyData(data);
    });

    return () => {
      supabase.removeChannel(channel);
      unsub();
    };
  }, [user?.id]);

  function updateProfile(patch: Partial<OwnerProfile>) {
    setProfile(prev => {
      const next = { ...prev, ...patch };
      if (patch.name !== undefined) next.initials = getInitials(patch.name);
      apiSet('profile', next);
      return next;
    });
  }

  return (
    <ProfileContext.Provider value={{ profile, profileLoading, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider');
  return ctx;
}

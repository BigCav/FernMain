import { useState, useRef, useEffect, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink, Link, Outlet, useLocation } from 'react-router';
import { LayoutDashboard, PawPrint, Wheat, ClipboardCheck, Plus, Map, Settings, DollarSign, CloudRain, BookOpen, LifeBuoy, User, HelpCircle, Bell, WifiOff, CalendarDays, Package, Sparkles, Lock, Leaf } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { usePaddocks } from '../context/PaddocksContext';
import { useNotifications } from '../context/NotificationsContext';
import { NewTaskModal } from './NewTaskModal';
import { RELEASES } from '../pages/Changelog';
import { NotificationsPanel } from './NotificationsPanel';
import { apiFlushPending } from '../lib/api';
import { useFeedReorderWatcher } from '../hooks/useFeedReorderWatcher';
import { useBreedingTaskWatcher } from '../hooks/useBreedingTaskWatcher';
import { useTankTaskWatcher } from '../hooks/useTankTaskWatcher';
import { useOverdueTaskWatcher } from '../hooks/useOverdueTaskWatcher';
import { useBreedingAlertWatcher } from '../hooks/useBreedingAlertWatcher';
import { useWithholdingExpiryWatcher } from '../hooks/useWithholdingExpiryWatcher';

const NAV = [
  { to: '/',         label: 'Dashboard', short: 'Home',    Icon: LayoutDashboard, dividerAfter: false, mobileOnly: false, plus: false, tourDesc: 'Your farm at a glance'                   },
  { to: '/animals',  label: 'Animals',   short: 'Animals', Icon: PawPrint,        dividerAfter: false, mobileOnly: false, plus: false, tourDesc: 'Health records, weights & breeding'      },
  { to: '/feed',     label: 'Feed',      short: 'Feed',    Icon: Wheat,           dividerAfter: false, mobileOnly: false, plus: false, tourDesc: 'Feed stocks and supplies'                },
  { to: '/tasks',    label: 'Tasks',     short: 'Tasks',   Icon: ClipboardCheck,  dividerAfter: false, mobileOnly: false, plus: false, tourDesc: 'To-dos and seasonal reminders'           },
  { to: '/paddocks', label: 'Paddocks',  short: 'Map',     Icon: Map,             dividerAfter: false, mobileOnly: false, plus: false, tourDesc: 'Map and manage your grazing areas'       },
  { to: '/calendar', label: 'Calendar',  short: 'Cal',     Icon: CalendarDays,    dividerAfter: false, mobileOnly: false, plus: false, tourDesc: 'Events and scheduled activities'         },
  { to: '/inventory',label: 'Inventory', short: 'Stock',   Icon: Package,         dividerAfter: false, mobileOnly: false, plus: false, tourDesc: 'Medications, equipment and supplies'     },
  { to: '/journal',  label: 'Journal',   short: 'Journal', Icon: BookOpen,        dividerAfter: true,  mobileOnly: false, plus: false, tourDesc: 'Notes, observations and weather logs'    },
  { to: '/finance',  label: 'Finance',   short: 'Finance', Icon: DollarSign,      dividerAfter: false, mobileOnly: false, plus: true,  tourDesc: 'Income, expenses and monthly P&L'       },
  { to: '/rainfall', label: 'Rainfall',  short: 'Rain',    Icon: CloudRain,       dividerAfter: false, mobileOnly: false, plus: true,  tourDesc: 'Rain gauge readings and tank levels'     },
  { to: '/profile',  label: 'Profile',   short: 'Profile', Icon: User,            dividerAfter: false, mobileOnly: true,  plus: false, tourDesc: 'Your profile and farm details'           },
  { to: '/settings', label: 'Settings',  short: 'Settings',Icon: Settings,        dividerAfter: false, mobileOnly: true,  plus: false, tourDesc: 'Preferences and configuration'           },
  { to: '/faq',      label: 'FAQ',       short: 'FAQ',     Icon: HelpCircle,      dividerAfter: true,  mobileOnly: true,  plus: false, tourDesc: 'Help and common questions'               },
  { to: '/support',  label: 'Support',   short: 'Support', Icon: LifeBuoy,        dividerAfter: false, mobileOnly: true,  plus: false, tourDesc: 'Get in touch with the team'              },
];

function SidebarLink({ to, label, Icon, locked }: { to: string; label: string; Icon: React.ElementType; locked?: boolean }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 12px',
        borderRadius: '10px',
        transition: 'all 0.15s',
        textDecoration: 'none',
        background: isActive ? 'rgba(255,255,255,0.10)' : 'transparent',
        color: isActive ? '#ffffff' : locked ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.42)',
      })}
    >
      {({ isActive }) => (
        <>
          <Icon width={15} height={15} />
          <span style={{ fontSize: '13px', fontWeight: isActive ? 600 : 400 }}>{label}</span>
          {isActive && !locked && (
            <span className="ml-auto w-1 h-4 rounded-full" style={{ background: '#ea580c' }} />
          )}
          {locked && !isActive && (
            <Lock width={10} height={10} className="ml-auto" style={{ color: 'rgba(255,255,255,0.22)', flexShrink: 0 }} />
          )}
          {locked && isActive && (
            <Lock width={10} height={10} className="ml-auto" style={{ color: 'rgba(255,255,255,0.5)', flexShrink: 0 }} />
          )}
        </>
      )}
    </NavLink>
  );
}

function MobileNavItem({ to, short, Icon, locked }: { to: string; short: string; Icon: React.ElementType; locked?: boolean }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className="flex-shrink-0 flex flex-col items-center gap-0.5 py-2 px-1 rounded-2xl transition-all relative"
      style={({ isActive }) => ({
        minWidth: 'calc((100vw - 122px) / 5)',
        background: isActive ? 'rgba(234,88,12,0.18)' : 'transparent',
        textDecoration: 'none',
      })}
    >
      {({ isActive }) => (
        <>
          <div className="relative">
            <Icon
              width={17} height={17}
              strokeWidth={isActive ? 2.5 : 1.75}
              style={{ color: isActive ? '#ea580c' : locked ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.38)', transition: 'color 0.15s' }}
            />
            {locked && !isActive && (
              <div className="absolute -top-1 -right-1.5 w-3 h-3 rounded-full flex items-center justify-center" style={{ background: '#222' }}>
                <Lock width={6} height={6} style={{ color: 'rgba(255,255,255,0.4)' }} />
              </div>
            )}
          </div>
          <span style={{
            fontSize: '8.5px',
            fontWeight: isActive ? 700 : 400,
            color: isActive ? '#ea580c' : locked ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.38)',
            transition: 'color 0.15s',
            letterSpacing: isActive ? '0.02em' : '0',
          }}>
            {short}
          </span>
        </>
      )}
    </NavLink>
  );
}

function useOnline() {
  return useSyncExternalStore(
    (cb) => { window.addEventListener('online', cb); window.addEventListener('offline', cb); return () => { window.removeEventListener('online', cb); window.removeEventListener('offline', cb); }; },
    () => navigator.onLine,
    () => true,
  );
}

const PUBLIC_CONTENT = ['/privacy', '/terms'];

export function Layout() {
  const [modalOpen, setModalOpen] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [navTour, setNavTour] = useState(() => localStorage.getItem('fern_nav_tour_pending') === '1');
  const [tourIdx, setTourIdx] = useState(0);
  const navScrollRef = useRef<HTMLDivElement>(null);
  const navItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isOnline = useOnline();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { paddocks } = usePaddocks();
  const { unreadCount } = useNotifications();
  const totalHa = paddocks.reduce((s, p) => s + p.hectares, 0);
  useFeedReorderWatcher();
  useBreedingTaskWatcher();
  useTankTaskWatcher();
  useOverdueTaskWatcher();
  useBreedingAlertWatcher();
  useWithholdingExpiryWatcher();
  const mainRef = useRef<HTMLElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const mobileBellRef = useRef<HTMLButtonElement>(null);
  const { pathname } = useLocation();

  const [tourFinishing, setTourFinishing] = useState(false);

  function dismissTour() {
    setNavTour(false);
    setTourFinishing(false);
    setTourIdx(0);
    localStorage.removeItem('fern_nav_tour_pending');
  }

  useEffect(() => {
    if (!navTour) return;
    const el = navItemRefs.current[tourIdx];
    if (el && navScrollRef.current) {
      const container = navScrollRef.current;
      const target = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
    }
    const isLast = tourIdx >= NAV.length - 1;
    const t = setTimeout(() => {
      if (isLast) {
        // Scroll back to first item
        setTourIdx(0);
        setTourFinishing(true);
        if (navScrollRef.current) navScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        // Show spinner for 1.8s then dismiss
        setTimeout(dismissTour, 1800);
      } else {
        setTourIdx(i => i + 1);
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [navTour, tourIdx]);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  useEffect(() => {
    const onBack = () => apiFlushPending();
    window.addEventListener('online', onBack);
    return () => window.removeEventListener('online', onBack);
  }, []);

  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') setKeyboardOpen(true);
    };
    const onFocusOut = () => setKeyboardOpen(false);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  // Logged-out users accessing public legal pages — no sidebar
  if (!user && PUBLIC_CONTENT.some(p => pathname.startsWith(p))) {
    return (
      <div style={{ background: '#f0eeeb', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif" }}>
        <Outlet />
      </div>
    );
  }

  return (
    <>
      <div
        className="flex h-screen overflow-hidden"
        style={{ background: '#f0eeeb', fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        {/* ─── Desktop Sidebar ─── */}
        <aside
          className="hidden md:flex flex-col w-56 flex-shrink-0 min-h-0 h-screen"
          style={{ background: '#111111' }}
        >
          {/* Profile — top of sidebar */}
          <div
            style={{
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              background: pathname === '/profile' ? 'rgba(255,255,255,0.06)' : 'transparent',
              transition: 'background 0.15s',
            }}
            className="flex items-center"
          >
            <NavLink
              to="/profile"
              style={{
                textDecoration: 'none',
                display: 'block',
                flex: 1,
                padding: '16px 12px 16px 16px',
                minWidth: 0,
              }}
              className="hover:opacity-80 active:opacity-60"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: '#ea580c' }}
                >
                  <span className="text-white" style={{ fontSize: '12px', fontWeight: 700 }}>
                    {profile.initials}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-white truncate" style={{ fontSize: '13px', fontWeight: 700 }}>
                    {profile.name}
                  </p>
                  {profile.fernPlus && (
                    <span
                      className="inline-flex items-center gap-1 mt-0.5"
                      style={{
                        padding: '1.5px 6px',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                        fontSize: '9px',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        color: '#fff',
                        textTransform: 'uppercase',
                        boxShadow: '0 1px 4px rgba(234,88,12,0.35)',
                      }}
                    >
                      <Sparkles width={8} height={8} strokeWidth={2.5} />
                      Fern Plus
                    </span>
                  )}
                  {!profile.fernPlus && (
                    <p className="truncate" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)' }}>
                      {profile.property} · {totalHa.toFixed(1)}ha
                    </p>
                  )}
                </div>
              </div>
            </NavLink>
            {/* Bell */}
            <button
              ref={bellRef}
              onClick={() => setNotifOpen(v => !v)}
              className="relative flex items-center justify-center flex-shrink-0 mr-3 transition-opacity hover:opacity-70"
              style={{ width: '34px', height: '34px', borderRadius: '10px', background: notifOpen ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)' }}
            >
              <Bell width={15} height={15} style={{ color: 'rgba(255,255,255,0.7)' }} />
              {unreadCount > 0 && (
                <span
                  className="absolute flex items-center justify-center"
                  style={{ top: '4px', right: '4px', minWidth: '16px', height: '16px', borderRadius: '8px', background: '#ef4444', fontSize: '9px', fontWeight: 800, color: '#fff', padding: '0 3px', border: '1.5px solid #111' }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* New Task CTA */}
          <div className="px-4 pt-5 pb-2">
            <button
              onClick={() => setModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all active:scale-[0.97]"
              style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 600 }}
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          </div>

          {/* Main nav */}
          <nav className="flex-1 min-h-0 px-3 py-2 space-y-0.5 overflow-y-auto">
            {NAV.filter(n => !n.mobileOnly).map(({ to, label, Icon, plus }) => (
              <SidebarLink key={to} to={to} label={label} Icon={Icon} locked={plus && !profile.fernPlus} />
            ))}
          </nav>

          {/* Settings + FAQ */}
          <div className="px-3 pb-2 space-y-0.5">
            <SidebarLink to="/settings" label="Settings" Icon={Settings} />
            <SidebarLink to="/faq" label="FAQ" Icon={HelpCircle} />
          </div>

          {/* Support button + legal links */}
          <div className="px-4 pb-5">
            <NavLink
              to="/support"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                padding: '9px 12px',
                borderRadius: '10px',
                transition: 'all 0.15s',
                textDecoration: 'none',
                background: isActive ? '#c2410c' : '#ea580c',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
              })}
            >
              Support
            </NavLink>
            <div className="flex flex-col items-center gap-1 mt-2.5">
              <div className="flex items-center justify-center gap-2.5">
                <Link
                  to="/privacy"
                  style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'color 0.15s' }}
                  className="hover:text-white"
                >
                  Privacy Policy
                </Link>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>·</span>
                <Link
                  to="/terms"
                  style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'color 0.15s' }}
                  className="hover:text-white"
                >
                  Terms of Service
                </Link>
              </div>
              <div className="flex items-center justify-center gap-2.5">
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>v{RELEASES[0].version}</span>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>·</span>
                <Link
                  to="/changelog"
                  style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'color 0.15s' }}
                  className="hover:text-white"
                >
                  Changelog
                </Link>
              </div>
            </div>
          </div>
        </aside>

        {/* ─── Main ─── */}
        <main ref={mainRef} className="flex-1 overflow-y-auto" style={{ paddingTop: isOnline ? 0 : '38px' }}>
          <div className="pb-28 md:pb-6">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </div>
        </main>

        {/* ─── Mobile Bottom Nav ─── */}
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-center px-3"
          style={{
            paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
            paddingTop: '8px',
            background: '#f0eeeb',
            transform: keyboardOpen ? 'translateY(110%)' : 'translateY(0)',
            transition: 'transform 0.2s ease',
          }}
        >
          <nav
            className="flex items-center w-full px-2 py-2 gap-0.5"
            style={{
              background: '#111111',
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.18)',
            }}
          >
            {/* Scrollable nav items */}
            <div ref={navScrollRef} className="flex-1 flex items-center overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {NAV.map(({ to, short, Icon, dividerAfter, plus }, i) => (
                <div key={to} className="flex items-center flex-shrink-0">
                  <div
                    ref={el => { navItemRefs.current[i] = el; }}
                    style={{
                      borderRadius: '16px',
                      boxShadow: navTour && tourIdx === i
                        ? '0 0 0 2px #ea580c, 0 0 16px rgba(234,88,12,0.55)'
                        : '0 0 0 0px transparent',
                      transition: 'box-shadow 0.25s ease',
                    }}
                  >
                    <MobileNavItem to={to} short={short} Icon={Icon} locked={plus && !profile.fernPlus} />
                  </div>
                  {dividerAfter && (
                    <div className="flex-shrink-0 w-px h-5 mx-0.5 self-center" style={{ background: 'rgba(255,255,255,0.15)' }} />
                  )}
                </div>
              ))}
            </div>

            {/* Separator */}
            <div className="flex-shrink-0 w-px self-stretch mx-1.5 my-1.5" style={{ background: 'rgba(255,255,255,0.13)' }} />

            {/* Bell */}
            <button
              ref={mobileBellRef}
              onClick={() => setNotifOpen(v => !v)}
              className="relative flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
              style={{ width: '40px', height: '40px', borderRadius: '14px', background: notifOpen ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)' }}
            >
              <Bell width={17} height={17} style={{ color: 'rgba(255,255,255,0.7)' }} />
              {unreadCount > 0 && (
                <span
                  className="absolute flex items-center justify-center"
                  style={{ top: '5px', right: '5px', minWidth: '14px', height: '14px', borderRadius: '7px', background: '#ef4444', fontSize: '8px', fontWeight: 800, color: '#fff', padding: '0 2px', border: '1.5px solid #111' }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* New Task FAB */}
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center justify-center flex-shrink-0 ml-1 transition-all active:scale-95"
              style={{
                width: '40px',
                height: '40px',
                background: '#ea580c',
                borderRadius: '14px',
                boxShadow: '0 4px 14px rgba(234,88,12,0.45)',
              }}
            >
              <Plus className="w-4 h-4 text-white" strokeWidth={2.5} />
            </button>
          </nav>
        </div>
      </div>

      <NewTaskModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} bellRefs={[bellRef, mobileBellRef]} />

      {/* ── Mobile nav tour coach mark ── */}
      <AnimatePresence>
        {navTour && (() => {
          const item = NAV[tourIdx];
          const TourIcon = item?.Icon;
          return (
            <motion.div
              key="nav-tour"
              className="md:hidden fixed inset-0 z-[55] flex flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={dismissTour}
              style={{ background: 'rgba(0,0,0,0.55)' }}
            >
              {/* Centre message */}
              <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#ea580c' }}>
                  <Leaf width={24} height={24} style={{ color: '#fff' }} />
                </div>
                <p style={{ fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: '8px' }}>
                  Here's how to navigate Fern
                </p>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                  Swipe the bar below to reach any section
                </p>
              </div>

              {/* Spinner shown when finishing */}
              <AnimatePresence>
                {tourFinishing && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ background: 'rgba(0,0,0,0.7)' }}
                  >
                    <style>{`
                      @keyframes fern-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    `}</style>
                    <div style={{
                      width: '48px', height: '48px',
                      border: '4px solid rgba(234,88,12,0.25)',
                      borderTopColor: '#ea580c',
                      borderRadius: '50%',
                      animation: 'fern-spin 0.75s linear infinite',
                    }} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tooltip card above nav */}
              {!tourFinishing && (
                <motion.div
                  className="absolute left-3 right-3 flex flex-col"
                  style={{ bottom: 'calc(max(env(safe-area-inset-bottom), 12px) + 76px)' }}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="rounded-2xl overflow-hidden" style={{ background: '#1c1c1e', boxShadow: '0 8px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center gap-3.5 px-4 pt-4 pb-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(234,88,12,0.18)' }}>
                        {TourIcon && <TourIcon width={17} height={17} style={{ color: '#ea580c' }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>{item?.label}</p>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '1px' }}>{item?.tourDesc}</p>
                      </div>
                      <button onClick={dismissTour} className="flex-shrink-0 px-3 py-1.5 rounded-xl transition-all active:scale-95" style={{ background: 'rgba(255,255,255,0.08)', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        Skip
                      </button>
                    </div>
                    <div className="mx-4 mb-3.5 rounded-full overflow-hidden" style={{ height: '3px', background: 'rgba(255,255,255,0.08)' }}>
                      <motion.div className="h-full rounded-full" style={{ background: '#ea580c' }} animate={{ width: `${((tourIdx + 1) / NAV.length) * 100}%` }} transition={{ duration: 0.5, ease: 'easeOut' }} />
                    </div>
                    <div className="px-4 pb-3.5 flex items-center justify-between">
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>Swipe the bar to reach any page</p>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>{tourIdx + 1} / {NAV.length}</p>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div style={{ width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderTop: '8px solid #1c1c1e' }} />
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Offline banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            key="offline-banner"
            className="fixed top-0 left-0 md:left-56 right-0 z-[100] flex items-center justify-center gap-2 py-2.5 px-4"
            style={{ background: '#111111', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          >
            <WifiOff width={12} height={12} style={{ color: '#ea580c', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
              <span style={{ fontWeight: 600, color: '#fff' }}>No connection</span>
              <span style={{ color: 'rgba(255,255,255,0.45)' }}> — changes will sync when back online</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
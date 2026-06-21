import { Link } from 'react-router';
import {
  Leaf, PawPrint, Wheat, ClipboardCheck, CloudRain, DollarSign,
  Map, CalendarDays, ArrowRight, Check, Star, ChevronDown,
  AlertTriangle, Smartphone, Download,
} from 'lucide-react';

// Replace this URL with your hosted APK download link
const APK_URL = '/fern.apk';
import { useState } from 'react';

const HERO_URL = 'https://images.unsplash.com/photo-1770862887552-c36e0586eeee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxOZXclMjBaZWFsYW5kJTIwZmFybSUyMGxpZmVzdHlsZSUyMGJsb2NrJTIwcm9sbGluZyUyMGhpbGxzJTIwZ3JlZW58ZW58MXx8fHwxNzgwNDQ3NTgyfDA&ixlib=rb-4.1.0&q=80&w=1080';

const FEATURES = [
  {
    icon: <PawPrint width={18} height={18} />,
    color: '#7c3aed', bg: '#f5f3ff',
    title: 'Animal tracking',
    desc: 'Tag and track every animal on your block. Health events, treatments, weight, breeding records, and withholding periods, all in one place.',
  },
  {
    icon: <Wheat width={18} height={18} />,
    color: '#d97706', bg: '#fffbeb',
    title: 'Feed management',
    desc: 'Monitor stock levels across all your feed, get low-stock alerts, and log usage so you never run short mid-winter.',
  },
  {
    icon: <ClipboardCheck width={18} height={18} />,
    color: '#15803d', bg: '#f0fdf4',
    title: 'Farm tasks',
    desc: 'Schedule recurring jobs, track overdue work, and keep your week organised with a dedicated farm task board.',
  },
  {
    icon: <Map width={18} height={18} />,
    color: '#0ea5e9', bg: '#f0f9ff',
    title: 'Paddock mapping',
    desc: 'Draw your paddocks on a satellite map, log rotations, and track which animals are grazing where.',
  },
  {
    icon: <DollarSign width={18} height={18} />,
    color: '#16a34a', bg: '#f0fdf4',
    title: 'Finance tracking',
    desc: "Log income and expenses, view monthly P&L summaries, and keep on top of your block's cash flow without a spreadsheet.",
  },
  {
    icon: <CloudRain width={18} height={18} />,
    color: '#3b82f6', bg: '#eff6ff',
    title: 'Rainfall & water',
    desc: 'Record rainfall and monitor tank levels so you always know how your water supply is tracking through dry spells.',
  },
  {
    icon: <CalendarDays width={18} height={18} />,
    color: '#ea580c', bg: '#fff7ed',
    title: 'Farm calendar',
    desc: 'See tasks, breeding due dates, health checks, and seasonal milestones in one unified farm calendar view.',
  },
  {
    icon: <Leaf width={18} height={18} />,
    color: '#059669', bg: '#ecfdf5',
    title: 'Farm journal',
    desc: 'Keep a private diary of observations, decisions, and seasonal notes. A running log of life on your block.',
  },
];

const FREE_FEATURES = [
  'Up to 30 animals',
  'Animal health & withholding',
  'Weight & breeding records',
  'Tasks, paddocks & feed',
  'Calendar & inventory',
  'Farm journal',
];

const PLUS_FEATURES = [
  'Unlimited animals',
  'Finance tracking & P&L',
  'Rainfall & water tanks',
  'Animal transfers',
  'Season planner & pasture notes',
  'Task board view & stats',
  'Priority support',
];

const FAQS = [
  {
    q: 'Is there a free plan?',
    a: 'Yes, Fern is free for lifestyle blocks with up to 30 animals. The free plan includes animal tracking, feed management, tasks, and your paddock map.',
  },
  {
    q: 'Who is Fern built for?',
    a: 'Fern is designed for New Zealand small farmers and lifestyle block owners who want a simple, practical way to manage their property, without the complexity of enterprise farm software.',
  },
  {
    q: 'Can I cancel Fern Plus at any time?',
    a: 'Yes, you can cancel at any time. Your Plus features remain active until the end of your billing period.',
  },
  {
    q: 'Is my data safe?',
    a: 'Your farm data is stored securely in New Zealand-based infrastructure. We never sell or share your data with third parties.',
  },
  {
    q: 'Does Fern work on mobile?',
    a: 'Fern is a progressive web app that works great on any device: phone, tablet, or desktop. Add it to your home screen for an app-like experience.',
  },
];

function FeatureCard({ icon, color, bg, title, desc }: {
  icon: React.ReactNode; color: string; bg: string; title: string; desc: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: '#fefefe',
        border: `1px solid ${hovered ? '#d1d5db' : '#ebebeb'}`,
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.09)' : '0 0 0 rgba(0,0,0,0)',
        transition: 'transform 220ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 220ms ease, border-color 180ms ease',
        cursor: 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
        style={{
          background: bg,
          color,
          transform: hovered ? 'scale(1.1)' : 'scale(1)',
          transition: 'transform 250ms cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {icon}
      </div>
      <p style={{ fontSize: '14px', fontWeight: 700, color: '#111', marginBottom: '6px' }}>{title}</p>
      <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.6 }}>{desc}</p>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="border rounded-2xl overflow-hidden cursor-pointer select-none"
      style={{
        borderColor: hovered || open ? '#d1d5db' : '#e5e7eb',
        background: '#fefefe',
        transform: hovered ? 'translateY(-1px)' : 'none',
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.07)' : '0 0 0 rgba(0,0,0,0)',
        transition: 'transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease',
      }}
      onClick={() => setOpen(v => !v)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center justify-between px-5 py-4 gap-4">
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#111', transition: 'color 150ms' }}>{q}</p>
        <ChevronDown
          width={16} height={16}
          style={{
            color: open ? '#ea580c' : '#9ca3af',
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 250ms cubic-bezier(0.4,0,0.2,1), color 200ms',
          }}
        />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateRows: open ? '1fr' : '0fr',
          transition: 'grid-template-rows 250ms cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <div className="px-5 pb-4 border-t" style={{ borderColor: '#f3f4f6' }}>
            <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.7, paddingTop: '12px' }}>{a}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mini stat card matching the real dashboard style
function MockStatCard({
  icon, iconBg, iconColor, badge, badgeBg, badgeColor,
  value, valueColor, label, sub, cardBg, cardBorder,
}: {
  icon: React.ReactNode; iconBg: string; iconColor: string;
  badge?: string; badgeBg?: string; badgeColor?: string;
  value: string; valueColor: string; label: string; sub: string;
  cardBg?: string; cardBorder?: string;
}) {
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: cardBg ?? '#fefefe', border: `1px solid ${cardBorder ?? '#ebebeb'}` }}
    >
      <div className="flex items-center justify-between mb-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>
        {badge && (
          <span
            className="px-1.5 py-0.5 rounded-md"
            style={{ fontSize: '9px', fontWeight: 700, background: badgeBg, color: badgeColor }}
          >
            {badge}
          </span>
        )}
      </div>
      <p style={{ fontSize: '20px', fontWeight: 800, color: valueColor, letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: '9px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '3px' }}>{label}</p>
      <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '1px' }}>{sub}</p>
    </div>
  );
}

export function LandingPage() {
  return (
    <div style={{ background: '#f0eeeb', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Nav */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-5 py-3.5 md:px-10"
        style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#ea580c' }}>
            <Leaf width={14} height={14} style={{ color: '#fff' }} />
          </div>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#111', letterSpacing: '-0.03em' }}>Fern</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={APK_URL}
            download="fern.apk"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all hover:bg-gray-100"
            style={{ fontSize: '12px', fontWeight: 600, color: '#374151', textDecoration: 'none', border: '1px solid #e5e7eb' }}
          >
            <Smartphone width={12} height={12} />
            Android APK
          </a>
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl transition-all hover:bg-white"
            style={{ fontSize: '13px', fontWeight: 600, color: '#374151', textDecoration: 'none' }}
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all active:scale-[0.97]"
            style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}
          >
            Get started free
            <ArrowRight width={13} height={13} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-5 pt-16 pb-12 md:pt-24 md:pb-20 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
              style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#ea580c', letterSpacing: '0.04em' }}>
                BUILT FOR NZ LIFESTYLE BLOCKS
              </span>
            </div>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 900, color: '#111', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '18px' }}>
              Everything on your block,<br />
              <span style={{ color: '#ea580c' }}>finally organised.</span>
            </h1>
            <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.75, marginBottom: '28px', maxWidth: '480px' }}>
              Fern is a simple farm management app for New Zealand small farmers and lifestyle block owners.
              Track animals, feed, tasks, finances, and rainfall, all from your phone.
            </p>
            <div className="inline-flex items-center gap-3 rounded-2xl px-3 py-2.5" style={{ background: '#fff', border: '1px solid #ebebeb', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <Link
                to="/register"
                className="flex items-center gap-2 px-5 py-3 rounded-xl transition-all active:scale-[0.97] hover:brightness-95"
                style={{ background: '#ea580c', color: '#fff', fontSize: '14px', fontWeight: 700, textDecoration: 'none' }}
              >
                Start for free
                <ArrowRight width={15} height={15} />
              </Link>
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>No credit card needed</p>
            </div>
            {/* Social proof */}
            <div className="flex items-center gap-1.5 mt-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} width={13} height={13} fill="#fbbf24" style={{ color: '#fbbf24' }} />
              ))}
              <p style={{ fontSize: '12px', color: '#6b7280', marginLeft: '4px' }}>
                Loved by lifestyle block owners across NZ
              </p>
            </div>
          </div>

          {/* Hero image */}
          <div className="relative px-4 md:px-6">
            <div
              className="rounded-3xl overflow-hidden shadow-2xl"
              style={{ aspectRatio: '4/3' }}
            >
              <img
                src={HERO_URL}
                alt="Fluffy white sheep grazing on green New Zealand hillside"
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0 rounded-3xl"
                style={{ background: 'linear-gradient(135deg, rgba(234,88,12,0.08) 0%, transparent 60%)' }}
              />
            </div>
            {/* Floating stat cards */}
            <div
              className="absolute -bottom-4 left-0 rounded-2xl px-4 py-3 shadow-lg"
              style={{ background: '#fff', border: '1px solid #f3f4f6' }}
            >
              <p style={{ fontSize: '22px', fontWeight: 800, color: '#111', letterSpacing: '-0.04em', lineHeight: 1 }}>100%</p>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>NZ-focused features</p>
            </div>
            <div
              className="absolute -top-4 right-0 rounded-2xl px-4 py-3 shadow-lg"
              style={{ background: '#fff', border: '1px solid #f3f4f6' }}
            >
              <p style={{ fontSize: '22px', fontWeight: 800, color: '#ea580c', letterSpacing: '-0.04em', lineHeight: 1 }}>Free</p>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>to get started</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section style={{ background: '#fff', borderTop: '1px solid #ebebeb', borderBottom: '1px solid #ebebeb' }}>
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-center gap-6 flex-wrap">
          {['Animal tracking', 'Feed management', 'Task board', 'Finance', 'Paddock map', 'Rainfall & water'].map(f => (
            <div key={f} className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#ea580c' }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>{f}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-5 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#111', letterSpacing: '-0.03em', marginBottom: '10px' }}>
            Everything a lifestyle block needs
          </h2>
          <p style={{ fontSize: '15px', color: '#6b7280', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
            From a couple of sheep to a busy mixed-animal operation, Fern scales with your block.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon, color, bg, title, desc }) => (
            <FeatureCard key={title} icon={icon} color={color} bg={bg} title={title} desc={desc} />
          ))}
        </div>
      </section>

      {/* Dashboard preview callout */}
      <section
        className="mx-4 md:mx-10 lg:mx-auto max-w-5xl rounded-3xl overflow-hidden mb-16 md:mb-24"
        style={{ background: 'linear-gradient(135deg, #111 0%, #1c1917 100%)' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 items-center">
          <div className="px-8 py-10 md:px-12">
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#ea580c', letterSpacing: '0.08em', marginBottom: '12px' }}>YOUR DAILY VIEW</p>
            <h3 style={{ fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: '14px' }}>
              A dashboard that actually makes sense
            </h3>
            <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: 1.75, marginBottom: '24px' }}>
              See what needs attention today: overdue tasks, animals flagged for care, low feed, upcoming health checks, and this month's finances, all on one screen.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all hover:brightness-95"
              style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}
            >
              Try it free
              <ArrowRight width={13} height={13} />
            </Link>
          </div>
          <div className="px-6 pb-8 md:py-8 md:pr-8">
            {/* Mini dashboard mockup matching real dashboard style */}
            <div className="rounded-2xl overflow-hidden" style={{ background: '#f0eeeb' }}>
              {/* Header */}
              <div className="px-4 pt-4 pb-3">
                <p style={{ fontSize: '14px', fontWeight: 800, color: '#111', letterSpacing: '-0.02em' }}>Good morning, Sarah</p>
                <p style={{ fontSize: '11px', color: '#9ca3af' }}>Thu 4 Jun · Autumn</p>
              </div>
              {/* Alert banner — above stats */}
              <div className="mx-3 mb-2 rounded-xl px-3 py-2 flex items-center gap-2" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
                <AlertTriangle width={11} height={11} style={{ color: '#ea580c', flexShrink: 0 }} />
                <p style={{ fontSize: '10px', fontWeight: 600, color: '#92400e' }}>1 task overdue · 3 animals need attention</p>
              </div>
              {/* Stat cards grid */}
              <div className="grid grid-cols-2 gap-2 px-3 pb-3">
                <MockStatCard
                  icon={<PawPrint width={13} height={13} />}
                  iconBg="#f5f3ff" iconColor="#7c3aed"
                  badge="3 flagged" badgeBg="#fff7ed" badgeColor="#ea580c"
                  value="8" valueColor="#111"
                  label="Animals" sub="5 species"
                />
                <MockStatCard
                  icon={<ClipboardCheck width={13} height={13} />}
                  iconBg="#ffedd5" iconColor="#ea580c"
                  badge="0 today" badgeBg="#f0fdf4" badgeColor="#15803d"
                  value="1" valueColor="#ea580c"
                  label="Overdue" sub="0 due this week"
                  cardBg="#fff7ed" cardBorder="#fed7aa"
                />
                <MockStatCard
                  icon={<Wheat width={13} height={13} />}
                  iconBg="#fffbeb" iconColor="#d97706"
                  badge="1 low" badgeBg="#fef2f2" badgeColor="#dc2626"
                  value="1" valueColor="#dc2626"
                  label="Low Stock" sub="3 items tracked"
                />
                <MockStatCard
                  icon={<CloudRain width={13} height={13} />}
                  iconBg="#eff6ff" iconColor="#3b82f6"
                  value="2mm" valueColor="#3b82f6"
                  label="This Month" sub="-11d since rain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-5 pb-16 md:pb-24" id="pricing">
        <div className="text-center mb-12">
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#111', letterSpacing: '-0.03em', marginBottom: '10px' }}>
            Simple, honest pricing
          </h2>
          <p style={{ fontSize: '15px', color: '#6b7280', maxWidth: '420px', margin: '0 auto' }}>
            Start free. Upgrade when your block grows.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Free */}
          <div
            className="rounded-2xl p-7 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg md:flex md:flex-col"
            style={{ background: '#fefefe', border: '1px solid #ebebeb' }}
          >
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>Free</p>
              <p style={{ fontSize: '38px', fontWeight: 900, color: '#111', letterSpacing: '-0.04em', lineHeight: 1 }}>$0</p>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px', marginBottom: '20px' }}>Forever free</p>
              <div className="space-y-2.5">
                {FREE_FEATURES.map(f => (
                  <div key={f} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#f0fdf4' }}>
                      <Check width={11} height={11} style={{ color: '#16a34a' }} strokeWidth={2.5} />
                    </div>
                    <span style={{ fontSize: '13px', color: '#374151' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:mt-auto mt-7 pt-6">
              <Link
                to="/register"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all active:scale-[0.97] hover:brightness-95"
                style={{ background: '#f5f4f2', color: '#374151', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}
              >
                Get started free
              </Link>
            </div>
          </div>

          {/* Fern Plus */}
          <div
            className="rounded-2xl p-7 relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl md:flex md:flex-col"
            style={{ background: '#111', border: '1px solid #222' }}
          >
            <div
              className="absolute top-5 right-5 px-2.5 py-1 rounded-full"
              style={{ background: '#ea580c', fontSize: '10px', fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}
            >
              MOST POPULAR
            </div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#e5e7eb', marginBottom: '4px' }}>Fern Plus</p>
              <p style={{ fontSize: '38px', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>$16</p>
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', marginBottom: '20px' }}>NZD per month</p>
              <div className="space-y-2.5">
                {PLUS_FEATURES.map(f => (
                  <div key={f} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(234,88,12,0.2)' }}>
                      <Check width={11} height={11} style={{ color: '#fb923c' }} strokeWidth={2.5} />
                    </div>
                    <span style={{ fontSize: '13px', color: '#d1d5db' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:mt-auto mt-7 pt-6">
              <Link
                to="/register"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all active:scale-[0.97] hover:brightness-95"
                style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}
              >
                Start free trial
                <ArrowRight width={13} height={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-5 pb-16 md:pb-24">
        <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: 800, color: '#111', letterSpacing: '-0.03em', marginBottom: '16px', textAlign: 'center' }}>
          Common questions
        </h2>
        <div className="space-y-3">
          {FAQS.map(({ q, a }) => (
            <FaqItem key={q} q={q} a={a} />
          ))}
        </div>
      </section>

      {/* ── Get the app section ── */}
      <section className="mx-4 md:mx-10 lg:mx-auto max-w-5xl mb-12 md:mb-16 rounded-3xl overflow-hidden" style={{ background: '#111' }}>
        <div className="px-8 py-12 md:px-12 md:py-14 flex flex-col md:flex-row items-center gap-10">

          {/* Left: text + button */}
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5" style={{ background: 'rgba(234,88,12,0.15)', border: '1px solid rgba(234,88,12,0.3)' }}>
              <Smartphone width={11} height={11} style={{ color: '#ea580c' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#ea580c', letterSpacing: '0.04em' }}>ANDROID APP</span>
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '12px' }}>
              Take Fern out to<br />the paddock
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: '28px', maxWidth: '380px' }}>
              Install Fern directly on your Android phone as a native app. Works offline, loads instantly, and sits right on your home screen.
            </p>

            {/* Download button */}
            <a
              href={APK_URL}
              download="fern.apk"
              className="inline-flex items-center gap-3 px-5 py-4 rounded-2xl transition-all active:scale-[0.97] hover:brightness-110"
              style={{ background: '#ea580c', textDecoration: 'none', boxShadow: '0 4px 20px rgba(234,88,12,0.35)' }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <Smartphone width={17} height={17} style={{ color: '#fff' }} />
              </div>
              <div className="text-left">
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', lineHeight: 1, marginBottom: '3px' }}>Download free</p>
                <p style={{ fontSize: '15px', fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>Fern for Android</p>
              </div>
              <Download width={15} height={15} style={{ color: 'rgba(255,255,255,0.7)', marginLeft: '6px' }} />
            </a>

            {/* Footnote */}
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '12px' }}>
              .apk file · Android 8.0+ · No Google Play required
            </p>
          </div>

          {/* Right: feature pills */}
          <div className="flex flex-col gap-3 w-full md:w-64 flex-shrink-0">
            {[
              { Icon: Leaf,          color: '#34d399', bg: 'rgba(52,211,153,0.15)',  label: 'Works offline',     desc: 'Log animals and tasks without signal' },
              { Icon: Smartphone,    color: '#60a5fa', bg: 'rgba(96,165,250,0.15)',  label: 'Home screen icon',  desc: 'Feels like a native app'              },
              { Icon: ArrowRight,    color: '#fbbf24', bg: 'rgba(251,191,36,0.15)',  label: 'Instant load',      desc: 'No browser chrome, full screen'       },
              { Icon: Check,         color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', label: 'Always in sync',    desc: 'Changes sync when back online'        },
            ].map(({ Icon, color, bg, label, desc }) => (
              <div key={label} className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                  <Icon width={15} height={15} style={{ color }} />
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{label}</p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="mx-4 md:mx-10 lg:mx-auto max-w-5xl mb-16 md:mb-24 rounded-3xl overflow-hidden" style={{ background: '#ea580c' }}>
        <div className="text-center px-6 py-12 md:py-16">
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: '10px', lineHeight: 1.15 }}>
            Ready to get your block sorted?
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.75)', marginBottom: '24px', maxWidth: '420px', margin: '0 auto 24px' }}>
            Join NZ lifestyle block owners who use Fern to stay on top of everything, season after season.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl transition-all active:scale-[0.97] hover:brightness-95"
            style={{ background: '#fff', color: '#ea580c', fontSize: '14px', fontWeight: 700, textDecoration: 'none' }}
          >
            Create your free account
            <ArrowRight width={14} height={14} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{ borderTop: '1px solid #e5e7eb', background: '#fefefe' }}
        className="px-5 py-8 md:px-10"
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#ea580c' }}>
              <Leaf width={12} height={12} style={{ color: '#fff' }} />
            </div>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#111', letterSpacing: '-0.03em' }}>Fern</span>
            <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '4px' }}>Farm management for NZ lifestyle blocks</span>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/terms" style={{ fontSize: '12px', color: '#6b7280', textDecoration: 'none' }}>Terms</Link>
            <Link to="/privacy" style={{ fontSize: '12px', color: '#6b7280', textDecoration: 'none' }}>Privacy</Link>
            <Link to="/login" style={{ fontSize: '12px', color: '#6b7280', textDecoration: 'none' }}>Sign in</Link>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-5 pt-5" style={{ borderTop: '1px solid #f3f4f6' }}>
          <p style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center' }}>
            © {new Date().getFullYear()} Fern. Made in New Zealand.
          </p>
        </div>
      </footer>

    </div>
  );
}

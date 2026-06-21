import { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, X, MessageSquare, CheckCircle2, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiSet } from '../lib/api';
import { AnimatedSection } from '../components/AnimatedSection';

type TicketCategory = 'general' | 'bug' | 'feature' | 'account';
type TicketStatus   = 'open' | 'in_progress' | 'resolved';
type TicketPriority = 'low' | 'normal' | 'high';

interface Message {
  role: 'user' | 'support';
  text: string;
  date: string;
}

interface Ticket {
  id:       string;
  date:     string;
  subject:  string;
  category: TicketCategory;
  priority: TicketPriority;
  status:   TicketStatus;
  messages: Message[];
}

const CATEGORY_CONFIG: Record<TicketCategory, { label: string; color: string; bg: string; border: string }> = {
  general: { label: 'General',         color: '#6b7280', bg: '#f5f5f5',  border: '#e5e7eb' },
  bug:     { label: 'Bug Report',      color: '#dc2626', bg: '#fef2f2',  border: '#fecaca' },
  feature: { label: 'Feature Request', color: '#7c3aed', bg: '#f5f3ff',  border: '#ddd6fe' },
  account: { label: 'Account',         color: '#d97706', bg: '#fffbeb',  border: '#fde68a' },
};

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; bg: string; border: string }> = {
  open:        { label: 'Open',               color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
  in_progress: { label: 'Awaiting Response',  color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  resolved:    { label: 'Resolved',           color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
};


const MOCK_TICKETS: Ticket[] = [
  {
    id:       'tk-001',
    date:     '2026-05-10',
    subject:  'Animals page loading slowly with 20+ animals',
    category: 'bug',
    priority: 'normal',
    status:   'in_progress',
    messages: [
      { role: 'user',    date: '2026-05-10', text: 'When I have more than 20 animals logged the Animals page takes a second or two to load. Not a major issue but noticeable on mobile.' },
      { role: 'support', date: '2026-05-11', text: "Thanks for reporting this. We've identified the cause and a fix will be in the next release. In the meantime filtering by species can help." },
    ],
  },
  {
    id:       'tk-002',
    date:     '2026-04-28',
    subject:  'Request: bulk task completion',
    category: 'feature',
    priority: 'low',
    status:   'open',
    messages: [
      { role: 'user', date: '2026-04-28', text: 'Would be great to be able to tick off multiple tasks at once, e.g. select all feeding tasks and mark done.' },
    ],
  },
  {
    id:       'tk-003',
    date:     '2026-04-15',
    subject:  'Finance export to CSV',
    category: 'feature',
    priority: 'normal',
    status:   'resolved',
    messages: [
      { role: 'user',    date: '2026-04-15', text: 'My accountant wants a CSV of transactions for the financial year. Is this something that could be added?' },
      { role: 'support', date: '2026-04-16', text: "CSV export has been added to the Finance page, look for the Export button in the top right. Let us know if you need any other formats." },
    ],
  },
];


function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-NZ', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

const CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: 'general', label: 'General'         },
  { value: 'bug',     label: 'Bug Report'      },
  { value: 'feature', label: 'Feature Request' },
  { value: 'account', label: 'Account'         },
];

const INPUT = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none bg-white text-gray-900 transition-colors focus:border-orange-400 text-sm';

function TicketCard({
  ticket,
  onResolve,
  onReply,
  profileName,
}: {
  ticket: Ticket;
  onResolve: (id: string) => void;
  onReply: (id: string, text: string) => void;
  profileName: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scfg = STATUS_CONFIG[ticket.status];
  const ccfg = CATEGORY_CONFIG[ticket.category];

  useEffect(() => {
    if (expanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [expanded, ticket.messages.length]);

  function handleSend() {
    if (!replyText.trim()) return;
    onReply(ticket.id, replyText.trim());
    setReplyText('');
  }

  return (
    <div className="rounded-2xl overflow-hidden transition-shadow hover:shadow-sm"
      style={{ background: '#fefefe', border: '1px solid #ebebeb' }}>

      {/* Header row */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left p-5 transition-colors hover:bg-gray-50"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginBottom: '6px' }}>{ticket.subject}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-lg"
                style={{ fontSize: '10px', fontWeight: 600, background: ccfg.bg, color: ccfg.color, border: `1px solid ${ccfg.border}` }}>
                {ccfg.label}
              </span>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>#{ticket.id} · {fmtDate(ticket.date)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="px-2.5 py-1 rounded-lg"
              style={{ fontSize: '10px', fontWeight: 700, background: scfg.bg, color: scfg.color, border: `1px solid ${scfg.border}` }}>
              {scfg.label}
            </span>
            {expanded
              ? <ChevronUp width={14} height={14} style={{ color: '#9ca3af' }} />
              : <ChevronDown width={14} height={14} style={{ color: '#9ca3af' }} />}
          </div>
        </div>
      </button>

      {/* Chat thread */}
      <AnimatedSection open={expanded}>
        <div style={{ borderTop: '1px solid #f5f5f5' }}>

          {/* Messages */}
          <div className="px-4 py-4 space-y-3">
            {ticket.messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              return (
                <div key={i} className={`flex flex-col gap-1 ${isUser ? 'items-start' : 'items-end'}`}>
                  <p style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', paddingLeft: isUser ? '4px' : '0', paddingRight: isUser ? '0' : '4px' }}>
                    {isUser ? profileName : 'Support'} · {fmtDate(msg.date)}
                  </p>
                  <div
                    className="max-w-[85%] px-3.5 py-2.5 rounded-2xl"
                    style={isUser
                      ? { background: '#f3f4f6', borderBottomLeftRadius: '6px' }
                      : { background: '#ea580c', borderBottomRightRadius: '6px' }
                    }
                  >
                    <p style={{ fontSize: '13px', lineHeight: '1.55', color: isUser ? '#111' : '#fff' }}>
                      {msg.text}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply input (non-resolved) */}
          {ticket.status !== 'resolved' && (
            <div className="px-4 pb-4 flex items-end gap-2" style={{ borderTop: '1px solid #f5f5f5', paddingTop: '12px' }}>
              <textarea
                className="flex-1 resize-none rounded-xl px-3 py-2.5 outline-none transition-colors"
                style={{ fontSize: '13px', color: '#111', background: '#f9f9f8', border: '1px solid #e5e7eb', lineHeight: '1.5', minHeight: '40px', maxHeight: '120px' }}
                placeholder="Type a reply…"
                rows={1}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              />
              <button
                onClick={handleSend}
                disabled={!replyText.trim()}
                className="flex items-center justify-center rounded-xl transition-all active:scale-[0.95] flex-shrink-0"
                style={{
                  width: '40px', height: '40px',
                  background: replyText.trim() ? '#ea580c' : '#f3f4f6',
                  color: replyText.trim() ? '#fff' : '#9ca3af',
                }}
              >
                <Send width={15} height={15} />
              </button>
            </div>
          )}

          {/* Mark resolved */}
          {ticket.status !== 'resolved' && (
            <div className="px-4 pb-4">
              <button
                onClick={() => onResolve(ticket.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all"
                style={{ fontSize: '11px', fontWeight: 600, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}
              >
                <CheckCircle2 width={12} height={12} />
                Mark as resolved
              </button>
            </div>
          )}
        </div>
      </AnimatedSection>
    </div>
  );
}

function readTicketsCache(): Ticket[] | null {
  try {
    const raw = localStorage.getItem('fern_cache_supportTickets');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function Support() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [tickets, setTickets] = useState<Ticket[]>(() => readTicketsCache() ?? []);

  useEffect(() => {
    if (!user) { setTickets([]); return; }
    apiGet<Ticket[]>('supportTickets').then(data => {
      if (data) setTickets(data);
    });
  }, [user?.id]);
  const [showForm, setShowForm] = useState(false);

  const [subject,  setSubject]  = useState('');
  const [category, setCategory] = useState<TicketCategory>('general');
  const [message,  setMessage]  = useState('');

  const open     = useMemo(() => tickets.filter(t => t.status !== 'resolved'), [tickets]);
  const resolved = useMemo(() => tickets.filter(t => t.status === 'resolved'),  [tickets]);

  function handleResolve(id: string) {
    const next = tickets.map(t => t.id === id ? { ...t, status: 'resolved' as TicketStatus } : t);
    setTickets(next);
    apiSet('supportTickets', next);
  }

  function handleReply(id: string, text: string) {
    const today = new Date().toISOString().split('T')[0];
    const next = tickets.map(t => t.id === id
      ? { ...t, status: 'in_progress' as TicketStatus, messages: [...t.messages, { role: 'user' as const, text, date: today }] }
      : t
    );
    setTickets(next);
    apiSet('supportTickets', next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    const today = new Date().toISOString().split('T')[0];
    const ticket: Ticket = {
      id:       `tk-${String(tickets.length + 1).padStart(3, '0')}`,
      date:     today,
      subject:  subject.trim(),
      category,
      priority: profile.fernPlus ? 'high' : 'normal',
      status:   'open',
      messages: [{ role: 'user', text: message.trim(), date: today }],
    };
    const next = [ticket, ...tickets];
    setTickets(next);
    apiSet('supportTickets', next);
    setSubject(''); setMessage(''); setCategory('general');
    setShowForm(false);
  }

  return (
    <div className="px-4 pt-6 md:px-8 md:pt-8 max-w-5xl mx-auto pb-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p style={{ fontSize: '22px', fontWeight: 800, color: '#111', letterSpacing: '-0.03em' }}>Support</p>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>
            {open.length} open · {resolved.length} resolved
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all active:scale-[0.97] flex-shrink-0"
          style={{ background: showForm ? '#f5f5f4' : '#ea580c', color: showForm ? '#6b7280' : '#fff', fontSize: '13px', fontWeight: 600 }}
        >
          {showForm ? <X width={14} height={14} /> : <Plus width={14} height={14} />}
          {showForm ? 'Cancel' : 'New Ticket'}
        </button>
      </div>

      {/* Info banner */}
      <div className="rounded-2xl p-4 mb-5 flex items-start gap-3"
        style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
        <MessageSquare width={15} height={15} style={{ color: '#ea580c', flexShrink: 0, marginTop: '1px' }} />
        <div>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#111' }}>Submitting as {profile.name}</p>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
            {profile.fernPlus
              ? 'Your tickets are marked high priority as a Fern Plus member. We typically respond within 1 business day.'
              : 'We typically respond within 1–2 business days.'}
          </p>
        </div>
      </div>

      {/* New ticket form */}
      <AnimatedSection open={showForm}>
        <div className="rounded-2xl mb-5 overflow-hidden" style={{ border: '1px solid #ebebeb' }}>
          <div className="px-5 py-4" style={{ background: '#f9f9f8', borderBottom: '1px solid #ebebeb' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>New Support Ticket</p>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4" style={{ background: '#fefefe' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>Subject</p>
              <input className={INPUT} placeholder="Briefly describe your issue" value={subject} onChange={e => setSubject(e.target.value)} required />
            </div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>Category</p>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map(c => {
                  const active = category === c.value;
                  const cfg = CATEGORY_CONFIG[c.value];
                  return (
                    <button key={c.value} type="button" onClick={() => setCategory(c.value)}
                      className="px-3 py-1.5 rounded-xl transition-all"
                      style={{ fontSize: '11px', fontWeight: active ? 700 : 400, background: active ? cfg.bg : '#f9f9f8', color: active ? cfg.color : '#6b7280', border: `1px solid ${active ? cfg.border : '#f0f0f0'}` }}>
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>Message</p>
              <textarea className={INPUT} style={{ resize: 'none', height: '110px' }}
                placeholder="Describe the issue in detail, what happened, what you expected, and any steps to reproduce..."
                value={message} onChange={e => setMessage(e.target.value)} required />
            </div>
            <button type="submit" className="w-full py-2.5 rounded-xl transition-all active:scale-[0.97]"
              style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 600 }}>
              Submit Ticket
            </button>
          </form>
        </div>
      </AnimatedSection>

      {/* Open tickets */}
      {open.length > 0 && (
        <div className="mb-6">
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
            Open · {open.length}
          </p>
          <div className="space-y-3">
            {open.map(t => <TicketCard key={t.id} ticket={t} onResolve={handleResolve} onReply={handleReply} profileName={profile.name} />)}
          </div>
        </div>
      )}

      {/* Resolved tickets */}
      {resolved.length > 0 && (
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
            Resolved · {resolved.length}
          </p>
          <div className="space-y-3">
            {resolved.map(t => <TicketCard key={t.id} ticket={t} onResolve={handleResolve} onReply={handleReply} profileName={profile.name} />)}
          </div>
        </div>
      )}

      {tickets.length === 0 && (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#f5f5f5' }}>
            <MessageSquare width={20} height={20} style={{ color: '#9ca3af' }} />
          </div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#6b7280' }}>No tickets yet</p>
          <p style={{ fontSize: '13px', color: '#9ca3af' }}>Submit a ticket above if you need help.</p>
        </div>
      )}
    </div>
  );
}

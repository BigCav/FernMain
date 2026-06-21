import { useState, useMemo } from 'react';
import { Plus, Trash2, X, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { useJournal, JournalEntry } from '../context/JournalContext';
import { AnimatedSection } from '../components/AnimatedSection';
import { DatePickerInput } from '../components/DatePickerInput';
import { PageHeader } from '../components/PageHeader';

const TODAY = new Date().toISOString().split('T')[0];

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function relativeDate(dateStr: string): string {
  const now  = Date.now();
  const then = new Date(dateStr + 'T12:00:00').getTime();
  const days = Math.round((now - then) / 86400000);
  if (days === 0)  return 'Today';
  if (days === 1)  return 'Yesterday';
  if (days > 1 && days < 7)  return `${days} days ago`;
  if (days >= 7 && days < 30) return `${Math.round(days / 7)}w ago`;
  return fmtDate(dateStr);
}

const INPUT = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none bg-white text-gray-900 transition-colors focus:border-orange-400 text-sm';

function EntryCard({ entry, onDelete }: { entry: JournalEntry; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = entry.body.length > 180;
  const preview = isLong && !expanded ? entry.body.slice(0, 180).trimEnd() + '…' : entry.body;

  return (
    <div
      className="rounded-2xl p-5 transition-all"
      style={{ background: '#fefefe', border: '1px solid #ebebeb' }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#111' }}>{entry.title}</p>
          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
            {fmtDate(entry.date)} · {relativeDate(entry.date)}
          </p>
        </div>
        <button
          onClick={onDelete}
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-red-50"
          style={{ color: '#d1d5db' }}
        >
          <Trash2 width={13} height={13} />
        </button>
      </div>

      <p style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
        {preview}
      </p>

      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 mt-2 transition-colors"
          style={{ fontSize: '11px', color: '#ea580c', fontWeight: 600 }}
        >
          {expanded ? <><ChevronUp width={12} height={12} /> Show less</> : <><ChevronDown width={12} height={12} /> Read more</>}
        </button>
      )}
    </div>
  );
}

export function Journal() {
  const { entries, addEntry, deleteEntry } = useJournal();
  const [showForm, setShowForm] = useState(false);
  const [title,    setTitle]    = useState('');
  const [body,     setBody]     = useState('');
  const [date,     setDate]     = useState(TODAY);

  const grouped = useMemo(() => {
    const map = new Map<string, JournalEntry[]>();
    entries.forEach((e) => {
      const month = e.date.slice(0, 7);
      if (!map.has(month)) map.set(month, []);
      map.get(month)!.push(e);
    });
    return Array.from(map.entries());
  }, [entries]);

  function fmtMonth(ym: string): string {
    const [y, m] = ym.split('-');
    return new Date(Number(y), Number(m) - 1, 1)
      .toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    addEntry({ date, title: title.trim(), body: body.trim() });
    setTitle(''); setBody(''); setDate(TODAY);
    setShowForm(false);
  }

  return (
    <div className="pb-8">

      <PageHeader
        title="Journal"
        action={
          <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all active:scale-[0.97]" style={{ background: showForm ? '#f5f5f4' : '#ea580c', color: showForm ? '#6b7280' : '#fff', fontSize: '13px', fontWeight: 600 }}>
            {showForm ? <X width={14} height={14} /> : <Plus width={14} height={14} />}
            {showForm ? 'Cancel' : 'New Entry'}
          </button>
        }
        chips={[
          { label: `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`, variant: 'neutral' },
        ]}
      />

      <div className="max-w-5xl mx-auto px-4 md:px-8">

      {/* Add form */}
      <AnimatedSection open={showForm}>
        <div
          className="rounded-2xl p-5 mb-5"
          style={{ background: '#fefefe', border: '1px solid #ebebeb' }}
        >
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginBottom: '14px' }}>New entry</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>Title</p>
                <input
                  className={INPUT}
                  placeholder="What did you do?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div style={{ width: '140px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>Date</p>
                <DatePickerInput value={date} onChange={v => setDate(v)} placeholder="Journal date" />
              </div>
            </div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>Notes</p>
              <textarea
                className={INPUT}
                style={{ resize: 'none', height: '110px' }}
                placeholder="Write about what happened on the block today..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl transition-all active:scale-[0.97]"
              style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 600 }}
            >
              Save entry
            </button>
          </form>
        </div>
      </AnimatedSection>

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#f5f5f5' }}>
            <BookOpen width={20} height={20} style={{ color: '#9ca3af' }} />
          </div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#6b7280' }}>No entries yet</p>
          <p style={{ fontSize: '13px', color: '#9ca3af' }}>Write your first journal entry above.</p>
        </div>
      )}

      {/* Entries grouped by month */}
      <div className="space-y-6">
        {grouped.map(([month, monthEntries]) => (
          <div key={month}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
              {fmtMonth(month)}
            </p>
            <div className="space-y-3">
              {monthEntries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onDelete={() => deleteEntry(entry.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}

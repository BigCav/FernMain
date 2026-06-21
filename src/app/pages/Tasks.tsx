import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { useTasks } from '../context/TasksContext';
import { useProfile } from '../context/ProfileContext';
import { AnimatedSection } from '../components/AnimatedSection';
import { DatePickerTrigger } from '../components/DatePickerInput';
import { TaskStatsStrip } from '../components/TaskStatsStrip';
import { TaskBoard } from '../components/TaskBoard';
import {
  Task, TaskCategory, TaskPriority, TASK_CATEGORY_CONFIG,
  daysDiff, fmtDate, TODAY,
} from '../data/blockData';
import { CheckCircle2, Circle, Trash2, Plus, ChevronDown, ChevronUp, AlertTriangle, X, RefreshCw, AlarmClock, Calendar, LayoutGrid, List, Sparkles } from 'lucide-react';
import { DropdownSelect } from '../components/DropdownSelect';
import { parseNaturalDate, describeDate, formatDisplayDate } from '../utils/naturalDate';
import { PageHeader } from '../components/PageHeader';

const CATEGORIES: { value: TaskCategory | 'all'; label: string }[] = [
  { value: 'all',         label: 'All'         },
  { value: 'feeding',     label: 'Feeding'     },
  { value: 'health',      label: 'Health'      },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'fencing',     label: 'Fencing'     },
  { value: 'pasture',     label: 'Pasture'     },
  { value: 'other',       label: 'Other'       },
];

const PRIORITY_DOT: Record<TaskPriority, string> = {
  high:   '#dc2626',
  medium: '#d97706',
  low:    '#15803d',
};

const PRIORITY_STYLES: Record<TaskPriority, { color: string; bg: string; border: string }> = {
  high:   { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  medium: { color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  low:    { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
};

const INPUT = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none bg-white text-gray-900 transition-colors focus:border-orange-400';


function AnimatedTick() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <style>{`
        @keyframes tick-draw {
          from { stroke-dashoffset: 14; }
          to   { stroke-dashoffset: 0;  }
        }
        @keyframes circle-pop {
          0%   { stroke-dashoffset: 50; opacity: 0.4; }
          60%  { stroke-dashoffset: 0;  opacity: 1;   }
          100% { stroke-dashoffset: 0;  opacity: 1;   }
        }
      `}</style>
      <circle
        cx="9" cy="9" r="8"
        stroke="#22c55e" strokeWidth="1.5" fill="white"
        strokeDasharray="50"
        style={{ animation: 'circle-pop 0.35s ease forwards' }}
      />
      <path
        d="M5.5 9.2 L7.8 11.5 L12.5 6.5"
        stroke="#22c55e" strokeWidth="1.75"
        strokeLinecap="round" strokeLinejoin="round"
        fill="none"
        strokeDasharray="14"
        strokeDashoffset="14"
        style={{ animation: 'tick-draw 0.28s ease forwards 0.12s' }}
      />
    </svg>
  );
}

function TaskRow({
  task,
  onComplete,
  onUncomplete,
  onDelete,
  onSnooze,
}: {
  task: ReturnType<typeof useTasks>['tasks'][number];
  onComplete: () => void;
  onUncomplete: () => void;
  onDelete: () => void;
  onSnooze: () => void;
}) {
  const diff      = daysDiff(task.dueDate);
  const overdue   = !task.completed && diff < 0;
  const today     = !task.completed && diff === 0;
  const cfg       = TASK_CATEGORY_CONFIG[task.category];
  const [flash, setFlash] = useState<'complete' | 'uncomplete' | null>(null);

  function handleRowClick() {
    if (flash) return; // prevent double-click during animation
    if (task.completed) {
      setFlash('uncomplete');
      setTimeout(() => { onUncomplete(); setFlash(null); }, 350);
    } else {
      setFlash('complete');
      setTimeout(() => { onComplete(); setFlash(null); }, 500);
    }
  }

  const flashBg = flash === 'uncomplete' ? '#f5f5f5' : overdue ? '#fef9f9' : '#fff';
  const baseBorder =
    flash === 'complete'   ? '#22c55e' :
    flash === 'uncomplete' ? '#e5e7eb' :
    overdue ? '#fecaca' : '#f0f0f0';

  return (
    <div
      onClick={handleRowClick}
      className="flex items-start gap-3 px-4 py-3.5 group rounded-xl cursor-pointer"
      style={{
        background: flashBg,
        border: `1px solid ${baseBorder}`,
        marginBottom: '4px',
        transition: flash ? 'background 0.45s ease' : 'background 0.15s',
      }}
    >
      {/* Complete toggle */}
      <div className="flex-shrink-0 mt-0.5">
        {flash === 'complete'
          ? <AnimatedTick />
          : task.completed
            ? <CheckCircle2 width={18} height={18} style={{ color: '#22c55e' }} />
            : <Circle width={18} height={18} style={{ color: '#d1d5db' }} />
        }
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span
            className="inline-block px-2 py-0.5 rounded-full"
            style={{ fontSize: '10px', fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, whiteSpace: 'nowrap' }}
          >
            {cfg.label}
          </span>
          {task.priority === 'high' && (
            <span
              className="inline-block px-1.5 py-0.5 rounded-md flex-shrink-0"
              style={{ fontSize: '10px', fontWeight: 700, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', letterSpacing: '0.01em' }}
            >
              High
            </span>
          )}
          {task.priority === 'medium' && (
            <span
              className="inline-block px-1.5 py-0.5 rounded-md flex-shrink-0"
              style={{ fontSize: '10px', fontWeight: 700, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', letterSpacing: '0.01em' }}
            >
              Medium
            </span>
          )}
          {task.recurring && (
            <span style={{ fontSize: '10px', color: '#9ca3af' }}>Recurring · {task.recurring}</span>
          )}
        </div>
        <p
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: task.completed ? '#9ca3af' : '#111',
            textDecoration: task.completed ? 'line-through' : 'none',
            transition: 'color 0.2s, text-decoration 0.2s',
          }}
        >
          {task.title}
        </p>
        {task.notes && !task.completed && (
          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }} className="truncate">
            {task.notes}
          </p>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 flex-shrink-0 self-center">
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: task.completed ? '#9ca3af' : overdue ? '#dc2626' : today ? '#ea580c' : '#9ca3af',
            whiteSpace: 'nowrap',
          }}
        >
          {task.completed
            ? (task.completedDate ? fmtDate(task.completedDate) : 'Done')
            : overdue
              ? `${Math.abs(diff)}d overdue`
              : today
                ? 'Today'
                : diff === 1 ? 'Tomorrow' : fmtDate(task.dueDate)
          }
        </span>
        {overdue && !task.completed && (
          <button
            onClick={(e) => { e.stopPropagation(); onSnooze(); }}
            title="Snooze 1 day"
            className="hidden md:flex opacity-0 group-hover:opacity-100 transition-all items-center gap-0.5 px-1.5 py-0.5 rounded-lg"
            style={{ color: '#9ca3af', border: '1px solid #e5e7eb', fontSize: '10px', fontWeight: 600, whiteSpace: 'nowrap' }}
          >
            <AlarmClock width={11} height={11} />
            +1d
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="hidden md:flex opacity-0 group-hover:opacity-100 transition-all w-6 h-6 items-center justify-center rounded-lg"
          style={{ color: '#9ca3af' }}
        >
          <Trash2 width={13} height={13} />
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  count,
  accent,
  children,
  defaultOpen = true,
}: {
  title: string;
  count: number;
  accent?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (count === 0) return null;
  return (
    <div className="mb-5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 mb-2 w-full text-left"
      >
        <span style={{ fontSize: '11px', fontWeight: 700, color: accent ?? '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {title}
        </span>
        <span
          className="px-1.5 py-0.5 rounded-md"
          style={{ fontSize: '10px', fontWeight: 700, background: accent ? accent + '18' : '#f0f0f0', color: accent ?? '#6b7280' }}
        >
          {count}
        </span>
        <span className="ml-auto" style={{ color: '#9ca3af' }}>
          {open ? <ChevronUp width={14} height={14} /> : <ChevronDown width={14} height={14} />}
        </span>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

export function Tasks() {
  const { tasks, addTask, completeTask, uncompleteTask, deleteTask, snoozeTask, rescheduleTask } = useTasks();
  const { profile } = useProfile();
  const [searchParams] = useSearchParams();
  const [activeCategory,  setActiveCategory]  = useState<TaskCategory | 'all'>('all');
  const [showAddForm,     setShowAddForm]     = useState(false);
  const [showOverdueOnly, setShowOverdueOnly] = useState(() => searchParams.get('overdue') === '1');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

  // New task form
  const [newTitle,      setNewTitle]     = useState('');
  const [newCategory,   setNewCategory]  = useState<TaskCategory>('feeding');
  const [newDue,        setNewDue]       = useState('');
  const [newDateInput,  setNewDateInput] = useState('');
  const [newPriority,   setNewPriority]  = useState<TaskPriority>('low');
  const [newNotes,      setNewNotes]     = useState('');
  const [newRecurring,  setNewRecurring] = useState<Task['recurring']>(null);

  const newParsedDate   = parseNaturalDate(newDateInput);
  const newResolvedDate = newParsedDate ?? newDue;

  const totalOverdueCount = useMemo(
    () => tasks.filter((t) => !t.completed && daysDiff(t.dueDate) < 0).length,
    [tasks],
  );

  const filtered = useMemo(() =>
    tasks.filter((t) => {
      if (showOverdueOnly && (t.completed || daysDiff(t.dueDate) >= 0)) return false;
      return activeCategory === 'all' || t.category === activeCategory;
    }),
    [tasks, activeCategory, showOverdueOnly],
  );

  const overdue   = filtered.filter((t) => !t.completed && daysDiff(t.dueDate) < 0).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const todayList = filtered.filter((t) => !t.completed && daysDiff(t.dueDate) === 0);
  const upcoming  = filtered.filter((t) => !t.completed && daysDiff(t.dueDate) > 0).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const completed = filtered.filter((t) => t.completed).sort((a, b) => (b.completedDate ?? '').localeCompare(a.completedDate ?? ''));

  function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newResolvedDate) return;
    addTask({
      id:        `t-${Date.now()}`,
      title:     newTitle.trim(),
      category:  newCategory,
      dueDate:   newResolvedDate,
      completed: false,
      priority:  newPriority,
      notes:     newNotes.trim() || undefined,
      recurring: newRecurring ?? undefined,
    });
    setNewTitle(''); setNewDue(''); setNewDateInput(''); setNewNotes(''); setNewRecurring(null);
    setShowAddForm(false);
  }

  return (
    <div className="pb-8">

      <PageHeader
        title="Tasks"
        action={
          <>
            {profile.fernPlus && (
              <div className="hidden md:flex items-center rounded-xl p-0.5" style={{ background: '#f0f0ef', border: '1px solid #e5e7eb' }}>
                <button onClick={() => setViewMode('list')} className="flex items-center justify-center w-8 h-8 rounded-lg transition-all" style={{ background: viewMode === 'list' ? '#fff' : 'transparent', color: viewMode === 'list' ? '#111' : '#9ca3af', boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }} title="List view"><List width={14} height={14} /></button>
                <button onClick={() => setViewMode('board')} className="flex items-center justify-center w-8 h-8 rounded-lg transition-all" style={{ background: viewMode === 'board' ? '#fff' : 'transparent', color: viewMode === 'board' ? '#7c3aed' : '#9ca3af', boxShadow: viewMode === 'board' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }} title="Board view"><LayoutGrid width={14} height={14} /></button>
              </div>
            )}
            <button onClick={() => setShowAddForm((v) => !v)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-shrink-0 transition-all active:scale-[0.97]" style={{ background: showAddForm ? '#f5f5f4' : '#ea580c', color: showAddForm ? '#6b7280' : '#fff', fontSize: '13px', fontWeight: 600 }}>
              {showAddForm ? <X width={14} height={14} /> : <Plus width={14} height={14} />}
              {showAddForm ? 'Cancel' : 'New Task'}
            </button>
          </>
        }
        chips={[
          { label: `${tasks.filter(t => !t.completed).length} open`, variant: 'neutral' },
          ...(totalOverdueCount > 0 ? [{ label: `${totalOverdueCount} overdue`, variant: 'danger' as const, onClick: () => setShowOverdueOnly(v => !v), active: showOverdueOnly }] : []),
        ]}
      />

      <div className="max-w-5xl mx-auto px-4 md:px-8">

      {/* Inline add form */}
      <AnimatedSection open={showAddForm}>
        <div className="rounded-2xl mb-5 overflow-hidden" style={{ border: '1px solid #ebebeb' }}>
          <div className="px-5 py-4" style={{ background: '#f9f9f8', borderBottom: '1px solid #ebebeb' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>New Task</p>
          </div>
          <form onSubmit={handleAddTask} className="p-5 space-y-4" style={{ background: '#fefefe' }}>
            <input
              className={INPUT}
              style={{ fontSize: '13px' }}
              placeholder="What needs to be done?"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
            />
            <DropdownSelect
              value={newCategory}
              onChange={v => setNewCategory(v as TaskCategory)}
              placeholder="Category…"
              options={CATEGORIES.filter(c => c.value !== 'all').map(c => ({ label: c.label, value: c.value }))}
            />
            <div className="flex gap-3">
              <div className="flex-1">
                <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Due Date</p>
                <div className="relative">
                  <input className={INPUT} style={{ fontSize: '13px', paddingRight: '36px' }}
                    placeholder="Friday, in 3 days, tomorrow…"
                    value={newDateInput}
                    onChange={e => { setNewDateInput(e.target.value); setNewDue(''); }}
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ pointerEvents: 'none' }}>
                    <Calendar width={14} height={14} style={{ color: '#9ca3af' }} />
                  </div>
                  <DatePickerTrigger
                    value={newDue}
                    onChange={v => { setNewDue(v); setNewDateInput(''); }}
                    style={{ position: 'absolute', right: 0, top: 0, width: '36px', height: '100%' }}
                  />
                </div>
                {newResolvedDate && (
                  <div className="flex items-center gap-1.5 mt-1.5" style={{ display: 'inline-flex' }}>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                      style={{ fontSize: '11px', fontWeight: 600, color: '#ea580c', background: '#fff7ed', border: '1px solid #fed7aa' }}>
                      <Calendar width={10} height={10} />
                      {describeDate(newResolvedDate)} · {formatDisplayDate(newResolvedDate)}
                    </span>
                  </div>
                )}
                {newDateInput && !newParsedDate && (
                  <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Try: "Friday", "in 3 days"</p>
                )}
              </div>
              <div>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Priority</p>
                <DropdownSelect
                  value={newPriority}
                  onChange={v => setNewPriority(v as TaskPriority)}
                  placeholder="Priority…"
                  options={[
                    { label: 'Low',    value: 'low'    },
                    { label: 'Medium', value: 'medium' },
                    { label: 'High',   value: 'high'   },
                  ]}
                />
              </div>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Repeat</p>
              <DropdownSelect
                value={newRecurring === null ? 'once' : newRecurring ?? 'once'}
                onChange={v => setNewRecurring(v === 'once' ? null : v as Task['recurring'])}
                placeholder="Repeat…"
                options={[
                  { label: 'Once',    value: 'once'    },
                  { label: 'Daily',   value: 'daily'   },
                  { label: 'Weekly',  value: 'weekly'  },
                  { label: 'Monthly', value: 'monthly' },
                ]}
              />
            </div>
            <textarea className={INPUT} style={{ fontSize: '13px', resize: 'none', height: '64px' }} placeholder="Notes (optional)" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 py-2.5 rounded-xl" style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 600 }}>Add Task</button>
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2.5 rounded-xl" style={{ background: '#f5f5f4', color: '#6b7280', fontSize: '13px', border: '1px solid #e5e7eb' }}>Cancel</button>
            </div>
          </form>
        </div>
      </AnimatedSection>

      {/* Overdue filter chip */}
      {showOverdueOnly && (
        <div className="flex items-center gap-2 mb-4">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
          >
            <AlertTriangle width={12} height={12} style={{ color: '#dc2626', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#dc2626' }}>
              Overdue only
            </span>
            <button
              onClick={() => setShowOverdueOnly(false)}
              className="ml-0.5 flex items-center justify-center w-4 h-4 rounded-full transition-all"
              style={{ background: '#fecaca' }}
              title="Clear filter"
            >
              <X width={9} height={9} style={{ color: '#7f1d1d' }} />
            </button>
          </div>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>
            {overdue.length} {overdue.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>
      )}

      {/* Plus: stats strip */}
      {profile.fernPlus && <TaskStatsStrip tasks={tasks} />}

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-5" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat.value;
          const cfg = cat.value !== 'all' ? TASK_CATEGORY_CONFIG[cat.value as TaskCategory] : null;
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl transition-all"
              style={{
                fontSize: '12px',
                fontWeight: active ? 700 : 400,
                background: active ? (cfg ? cfg.bg : '#111') : '#fff',
                color: active ? (cfg ? cfg.color : '#fff') : '#6b7280',
                border: `1px solid ${active ? (cfg ? cfg.border : '#111') : '#ebebeb'}`,
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Plus: board view */}
      {profile.fernPlus && viewMode === 'board' ? (
        <TaskBoard
          tasks={tasks}
          onComplete={completeTask}
          onUncomplete={uncompleteTask}
          onDelete={deleteTask}
          onSnooze={snoozeTask}
          onReschedule={rescheduleTask}
          categoryFilter={activeCategory}
        />
      ) : (
        <>
          {/* Task sections */}
          <Section title="Overdue" count={overdue.length} accent="#dc2626">
            {overdue.map((t) => (
              <TaskRow key={t.id} task={t} onComplete={() => completeTask(t.id)} onUncomplete={() => uncompleteTask(t.id)} onDelete={() => deleteTask(t.id)} onSnooze={() => snoozeTask(t.id)} />
            ))}
          </Section>

          <Section title="Today" count={todayList.length} accent="#ea580c">
            {todayList.map((t) => (
              <TaskRow key={t.id} task={t} onComplete={() => completeTask(t.id)} onUncomplete={() => uncompleteTask(t.id)} onDelete={() => deleteTask(t.id)} onSnooze={() => snoozeTask(t.id)} />
            ))}
          </Section>

          <Section title="Upcoming" count={upcoming.length} accent="#374151">
            {upcoming.map((t) => (
              <TaskRow key={t.id} task={t} onComplete={() => completeTask(t.id)} onUncomplete={() => uncompleteTask(t.id)} onDelete={() => deleteTask(t.id)} onSnooze={() => snoozeTask(t.id)} />
            ))}
          </Section>

          <Section title="Completed" count={completed.length} defaultOpen={false}>
            {completed.map((t) => (
              <TaskRow key={t.id} task={t} onComplete={() => completeTask(t.id)} onUncomplete={() => uncompleteTask(t.id)} onDelete={() => deleteTask(t.id)} onSnooze={() => snoozeTask(t.id)} />
            ))}
          </Section>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p style={{ fontSize: '14px', color: '#9ca3af' }}>No tasks yet, add one above</p>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
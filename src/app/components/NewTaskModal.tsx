import { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import { useTasks } from '../context/TasksContext';
import { Task, TaskCategory, TaskPriority } from '../data/blockData';
import { parseNaturalDate, describeDate, formatDisplayDate } from '../utils/naturalDate';
import { DropdownSelect } from './DropdownSelect';
import { DatePickerTrigger } from './DatePickerInput';

interface Props {
  open: boolean;
  onClose: () => void;
}

const CATEGORIES: { value: TaskCategory; label: string }[] = [
  { value: 'feeding',     label: 'Feeding'     },
  { value: 'health',      label: 'Health'      },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'fencing',     label: 'Fencing'     },
  { value: 'pasture',     label: 'Pasture'     },
  { value: 'other',       label: 'Other'       },
];

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: 'low',    label: 'Low'    },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High'   },
];

type Recurrence = Task['recurring'];
const RECURRENCES: { value: Recurrence; label: string }[] = [
  { value: null,      label: 'Once'    },
  { value: 'daily',   label: 'Daily'   },
  { value: 'weekly',  label: 'Weekly'  },
  { value: 'monthly', label: 'Monthly' },
];

const INPUT = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none bg-white text-gray-900 transition-colors focus:border-orange-400';

export function NewTaskModal({ open, onClose }: Props) {
  const { addTask } = useTasks();

  const [title,       setTitle]       = useState('');
  const [category,    setCategory]    = useState<TaskCategory>('feeding');
  const [dueDate,     setDueDate]     = useState('');
  const [dateInput,   setDateInput]   = useState('');
  const [priority,    setPriority]    = useState<TaskPriority>('low');
  const [notes,       setNotes]       = useState('');
  const [recurring,   setRecurring]   = useState<Recurrence>(null);

  const parsedDate = parseNaturalDate(dateInput);
  const resolvedDate = parsedDate ?? dueDate;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !resolvedDate) return;

    const task: Task = {
      id:        `t-${Date.now()}`,
      title:     title.trim(),
      category,
      dueDate:   resolvedDate,
      completed: false,
      priority,
      notes:     notes.trim() || undefined,
      recurring: recurring ?? undefined,
    };

    addTask(task);
    handleClose();
  }

  function handleClose() {
    setTitle(''); setCategory('feeding'); setDueDate(''); setDateInput('');
    setPriority('low'); setNotes(''); setRecurring(null);
    onClose();
  }

  // Shared header + form — rendered in both mobile sheet and desktop modal
  const formContent = (
    <>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
        <p style={{ fontSize: '15px', fontWeight: 700, color: '#111' }}>New Task</p>
        <button
          onClick={handleClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg"
          style={{ background: '#f5f5f4', color: '#6b7280' }}
        >
          <X width={14} height={14} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Title */}
        <div>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
            Task
          </p>
          <input
            className={INPUT}
            style={{ fontSize: '13px' }}
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Category */}
        <div>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
            Category
          </p>
          <DropdownSelect
            value={category}
            onChange={v => setCategory(v as TaskCategory)}
            placeholder="Select category…"
            options={CATEGORIES.map(c => ({ label: c.label, value: c.value }))}
          />
        </div>

        {/* Due Date — full width */}
        <div>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
            Due Date
          </p>
          <div className="relative">
            <input
              className={INPUT}
              style={{ fontSize: '13px', paddingRight: '36px' }}
              placeholder="Friday, in 3 days, tomorrow…"
              value={dateInput}
              onChange={(e) => { setDateInput(e.target.value); setDueDate(''); }}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2" style={{ pointerEvents: 'none' }}>
              <Calendar width={15} height={15} style={{ color: '#9ca3af' }} />
            </div>
            <DatePickerTrigger
              value={dueDate}
              onChange={v => { setDueDate(v); setDateInput(''); }}
              style={{ position: 'absolute', right: 0, top: 0, width: '36px', height: '100%' }}
            />
          </div>
          {resolvedDate && (
            <div className="flex items-center gap-1.5 mt-1.5" style={{ display: 'inline-flex' }}>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                style={{ fontSize: '11px', fontWeight: 600, color: '#ea580c', background: '#fff7ed', border: '1px solid #fed7aa' }}>
                <Calendar width={10} height={10} />
                {describeDate(resolvedDate)} · {formatDisplayDate(resolvedDate)}
              </span>
            </div>
          )}
          {dateInput && !parsedDate && (
            <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
              Try: "Friday", "in 3 days", "next week"
            </p>
          )}
        </div>

        {/* Priority */}
        <div>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
            Priority
          </p>
          <DropdownSelect
            value={priority}
            onChange={v => setPriority(v as TaskPriority)}
            placeholder="Select priority…"
            options={PRIORITIES.map(p => ({ label: p.label, value: p.value }))}
          />
        </div>

        {/* Recurrence */}
        <div>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
            Repeat
          </p>
          <DropdownSelect
            value={recurring ?? ''}
            onChange={v => setRecurring((v || null) as Recurrence)}
            placeholder="Select repeat…"
            options={RECURRENCES.map(r => ({ label: r.label, value: r.value ?? '' }))}
          />
        </div>

        {/* Notes */}
        <div>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
            Notes (optional)
          </p>
          <textarea
            className={INPUT}
            style={{ fontSize: '13px', resize: 'none', height: '72px' }}
            placeholder="Any extra detail..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={!title.trim() || !resolvedDate}
          className="flex-1 py-2.5 rounded-xl transition-all active:scale-[0.97] disabled:opacity-40"
            style={{ background: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: 600 }}
          >
            Add Task
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl transition-all"
            style={{ background: '#f5f5f4', color: '#6b7280', fontSize: '13px', border: '1px solid #e5e7eb' }}
          >
            Cancel
          </button>
        </div>
      </form>
    </>
  );

  return (
    /* Always mounted so open/close is driven by CSS, not React remount */
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100]"
        style={{
          background: 'rgba(0,0,0,0.42)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
        onClick={handleClose}
      />

      {/* Mobile bottom sheet */}
      <div
        className="sm:hidden fixed left-0 right-0 bottom-0 z-[101] flex flex-col rounded-t-3xl overflow-y-auto"
        style={{
          background: '#fefefe',
          transform: open ? 'translateY(0)' : 'translateY(110%)',
          transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
          willChange: 'transform',
          maxHeight: '90vh',
          paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: '#d1d5db' }} />
        </div>
        {formContent}
      </div>

      {/* Desktop centered modal */}
      <div
        className="hidden sm:flex fixed inset-0 z-[101] items-center justify-center"
        style={{ pointerEvents: open ? 'auto' : 'none' }}
        onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      >
        <div
          className="w-full max-w-md rounded-2xl overflow-y-auto"
          style={{
            background: '#fefefe',
            maxHeight: '90vh',
            opacity: open ? 1 : 0,
            transform: open ? 'scale(1) translateY(0px)' : 'scale(0.95) translateY(16px)',
            transition: 'opacity 0.25s ease, transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
            willChange: 'transform, opacity',
          }}
        >
          {formContent}
        </div>
      </div>
    </>
  );
}

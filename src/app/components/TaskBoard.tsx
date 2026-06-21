import { useState, useRef, useCallback } from 'react';
import { Task, TaskCategory, TASK_CATEGORY_CONFIG, daysDiff, fmtDate, TODAY } from '../data/blockData';
import { CheckCircle2, Circle, GripVertical, AlarmClock, Trash2 } from 'lucide-react';

interface Column {
  id: string;
  label: string;
  accent: string;
  bg: string;
  border: string;
  filter: (t: Task) => boolean;
  dropDate: string;
  droppable: boolean;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function getThisWeekEnd(): string {
  const d = new Date(TODAY + 'T12:00:00');
  const day = d.getDay();
  const toSunday = day === 0 ? 0 : 7 - day;
  d.setDate(d.getDate() + toSunday);
  return d.toISOString().split('T')[0];
}

const WEEK_END = getThisWeekEnd();
const NEXT_WEEK = addDays(WEEK_END, 1);

const COLUMNS: Column[] = [
  {
    id: 'overdue',
    label: 'Overdue',
    accent: '#dc2626',
    bg: '#fef9f9',
    border: '#fecaca',
    filter: t => !t.completed && daysDiff(t.dueDate) < 0,
    dropDate: TODAY,
    droppable: false,
  },
  {
    id: 'today',
    label: 'Today',
    accent: '#ea580c',
    bg: '#fff8f5',
    border: '#fed7aa',
    filter: t => !t.completed && daysDiff(t.dueDate) === 0,
    dropDate: TODAY,
    droppable: true,
  },
  {
    id: 'this-week',
    label: 'This Week',
    accent: '#7c3aed',
    bg: '#faf8ff',
    border: '#ddd6fe',
    filter: t => !t.completed && daysDiff(t.dueDate) > 0 && t.dueDate <= WEEK_END,
    dropDate: addDays(TODAY, 3),
    droppable: true,
  },
  {
    id: 'later',
    label: 'Later',
    accent: '#374151',
    bg: '#f9f9f8',
    border: '#e5e7eb',
    filter: t => !t.completed && t.dueDate > WEEK_END,
    dropDate: NEXT_WEEK,
    droppable: true,
  },
];

function BoardCard({
  task,
  onComplete,
  onDelete,
  onSnooze,
  onDragStart,
  onDragEnd,
}: {
  task: Task;
  onComplete: () => void;
  onDelete: () => void;
  onSnooze: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  const diff    = daysDiff(task.dueDate);
  const overdue = diff < 0;
  const today   = diff === 0;
  const cfg     = TASK_CATEGORY_CONFIG[task.category];

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="group rounded-xl px-3 py-2.5 cursor-grab active:cursor-grabbing select-none"
      style={{
        background: '#fff',
        border: '1px solid #f0f0f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        marginBottom: '6px',
        transition: 'box-shadow 0.15s, transform 0.15s',
      }}
    >
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 mt-0.5" style={{ color: '#d1d5db', cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); onComplete(); }}>
          <Circle width={15} height={15} className="hover:text-green-400 transition-colors" />
        </div>

        <div className="flex-1 min-w-0">
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#111', lineHeight: 1.3 }} className="truncate">
            {task.title}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span
              className="inline-block px-1.5 py-0.5 rounded-full"
              style={{ fontSize: '9px', fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, whiteSpace: 'nowrap' }}
            >
              {cfg.label}
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: overdue ? '#dc2626' : today ? '#ea580c' : '#9ca3af',
                whiteSpace: 'nowrap',
              }}
            >
              {overdue
                ? `${Math.abs(diff)}d overdue`
                : today
                  ? 'Today'
                  : diff === 1 ? 'Tomorrow' : fmtDate(task.dueDate)}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical width={12} height={12} style={{ color: '#d1d5db' }} />
        </div>
      </div>

      <div className="flex items-center gap-1 mt-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
        {overdue && (
          <button
            onClick={(e) => { e.stopPropagation(); onSnooze(); }}
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg transition-all"
            style={{ color: '#9ca3af', border: '1px solid #e5e7eb', fontSize: '9px', fontWeight: 600 }}
            title="Snooze 1 day"
          >
            <AlarmClock width={9} height={9} />
            +1d
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="flex items-center justify-center w-5 h-5 rounded-lg transition-all"
          style={{ color: '#9ca3af' }}
          title="Delete"
        >
          <Trash2 width={10} height={10} />
        </button>
      </div>
    </div>
  );
}

function CompletedCard({ task, onUncomplete }: { task: Task; onUncomplete: () => void }) {
  const cfg = TASK_CATEGORY_CONFIG[task.category];
  return (
    <div
      className="group rounded-xl px-3 py-2.5 cursor-pointer"
      style={{ background: '#f9faf8', border: '1px solid #e5e7eb', marginBottom: '6px', opacity: 0.7 }}
      onClick={onUncomplete}
    >
      <div className="flex items-start gap-2">
        <CheckCircle2 width={15} height={15} style={{ color: '#22c55e', flexShrink: 0, marginTop: 2 }} />
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', textDecoration: 'line-through', lineHeight: 1.3 }} className="truncate">
            {task.title}
          </p>
          <span style={{ fontSize: '9px', fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, padding: '1px 6px', borderRadius: 999, display: 'inline-block', marginTop: '3px' }}>
            {cfg.label}
          </span>
        </div>
      </div>
    </div>
  );
}

export function TaskBoard({
  tasks,
  onComplete,
  onUncomplete,
  onDelete,
  onSnooze,
  onReschedule,
  categoryFilter,
}: {
  tasks: Task[];
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onDelete: (id: string) => void;
  onSnooze: (id: string) => void;
  onReschedule: (id: string, date: string) => void;
  categoryFilter: string;
}) {
  const [dragId, setDragId]   = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const dragColRef            = useRef<string | null>(null);
  const hoverTimerRef         = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredTasks = tasks.filter(t =>
    categoryFilter === 'all' || t.category === categoryFilter
  );

  const completedTasks = filteredTasks.filter(t => t.completed)
    .sort((a, b) => (b.completedDate ?? '').localeCompare(a.completedDate ?? ''))
    .slice(0, 5);

  const clearHoverTimer = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  function handleDragStart(e: React.DragEvent, task: Task, colId: string) {
    setDragId(task.id);
    dragColRef.current = colId;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  }

  function handleDragOver(e: React.DragEvent, col: Column) {
    if (!col.droppable) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (overCol !== col.id) {
      clearHoverTimer();
      hoverTimerRef.current = setTimeout(() => setOverCol(col.id), 180);
    }
  }

  function handleDragLeave(e: React.DragEvent, colId: string) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      clearHoverTimer();
      setOverCol(prev => prev === colId ? null : prev);
    }
  }

  function handleDrop(e: React.DragEvent, col: Column) {
    e.preventDefault();
    clearHoverTimer();
    if (!col.droppable) return;
    const id = dragId ?? e.dataTransfer.getData('text/plain');
    if (id && dragColRef.current !== col.id) {
      onReschedule(id, col.dropDate);
    }
    setDragId(null);
    setOverCol(null);
    dragColRef.current = null;
  }

  function handleDragEnd() {
    clearHoverTimer();
    setDragId(null);
    setOverCol(null);
    dragColRef.current = null;
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max md:min-w-0 md:grid md:grid-cols-4">
        {COLUMNS.map(col => {
          const colTasks  = filteredTasks.filter(col.filter);
          const isOver    = overCol === col.id;
          const isDragging = dragId !== null;
          const cantDrop  = isDragging && !col.droppable && dragColRef.current !== col.id;

          return (
            <div
              key={col.id}
              className="flex flex-col rounded-2xl"
              style={{
                minWidth: '220px',
                background: isOver ? col.bg : '#f9f9f8',
                border: `1.5px solid ${isOver ? col.accent : cantDrop ? '#f0f0f0' : '#ebebeb'}`,
                padding: '12px',
                opacity: cantDrop ? 0.5 : 1,
                transition: 'background 0.12s, border-color 0.12s, opacity 0.12s',
              }}
              onDragOver={e => handleDragOver(e, col)}
              onDrop={e => handleDrop(e, col)}
              onDragLeave={e => handleDragLeave(e, col.id)}
            >
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3">
                <span style={{ fontSize: '11px', fontWeight: 700, color: col.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {col.label}
                </span>
                <span
                  className="px-1.5 py-0.5 rounded-md"
                  style={{ fontSize: '10px', fontWeight: 700, background: col.accent + '18', color: col.accent }}
                >
                  {colTasks.length}
                </span>
                {cantDrop && (
                  <span style={{ fontSize: '9px', color: '#dc2626', marginLeft: 'auto', fontWeight: 600 }}>No drop</span>
                )}
              </div>

              {/* Drop zone hint */}
              {isOver && dragId && col.droppable && (
                <div
                  className="rounded-xl mb-2 flex items-center justify-center"
                  style={{ height: 36, border: `2px dashed ${col.accent}`, background: col.bg, opacity: 0.7 }}
                >
                  <span style={{ fontSize: '10px', color: col.accent, fontWeight: 600 }}>Drop here</span>
                </div>
              )}

              {/* Cards — fixed height, scroll to reveal more */}
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    overflowY: 'auto',
                    maxHeight: '370px',
                    scrollbarWidth: 'none',
                  }}
                >
                  {colTasks.length === 0 && !isOver && (
                    <div className="flex items-center justify-center py-6">
                      <p style={{ fontSize: '11px', color: '#d1d5db' }}>Empty</p>
                    </div>
                  )}
                  {colTasks.map(task => (
                    <div
                      key={task.id}
                      style={{ opacity: dragId === task.id ? 0.4 : 1, transition: 'opacity 0.15s' }}
                    >
                      <BoardCard
                        task={task}
                        onComplete={() => onComplete(task.id)}
                        onDelete={() => onDelete(task.id)}
                        onSnooze={() => onSnooze(task.id)}
                        onDragStart={e => handleDragStart(e, task, col.id)}
                        onDragEnd={handleDragEnd}
                      />
                    </div>
                  ))}
                </div>
                {/* Fade gradient — shows whenever content might overflow */}
                {colTasks.length >= 4 && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '48px',
                      background: `linear-gradient(to bottom, transparent, ${isOver ? col.bg : '#f9f9f8'})`,
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completed strip at bottom */}
      {completedTasks.length > 0 && (
        <div className="mt-4 rounded-2xl p-3" style={{ background: '#f9f9f8', border: '1px solid #ebebeb' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
            Recently Completed
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {completedTasks.map(task => (
              <CompletedCard key={task.id} task={task} onUncomplete={() => onUncomplete(task.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

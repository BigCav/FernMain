import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task, TODAY } from '../data/blockData';
import { useAuth } from './AuthContext';
import { apiGet, apiSet, apiSubscribe } from '../lib/api';

interface TasksContextValue {
  tasks: Task[];
  addTask: (t: Task) => void;
  completeTask: (id: string) => void;
  uncompleteTask: (id: string) => void;
  deleteTask: (id: string) => void;
  snoozeTask: (id: string, days?: number) => void;
  rescheduleTask: (id: string, newDate: string) => void;
}

const TasksContext = createContext<TasksContextValue | null>(null);

function nextRecurringDate(fromDate: string, recurrence: NonNullable<Task['recurring']>): string {
  const d = new Date(fromDate + 'T12:00:00');
  if (recurrence === 'weekly')  d.setDate(d.getDate() + 7);
  if (recurrence === 'monthly') d.setMonth(d.getMonth() + 1);
  if (recurrence === 'daily')   d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

export function TasksProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!user) { setTasks([]); return; }
    apiGet<Task[]>('tasks').then(data => setTasks(data ?? []));
    return apiSubscribe('tasks', (data) => setTasks((data as Task[]) ?? []));
  }, [user?.id]);

  function save(next: Task[]) { apiSet('tasks', next); }

  function addTask(t: Task) {
    setTasks(prev => { const next = [t, ...prev]; save(next); return next; });
  }

  function completeTask(id: string) {
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      const updated = prev.map(t => t.id === id ? { ...t, completed: true, completedDate: TODAY } : t);
      if (task?.recurring) {
        const next: Task = { ...task, id: `t-${Date.now()}`, completed: false, completedDate: undefined, dueDate: nextRecurringDate(task.dueDate, task.recurring) };
        const result = [...updated, next];
        save(result);
        return result;
      }
      save(updated);
      return updated;
    });
  }

  function uncompleteTask(id: string) {
    setTasks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, completed: false, completedDate: undefined } : t);
      save(next);
      return next;
    });
  }

  function deleteTask(id: string) {
    setTasks(prev => { const next = prev.filter(t => t.id !== id); save(next); return next; });
  }

  function snoozeTask(id: string, days = 1) {
    setTasks(prev => {
      const next = prev.map(t => {
        if (t.id !== id) return t;
        const d = new Date(t.dueDate + 'T12:00:00');
        d.setDate(d.getDate() + days);
        return { ...t, dueDate: d.toISOString().split('T')[0] };
      });
      save(next);
      return next;
    });
  }

  function rescheduleTask(id: string, newDate: string) {
    setTasks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, dueDate: newDate } : t);
      save(next);
      return next;
    });
  }

  return (
    <TasksContext.Provider value={{ tasks, addTask, completeTask, uncompleteTask, deleteTask, snoozeTask, rescheduleTask }}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error('useTasks must be used inside TasksProvider');
  return ctx;
}

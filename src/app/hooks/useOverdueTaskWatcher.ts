import { useEffect, useRef } from 'react';
import { useTasks } from '../context/TasksContext';
import { useNotifications } from '../context/NotificationsContext';
import { TODAY } from '../data/blockData';

// Watches for overdue (incomplete, past due-date) tasks and creates a
// notification for each one. Deduplication is handled in NotificationsContext.
export function useOverdueTaskWatcher() {
  const { tasks } = useTasks();
  const { addNotification } = useNotifications();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const overdue = tasks.filter(t => !t.completed && t.dueDate < TODAY);
    overdue.forEach(task => {
      const daysLate = Math.round(
        (new Date(TODAY + 'T00:00:00').getTime() - new Date(task.dueDate + 'T00:00:00').getTime()) / 86400000
      );
      addNotification({
        type: 'task_overdue',
        title: `Overdue: ${task.title}`,
        body: `Was due ${daysLate === 1 ? 'yesterday' : `${daysLate} days ago`}. Tap Tasks to action it.`,
        taskId: task.id,
      });
    });
  }, [tasks]);
}

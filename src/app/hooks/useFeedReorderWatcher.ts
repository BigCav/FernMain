import { useEffect, useRef } from 'react';
import { useFeed } from '../context/FeedContext';
import { useTasks } from '../context/TasksContext';
import { isLowStock, TODAY } from '../data/blockData';

// Runs silently in the background. Whenever a feed item becomes low stock
// and no pending "Reorder: <name>" task already exists, it auto-creates one.
export function useFeedReorderWatcher() {
  const { feedItems } = useFeed();
  const { tasks, addTask } = useTasks();

  // Track which item IDs we've already auto-created a task for this session
  // so we don't spam tasks if the user hasn't restocked yet.
  const createdRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    feedItems.forEach((item) => {
      if (!isLowStock(item)) return;

      const taskTitle = `Reorder: ${item.name}`;

      // Already have a pending (uncompleted) reorder task for this item?
      const alreadyPending = tasks.some(
        (t) => !t.completed && t.title === taskTitle
      );
      if (alreadyPending) return;

      // Already auto-created one this session?
      if (createdRef.current.has(item.id)) return;

      createdRef.current.add(item.id);

      addTask({
        id:        `reorder-${item.id}-${Date.now()}`,
        title:     taskTitle,
        category:  'other',
        priority:  'medium',
        dueDate:   TODAY,
        completed: false,
        notes:     `${item.name} is low, ${item.stockKg} kg remaining (threshold: ${item.reorderAtKg} kg)`,
      });
    });
  // Re-run whenever feed stock levels or task list changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedItems]);
}

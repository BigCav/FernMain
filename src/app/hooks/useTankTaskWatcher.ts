import { useEffect, useRef } from 'react';
import { useWaterLog } from '../context/WaterLogContext';
import { useTasks } from '../context/TasksContext';
import { TODAY } from '../data/blockData';

const LOW_PCT = 20;

export function useTankTaskWatcher() {
  const { entries, tanks } = useWaterLog();
  const { tasks, addTask } = useTasks();
  const createdRef         = useRef<Set<string>>(new Set());

  useEffect(() => {
    tanks.forEach((tank) => {
      const latest = [...entries]
        .filter(e => e.type === 'tank' && e.tank_id === tank.id)
        .sort((a, b) => b.date.localeCompare(a.date))[0];

      if (!latest || (latest.tank_pct ?? 100) > LOW_PCT) return;

      const taskTitle = `Refill water supply: ${tank.name}`;

      const alreadyPending = tasks.some(t => !t.completed && t.title === taskTitle);
      if (alreadyPending) return;
      if (createdRef.current.has(tank.id)) return;

      createdRef.current.add(tank.id);

      addTask({
        id:        `tank-low-${tank.id}-${Date.now()}`,
        title:     taskTitle,
        category:  'maintenance',
        priority:  'high',
        dueDate:   TODAY,
        completed: false,
        notes:     `${tank.name} is at ${latest.tank_pct}% (${tank.location}). Capacity: ${(tank.capacity_l / 1000).toFixed(0)}k litres.`,
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, tanks]);
}

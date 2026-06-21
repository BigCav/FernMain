import { useEffect, useRef } from 'react';
import { useBreeding } from '../context/BreedingContext';
import { useAnimals } from '../context/AnimalsContext';
import { useTasks } from '../context/TasksContext';
import { TODAY } from '../data/blockData';

const DAYS_AHEAD = 7;

export function useBreedingTaskWatcher() {
  const { records }            = useBreeding();
  const { animals }            = useAnimals();
  const { tasks, addTask }     = useTasks();
  const createdRef             = useRef<Set<string>>(new Set());

  useEffect(() => {
    const todayMs = new Date(TODAY + 'T12:00:00').getTime();

    records.forEach((r) => {
      if (r.actualBirthDate) return; // already delivered

      const dueMs   = new Date(r.expectedDueDate + 'T12:00:00').getTime();
      const daysLeft = Math.round((dueMs - todayMs) / 86400000);

      if (daysLeft > DAYS_AHEAD || daysLeft < 0) return;

      const animal    = animals.find(a => a.id === r.animalId);
      if (!animal) return;

      const taskTitle = `Prepare birthing area for ${animal.name}`;

      const alreadyPending = tasks.some(t => !t.completed && t.title === taskTitle);
      if (alreadyPending) return;
      if (createdRef.current.has(r.id)) return;

      createdRef.current.add(r.id);

      // Schedule the prep task for 2 days before due date
      const prepDate = new Date(r.expectedDueDate + 'T12:00:00');
      prepDate.setDate(prepDate.getDate() - 2);
      const dueDateStr = prepDate.toISOString().split('T')[0];

      addTask({
        id:        `birth-prep-${r.id}-${Date.now()}`,
        title:     taskTitle,
        category:  'health',
        priority:  'high',
        dueDate:   dueDateStr < TODAY ? TODAY : dueDateStr,
        completed: false,
        notes:     `${animal.name} expected to give birth around ${r.expectedDueDate}. Prepare clean bedding, check supplies, have vet number on hand.`,
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records]);
}

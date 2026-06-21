import { useEffect, useRef } from 'react';
import { useBreeding, daysUntilDue } from '../context/BreedingContext';
import { useAnimals } from '../context/AnimalsContext';
import { useNotifications } from '../context/NotificationsContext';
import { SPECIES_CONFIG } from '../data/blockData';

const ALERT_DAYS = 7;

export function useBreedingAlertWatcher() {
  const { records } = useBreeding();
  const { animals, loading } = useAnimals();
  const { addNotification } = useNotifications();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current || loading || !records.length) return;
    ranRef.current = true;

    const due = records.filter(r => !r.actualBirthDate && daysUntilDue(r.expectedDueDate) <= ALERT_DAYS);
    due.forEach(r => {
      const animal = animals.find(a => a.id === r.animalId);
      const days = daysUntilDue(r.expectedDueDate);
      const scfg = animal ? SPECIES_CONFIG[animal.species] : null;
      const speciesLabel = scfg?.label ?? 'Animal';
      addNotification({
        type: 'breeding_due',
        taskId: `breeding-${r.id}`,
        title: days < 0 ? 'Birth overdue' : days === 0 ? 'Birth due today' : `Birth due in ${days} day${days !== 1 ? 's' : ''}`,
        body: animal
          ? `${animal.name} (${speciesLabel}) is due to give birth${days > 0 ? ` in ${days} day${days !== 1 ? 's' : ''}` : days === 0 ? ' today' : ` — ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} overdue`}.`
          : 'A breeding record is due soon.',
      });
    });
  }, [loading, records.length]);
}

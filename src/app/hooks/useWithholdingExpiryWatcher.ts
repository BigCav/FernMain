import { useEffect, useRef } from 'react';
import { useWithholding, meatClearDate } from '../context/WithholdingContext';
import { useAnimals } from '../context/AnimalsContext';
import { useNotifications } from '../context/NotificationsContext';
import { TODAY } from '../data/blockData';

export function useWithholdingExpiryWatcher() {
  const { records } = useWithholding();
  const { animals, loading } = useAnimals();
  const { addNotification } = useNotifications();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current || loading || !records.length) return;
    ranRef.current = true;

    records.forEach(r => {
      if (meatClearDate(r) === TODAY) {
        const animal = animals.find(a => a.id === r.animalId);
        addNotification({
          type: 'withholding_cleared',
          taskId: `whp-cleared-${r.id}`,
          title: 'Withholding period cleared',
          body: animal
            ? `${animal.name}'s withholding period for ${r.productName} has cleared today. Meat is now safe for processing.`
            : `A withholding period for ${r.productName} has cleared today.`,
        });
      }
    });
  }, [loading, records.length]);
}

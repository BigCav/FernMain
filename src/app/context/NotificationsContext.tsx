import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { apiGet, apiSet, apiSubscribe } from '../lib/api';
import type { Animal } from '../data/blockData';

export type NotificationType =
  | 'task_overdue'
  | 'transfer_sent'      // sender sees this — informational, no accept/decline
  | 'transfer_incoming'  // receiver sees this — has accept/decline buttons
  | 'transfer_accepted'
  | 'transfer_declined'
  | 'breeding_due'       // birth imminent (≤7 days)
  | 'withholding_cleared'; // WHP meat clearance date reached

export interface TransferPayload {
  transferId: string;
  animalId: string;
  animalName: string;
  animalTag: string;
  animalBreed: string;
  animalSpecies: string;
  fromEmail: string;
  fromName: string;
  fromProperty: string;
  fromLocation: string;
  toEmail: string;
  date: string;
  photo?: string;
  purpose: string;
  price?: number;
  notes?: string;
  animalSnapshot: Animal;
  weightHistory?: Array<{ id: string; animalId: string; date: string; kg: number; notes?: string }>;
  healthEvents?: Array<{ id: string; animalId: string; date: string; type: string; notes?: string; vet?: string; cost?: number }>;
  breedingRecords?: Array<{ id: string; animalId: string; sireId?: string; sireName?: string; matingDate: string; expectedDueDate: string; actualBirthDate?: string; offspringCount?: number; notes?: string }>;
  withholdingRecords?: Array<{ id: string; animalId: string; productName: string; treatmentDate: string; meatDays: number; milkDays?: number; notes?: string }>;
  status: 'pending' | 'accepted' | 'declined';
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  taskId?: string;
  transfer?: TransferPayload;
}

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  acceptTransfer: (notificationId: string) => Promise<Animal | null>;
  declineTransfer: (notificationId: string) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loaded, setLoaded] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const data = await apiGet<AppNotification[]>('notifications');
    setNotifications(data ?? []);
    setLoaded(true);
  }, [user?.id]);

  useEffect(() => {
    if (!user) { setNotifications([]); setLoaded(false); return; }
    fetchNotifications();

    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30_000);

    // Refetch when tab becomes visible again
    const onVisible = () => { if (document.visibilityState === 'visible') fetchNotifications(); };
    document.addEventListener('visibilitychange', onVisible);

    const offSub = apiSubscribe('notifications', (d) => setNotifications((d as AppNotification[]) ?? []));

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      offSub();
    };
  }, [user?.id, fetchNotifications]);

  function persist(next: AppNotification[]) {
    setNotifications(next);
    if (loaded) apiSet('notifications', next);
  }

  const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    setNotifications(prev => {
      // Deduplicate any notification type that carries a taskId
      if (n.taskId && prev.some(p => p.taskId === n.taskId)) return prev;
      const next: AppNotification[] = [{
        ...n,
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
        read: false,
      }, ...prev];
      if (loaded) apiSet('notifications', next);
      return next;
    });
  }, [loaded]);

  function markRead(id: string) {
    persist(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  }

  function markAllRead() {
    persist(notifications.map(n => ({ ...n, read: true })));
  }

  function dismiss(id: string) {
    persist(notifications.filter(n => n.id !== id));
  }

  async function acceptTransfer(notificationId: string): Promise<Animal | null> {
    const notif = notifications.find(n => n.id === notificationId);
    if (!notif?.transfer) return null;
    const animal = notif.transfer.animalSnapshot;
    // Mark notification as accepted + read
    persist(notifications.map(n =>
      n.id === notificationId
        ? { ...n, read: true, transfer: { ...n.transfer!, status: 'accepted' } }
        : n
    ));
    return animal;
  }

  function declineTransfer(notificationId: string) {
    persist(notifications.map(n =>
      n.id === notificationId
        ? { ...n, read: true, transfer: { ...n.transfer!, status: 'declined' } }
        : n
    ));
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, addNotification, markRead, markAllRead, dismiss, acceptTransfer, declineTransfer }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationsProvider');
  return ctx;
}

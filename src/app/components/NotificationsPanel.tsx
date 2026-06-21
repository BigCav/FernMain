import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, CheckCheck, ClipboardCheck, ArrowRightLeft, Check, XCircle, SendHorizonal, Baby, ShieldCheck } from 'lucide-react';
import { useNotifications, AppNotification } from '../context/NotificationsContext';
import { useAnimals } from '../context/AnimalsContext';
import { useWeight } from '../context/WeightContext';
import { useBreeding } from '../context/BreedingContext';
import { useWithholding } from '../context/WithholdingContext';
import { usePhotos } from '../context/PhotoContext';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function dateGroup(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const notifDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (notifDay.getTime() === today.getTime()) return 'Today';
  if (notifDay.getTime() === yesterday.getTime()) return 'Yesterday';
  return 'Earlier';
}

const TYPE_META: Record<AppNotification['type'], { icon: React.ReactNode; color: string; bg: string; border: string; label: string }> = {
  task_overdue: {
    icon: <ClipboardCheck width={13} height={13} />,
    color: '#ef4444', bg: '#fef2f2', border: '#fecaca', label: 'Overdue',
  },
  transfer_sent: {
    icon: <SendHorizonal width={13} height={13} />,
    color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', label: 'Sent',
  },
  transfer_incoming: {
    icon: <ArrowRightLeft width={13} height={13} />,
    color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', label: 'Incoming',
  },
  transfer_accepted: {
    icon: <Check width={13} height={13} />,
    color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Accepted',
  },
  transfer_declined: {
    icon: <XCircle width={13} height={13} />,
    color: '#ef4444', bg: '#fef2f2', border: '#fecaca', label: 'Declined',
  },
  breeding_due: {
    icon: <Baby width={13} height={13} />,
    color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', label: 'Birth',
  },
  withholding_cleared: {
    icon: <ShieldCheck width={13} height={13} />,
    color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Cleared',
  },
};

function NotifIcon({ type }: { type: AppNotification['type'] }) {
  const m = TYPE_META[type] ?? TYPE_META.task_overdue;
  return (
    <div
      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: m.bg, border: `1px solid ${m.border}`, color: m.color }}
    >
      {m.icon}
    </div>
  );
}

function TransferActions({ notif }: { notif: AppNotification }) {
  const { acceptTransfer, declineTransfer } = useNotifications();
  const { addAnimal, addHealthEvents } = useAnimals();
  const { addEntries: addWeightEntries } = useWeight();
  const { addRecords: addBreedingRecords } = useBreeding();
  const { addRecords: addWithholdingRecords } = useWithholding();
  const { setPhoto } = usePhotos();

  if (!notif.transfer || notif.transfer.status !== 'pending') {
    const accepted = notif.transfer?.status === 'accepted';
    return (
      <span
        className="inline-block mt-1.5 px-2 py-0.5 rounded-lg"
        style={{
          fontSize: '10px', fontWeight: 700,
          background: accepted ? '#f0fdf4' : '#fef2f2',
          color: accepted ? '#16a34a' : '#ef4444',
          border: `1px solid ${accepted ? '#bbf7d0' : '#fecaca'}`,
        }}
      >
        {accepted ? '✓ Accepted' : '✕ Declined'}
      </span>
    );
  }

  return (
    <div className="flex gap-2 mt-2.5">
      <button
        onClick={async (e) => {
          e.stopPropagation();
          const animal = await acceptTransfer(notif.id);
          if (animal && notif.transfer) {
            const newAnimalId = `a-${Date.now()}`;
            const uid = () => Math.random().toString(36).slice(2, 8);
            const t = notif.transfer;
            const incomingTransfer = {
              id: t.transferId,
              date: t.date,
              fromName: t.fromName,
              fromProperty: t.fromProperty,
              fromLocation: t.fromLocation || '',
              toEmail: t.toEmail,
              purpose: t.purpose as import('../data/blockData').TransferPurpose,
              price: t.price,
              notes: t.notes,
            };
            addAnimal({ ...animal, id: newAnimalId, transfers: [...(animal.transfers ?? []), incomingTransfer] });
            if (t.photo) setPhoto(newAnimalId, t.photo);
            addWeightEntries((t.weightHistory ?? []).map((w, i) => ({ ...w, id: `w-${Date.now()}-${i}-${uid()}`, animalId: newAnimalId })));
            addHealthEvents((t.healthEvents ?? []).map((h, i) => ({ ...h, id: `he-${Date.now()}-${i}-${uid()}`, animalId: newAnimalId })));
            addBreedingRecords((t.breedingRecords ?? []).map((b, i) => ({ ...b, id: `br-${Date.now()}-${i}-${uid()}`, animalId: newAnimalId })));
            addWithholdingRecords((t.withholdingRecords ?? []).map((wh, i) => ({ ...wh, id: `wh-${Date.now()}-${i}-${uid()}`, animalId: newAnimalId })));
          }
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all active:scale-[0.97]"
        style={{ fontSize: '11px', fontWeight: 700, background: '#16a34a', color: '#fff' }}
      >
        <Check width={11} height={11} />
        Accept
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); declineTransfer(notif.id); }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all active:scale-[0.97]"
        style={{ fontSize: '11px', fontWeight: 600, background: '#f5f5f4', color: '#6b7280', border: '1px solid #e5e7eb' }}
      >
        <XCircle width={11} height={11} />
        Decline
      </button>
    </div>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  bellRefs?: React.RefObject<HTMLElement | null>[];
}

export function NotificationsPanel({ open, onClose, bellRefs }: Props) {
  const { notifications, unreadCount, markRead, markAllRead, dismiss } = useNotifications();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(target)) {
        const clickedBell = bellRefs?.some(r => r.current?.contains(target));
        if (!clickedBell) onClose();
      }
    }
    setTimeout(() => document.addEventListener('mousedown', handleClick), 0);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose, bellRefs]);

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;

  // Group notifications by day
  const groups: Array<{ label: string; items: AppNotification[] }> = [];
  for (const notif of notifications) {
    const label = dateGroup(notif.createdAt);
    const existing = groups.find(g => g.label === label);
    if (existing) existing.items.push(notif);
    else groups.push({ label, items: [notif] });
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Mobile backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: 'rgba(0,0,0,0.3)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            ref={panelRef}
            className="fixed z-50 flex flex-col"
            style={{
              bottom: 0, left: 0, right: 0,
              maxHeight: '80vh',
              borderRadius: '20px 20px 0 0',
              ...(isDesktop ? {
                top: '56px', left: '8px', right: 'auto', bottom: 'auto',
                width: '340px', maxHeight: '520px',
                borderRadius: '16px',
              } : {}),
              background: '#fefefe',
              boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
              border: '1px solid #ebebeb',
            }}
            initial={isDesktop ? { opacity: 0, scale: 0.96, y: -8 } : { y: '100%' }}
            animate={isDesktop ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
            exit={isDesktop ? { opacity: 0, scale: 0.96, y: -8 } : { y: '100%' }}
            transition={isDesktop
              ? { duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }
              : { type: 'spring', stiffness: 380, damping: 34 }
            }
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 flex-shrink-0" style={{ borderBottom: '1px solid #f0f0f0' }}>
              <div className="flex items-center gap-2">
                <Bell width={14} height={14} style={{ color: '#111' }} />
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#111', letterSpacing: '-0.02em' }}>Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 h-5 min-w-5 flex items-center justify-center rounded-full" style={{ fontSize: '10px', fontWeight: 700, background: '#ef4444', color: '#fff' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors hover:bg-gray-50"
                    style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280' }}
                  >
                    <CheckCheck width={12} height={12} />
                    Mark all read
                  </button>
                )}
                <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-50">
                  <X width={13} height={13} style={{ color: '#9ca3af' }} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 pb-3 md:pb-3" style={{ paddingBottom: isDesktop ? '12px' : '32px' }}>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#f5f5f4' }}>
                    <Bell width={20} height={20} style={{ color: '#9ca3af' }} />
                  </div>
                  <div className="text-center">
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>All caught up</p>
                    <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>No notifications yet</p>
                  </div>
                </div>
              ) : (
                <div>
                  {groups.map(group => (
                    <div key={group.label}>
                      {/* Date group header */}
                      <div className="px-4 pt-3 pb-1 sticky top-0" style={{ background: '#fefefe', zIndex: 1 }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          {group.label}
                        </span>
                      </div>

                      {group.items.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => markRead(notif.id)}
                          className="group relative flex gap-3 py-3 mx-2 px-3 cursor-pointer transition-colors"
                          style={{
                            borderLeft: notif.read ? '3px solid transparent' : '3px solid #ea580c',
                            borderBottom: '1px solid #f5f5f5',
                            background: notif.read ? 'transparent' : '#fff4ee',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = notif.read ? '#f9f9f8' : '#fdeee6')}
                          onMouseLeave={e => (e.currentTarget.style.background = notif.read ? 'transparent' : '#fff4ee')}
                        >

                          <NotifIcon type={notif.type} />

                          <div className="flex-1 min-w-0 pr-6">
                            <div className="flex items-start justify-between gap-2 mb-0.5">
                              <p style={{
                                fontSize: '12px',
                                fontWeight: notif.read ? 600 : 700,
                                color: notif.read ? '#374151' : '#111',
                                lineHeight: 1.35,
                              }}>
                                {notif.title}
                              </p>
                            </div>
                            <p style={{ fontSize: '11px', color: '#6b7280', lineHeight: 1.45 }}>{notif.body}</p>
                            {notif.type === 'transfer_incoming' && <TransferActions notif={notif} />}
                            <p style={{ fontSize: '10px', color: '#b0b7c0', marginTop: '5px', fontWeight: 500 }}>
                              {timeAgo(notif.createdAt)}
                            </p>
                          </div>

                          {/* Dismiss button — always present, fades in on hover */}
                          <button
                            onClick={(e) => { e.stopPropagation(); dismiss(notif.id); }}
                            className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-lg transition-all opacity-0 group-hover:opacity-100 hover:bg-gray-100"
                            style={{ color: '#9ca3af' }}
                            title="Dismiss"
                          >
                            <X width={10} height={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

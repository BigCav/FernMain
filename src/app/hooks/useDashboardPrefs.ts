import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiSet } from '../lib/api';

export const DASHBOARD_WIDGETS = [
  { key: 'birthday',     label: 'Birthday alerts',          desc: 'Upcoming animal birthdays within 14 days' },
  { key: 'weather',      label: 'Weather & dry spell',      desc: 'Forecast strip and dry spell counter' },
  { key: 'tasks',        label: 'Tasks this week',          desc: 'Overdue, today and upcoming tasks' },
  { key: 'animalHealth', label: 'Animal health',            desc: 'Animals needing attention and species breakdown' },
  { key: 'idleAlerts',   label: 'Idle animal alerts',       desc: 'Animals with no health check in 60+ days' },
  { key: 'weightAlerts', label: 'Declining weight alerts',  desc: '3 consecutive weight drops flagged' },
  { key: 'breeding',     label: 'Breeding due soon',        desc: 'Births expected within 30 days' },
  { key: 'withholding',  label: 'Withholding periods',      desc: 'Active WHP treatments and clearance dates' },
  { key: 'healthChecks', label: 'Upcoming health checks',   desc: 'Scheduled next-due vet events' },
  { key: 'recentEvents', label: 'Recent health events',     desc: 'Latest logged treatments and check-ups' },
  { key: 'rainfall',     label: 'Rainfall & Water',         desc: 'Monthly rainfall totals and tank levels' },
  { key: 'finance',      label: 'Finance summary',          desc: 'Monthly income, expenses and net P&L' },
] as const;

export type WidgetKey = typeof DASHBOARD_WIDGETS[number]['key'];
export const PLUS_WIDGET_KEYS = new Set<WidgetKey>(['rainfall', 'finance']);

const DEFAULT_PREFS: Record<WidgetKey, boolean> = {
  birthday:     true,
  weather:      true,
  tasks:        true,
  animalHealth: true,
  idleAlerts:   false,
  weightAlerts: false,
  breeding:     false,
  withholding:  false,
  healthChecks: false,
  recentEvents: false,
  rainfall:     false,
  finance:      false,
};

const CACHE_KEY = 'fern_cache_dashboardPrefs';

function readCacheSync(): Record<WidgetKey, boolean> | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function useDashboardPrefs() {
  const { user } = useAuth();
  // Initialise synchronously from localStorage so prefs are ready on first render
  const [prefs, setPrefs] = useState<Record<WidgetKey, boolean>>(
    () => readCacheSync() ?? DEFAULT_PREFS
  );

  useEffect(() => {
    if (!user) { setPrefs(DEFAULT_PREFS); return; }
    // Background refresh — updates prefs silently if server has newer data
    apiGet<Record<WidgetKey, boolean>>('dashboardPrefs').then(data => {
      if (data) setPrefs(data);
    });
  }, [user?.id]);

  function toggle(key: WidgetKey) {
    setPrefs(prev => {
      const next = { ...prev, [key]: !prev[key] };
      apiSet('dashboardPrefs', next);
      return next;
    });
  }

  function show(key: WidgetKey): boolean {
    return prefs[key] ?? false;
  }

  return { prefs, toggle, show };
}

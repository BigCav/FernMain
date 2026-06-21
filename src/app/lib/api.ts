import { supabase } from './supabase';
import { projectId } from '../../../utils/supabase/info';

const BASE = `https://${projectId}.functions.supabase.co/make-server-4e6b560b`;

const CACHE_PREFIX   = 'fern_cache_';
const VERSION_PREFIX = 'fern_ver_';
const PENDING_KEY    = 'fern_pending_sync';

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

// ── Local cache helpers ───────────────────────────────────────────────────────

function cacheWrite(store: string, data: unknown) {
  try { localStorage.setItem(CACHE_PREFIX + store, JSON.stringify(data)); } catch {}
}

function cacheRead<T>(store: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + store);
    return raw ? JSON.parse(raw) as T : null;
  } catch { return null; }
}

function versionWrite(store: string, v: number) {
  try { localStorage.setItem(VERSION_PREFIX + store, String(v)); } catch {}
}

function versionRead(store: string): number | undefined {
  try {
    const raw = localStorage.getItem(VERSION_PREFIX + store);
    if (raw === null) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  } catch { return undefined; }
}

// ── Pending offline queue (per-store snapshot of latest pending write) ───────

interface PendingEntry { data: unknown; baseVersion?: number; deletedIds: string[] }

function pendingAdd(store: string, entry: PendingEntry) {
  try {
    const pending: Record<string, PendingEntry> = JSON.parse(localStorage.getItem(PENDING_KEY) ?? '{}');
    pending[store] = entry;
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch {}
}

function pendingClear() {
  try { localStorage.removeItem(PENDING_KEY); } catch {}
}

function pendingRead(): Record<string, PendingEntry> {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) ?? '{}'); } catch { return {}; }
}

// ── Subscribers — let contexts react to server-side merges ───────────────────

const subscribers = new Map<string, Set<(data: unknown) => void>>();

export function apiSubscribe(store: string, cb: (data: unknown) => void): () => void {
  let set = subscribers.get(store);
  if (!set) { set = new Set(); subscribers.set(store, set); }
  set.add(cb);
  return () => { set!.delete(cb); };
}

function notify(store: string, data: unknown) {
  const set = subscribers.get(store);
  if (!set) return;
  for (const cb of set) { try { cb(data); } catch {} }
}

// ── Diff helper — auto-detects array-of-{id} deletions ──────────────────────

function diffDeletedIds(prev: unknown, next: unknown): string[] {
  if (!Array.isArray(prev) || !Array.isArray(next)) return [];
  const prevIds = new Set<string>();
  for (const p of prev) if (p && typeof (p as any).id === 'string') prevIds.add((p as any).id);
  if (prevIds.size === 0) return [];
  const nextIds = new Set<string>();
  for (const n of next) if (n && typeof (n as any).id === 'string') nextIds.add((n as any).id);
  const removed: string[] = [];
  for (const id of prevIds) if (!nextIds.has(id)) removed.push(id);
  return removed;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function apiGet<T>(store: string): Promise<T | null> {
  const token = await getToken();
  if (!token) return cacheRead<T>(store);
  try {
    const res = await fetch(`${BASE}/data/${store}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return cacheRead<T>(store);
    const json = await res.json();
    const data = json.data as T | null;
    if (typeof json.version === 'number') versionWrite(store, json.version);
    if (data !== null) cacheWrite(store, data);
    return data;
  } catch {
    return cacheRead<T>(store);
  }
}

export async function apiSet(store: string, data: unknown): Promise<void> {
  const prev = cacheRead<unknown>(store);
  const deletedIds = diffDeletedIds(prev, data);
  const baseVersion = versionRead(store);

  // Optimistic local cache write
  cacheWrite(store, data);

  const token = await getToken();
  if (!token) { pendingAdd(store, { data, baseVersion, deletedIds }); return; }

  try {
    const res = await fetch(`${BASE}/data/${store}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, baseVersion, deletedIds }),
    });

    if (!res.ok) {
      // 409 means the server returned canonical state for a non-array conflict.
      if (res.status === 409) {
        try {
          const body = await res.json();
          if (typeof body.version === 'number') versionWrite(store, body.version);
          if ('data' in body) {
            cacheWrite(store, body.data);
            notify(store, body.data);
          }
        } catch {}
        return;
      }
      pendingAdd(store, { data, baseVersion, deletedIds });
      return;
    }

    const body = await res.json();
    if (typeof body.version === 'number') versionWrite(store, body.version);
    // If the server merged our write with concurrent state, the canonical data
    // differs from what we sent — update cache and notify subscribers so the
    // context picks up other tabs' changes.
    if (body.merged && 'data' in body) {
      cacheWrite(store, body.data);
      notify(store, body.data);
    }
  } catch {
    pendingAdd(store, { data, baseVersion, deletedIds });
  }
}

// Flush queued writes when reconnecting. Safe now: the server merges array
// stores by id with tombstones, so a stale tab's replay can no longer wipe
// items that another tab/session added or kept.
export async function apiFlushPending(): Promise<void> {
  const pending = pendingRead();
  const stores  = Object.keys(pending);
  if (!stores.length) return;

  const token = await getToken();
  if (!token) return;

  await Promise.all(
    stores.map(async store => {
      const entry = pending[store];
      try {
        const res = await fetch(`${BASE}/data/${store}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        });
        if (!res.ok) return;
        const body = await res.json();
        if (typeof body.version === 'number') versionWrite(store, body.version);
        if ((body.merged || res.status === 200) && 'data' in body) {
          cacheWrite(store, body.data);
          notify(store, body.data);
        }
      } catch { /* leave in queue */ }
    })
  );

  pendingClear();
}

export async function apiSendTransferNotification(recipientEmail: string, notification: object): Promise<boolean> {
  const token = await getToken();
  if (!token) return false;
  const res = await fetch(`${BASE}/send-transfer-notification`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipientEmail, notification }),
  });
  return res.ok;
}

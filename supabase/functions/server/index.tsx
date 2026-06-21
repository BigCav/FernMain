import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use('*', logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

app.get("/make-server-4e6b560b/health", (c) => c.json({ status: "ok" }));

// ── Auth helper ──────────────────────────────────────────────────────────────
async function getUserId(c: any): Promise<string | null> {
  const auth = c.req.header("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
}

// ── Versioned wrapper helpers ────────────────────────────────────────────────
// Stored shape: { version: number, data: any, tombstones?: Record<string, number> }
// Legacy raw values are auto-wrapped on read.

type Wrapper = { version: number; data: any; tombstones?: Record<string, number> };

function unwrap(raw: any): Wrapper {
  if (raw && typeof raw === 'object' && 'version' in raw && 'data' in raw) {
    return { version: raw.version, data: raw.data, tombstones: raw.tombstones ?? {} };
  }
  // Legacy: bare value. Treat as version 0.
  return { version: 0, data: raw ?? null, tombstones: {} };
}

function isArrayOfIded(v: any): v is Array<{ id: string }> {
  return Array.isArray(v) && v.every(x => x && typeof x === 'object' && typeof x.id === 'string');
}

// Merge incoming client data into server data using id-based union with tombstones.
// - Items in deletedIds are removed and tombstoned at `newVersion`.
// - For each client item: if tombstoned AFTER client's baseVersion, skip (a newer tab deleted it).
// - Otherwise upsert by id. Server-only items (added by other tabs) are preserved.
function mergeArrays(
  serverData: any[],
  clientData: any[],
  baseVersion: number,
  deletedIds: string[],
  tombstones: Record<string, number>,
  newVersion: number,
): { merged: any[]; tombstones: Record<string, number> } {
  const byId = new Map<string, any>();
  for (const item of serverData) byId.set(item.id, item);

  const nextTombstones = { ...tombstones };

  for (const id of deletedIds) {
    byId.delete(id);
    nextTombstones[id] = newVersion;
  }

  for (const item of clientData) {
    if (!item || typeof item.id !== 'string') continue;
    const ts = nextTombstones[item.id];
    if (ts !== undefined && ts > baseVersion) continue; // resurrection guard
    byId.set(item.id, item);
  }

  // Prune very old tombstones to bound size (>1000 versions old)
  const minKeep = newVersion - 1000;
  for (const id of Object.keys(nextTombstones)) {
    if (nextTombstones[id] < minKeep) delete nextTombstones[id];
  }

  return { merged: Array.from(byId.values()), tombstones: nextTombstones };
}

// ── GET /data/:store ─────────────────────────────────────────────────────────
app.get("/make-server-4e6b560b/data/:store", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const store = c.req.param("store");
  const raw = await kv.get(`user:${userId}:${store}`);
  const { version, data } = unwrap(raw);
  return c.json({ data, version });
});

// ── POST /data/:store ────────────────────────────────────────────────────────
// Body: { data, baseVersion?, deletedIds?: string[] }
// Behaviour:
//   - If baseVersion matches current: straight write, version+1.
//   - If conflict AND both server+client data are arrays-of-{id}: merge by id with tombstones.
//   - If conflict otherwise: return 409 with current { data, version }; client must refetch.
app.post("/make-server-4e6b560b/data/:store", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const store = c.req.param("store");
  const body = await c.req.json();
  const key = `user:${userId}:${store}`;

  const current = unwrap(await kv.get(key));
  const baseVersion: number | undefined = typeof body.baseVersion === 'number' ? body.baseVersion : undefined;
  const deletedIds: string[] = Array.isArray(body.deletedIds) ? body.deletedIds : [];
  const incoming = body.data;
  const newVersion = current.version + 1;

  // Fast path: client is up-to-date OR this is a non-array store with no version conflict.
  if (baseVersion === undefined || baseVersion === current.version) {
    let nextTombstones = current.tombstones ?? {};
    // Even on the fast path, record tombstones for explicit deletes so a later
    // stale writer can't resurrect them.
    if (isArrayOfIded(incoming) && deletedIds.length) {
      nextTombstones = { ...nextTombstones };
      for (const id of deletedIds) nextTombstones[id] = newVersion;
    }
    await kv.set(key, { version: newVersion, data: incoming, tombstones: nextTombstones });
    return c.json({ ok: true, version: newVersion, data: incoming, merged: false });
  }

  // Conflict path.
  if (isArrayOfIded(current.data) && isArrayOfIded(incoming)) {
    const { merged, tombstones } = mergeArrays(
      current.data,
      incoming,
      baseVersion,
      deletedIds,
      current.tombstones ?? {},
      newVersion,
    );
    await kv.set(key, { version: newVersion, data: merged, tombstones });
    return c.json({ ok: true, version: newVersion, data: merged, merged: true });
  }

  // Non-array conflict: refuse, surface current state.
  return c.json({ error: "conflict", version: current.version, data: current.data }, 409);
});

// ── POST /send-transfer-notification ─────────────────────────────────────────
app.post("/make-server-4e6b560b/send-transfer-notification", async (c) => {
  const senderId = await getUserId(c);
  if (!senderId) return c.json({ error: "Unauthorized" }, 401);

  const { recipientEmail, notification } = await c.req.json();
  if (!recipientEmail || !notification) return c.json({ error: "Missing recipientEmail or notification" }, 400);

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: { users }, error: usersError } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
  if (usersError) return c.json({ error: "Failed to list users" }, 500);

  const recipient = users.find((u: any) => u.email?.toLowerCase() === recipientEmail.toLowerCase());
  if (!recipient) return c.json({ error: "Recipient not found" }, 404);

  // Read via wrapper so we don't clobber version/tombstones on the recipient's notifications store.
  const key = `user:${recipient.id}:notifications`;
  const current = unwrap(await kv.get(key));
  const currentList: any[] = Array.isArray(current.data) ? current.data : [];

  const newNotif = {
    ...notification,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    read: false,
  };
  await kv.set(key, {
    version: current.version + 1,
    data: [newNotif, ...currentList],
    tombstones: current.tombstones ?? {},
  });

  return c.json({ ok: true });
});

Deno.serve(app.fetch);

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function fmt(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDisplayDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function nextWeekday(from: Date, targetDay: number): Date {
  const diff = ((targetDay - from.getDay()) + 7) % 7 || 7;
  return addDays(from, diff);
}

export function parseNaturalDate(input: string): string | null {
  const now   = new Date();
  const lower = input.toLowerCase().trim();

  if (!lower) return null;

  // Exact words
  if (lower === 'today')     return fmt(now);
  if (lower === 'tomorrow')  return fmt(addDays(now, 1));
  if (lower === 'yesterday') return fmt(addDays(now, -1));
  if (lower === 'next week') return fmt(addDays(now, 7));
  if (lower === 'next month') {
    const d = new Date(now);
    d.setMonth(d.getMonth() + 1);
    return fmt(d);
  }
  if (lower === 'end of week' || lower === 'this friday') {
    return fmt(nextWeekday(now, 5));
  }

  // "in X days / weeks / months"
  const inMatch = lower.match(/^in\s+(\d+)\s+(day|days|week|weeks|month|months)$/);
  if (inMatch) {
    const n = parseInt(inMatch[1]);
    const unit = inMatch[2];
    if (unit.startsWith('day'))   return fmt(addDays(now, n));
    if (unit.startsWith('week'))  return fmt(addDays(now, n * 7));
    if (unit.startsWith('month')) {
      const d = new Date(now);
      d.setMonth(d.getMonth() + n);
      return fmt(d);
    }
  }

  // "X days" shorthand (e.g. "3 days")
  const shortDays = lower.match(/^(\d+)\s+days?$/);
  if (shortDays) return fmt(addDays(now, parseInt(shortDays[1])));

  // Plain weekday name → next occurrence
  const dayIdx = DAYS.indexOf(lower);
  if (dayIdx !== -1) return fmt(nextWeekday(now, dayIdx));

  // "next Monday" etc.
  const nextDay = lower.match(/^next\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/);
  if (nextDay) return fmt(nextWeekday(now, DAYS.indexOf(nextDay[1])));

  // "this Monday" etc.
  const thisDay = lower.match(/^this\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/);
  if (thisDay) return fmt(nextWeekday(now, DAYS.indexOf(thisDay[1])));

  return null;
}

export function describeDate(iso: string): string {
  const now    = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(iso + 'T00:00:00');
  const diff   = Math.round((target.getTime() - now.getTime()) / 86400000);

  if (diff === 0)  return 'Today';
  if (diff === 1)  return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 0 && diff <= 6) return target.toLocaleDateString('en-NZ', { weekday: 'long' });
  return target.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' });
}

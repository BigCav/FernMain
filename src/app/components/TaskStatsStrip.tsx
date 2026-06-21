import { useMemo } from 'react';
import { Task, TaskCategory, TASK_CATEGORY_CONFIG, TODAY } from '../data/blockData';
import { TrendingUp, Flame, CheckSquare, Tag } from 'lucide-react';

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay(); // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export function TaskStatsStrip({ tasks }: { tasks: Task[] }) {
  const stats = useMemo(() => {
    const weekStart = getWeekStart(TODAY);
    const weekEnd   = addDays(weekStart, 6);

    const doneThisWeek = tasks.filter(t =>
      t.completed &&
      t.completedDate &&
      t.completedDate >= weekStart &&
      t.completedDate <= weekEnd
    ).length;

    // Streak: count consecutive days (going backwards from today) that had ≥1 completion
    let streak = 0;
    let cursor = TODAY;
    for (let i = 0; i < 365; i++) {
      const day = addDays(TODAY, -i);
      const hadCompletion = tasks.some(t => t.completed && t.completedDate === day);
      if (hadCompletion) {
        streak++;
        cursor = day;
      } else {
        if (i === 0) {
          // today has no completions yet — check yesterday to keep streak alive
          cursor = day;
          continue;
        }
        break;
      }
    }
    // If today had no completions but yesterday did, streak is still valid
    // (already handled by the i===0 skip above)
    void cursor;

    // Completion rate: tasks due this week vs completed this week
    const dueThisWeek = tasks.filter(t =>
      t.dueDate >= weekStart && t.dueDate <= weekEnd
    ).length;
    const rate = dueThisWeek > 0 ? Math.round((doneThisWeek / dueThisWeek) * 100) : null;

    // Top category by open task count
    const catCount: Partial<Record<TaskCategory, number>> = {};
    tasks.filter(t => !t.completed).forEach(t => {
      catCount[t.category] = (catCount[t.category] ?? 0) + 1;
    });
    const topCat = (Object.entries(catCount) as [TaskCategory, number][])
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return { doneThisWeek, streak, rate, topCat, dueThisWeek };
  }, [tasks]);

  const topCatCfg = stats.topCat ? TASK_CATEGORY_CONFIG[stats.topCat] : null;

  const items = [
    {
      icon: <CheckSquare width={14} height={14} />,
      value: String(stats.doneThisWeek),
      label: 'Done this week',
      iconColor: '#16a34a',
      iconBg: '#f0fdf4',
    },
    {
      icon: <Flame width={14} height={14} />,
      value: stats.streak > 0 ? `${stats.streak}d` : '—',
      label: 'Streak',
      iconColor: '#ea580c',
      iconBg: '#fff7ed',
    },
    {
      icon: <TrendingUp width={14} height={14} />,
      value: stats.rate !== null ? `${stats.rate}%` : '—',
      label: 'This week',
      iconColor: '#6366f1',
      iconBg: '#eef2ff',
    },
    {
      icon: <Tag width={14} height={14} />,
      value: topCatCfg?.label ?? '—',
      label: 'Busiest',
      iconColor: topCatCfg?.color ?? '#9ca3af',
      iconBg: topCatCfg?.bg ?? '#f5f5f4',
    },
  ];

  return (
    <div className="hidden md:grid md:grid-cols-4 gap-3 mb-5">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
          style={{ background: '#fefefe', border: '1px solid #ebebeb' }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: item.iconBg, color: item.iconColor }}
          >
            {item.icon}
          </div>
          <div>
            <p style={{ fontSize: '17px', fontWeight: 800, color: '#111', lineHeight: 1 }}>{item.value}</p>
            <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

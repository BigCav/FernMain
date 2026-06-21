import { useMemo } from 'react';
import { useWeather, getCityCoords } from '../hooks/useWeather';
import { useProfile } from '../context/ProfileContext';
import { Sun, Moon, Cloud, CloudRain, CloudSnow, CloudLightning, Droplets, Wind, CloudOff } from 'lucide-react';

// ── Sky configs ───────────────────────────────────────────────────────────────
function getSky(code: number, night: boolean) {
  if (night) {
    if (code === 0)   return { grad: 'linear-gradient(160deg, #0f0c29 0%, #302b63 55%, #1a1040 100%)', accent: '#c4b5fd', scene: 'moon-clear'  as const };
    if (code <= 3)    return { grad: 'linear-gradient(160deg, #1a1040 0%, #2d1b69 60%, #0d0c1d 100%)', accent: '#a78bfa', scene: 'moon-cloud'  as const };
    return              { grad: 'linear-gradient(160deg, #0d1117 0%, #1f2937 60%, #111827 100%)',      accent: '#94a3b8', scene: 'rain-night'  as const };
  }
  if (code === 0)     return { grad: 'linear-gradient(160deg, #1d4ed8 0%, #3b82f6 55%, #93c5fd 100%)', accent: '#fde68a', scene: 'sun-clear'   as const };
  if (code <= 3)      return { grad: 'linear-gradient(160deg, #1d4ed8 0%, #3b82f6 55%, #93c5fd 100%)', accent: '#fde68a', scene: 'sun-cloud'   as const };
  // code 45/48 = fog/overcast — flat grey; rain codes (51–67) = stormy blue-grey
  if (code <= 48)     return { grad: 'linear-gradient(160deg, #374151 0%, #4b5563 55%, #64748b 100%)', accent: '#d1d5db', scene: 'overcast'    as const };
  return                { grad: 'linear-gradient(160deg, #2563eb 0%, #3b82f6 50%, #60a5fa 100%)',      accent: '#bfdbfe', scene: 'rain-day'    as const };
}

// ── Stars (rendered in hero, not inside illustration) ─────────────────────────
const STARS = [
  { x: '5%',  y: '12%', s: 2,   d: '0s'   },
  { x: '16%', y: '30%', s: 1.5, d: '0.5s' },
  { x: '26%', y: '8%',  s: 2.5, d: '0.9s' },
  { x: '38%', y: '24%', s: 1,   d: '0.3s' },
  { x: '22%', y: '55%', s: 1.5, d: '1.2s' },
  { x: '52%', y: '14%', s: 2,   d: '0.7s' },
  { x: '11%', y: '66%', s: 1,   d: '1.5s' },
  { x: '44%', y: '42%', s: 1.5, d: '0.4s' },
  { x: '63%', y: '32%', s: 1,   d: '1.0s' },
  { x: '72%', y: '18%', s: 1.8, d: '0.6s' },
  { x: '58%', y: '58%', s: 1.2, d: '1.3s' },
  { x: '80%', y: '46%', s: 1.5, d: '0.2s' },
];

// ── Animated scene ────────────────────────────────────────────────────────────
function SceneIllustration({ scene, accent }: { scene: ReturnType<typeof getSky>['scene']; accent: string }) {
  if (scene === 'moon-clear') return (
    <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
      <div style={{
        position: 'absolute', inset: -18, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(196,181,253,0.28) 0%, transparent 70%)',
        animation: 'fern-glow-pulse 3.5s ease-in-out infinite',
      }} />
      <div style={{
        width: 90, height: 90, borderRadius: '50%',
        background: 'radial-gradient(circle at 38% 38%, #f5f0ff, #e2d9f3, #c4b5fd)',
        boxShadow: '0 0 28px rgba(196,181,253,0.65), 0 0 56px rgba(196,181,253,0.25)',
        animation: 'fern-float 4.5s ease-in-out infinite',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50%', background: 'rgba(139,92,246,0.2)', top: '22%', left: '54%' }} />
        <div style={{ position: 'absolute', width: 9,  height: 9,  borderRadius: '50%', background: 'rgba(139,92,246,0.16)', top: '54%', left: '26%' }} />
        <div style={{ position: 'absolute', width: 6,  height: 6,  borderRadius: '50%', background: 'rgba(139,92,246,0.13)', top: '36%', left: '72%' }} />
      </div>
    </div>
  );

  if (scene === 'moon-cloud') return (
    <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
      {/* Moon — top-right, partially peeking behind cloud */}
      <div style={{
        position: 'absolute', width: 52, height: 52, borderRadius: '50%',
        top: 2, right: 2,
        background: 'radial-gradient(circle at 35% 35%, #f0ebff, #c4b5fd)',
        boxShadow: '0 0 18px rgba(196,181,253,0.45)',
        animation: 'fern-float 4.5s ease-in-out infinite',
      }} />
      {/* 3-div cloud — drifts bottom-left */}
      <div style={{ position: 'absolute', bottom: 4, left: -4, animation: 'fern-drift 7s ease-in-out infinite' }}>
        <div style={{ width: 76, height: 28, borderRadius: '50px', background: 'rgba(255,255,255,0.2)' }} />
        <div style={{ width: 42, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.17)', position: 'absolute', top: -14, left: 13 }} />
        <div style={{ width: 28, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.14)', position: 'absolute', top: -9,  left: 38 }} />
      </div>
    </div>
  );

  if (scene === 'sun-clear') return (
    <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
      {/* Outer diffuse halo — slow breathe */}
      <div style={{
        position: 'absolute', inset: -22, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(253,230,138,0.22) 20%, rgba(251,191,36,0.08) 55%, transparent 75%)',
        animation: 'fern-glow-pulse 4s ease-in-out infinite',
      }} />
      {/* Mid glow ring */}
      <div style={{
        position: 'absolute', inset: -8, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(253,230,138,0.38) 35%, rgba(251,191,36,0.14) 65%, transparent 80%)',
        animation: 'fern-glow-pulse 2.8s ease-in-out infinite',
        animationDelay: '0.6s',
      }} />
      {/* Sun body */}
      <div style={{
        width: 90, height: 90, borderRadius: '50%',
        background: 'radial-gradient(circle at 38% 34%, #fff9d6, #fde68a 35%, #fbbf24)',
        boxShadow: '0 0 28px rgba(251,191,36,0.9), 0 0 52px rgba(251,191,36,0.35)',
        animation: 'fern-float 5s ease-in-out infinite',
        position: 'relative',
      }} />
    </div>
  );

  if (scene === 'sun-cloud') return (
    <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
      <div style={{
        position: 'absolute', width: 54, height: 54, borderRadius: '50%',
        top: 0, right: 2,
        background: 'radial-gradient(circle at 40% 35%, #fef9c3, #fbbf24)',
        boxShadow: '0 0 22px rgba(251,191,36,0.65)',
        animation: 'fern-float 5s ease-in-out infinite',
      }} />
      <div style={{ position: 'absolute', bottom: 4, left: -2, animation: 'fern-drift 8s ease-in-out infinite' }}>
        <div style={{ width: 78, height: 30, borderRadius: '50px', background: 'rgba(255,255,255,0.85)' }} />
        <div style={{ width: 44, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.8)',  position: 'absolute', top: -15, left: 14 }} />
        <div style={{ width: 28, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.75)', position: 'absolute', top: -10, left: 40 }} />
      </div>
    </div>
  );

  if (scene === 'overcast') return (
    <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
      {/* Large grey cloud filling most of the box */}
      <div style={{ position: 'absolute', top: 14, left: -2, animation: 'fern-drift 9s ease-in-out infinite' }}>
        <div style={{ width: 86, height: 32, borderRadius: '50px', background: 'rgba(255,255,255,0.3)' }} />
        <div style={{ width: 50, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.27)', position: 'absolute', top: -18, left: 16 }} />
        <div style={{ width: 32, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.22)', position: 'absolute', top: -12, left: 46 }} />
      </div>
      {/* Second smaller cloud lower */}
      <div style={{ position: 'absolute', bottom: 6, right: -4, animation: 'fern-drift 12s ease-in-out infinite', animationDelay: '1s' }}>
        <div style={{ width: 56, height: 20, borderRadius: '50px', background: 'rgba(255,255,255,0.18)' }} />
        <div style={{ width: 30, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', position: 'absolute', top: -11, left: 10 }} />
        <div style={{ width: 20, height: 16, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', position: 'absolute', top: -7,  left: 30 }} />
      </div>
    </div>
  );

  if (scene === 'rain-day') {
    const drops = [0,1,2,3,4,5];
    // Cloud base top=20, height=30 → base bottom at ~50px. Drops start at 56% (~50px).
    return (
      <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 20, left: -4, animation: 'fern-drift 8s ease-in-out infinite' }}>
          <div style={{ width: 86, height: 30, borderRadius: '50px', background: 'rgba(255,255,255,0.6)' }} />
          <div style={{ width: 50, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.55)', position: 'absolute', top: -16, left: 14 }} />
          <div style={{ width: 32, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.5)',  position: 'absolute', top: -11, left: 44 }} />
        </div>
        {drops.map(i => (
          <div key={i} style={{
            position: 'absolute', width: 2, height: 10, borderRadius: '2px',
            background: 'rgba(186,230,255,0.95)', left: `${8 + i * 14}%`, top: '56%',
            animation: `fern-rain-drop ${0.8 + (i % 3) * 0.2}s ease-in infinite`,
            animationDelay: `${i * 0.15}s`,
          }} />
        ))}
      </div>
    );
  }

  // rain-night — same layout as day rain, translucent cloud, no moon
  const drops = [0,1,2,3,4,5];
  return (
    <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 20, left: -4, animation: 'fern-drift 8s ease-in-out infinite' }}>
        <div style={{ width: 86, height: 30, borderRadius: '50px', background: 'rgba(255,255,255,0.22)' }} />
        <div style={{ width: 50, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', position: 'absolute', top: -16, left: 14 }} />
        <div style={{ width: 32, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.14)', position: 'absolute', top: -11, left: 44 }} />
      </div>
      {drops.map(i => (
        <div key={i} style={{
          position: 'absolute', width: 2, height: 10, borderRadius: '2px',
          background: 'rgba(148,163,184,0.85)', left: `${8 + i * 14}%`, top: '56%',
          animation: `fern-rain-drop ${0.8 + (i % 3) * 0.2}s ease-in infinite`,
          animationDelay: `${i * 0.15}s`,
        }} />
      ))}
    </div>
  );
}

// ── Forecast icon (Lucide, always white) ──────────────────────────────────────
function ForecastIcon({ code, night, active }: { code: number; night: boolean; active: boolean }) {
  const c = active ? '#fff' : 'rgba(255,255,255,0.55)';
  const sz = 14;
  if (code === 0)   return night ? <Moon width={sz} height={sz} style={{ color: c }} /> : <Sun width={sz} height={sz} style={{ color: active ? '#fde68a' : 'rgba(253,230,138,0.6)' }} />;
  if (code <= 3)    return <Cloud width={sz} height={sz} style={{ color: c }} />;
  if (code <= 67)   return <CloudRain width={sz} height={sz} style={{ color: c }} />;
  if (code <= 77)   return <CloudSnow width={sz} height={sz} style={{ color: c }} />;
  return <CloudLightning width={sz} height={sz} style={{ color: c }} />;
}

const DAY_LABELS = ['Today', 'Tmrw'];
function dayLabel(dateStr: string, i: number) {
  if (i < 2) return DAY_LABELS[i];
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-NZ', { weekday: 'short' });
}

// ── Main widget ───────────────────────────────────────────────────────────────
export function WeatherWidget() {
  const { profile } = useProfile();
  const [lat, lon] = getCityCoords(profile.city || profile.location);
  const { data, loading, error } = useWeather(lat, lon);

  // Dry spell calculated from real API history — not from user-entered data
  const drySpellDays = useMemo(() => {
    if (!data) return null;
    // Currently raining → no dry spell
    if (data.current.weatherCode >= 51) return 0;
    const past = [...(data.pastPrecipitation ?? [])].reverse(); // most recent first
    if (!past.length) return null;
    let days = 0;
    for (const p of past) {
      if (p.precipitation >= 1) break;
      days++;
    }
    return days;
  }, [data]);

  if (loading && !data) return (
    <div className="rounded-2xl overflow-hidden animate-pulse h-full" style={{ background: '#e0f2fe', minHeight: 200 }}>
      <div className="px-5 pt-5 pb-3">
        <div className="rounded" style={{ height: 10, width: 80, background: 'rgba(255,255,255,0.45)', marginBottom: 14 }} />
        <div className="rounded" style={{ height: 44, width: 100, background: 'rgba(255,255,255,0.5)', marginBottom: 10 }} />
        <div className="flex gap-3">
          <div className="rounded" style={{ height: 10, width: 60, background: 'rgba(255,255,255,0.35)' }} />
          <div className="rounded" style={{ height: 10, width: 40, background: 'rgba(255,255,255,0.35)' }} />
          <div className="rounded" style={{ height: 10, width: 55, background: 'rgba(255,255,255,0.35)' }} />
        </div>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(160deg, #1a1040, #302b63)', border: '1px solid rgba(139,92,246,0.2)' }}>
      <p style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: '6px' }}>Weather · {profile.city || profile.location}</p>
      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Unable to load weather data</p>
    </div>
  );

  const { current, forecast } = data;
  const hourNow = new Date().getHours();
  const isNight = hourNow >= 18 || hourNow < 6;

  const { grad, accent, scene } = getSky(current.weatherCode, isNight);
  const showStars = scene === 'moon-clear' || scene === 'moon-cloud' || scene === 'rain-night';

  return (
    <div className="rounded-2xl overflow-hidden h-full flex flex-col" style={{ background: grad, border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>

      {/* Aurora orb */}
      <div style={{ position: 'absolute', top: -40, right: -30, width: 180, height: 180, borderRadius: '50%', background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`, pointerEvents: 'none' }} />

      {/* Stars — spread across full hero, only for night scenes */}
      {showStars && STARS.map((s, i) => (
        <div key={i} style={{
          position: 'absolute', left: s.x, top: s.y,
          width: s.s, height: s.s, borderRadius: '50%',
          background: '#fefefe', zIndex: 1, pointerEvents: 'none',
          animation: `fern-twinkle ${1.4 + i * 0.25}s ease-in-out infinite`,
          animationDelay: s.d,
        }} />
      ))}

      {/* Desktop-only top spacer to vertically centre the hero */}
      <div className="hidden md:block flex-1" />

      {/* ── Hero row ── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3" style={{ position: 'relative', zIndex: 2 }}>
        <div>
          <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>
            {profile.city || profile.location}
          </p>
          <div className="flex items-end gap-2">
            <p style={{ fontSize: '44px', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>
              {current.temp}°
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', paddingBottom: '6px', maxWidth: 90 }}>
              {current.description}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <Wind width={10} height={10} style={{ color: 'rgba(255,255,255,0.5)' }} />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>{current.windSpeed} km/h</span>
            </div>
            <div className="flex items-center gap-1">
              <Droplets width={10} height={10} style={{ color: 'rgba(255,255,255,0.5)' }} />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>{current.humidity}%</span>
            </div>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Feels {current.feelsLike}°</span>
          </div>
        </div>
        <SceneIllustration scene={scene} accent={accent} />
      </div>

      <div className="flex-1" />

      {/* ── Forecast strip ── */}
      <div className="grid grid-cols-4 gap-1.5 mx-3 mb-3" style={{ zIndex: 2, position: 'relative' }}>
        {forecast.map((day, i) => {
          const isToday = i === 0;
          const showRain = day.precipitation >= 1;
          return (
            <div
              key={day.date}
              className="flex flex-col items-center py-3 gap-1.5 rounded-xl"
              style={{
                background: isToday ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: isToday ? '1px solid rgba(255,255,255,0.28)' : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <span style={{
                fontSize: '10px',
                fontWeight: isToday ? 700 : 500,
                color: isToday ? '#fff' : 'rgba(255,255,255,0.5)',
                letterSpacing: '0.04em',
              }}>
                {dayLabel(day.date, i)}
              </span>
              <ForecastIcon code={day.weatherCode} night={isNight} active={isToday} />
              <div className="flex items-center gap-1">
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>{day.maxTemp}°</span>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.38)' }}>{day.minTemp}°</span>
              </div>
              {showRain && (
                <span style={{ fontSize: '9px', color: 'rgba(186,230,255,0.9)', fontWeight: 600 }}>
                  {day.precipitation}mm
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Dry spell banner ── */}
      {drySpellDays != null && drySpellDays >= 3 && (
        <div className="flex items-center gap-2 mx-3 mb-3 px-3 py-2 rounded-xl"
          style={{ zIndex: 2, position: 'relative', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <CloudOff width={12} height={12} style={{ color: drySpellDays >= 14 ? '#fca5a5' : drySpellDays >= 7 ? '#fdba74' : 'rgba(255,255,255,0.45)', flexShrink: 0 }} />
          <p style={{ fontSize: '11px', color: drySpellDays >= 14 ? '#fca5a5' : drySpellDays >= 7 ? '#fdba74' : 'rgba(255,255,255,0.55)', fontWeight: drySpellDays >= 7 ? 600 : 400 }}>
            {drySpellDays === 1 ? 'Last rain was yesterday' : `${drySpellDays} days without rain`}
            {drySpellDays >= 14 && ', consider irrigation'}
            {drySpellDays >= 7 && drySpellDays < 14 && ', monitor pasture'}
          </p>
        </div>
      )}

    </div>
  );
}

import { useState, useEffect } from 'react';

export interface WeatherCurrent {
  temp: number;
  feelsLike: number;
  weatherCode: number;
  windSpeed: number;
  humidity: number;
  description: string;
}

export interface WeatherDay {
  date: string;
  weatherCode: number;
  maxTemp: number;
  minTemp: number;
  precipitation: number;
  description: string;
}

export interface WeatherData {
  current: WeatherCurrent;
  forecast: WeatherDay[];
  pastPrecipitation: { date: string; precipitation: number }[];
}

const CITY_COORDS: Record<string, [number, number]> = {
  // Northland
  'Whangarei':   [-35.7275, 174.3236], 'Kerikeri':  [-35.2238, 173.9600], 'Kaitaia':    [-35.1127, 173.2660],
  'Dargaville':  [-35.9333, 173.8833], 'Paihia':    [-35.2833, 174.0833], 'Mangawhai':  [-36.1333, 174.5833],
  'Wellsford':   [-36.2833, 174.5167],
  // Auckland
  'Auckland City': [-36.8485, 174.7633], 'Manukau':  [-36.9939, 174.8796], 'North Shore': [-36.7901, 174.7456],
  'Waitakere':   [-36.9000, 174.6500],   'Pukekohe': [-37.2006, 174.9014], 'Warkworth':   [-36.4000, 174.6667],
  'Helensville': [-36.6667, 174.4500],   'Papakura': [-37.0500, 174.9500],
  // Waikato
  'Hamilton':    [-37.7826, 175.2528], 'Cambridge':    [-37.8833, 175.4667], 'Te Awamutu': [-38.0082, 175.3268],
  'Huntly':      [-37.5586, 175.1571], 'Matamata':     [-37.8081, 175.7700], 'Te Kuiti':   [-38.3333, 175.1667],
  'Tokoroa':     [-38.2333, 175.8667], 'Morrinsville': [-37.6542, 175.5377], 'Raglan':     [-37.8021, 174.8719],
  // Bay of Plenty
  'Tauranga':    [-37.6878, 176.1651], 'Rotorua':  [-38.1368, 176.2497], 'Whakatane': [-37.9528, 176.9897],
  'Opotiki':     [-38.0167, 177.2833], 'Te Puke':  [-37.7795, 176.3440], 'Katikati':  [-37.5500, 175.9167],
  'Edgecumbe':   [-37.9833, 176.8333], 'Kawerau':  [-38.1000, 176.7000],
  // Gisborne
  'Gisborne':    [-38.6623, 178.0176], 'Ruatoria': [-37.8927, 178.3319], 'Tolaga Bay': [-38.3667, 178.3000],
  'Whatatutu':   [-38.3333, 177.9167],
  // Hawke's Bay
  'Napier':      [-39.4928, 176.9120], 'Hastings':       [-39.6386, 176.8399], 'Havelock North': [-39.6667, 176.8833],
  'Waipawa':     [-39.9333, 176.5833], 'Waipukurau':     [-40.0114, 176.5481], 'Wairoa':         [-39.0333, 177.4167],
  'Taradale':    [-39.5333, 176.8667],
  // Taranaki
  'New Plymouth': [-39.0556, 174.0752], 'Hawera':   [-39.5924, 174.2829], 'Stratford': [-39.3333, 174.2833],
  'Inglewood':   [-39.1500, 174.1833],  'Opunake':  [-39.4601, 173.8572], 'Eltham':    [-39.4333, 174.3000],
  'Waitara':     [-38.9833, 174.2333],
  // Manawatu-Whanganui
  'Palmerston North': [-40.3523, 175.6082], 'Whanganui': [-39.9333, 175.0500], 'Levin':     [-40.6206, 175.2749],
  'Feilding':    [-40.2270, 175.5695],      'Bulls':     [-40.1741, 175.3846], 'Marton':    [-40.0667, 175.3833],
  'Dannevirke':  [-40.2000, 176.1000],      'Foxton':    [-40.4667, 175.2833], 'Pahiatua':  [-40.4500, 175.8333],
  // Wellington
  'Wellington':  [-41.2866, 174.7756], 'Lower Hutt': [-41.2000, 174.9167], 'Upper Hutt': [-41.1333, 175.0500],
  'Porirua':     [-41.1333, 174.8500], 'Masterton':  [-40.9500, 175.6500], 'Kapiti':     [-40.8957, 175.0098],
  'Carterton':   [-41.0333, 175.5333], 'Martinborough': [-41.2167, 175.4500],
  // Tasman / Nelson
  'Nelson':      [-41.2706, 173.2840], 'Richmond': [-41.3333, 173.1833], 'Motueka':    [-41.1167, 173.0000],
  'Takaka':      [-40.8500, 172.8000], 'Murchison':[-41.8000, 172.3333], 'Brightwater':[-41.3667, 173.1333],
  'Stoke':       [-41.3000, 173.2500], 'Wakefield': [-41.4000, 173.0500],
  // Marlborough
  'Blenheim':    [-41.5137, 173.9608], 'Picton':   [-41.2941, 174.0008], 'Renwick':   [-41.5000, 173.8333],
  'Seddon':      [-41.6667, 174.0667], 'Havelock': [-41.2833, 173.7667], 'Ward':      [-41.8333, 174.1000],
  // West Coast
  'Greymouth':   [-42.4502, 171.2107], 'Westport': [-41.7500, 171.6000], 'Hokitika':  [-42.7167, 170.9667],
  'Reefton':     [-42.1167, 171.8667], 'Karamea':  [-41.2500, 172.1000], 'Ross':      [-42.9000, 170.8167],
  // Canterbury
  'Christchurch':[-43.5321, 172.6362], 'Rangiora': [-43.3000, 172.5833], 'Rolleston': [-43.5897, 172.3776],
  'Ashburton':   [-43.9000, 171.7333], 'Timaru':   [-44.3939, 171.2556], 'Kaikoura':  [-42.4000, 173.6833],
  'Darfield':    [-43.4833, 172.1167], 'Oxford':   [-43.3000, 172.1833], 'Methven':   [-43.6333, 171.6500],
  'Geraldine':   [-44.1000, 171.2333],
  // Otago
  'Dunedin':     [-45.8788, 170.5028], 'Queenstown': [-45.0302, 168.6615], 'Alexandra': [-45.2500, 169.3833],
  'Cromwell':    [-45.0500, 169.2000], 'Wanaka':     [-44.7000, 169.1333], 'Oamaru':    [-45.0989, 170.9714],
  'Balclutha':   [-46.2333, 169.7500], 'Milton':     [-46.1167, 169.9667], 'Mosgiel':   [-45.8833, 170.3500],
  'Clyde':       [-45.2000, 169.3167],
  // Southland
  'Invercargill':[-46.4132, 168.3538], 'Gore':    [-46.1000, 168.9333], 'Winton':    [-46.1500, 168.3333],
  'Riverton':    [-46.3500, 168.0167], 'Lumsden': [-45.7333, 168.4500], 'Te Anau':   [-45.4167, 167.7167],
  'Bluff':       [-46.6000, 168.3333], 'Otautau': [-46.1500, 167.9167],
};

const DEFAULT: [number, number] = [-36.8485, 174.7633]; // Auckland

export function getCityCoords(city: string): [number, number] {
  return CITY_COORDS[city] ?? DEFAULT;
}

export function wmoDescription(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code <= 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code <= 48) return 'Foggy';
  if (code <= 55) return 'Drizzle';
  if (code <= 65) return 'Rain';
  if (code <= 75) return 'Snow';
  if (code <= 82) return 'Showers';
  if (code <= 99) return 'Thunderstorm';
  return 'Cloudy';
}

const WEATHER_CACHE_KEY = (lat: number, lon: number) => `fern_cache_weather_${lat}_${lon}`;

function readWeatherCache(lat: number, lon: number): WeatherData | null {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY(lat, lon));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WeatherData;
    // Invalidate cache entries that pre-date the pastPrecipitation field
    if (!parsed.pastPrecipitation) return null;
    return parsed;
  } catch { return null; }
}

function writeWeatherCache(lat: number, lon: number, data: WeatherData) {
  try { localStorage.setItem(WEATHER_CACHE_KEY(lat, lon), JSON.stringify(data)); } catch {}
}

export function useWeather(lat: number, lon: number) {
  const [data, setData] = useState<WeatherData | null>(() => readWeatherCache(lat, lon));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);

    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,apparent_temperature,weathercode,windspeed_10m,relative_humidity_2m` +
      `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum` +
      `&timezone=Pacific%2FAuckland&forecast_days=4&past_days=10`;

    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        const c = json.current;
        const times = json.daily.time as string[];
        const todayStr = new Date().toISOString().split('T')[0];
        const todayIdx = times.findIndex((d: string) => d === todayStr);
        const base = todayIdx >= 0 ? todayIdx : 0;

        const fresh: WeatherData = {
          current: {
            temp:        Math.round(c.temperature_2m),
            feelsLike:   Math.round(c.apparent_temperature),
            weatherCode: c.weathercode,
            windSpeed:   Math.round(c.windspeed_10m),
            humidity:    c.relative_humidity_2m,
            description: wmoDescription(c.weathercode),
          },
          forecast: times.slice(base, base + 4).map((date, i) => ({
            date,
            weatherCode:   json.daily.weathercode[base + i],
            maxTemp:       Math.round(json.daily.temperature_2m_max[base + i]),
            minTemp:       Math.round(json.daily.temperature_2m_min[base + i]),
            precipitation: +(json.daily.precipitation_sum[base + i] ?? 0).toFixed(1),
            description:   wmoDescription(json.daily.weathercode[base + i]),
          })),
          pastPrecipitation: times.slice(0, base).map((date, i) => ({
            date,
            precipitation: +(json.daily.precipitation_sum[i] ?? 0).toFixed(1),
          })),
        };
        writeWeatherCache(lat, lon, fresh);
        setData(fresh);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [lat, lon]);

  return { data, loading, error };
}

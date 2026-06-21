import { useState, useRef, useEffect } from 'react';
import { MapPin, Navigation, Clock, Search } from 'lucide-react';

interface Suggestion {
  address: string;
  sublabel: string;
  lat: number;
  lng: number;
  recent?: boolean;
}

interface LocationInputProps {
  type: 'pickup' | 'destination';
  value: string;
  onChange: (value: string) => void;
  onSelect: (location: { lat: number; lng: number; address: string }) => void;
  autoFocus?: boolean;
  placeholder?: string;
}

const ALL_SUGGESTIONS: Suggestion[] = [
  { address: 'San Francisco International Airport', sublabel: 'SFO — South San Francisco', lat: 37.6213, lng: -122.3790 },
  { address: 'Union Square', sublabel: 'Powell St, San Francisco', lat: 37.7879, lng: -122.4074 },
  { address: 'Golden Gate Bridge', sublabel: 'Golden Gate Bridge, SF', lat: 37.8199, lng: -122.4783 },
  { address: "Fisherman's Wharf", sublabel: 'Jefferson St, San Francisco', lat: 37.8080, lng: -122.4177 },
  { address: 'Lombard Street', sublabel: 'Russian Hill, San Francisco', lat: 37.8021, lng: -122.4187 },
  { address: 'Salesforce Tower', sublabel: '415 Mission St, San Francisco', lat: 37.7897, lng: -122.3972 },
  { address: 'Oracle Park', sublabel: '24 Willie Mays Plaza, San Francisco', lat: 37.7786, lng: -122.3893 },
  { address: 'Coit Tower', sublabel: 'Telegraph Hill, San Francisco', lat: 37.8024, lng: -122.4058 },
];

const RECENT: Suggestion[] = [
  { address: 'Home', sublabel: '2847 Fillmore St, San Francisco', lat: 37.7935, lng: -122.4330, recent: true },
  { address: 'Work', sublabel: '1 Market St, San Francisco', lat: 37.7942, lng: -122.3950, recent: true },
];

export function LocationInput({
  type,
  value,
  onChange,
  onSelect,
  autoFocus,
  placeholder,
}: LocationInputProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const filtered =
    value.length > 0
      ? ALL_SUGGESTIONS.filter((s) =>
          s.address.toLowerCase().includes(value.toLowerCase()) ||
          s.sublabel.toLowerCase().includes(value.toLowerCase())
        )
      : RECENT;

  const showDropdown = focused && (value.length > 0 || RECENT.length > 0);

  const defaultPlaceholder =
    placeholder ?? (type === 'pickup' ? 'Enter pickup location' : 'Where to?');

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-3 px-4 py-3.5 bg-gray-100 rounded-xl transition-all duration-150 ${
          focused ? 'bg-white ring-2 ring-black/10 shadow-sm' : ''
        }`}
      >
        {/* Icon */}
        <div className="flex-shrink-0 w-5 flex items-center justify-center">
          {type === 'pickup' ? (
            <div className="w-3 h-3 rounded-full bg-black" />
          ) : (
            <div className="w-3 h-3 bg-black rounded-sm" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={defaultPlaceholder}
          className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-400 min-w-0"
        />

        {value.length > 0 && (
          <button
            onClick={() => onChange('')}
            className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center hover:bg-gray-400 transition-colors"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1 1L7 7M7 1L1 7" stroke="#555" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {value.length === 0 && (
            <div className="px-4 pt-3 pb-1">
              <span className="text-xs text-gray-400 uppercase tracking-wide">Recent</span>
            </div>
          )}
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-gray-400 text-sm">No results found</div>
          ) : (
            filtered.slice(0, 5).map((s, i) => (
              <button
                key={i}
                onMouseDown={() => {
                  onChange(s.address);
                  onSelect({ lat: s.lat, lng: s.lng, address: s.address });
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  {s.recent ? (
                    <Clock className="w-4 h-4 text-gray-500" />
                  ) : (
                    <MapPin className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-gray-900 truncate" style={{ fontSize: '14px' }}>{s.address}</div>
                  <div className="text-gray-400 truncate" style={{ fontSize: '12px' }}>{s.sublabel}</div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface MapViewProps {
  pickup?: Location;
  destination?: Location;
  driverLocation?: Location;
  showUserDot?: boolean;
}

// SF bounds
const LAT_MAX = 37.84;
const LAT_MIN = 37.60;
const LNG_MIN = -122.52;
const LNG_MAX = -122.36;
const W = 800;
const H = 600;

function lngToX(lng: number) {
  return ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * W;
}
function latToY(lat: number) {
  return ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * H;
}

export function MapView({ pickup, destination, driverLocation, showUserDot }: MapViewProps) {
  const userLat = 37.7749;
  const userLng = -122.4194;

  const pickupX = pickup ? lngToX(pickup.lng) : null;
  const pickupY = pickup ? latToY(pickup.lat) : null;
  const destX = destination ? lngToX(destination.lng) : null;
  const destY = destination ? latToY(destination.lat) : null;
  const driverX = driverLocation ? lngToX(driverLocation.lng) : null;
  const driverY = driverLocation ? latToY(driverLocation.lat) : null;

  // Midpoint for bezier curve control point
  const cpX = pickupX != null && destX != null ? (pickupX + destX) / 2 + (destY! - pickupY!) * 0.25 : 0;
  const cpY = pickupY != null && destY != null ? (pickupY + destY) / 2 - Math.abs(destX! - pickupX!) * 0.15 : 0;

  return (
    <div className="relative w-full h-full overflow-hidden">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Base background */}
        <rect width={W} height={H} fill="#f0ebe3" />

        {/* Pacific Ocean - left edge */}
        <polygon points="0,0 60,0 40,600 0,600" fill="#aacde8" opacity="0.9" />

        {/* San Francisco Bay - right side */}
        <polygon
          points="760,0 800,0 800,600 710,600 695,480 715,350 695,200 720,80"
          fill="#aacde8"
          opacity="0.9"
        />

        {/* Bay water shading */}
        <polygon
          points="760,0 800,0 800,600 710,600 695,480 715,350 695,200 720,80"
          fill="url(#bayGrad)"
          opacity="0.4"
        />

        {/* Defs */}
        <defs>
          <linearGradient id="bayGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#aacde8" />
          </linearGradient>
          <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1a1a1a" />
            <stop offset="100%" stopColor="#1a1a1a" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.2" />
          </filter>
          <filter id="markerShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Presidio (NW park) */}
        <polygon points="40,0 200,0 235,75 175,145 55,125 40,75" fill="#c8ddb5" />
        <polygon points="40,0 200,0 235,75 175,145 55,125 40,75" fill="#b8d0a0" opacity="0.3" />

        {/* Golden Gate Park */}
        <rect x="38" y="218" width="308" height="52" rx="6" fill="#c8ddb5" />
        <rect x="38" y="218" width="308" height="52" rx="6" fill="#b8d0a0" opacity="0.25" />
        {/* Panhandle */}
        <rect x="346" y="228" width="118" height="22" rx="4" fill="#c8ddb5" />

        {/* Dolores Park */}
        <rect x="438" y="302" width="48" height="58" rx="5" fill="#c8ddb5" />

        {/* McLaren Park */}
        <rect x="348" y="490" width="85" height="72" rx="6" fill="#c8ddb5" />

        {/* Subtlue building blocks grid */}
        {Array.from({ length: 18 }, (_, row) =>
          Array.from({ length: 22 }, (_, col) => (
            <rect
              key={`b-${row}-${col}`}
              x={col * 34 + 62 + (row % 2) * 2}
              y={row * 32 + 2}
              width={30}
              height={28}
              rx={1}
              fill="rgba(160,148,132,0.10)"
            />
          ))
        )}

        {/* === STREETS === */}
        {/* Minor street grid - horizontal */}
        {Array.from({ length: 20 }, (_, i) => (
          <line
            key={`h${i}`}
            x1={60}
            y1={i * 30 + 15}
            x2={755}
            y2={i * 30 + 15}
            stroke="#ffffff"
            strokeWidth="1.2"
            opacity="0.85"
          />
        ))}
        {/* Minor street grid - vertical */}
        {Array.from({ length: 22 }, (_, i) => (
          <line
            key={`v${i}`}
            x1={i * 32 + 64}
            y1={0}
            x2={i * 32 + 64}
            y2={600}
            stroke="#ffffff"
            strokeWidth="1.2"
            opacity="0.85"
          />
        ))}

        {/* Major roads */}
        {/* Market Street (diagonal NE-SW) */}
        <line x1="260" y1="96" x2="638" y2="595" stroke="#ffffff" strokeWidth="5.5" />
        {/* Van Ness Ave */}
        <line x1="330" y1="0" x2="330" y2="420" stroke="#ffffff" strokeWidth="4.5" />
        {/* 19th Ave / Park Presidio */}
        <line x1="162" y1="0" x2="162" y2="600" stroke="#ffffff" strokeWidth="4" />
        {/* Geary Blvd */}
        <line x1="60" y1="195" x2="755" y2="195" stroke="#ffffff" strokeWidth="4" />
        {/* Mission St (parallel to market, offset) */}
        <line x1="285" y1="96" x2="665" y2="595" stroke="#ffffff" strokeWidth="3" opacity="0.7" />
        {/* Embarcadero (curved along bay) */}
        <path
          d="M 718,82 C 705,160 692,280 688,420 C 686,490 692,540 700,590"
          stroke="#ffffff"
          strokeWidth="5"
          fill="none"
          opacity="0.9"
        />
        {/* Bay Bridge approach */}
        <path d="M 718,300 C 740,295 770,295 800,292" stroke="#ffffff" strokeWidth="6" fill="none" />
        {/* US-101 (south, thick freeway) */}
        <line x1="420" y1="595" x2="620" y2="595" stroke="#e8e0d0" strokeWidth="8" />
        <line x1="420" y1="595" x2="620" y2="595" stroke="#ffffff" strokeWidth="5" />
        {/* Cesar Chavez */}
        <line x1="60" y1="380" x2="688" y2="380" stroke="#ffffff" strokeWidth="3.5" />
        {/* Haight St */}
        <line x1="350" y1="248" x2="755" y2="248" stroke="#ffffff" strokeWidth="3" opacity="0.75" />

        {/* Road labels (tiny text) */}
        <text x="160" y="195" fill="#9a9080" fontSize="9" fontFamily="sans-serif" textAnchor="middle" dy="-3">Geary Blvd</text>
        <text x="310" y="290" fill="#9a9080" fontSize="8" fontFamily="sans-serif" textAnchor="middle" transform="rotate(-53,310,290)">Market St</text>
        <text x="333" y="200" fill="#9a9080" fontSize="8" fontFamily="sans-serif" textAnchor="start" dx="2">Van Ness</text>
        <text x="704" y="310" fill="#9a9080" fontSize="8" fontFamily="sans-serif">Emb.</text>
        <text x="90" y="247" fill="#8a9870" fontSize="8" fontFamily="sans-serif">GG Park</text>

        {/* Water labels */}
        <text x="780" y="320" fill="#6a9cb8" fontSize="9" fontFamily="sans-serif" textAnchor="middle" transform="rotate(-90,780,320)" opacity="0.8">San Francisco Bay</text>
        <text x="22" y="320" fill="#6a9cb8" fontSize="8" fontFamily="sans-serif" textAnchor="middle" transform="rotate(-90,22,320)" opacity="0.8">Pacific</text>

        {/* Route line */}
        {pickup && destination && pickupX != null && pickupY != null && destX != null && destY != null && (
          <>
            {/* Route shadow */}
            <path
              d={`M ${pickupX} ${pickupY} Q ${cpX} ${cpY} ${destX} ${destY}`}
              stroke="rgba(0,0,0,0.15)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
            />
            {/* Route line */}
            <path
              d={`M ${pickupX} ${pickupY} Q ${cpX} ${cpY} ${destX} ${destY}`}
              stroke="#1a1a1a"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="none"
            />
          </>
        )}

        {/* User location dot (home screen) */}
        {showUserDot && !pickup && (
          <g transform={`translate(${lngToX(userLng)}, ${latToY(userLat)})`}>
            <circle r="18" fill="rgba(66,133,244,0.15)" />
            <circle r="10" fill="rgba(66,133,244,0.25)" />
            <circle r="6" fill="#4285f4" />
            <circle r="6" fill="#4285f4" opacity="0.6">
              <animate attributeName="r" values="6;14;6" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0;0.6" dur="2.5s" repeatCount="indefinite" />
            </circle>
          </g>
        )}

        {/* Driver dot */}
        {driverX != null && driverY != null && (
          <g transform={`translate(${driverX}, ${driverY})`} filter="url(#markerShadow)">
            <circle r="16" fill="#1a1a1a" />
            {/* Car icon simplified */}
            <g fill="white" transform="translate(-6,-5)">
              <rect x="1" y="4" width="10" height="6" rx="1.5" fill="white" />
              <rect x="2" y="2" width="8" height="4" rx="1" fill="white" />
              <circle cx="3" cy="10" r="1.5" fill="#1a1a1a" />
              <circle cx="9" cy="10" r="1.5" fill="#1a1a1a" />
            </g>
          </g>
        )}

        {/* Pickup marker */}
        {pickupX != null && pickupY != null && (
          <g transform={`translate(${pickupX}, ${pickupY})`} filter="url(#markerShadow)">
            <circle r="14" fill="white" />
            <circle r="8" fill="#1a1a1a" />
          </g>
        )}

        {/* Destination marker - teardrop pin */}
        {destX != null && destY != null && (
          <g transform={`translate(${destX}, ${destY})`} filter="url(#markerShadow)">
            <path
              d="M 0,-18 C -8,-18 -14,-12 -14,-5 C -14,4 0,18 0,18 C 0,18 14,4 14,-5 C 14,-12 8,-18 0,-18 Z"
              fill="#1a1a1a"
            />
            <circle r="5" cy="-5" fill="white" />
          </g>
        )}
      </svg>

      {/* Scale indicator */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-2.5 py-1.5 rounded-lg shadow-sm">
        <div className="w-8 h-px bg-gray-500" />
        <span style={{ fontSize: '10px' }} className="text-gray-500 font-medium">0.5 mi</span>
      </div>

      {/* Map type badge */}
      <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm px-2.5 py-1.5 rounded-lg shadow-sm">
        <span style={{ fontSize: '10px' }} className="text-gray-500 font-medium">San Francisco, CA</span>
      </div>
    </div>
  );
}

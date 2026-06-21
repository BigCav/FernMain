import { useState, useEffect, useRef } from 'react';
import { Star, Phone, MessageSquare, X } from 'lucide-react';

interface DriverCardProps {
  rideType: string;
  onCancel: () => void;
}

const DRIVERS = [
  { name: 'Marcus T.', rating: 4.92, trips: 1840, plate: '7HXB 214', initials: 'MT', color: '#2d6a4f' },
  { name: 'Sarah K.', rating: 4.88, trips: 2310, plate: '3YRP 891', initials: 'SK', color: '#6b4226' },
  { name: 'David L.', rating: 4.95, trips: 3120, plate: '5NQW 447', initials: 'DL', color: '#1a3a5c' },
];

const CARS: Record<string, { make: string; model: string; color: string }> = {
  uberx: { make: 'Toyota', model: 'Camry', color: 'Silver' },
  comfort: { make: 'Honda', model: 'Accord', color: 'Black' },
  uberxl: { make: 'Chevrolet', model: 'Suburban', color: 'White' },
};

export function DriverCard({ rideType, onCancel }: DriverCardProps) {
  const [eta, setEta] = useState(4);
  const [progress, setProgress] = useState(0);
  const driverRef = useRef(DRIVERS[Math.floor(Math.random() * DRIVERS.length)]);
  const driver = driverRef.current;
  const car = CARS[rideType] ?? CARS['uberx'];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = p + 2;
        if (next >= 100) {
          clearInterval(interval);
          return 100;
        }
        return next;
      });
      setEta((e) => (e > 0 ? e - 0.08 : 0));
    }, 240);
    return () => clearInterval(interval);
  }, []);

  const etaLabel = eta <= 0 ? 'Arriving now' : `${Math.ceil(eta)} min away`;

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900" style={{ fontSize: '18px', fontWeight: 600 }}>
            Driver on the way
          </h2>
          <p className="text-gray-500 mt-0.5" style={{ fontSize: '14px' }}>
            {etaLabel}
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-gray-900" style={{ fontSize: '28px', fontWeight: 700, lineHeight: 1 }}>
            {Math.ceil(Math.max(eta, 0))}
          </span>
          <span className="text-gray-400" style={{ fontSize: '11px' }}>min</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-black rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Driver info */}
      <div className="flex items-center gap-4 py-1">
        {/* Avatar */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-white"
          style={{ backgroundColor: driver.color, fontSize: '16px', fontWeight: 600 }}
        >
          {driver.initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-gray-900" style={{ fontSize: '16px', fontWeight: 600 }}>
              {driver.name}
            </span>
            <div className="flex items-center gap-0.5">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <span className="text-gray-600" style={{ fontSize: '13px' }}>
                {driver.rating}
              </span>
            </div>
          </div>
          <div className="text-gray-500 mt-0.5" style={{ fontSize: '13px' }}>
            {car.color} {car.make} {car.model}
          </div>
          <div className="mt-1">
            <span
              className="inline-block bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-md"
              style={{ fontSize: '13px', fontWeight: 500, letterSpacing: '0.06em' }}
            >
              {driver.plate}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button className="flex items-center justify-center gap-2 py-3 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors">
          <Phone className="w-4 h-4 text-gray-700" />
          <span className="text-gray-700" style={{ fontSize: '14px', fontWeight: 500 }}>
            Call
          </span>
        </button>
        <button className="flex items-center justify-center gap-2 py-3 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors">
          <MessageSquare className="w-4 h-4 text-gray-700" />
          <span className="text-gray-700" style={{ fontSize: '14px', fontWeight: 500 }}>
            Message
          </span>
        </button>
      </div>

      {/* Cancel */}
      <button
        onClick={onCancel}
        className="w-full flex items-center justify-center gap-2 py-3.5 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors"
      >
        <X className="w-4 h-4 text-gray-600" />
        <span className="text-gray-600" style={{ fontSize: '14px', fontWeight: 500 }}>
          Cancel ride
        </span>
      </button>
    </div>
  );
}
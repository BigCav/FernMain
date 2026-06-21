interface RideOption {
  id: string;
  name: string;
  tagline: string;
  capacity: number;
  eta: string;
  price: number;
  priceNote?: string;
}

interface RideOptionsProps {
  distance: number;
  selectedOption: string;
  onSelectOption: (id: string) => void;
}

function CarIconX() {
  return (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="12" width="40" height="11" rx="3" fill="currentColor" />
      <rect x="9" y="5" width="26" height="10" rx="2.5" fill="currentColor" />
      <circle cx="12" cy="24" r="4" fill="currentColor" />
      <circle cx="36" cy="24" r="4" fill="currentColor" />
      <rect x="9" y="6" width="12" height="7" rx="1.5" fill="white" opacity="0.3" />
      <rect x="23" y="6" width="11" height="7" rx="1.5" fill="white" opacity="0.3" />
      <circle cx="12" cy="24" r="2" fill="white" opacity="0.4" />
      <circle cx="36" cy="24" r="2" fill="white" opacity="0.4" />
    </svg>
  );
}

function CarIconComfort() {
  return (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="12" width="44" height="11" rx="3.5" fill="currentColor" />
      <rect x="7" y="4" width="30" height="11" rx="3" fill="currentColor" />
      <circle cx="12" cy="24" r="4" fill="currentColor" />
      <circle cx="36" cy="24" r="4" fill="currentColor" />
      <rect x="8" y="5" width="13" height="8" rx="2" fill="white" opacity="0.3" />
      <rect x="23" y="5" width="12" height="8" rx="2" fill="white" opacity="0.3" />
      <circle cx="12" cy="24" r="2" fill="white" opacity="0.4" />
      <circle cx="36" cy="24" r="2" fill="white" opacity="0.4" />
      {/* Comfort indicator - rear spoiler hint */}
      <rect x="42" y="11" width="4" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

function CarIconXL() {
  return (
    <svg width="56" height="28" viewBox="0 0 56 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="12" width="52" height="11" rx="3" fill="currentColor" />
      <rect x="8" y="5" width="36" height="10" rx="2.5" fill="currentColor" />
      <circle cx="13" cy="24" r="4" fill="currentColor" />
      <circle cx="43" cy="24" r="4" fill="currentColor" />
      <rect x="9" y="6" width="10" height="7" rx="1.5" fill="white" opacity="0.3" />
      <rect x="21" y="6" width="10" height="7" rx="1.5" fill="white" opacity="0.3" />
      <rect x="33" y="6" width="10" height="7" rx="1.5" fill="white" opacity="0.3" />
      <circle cx="13" cy="24" r="2" fill="white" opacity="0.4" />
      <circle cx="43" cy="24" r="2" fill="white" opacity="0.4" />
    </svg>
  );
}

export function RideOptions({ distance, selectedOption, onSelectOption }: RideOptionsProps) {
  const rideOptions: RideOption[] = [
    {
      id: 'uberx',
      name: 'UberX',
      tagline: 'Affordable everyday rides',
      capacity: 4,
      eta: '2 min',
      price: parseFloat((8 + distance * 1.5).toFixed(2)),
    },
    {
      id: 'comfort',
      name: 'Comfort',
      tagline: 'Newer cars, extra legroom',
      capacity: 4,
      eta: '4 min',
      price: parseFloat((12 + distance * 2.1).toFixed(2)),
      priceNote: 'Extra comfort',
    },
    {
      id: 'uberxl',
      name: 'UberXL',
      tagline: 'Group rides, up to 6 seats',
      capacity: 6,
      eta: '6 min',
      price: parseFloat((15 + distance * 2.6).toFixed(2)),
    },
  ];

  const getCarIcon = (id: string) => {
    if (id === 'uberx') return <CarIconX />;
    if (id === 'comfort') return <CarIconComfort />;
    return <CarIconXL />;
  };

  const getPeopleIcon = (count: number) => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: count > 4 ? 2 : 1 }, (_, i) => (
        <svg key={i} width="11" height="11" viewBox="0 0 11 11" fill="none">
          <circle cx="5.5" cy="3" r="2.2" fill="currentColor" />
          <path d="M1 10c0-2.5 2-4.5 4.5-4.5S10 7.5 10 10" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        </svg>
      ))}
      <span style={{ fontSize: '11px' }} className="text-current">{count}</span>
    </div>
  );

  return (
    <div className="space-y-2.5">
      {rideOptions.map((option) => {
        const isSelected = selectedOption === option.id;
        return (
          <button
            key={option.id}
            onClick={() => onSelectOption(option.id)}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-150 border ${
              isSelected
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-900 border-gray-100 hover:border-gray-200 hover:bg-gray-50'
            }`}
          >
            {/* Car illustration */}
            <div className={`flex-shrink-0 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
              {getCarIcon(option.id)}
            </div>

            {/* Info */}
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                  {option.name}
                </span>
                <span
                  className={`${isSelected ? 'text-gray-300' : 'text-gray-400'}`}
                  style={{ fontSize: '12px' }}
                >
                  {option.eta}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`${isSelected ? 'text-gray-300' : 'text-gray-500'}`}
                  style={{ fontSize: '12px' }}
                >
                  {option.tagline}
                </span>
                <span className={`${isSelected ? 'text-gray-400' : 'text-gray-300'}`}>·</span>
                <span
                  className={`flex items-center gap-0.5 ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}
                >
                  {getPeopleIcon(option.capacity)}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex-shrink-0 text-right">
              <div className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                ${option.price.toFixed(2)}
              </div>
              {option.priceNote && (
                <div
                  className={`${isSelected ? 'text-gray-300' : 'text-gray-400'}`}
                  style={{ fontSize: '11px' }}
                >
                  {option.priceNote}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

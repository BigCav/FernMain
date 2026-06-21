import { useState } from 'react';
import { MapView } from './components/MapView';
import { LocationInput } from './components/LocationInput';
import { RideOptions } from './components/RideOptions';
import { ArrowLeft, Menu, User } from 'lucide-react';
import '../styles/index.css';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

type Screen = 'main' | 'selecting-ride';

export default function App() {
  const [screen, setScreen] = useState<Screen>('main');
  const [pickupInput, setPickupInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [pickup, setPickup] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [selectedRide, setSelectedRide] = useState('uberx');

  const handlePickupSelect = (location: Location) => {
    setPickup(location);
    setPickupInput(location.address);
  };

  const handleDestinationSelect = (location: Location) => {
    setDestination(location);
    setDestinationInput(location.address);
    if (pickup) {
      setScreen('selecting-ride');
    }
  };

  const calculateDistance = () => {
    if (!pickup || !destination) return 0;
    const R = 3959; // Earth's radius in miles
    const dLat = ((destination.lat - pickup.lat) * Math.PI) / 180;
    const dLng = ((destination.lng - pickup.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((pickup.lat * Math.PI) / 180) *
        Math.cos((destination.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleBookRide = () => {
    alert('Ride booked! A driver will be with you shortly.');
  };

  const handleBack = () => {
    setScreen('main');
    setDestination(null);
    setDestinationInput('');
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-white overflow-hidden">
      {/* Map Section */}
      <div className="relative h-[50vh] bg-gray-100">
        <MapView pickup={pickup || undefined} destination={destination || undefined} />

        {/* Header Buttons */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          {screen === 'selecting-ride' ? (
            <button
              onClick={handleBack}
              className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <button className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50">
              <Menu className="w-5 h-5" />
            </button>
          )}
          <button className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50">
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Sheet */}
      <div className="flex-1 bg-white rounded-t-3xl shadow-2xl p-6 overflow-auto -mt-6 z-20">
        {screen === 'main' ? (
          <div className="space-y-4">
            <h1 className="text-2xl mb-6">Where to?</h1>
            <LocationInput
              type="pickup"
              value={pickupInput}
              onChange={setPickupInput}
              onSelect={handlePickupSelect}
            />
            {pickup && (
              <LocationInput
                type="destination"
                value={destinationInput}
                onChange={setDestinationInput}
                onSelect={handleDestinationSelect}
              />
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl mb-2">Choose a ride</h2>
              <p className="text-sm text-gray-600">
                {calculateDistance().toFixed(1)} miles • {Math.ceil(calculateDistance() * 2)} min
              </p>
            </div>
            <RideOptions
              distance={calculateDistance()}
              selectedOption={selectedRide}
              onSelectOption={setSelectedRide}
            />
            <button
              onClick={handleBookRide}
              className="w-full bg-black text-white py-4 rounded-lg hover:bg-gray-900 transition-colors"
            >
              Confirm {selectedRide === 'uberx' ? 'UberX' : selectedRide === 'comfort' ? 'Comfort' : 'UberXL'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

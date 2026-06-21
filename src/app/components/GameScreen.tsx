import { useGame } from '../context/GameContext';
import { TopBar }          from './TopBar';
import { EventBanner }     from './EventBanner';
import { HexMap }          from './HexMap';
import { HexPanel }        from './HexPanel';
import { BottomNav }       from './BottomNav';
import { LordScreen }      from './LordScreen';
import { ResearchScreen }  from './ResearchScreen';
import { CityScreen }      from './CityScreen';
import { AllianceScreen }  from './AllianceScreen';

export function GameScreen() {
  const { activeScreen, selectedHexId } = useGame();
  const showHexPanel = !!selectedHexId;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative"
      style={{ fontFamily: "'Rajdhani', sans-serif" }}>

      {/* ── Always-on game layer ── */}
      <TopBar />
      <EventBanner />

      {/* Map + hex panel stack */}
      <div className="flex-1 flex flex-col min-h-0">
        <HexMap />
        {showHexPanel && <HexPanel />}
      </div>

      <BottomNav />

      {/* ── Overlay screens ── */}
      {activeScreen === 'lord'     && <LordScreen     />}
      {activeScreen === 'research' && <ResearchScreen />}
      {activeScreen === 'city'     && <CityScreen     />}
      {activeScreen === 'alliance' && <AllianceScreen />}
    </div>
  );
}

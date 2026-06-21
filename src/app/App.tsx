import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './context/AuthContext';
import { AnimalsProvider } from './context/AnimalsContext';
import { FeedProvider } from './context/FeedContext';
import { TasksProvider } from './context/TasksContext';
import { ProfileProvider } from './context/ProfileContext';
import { SpeciesProvider } from './context/SpeciesContext';
import { FinanceProvider } from './context/FinanceContext';
import { SuppliersProvider } from './context/SuppliersContext';
import { WaterLogProvider } from './context/WaterLogContext';
import { PaddocksProvider } from './context/PaddocksContext';
import { JournalProvider } from './context/JournalContext';
import { WeightProvider } from './context/WeightContext';
import { BreedingProvider } from './context/BreedingContext';
import { WithholdingProvider } from './context/WithholdingContext';
import { MobProvider } from './context/MobContext';
import { PhotoProvider } from './context/PhotoContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { InventoryProvider } from './context/InventoryContext';
import { PWAInstallBanner } from './components/PWAInstallBanner';

export default function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <SpeciesProvider>
          <SuppliersProvider>
            <AnimalsProvider>
              <FeedProvider>
                <TasksProvider>
                  <FinanceProvider>
                    <WaterLogProvider>
                      <PaddocksProvider>
                      <JournalProvider>
                        <WeightProvider>
                          <BreedingProvider>
                            <WithholdingProvider>
                              <MobProvider>
                                <PhotoProvider>
                                  <NotificationsProvider>
                                    <InventoryProvider>
                                      <RouterProvider router={router} />
                                      <PWAInstallBanner />
                                    </InventoryProvider>
                                  </NotificationsProvider>
                                </PhotoProvider>
                              </MobProvider>
                            </WithholdingProvider>
                          </BreedingProvider>
                        </WeightProvider>
                      </JournalProvider>
                      </PaddocksProvider>
                    </WaterLogProvider>
                  </FinanceProvider>
                </TasksProvider>
              </FeedProvider>
            </AnimalsProvider>
          </SuppliersProvider>
        </SpeciesProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}

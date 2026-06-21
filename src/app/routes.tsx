import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { AuthGuard } from './components/AuthGuard';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { Animals } from './pages/Animals';
import { AnimalDetail } from './pages/AnimalDetail';
import { Feed } from './pages/Feed';
import { Tasks } from './pages/Tasks';
import { PaddockMap } from './pages/PaddockMap';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { Finance } from './pages/Finance';
import { Rainfall } from './pages/Rainfall';
import { Journal } from './pages/Journal';
import { Support } from './pages/Support';
import { FAQ } from './pages/FAQ';
import { Onboarding } from './pages/Onboarding';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { Referral } from './pages/Referral';
import { FernPlus } from './pages/FernPlus';
import { FernPlusSuccess } from './pages/FernPlusSuccess';
import { SeasonPlanner } from './pages/SeasonPlanner';
import { PastureAndSoil } from './pages/PastureAndSoil';
import { Register } from './pages/Register';
import { Login } from './pages/Login';
import { Changelog } from './pages/Changelog';
import { FarmCalendar } from './pages/FarmCalendar';
import { Inventory } from './pages/Inventory';
import { Admin } from './pages/Admin';

function Guarded({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}

export const router = createBrowserRouter([
  { path: '/home',       Component: LandingPage    },
  { path: '/register',   Component: Register       },
  { path: '/login',      Component: Login          },
  { path: '/onboarding', element: <Guarded><Onboarding /></Guarded> },
  {
    path: '/',
    element: <Guarded><Layout /></Guarded>,
    children: [
      { index: true,         Component: Dashboard    },
      { path: 'animals',     Component: Animals      },
      { path: 'animals/:id', Component: AnimalDetail },
      { path: 'feed',        Component: Feed         },
      { path: 'tasks',       Component: Tasks        },
      { path: 'paddocks',    Component: PaddockMap   },
      { path: 'finance',     Component: Finance      },
      { path: 'rainfall',    Component: Rainfall     },
      { path: 'profile',     Component: Profile      },
      { path: 'settings',    Component: Settings     },
      { path: 'journal',     Component: Journal      },
      { path: 'faq',         Component: FAQ          },
      { path: 'support',     Component: Support      },
      { path: 'referral',    Component: Referral     },
      { path: 'fern-plus',         Component: FernPlus        },
      { path: 'fern-plus/success', Component: FernPlusSuccess },
      { path: 'seasons',     Component: SeasonPlanner  },
      { path: 'pasture',     Component: PastureAndSoil },
      { path: 'changelog',   Component: Changelog    },
      { path: 'calendar',   Component: FarmCalendar },
      { path: 'inventory',  Component: Inventory    },
      { path: 'privacy',     Component: PrivacyPolicy  },
      { path: 'terms',       Component: TermsOfService },
      { path: 'admin',       Component: Admin          },
    ],
  },
]);

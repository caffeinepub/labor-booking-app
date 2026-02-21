import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { Toaster } from './components/ui/sonner';
import Layout from './components/Layout';
import ProfileSetupModal from './components/ProfileSetupModal';
import ProfilePage from './pages/ProfilePage';
import DiscoveryPage from './pages/DiscoveryPage';
import CreateBookingPage from './pages/CreateBookingPage';
import BookingSuccessPage from './pages/BookingSuccessPage';
import BookingsDashboard from './pages/BookingsDashboard';
import BookingDetailPage from './pages/BookingDetailPage';
import LandingPage from './pages/LandingPage';

function LayoutWrapper() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const isAuthenticated = !!identity;

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  return (
    <>
      <Layout>
        <Outlet />
      </Layout>
      {showProfileSetup && <ProfileSetupModal />}
      <Toaster />
    </>
  );
}

const rootRoute = createRootRoute({
  component: LayoutWrapper,
});

const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: ProfilePage,
});

const discoveryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/discover',
  component: DiscoveryPage,
});

const createBookingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/book/$laborerId',
  component: CreateBookingPage,
});

const bookingSuccessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/booking-success',
  component: BookingSuccessPage,
});

const bookingsDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bookings',
  component: BookingsDashboard,
});

const bookingDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bookings/$bookingId',
  component: BookingDetailPage,
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  profileRoute,
  discoveryRoute,
  createBookingRoute,
  bookingSuccessRoute,
  bookingsDashboardRoute,
  bookingDetailRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}

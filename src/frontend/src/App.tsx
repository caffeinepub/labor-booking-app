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
import SystemHealthPage from './pages/SystemHealthPage';
import { useEffect } from 'react';

function LayoutWrapper() {
  const { identity, loginStatus } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const isAuthenticated = !!identity;

  useEffect(() => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('[App/LayoutWrapper] 🔄 Component State Update');
    console.log('[App/LayoutWrapper] Timestamp:', new Date().toISOString());
    console.log('[App/LayoutWrapper] Authentication:', {
      isAuthenticated,
      loginStatus,
      principal: identity?.getPrincipal().toString() || 'N/A',
      isAnonymous: identity?.getPrincipal().isAnonymous() || 'N/A',
    });
    console.log('[App/LayoutWrapper] Profile:', {
      profileLoading,
      isFetched,
      hasProfile: !!userProfile,
      profileName: userProfile?.name || 'N/A',
    });
    console.log('[App/LayoutWrapper] Show Profile Setup:', isAuthenticated && !profileLoading && isFetched && userProfile === null);
    console.log('═══════════════════════════════════════════════════════════');
  }, [identity, loginStatus, isAuthenticated, userProfile, profileLoading, isFetched]);

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

const systemHealthRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/system-health',
  component: SystemHealthPage,
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  profileRoute,
  discoveryRoute,
  createBookingRoute,
  bookingSuccessRoute,
  bookingsDashboardRoute,
  bookingDetailRoute,
  systemHealthRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  useEffect(() => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('[App] 🚀 APPLICATION INITIALIZED');
    console.log('[App] Timestamp:', new Date().toISOString());
    console.log('[App] Router created with routes:', [
      '/',
      '/profile',
      '/discover',
      '/book/:laborerId',
      '/booking-success',
      '/bookings',
      '/bookings/:bookingId',
      '/system-health',
    ]);
    console.log('═══════════════════════════════════════════════════════════');
  }, []);

  return <RouterProvider router={router} />;
}

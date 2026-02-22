import { useEffect, useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useActor } from '../hooks/useActor';
import { useGetCallerUserProfile, useGetCallerLaborer, useGetBookings } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { CheckCircle2, XCircle, Loader2, RefreshCw, AlertCircle } from 'lucide-react';

type HealthStatus = 'healthy' | 'error' | 'loading' | 'untested';

interface ComponentHealth {
  name: string;
  status: HealthStatus;
  message: string;
  details?: string;
}

export default function SystemHealthPage() {
  const { identity, loginStatus } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const { data: userProfile, isLoading: profileLoading, isError: profileError, error: profileErrorDetails } = useGetCallerUserProfile();
  const { data: laborerProfile, isLoading: laborerLoading, isError: laborerError, error: laborerErrorDetails } = useGetCallerLaborer();
  const { data: bookings, isLoading: bookingsLoading, isError: bookingsError, error: bookingsErrorDetails } = useGetBookings();

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('[SystemHealthPage] 🏥 HEALTH CHECK PAGE MOUNTED');
    console.log('[SystemHealthPage] Timestamp:', new Date().toISOString());
    console.log('═══════════════════════════════════════════════════════════');
  }, []);

  useEffect(() => {
    console.log('[SystemHealthPage] 🔄 Component state updated');
    console.log('[SystemHealthPage] Refresh key:', refreshKey);
    console.log('[SystemHealthPage] Authentication:', {
      isAuthenticated: !!identity,
      loginStatus,
      principal: identity?.getPrincipal().toString() || 'N/A',
    });
    console.log('[SystemHealthPage] Actor:', {
      available: !!actor,
      fetching: actorFetching,
    });
    console.log('[SystemHealthPage] User Profile:', {
      loading: profileLoading,
      error: profileError,
      hasProfile: !!userProfile,
    });
    console.log('[SystemHealthPage] Laborer Profile:', {
      loading: laborerLoading,
      error: laborerError,
      hasProfile: !!laborerProfile,
    });
    console.log('[SystemHealthPage] Bookings:', {
      loading: bookingsLoading,
      error: bookingsError,
      hasBookings: !!bookings,
      incoming: bookings?.incoming.length || 0,
      outgoing: bookings?.outgoing.length || 0,
    });
  }, [refreshKey, identity, loginStatus, actor, actorFetching, userProfile, profileLoading, profileError, laborerProfile, laborerLoading, laborerError, bookings, bookingsLoading, bookingsError]);

  const handleRefresh = () => {
    console.log('[SystemHealthPage] 🔄 Manual refresh triggered');
    setRefreshKey((prev) => prev + 1);
  };

  const isAuthenticated = !!identity;

  const components: ComponentHealth[] = [
    {
      name: 'Authentication',
      status: loginStatus === 'initializing' || loginStatus === 'logging-in'
        ? 'loading'
        : isAuthenticated
        ? 'healthy'
        : loginStatus === 'loginError'
        ? 'error'
        : 'untested',
      message: isAuthenticated
        ? `Authenticated as ${identity.getPrincipal().toString().slice(0, 10)}...`
        : loginStatus === 'loginError'
        ? 'Authentication failed'
        : 'Not authenticated',
      details: isAuthenticated ? `Principal: ${identity.getPrincipal().toString()}` : undefined,
    },
    {
      name: 'Backend Actor',
      status: actorFetching
        ? 'loading'
        : actor
        ? 'healthy'
        : 'error',
      message: actor
        ? 'Backend connection established'
        : actorFetching
        ? 'Connecting...'
        : 'Connection failed - actor not available',
      details: actor ? `Actor methods available: ${Object.keys(actor).length}` : undefined,
    },
    {
      name: 'User Profile Query',
      status: !isAuthenticated
        ? 'untested'
        : profileLoading
        ? 'loading'
        : profileError
        ? 'error'
        : 'healthy',
      message: !isAuthenticated
        ? 'Login required'
        : profileLoading
        ? 'Loading profile...'
        : profileError
        ? `Query failed: ${profileErrorDetails instanceof Error ? profileErrorDetails.message : 'Unknown error'}`
        : userProfile
        ? `Profile loaded: ${userProfile.name}`
        : 'No profile found (new user)',
      details: userProfile ? `Name: ${userProfile.name}` : undefined,
    },
    {
      name: 'Laborer Profile Query',
      status: !isAuthenticated
        ? 'untested'
        : laborerLoading
        ? 'loading'
        : laborerError
        ? 'error'
        : 'healthy',
      message: !isAuthenticated
        ? 'Login required'
        : laborerLoading
        ? 'Loading laborer profile...'
        : laborerError
        ? `Query failed: ${laborerErrorDetails instanceof Error ? laborerErrorDetails.message : 'Unknown error'}`
        : laborerProfile
        ? `Laborer profile loaded: ${laborerProfile.name}`
        : 'No laborer profile (not a worker)',
      details: laborerProfile
        ? `Labor ID: ${laborerProfile.laborId}, Location: ${laborerProfile.location}, Bookings: ${laborerProfile.bookings.length}`
        : undefined,
    },
    {
      name: 'Bookings Query',
      status: !isAuthenticated
        ? 'untested'
        : bookingsLoading
        ? 'loading'
        : bookingsError
        ? 'error'
        : 'healthy',
      message: !isAuthenticated
        ? 'Login required'
        : bookingsLoading
        ? 'Loading bookings...'
        : bookingsError
        ? `Query failed: ${bookingsErrorDetails instanceof Error ? bookingsErrorDetails.message : 'Unknown error'}`
        : bookings
        ? `Bookings loaded: ${bookings.incoming.length} incoming, ${bookings.outgoing.length} outgoing`
        : 'No bookings data',
      details: bookings
        ? `Total: ${bookings.incoming.length + bookings.outgoing.length} bookings`
        : undefined,
    },
  ];

  const getStatusIcon = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'loading':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'untested':
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-600">Healthy</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'loading':
        return <Badge variant="secondary">Loading</Badge>;
      case 'untested':
        return <Badge variant="outline">Untested</Badge>;
    }
  };

  const overallStatus: HealthStatus = components.some((c) => c.status === 'error')
    ? 'error'
    : components.some((c) => c.status === 'loading')
    ? 'loading'
    : components.every((c) => c.status === 'healthy' || c.status === 'untested')
    ? 'healthy'
    : 'untested';

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">System Health Check</h1>
            <p className="text-muted-foreground">
              Real-time diagnostic information for all critical components
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Overall Status</CardTitle>
              {getStatusBadge(overallStatus)}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {overallStatus === 'healthy'
                ? 'All systems operational'
                : overallStatus === 'error'
                ? 'One or more components have errors'
                : overallStatus === 'loading'
                ? 'Components are initializing...'
                : 'System not fully tested'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {components.map((component, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(component.status)}
                  <div>
                    <CardTitle className="text-lg">{component.name}</CardTitle>
                    <CardDescription>{component.message}</CardDescription>
                  </div>
                </div>
                {getStatusBadge(component.status)}
              </div>
            </CardHeader>
            {component.details && (
              <>
                <Separator />
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground font-mono">{component.details}</p>
                </CardContent>
              </>
            )}
          </Card>
        ))}
      </div>

      <Card className="mt-8 bg-muted/50">
        <CardHeader>
          <CardTitle>Troubleshooting Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong className="text-foreground">Authentication Issues:</strong>
            <p className="text-muted-foreground">
              If authentication fails, try clearing your browser cache and cookies, then log in again.
            </p>
          </div>
          <div>
            <strong className="text-foreground">Backend Connection Issues:</strong>
            <p className="text-muted-foreground">
              Check your internet connection and ensure the backend canister is deployed and running.
            </p>
          </div>
          <div>
            <strong className="text-foreground">Query Failures:</strong>
            <p className="text-muted-foreground">
              Query failures may indicate permission issues or backend errors. Check the browser console for detailed error messages.
            </p>
          </div>
          <div>
            <strong className="text-foreground">Browser Console:</strong>
            <p className="text-muted-foreground">
              Open your browser's developer tools (F12) and check the Console tab for detailed diagnostic logs.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

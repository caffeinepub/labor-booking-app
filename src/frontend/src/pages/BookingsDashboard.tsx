import { useEffect, useState } from 'react';
import { useGetCallerLaborer, useUpdateBookingStatus } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useBookingFilters } from '../hooks/useBookingFilters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Loader2, Calendar, MapPin, Clock, User, Filter, ArrowUpDown } from 'lucide-react';
import { useNavigate, Link } from '@tanstack/react-router';
import { BookingStatus, type Booking } from '../backend';
import BookingHistorySection from '../components/BookingHistorySection';
import { toast } from 'sonner';

export default function BookingsDashboard() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: laborer, isLoading } = useGetCallerLaborer();
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateBookingStatus();
  
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    if (!identity) {
      navigate({ to: '/' });
    }
  }, [identity, navigate]);

  const myPrincipal = identity?.getPrincipal().toString();

  // Enhanced logging for debugging outgoing bookings
  console.log('═══════════════════════════════════════════════════════════');
  console.log('[BookingsDashboard] 📊 DASHBOARD STATE');
  console.log('[BookingsDashboard] Current user principal:', myPrincipal);
  console.log('[BookingsDashboard] Laborer data loaded:', !!laborer);
  console.log('[BookingsDashboard] Total bookings in laborer record:', laborer?.bookings.length || 0);
  console.log('═══════════════════════════════════════════════════════════');

  if (laborer?.bookings) {
    console.log('[BookingsDashboard] 📋 ALL BOOKINGS DETAILS:');
    laborer.bookings.forEach((booking, index) => {
      const isRequesterMatch = booking.requester.toString() === myPrincipal;
      const isTargetMatch = booking.targetLaborer.toString() === myPrincipal;
      
      console.log(`[BookingsDashboard] Booking ${index + 1}:`, {
        id: booking.id.toString(),
        requester: booking.requester.toString(),
        targetLaborer: booking.targetLaborer.toString(),
        status: booking.status,
        serviceType: booking.serviceType,
        isRequesterMatch,
        isTargetMatch,
        classification: isRequesterMatch ? 'OUTGOING' : isTargetMatch ? 'INCOMING' : 'UNKNOWN',
      });
    });
  }

  const outgoingBookings = laborer?.bookings.filter((b) => {
    const isMatch = b.requester.toString() === myPrincipal;
    console.log('[BookingsDashboard] 🔍 Outgoing filter - Booking ID:', b.id.toString(), 'Match:', isMatch);
    return isMatch;
  }) || [];
  
  const incomingBookings = laborer?.bookings.filter((b) => {
    const isMatch = b.targetLaborer.toString() === myPrincipal;
    console.log('[BookingsDashboard] 🔍 Incoming filter - Booking ID:', b.id.toString(), 'Match:', isMatch);
    return isMatch;
  }) || [];

  console.log('═══════════════════════════════════════════════════════════');
  console.log('[BookingsDashboard] 📊 FILTERED RESULTS:');
  console.log('[BookingsDashboard] Outgoing bookings count:', outgoingBookings.length);
  console.log('[BookingsDashboard] Incoming bookings count:', incomingBookings.length);
  console.log('═══════════════════════════════════════════════════════════');

  const { filterAndSortBookings } = useBookingFilters();

  const filteredOutgoing = filterAndSortBookings(outgoingBookings, statusFilter, sortOrder);
  const filteredIncoming = filterAndSortBookings(incomingBookings, statusFilter, sortOrder);

  console.log('[BookingsDashboard] 🔧 After status/sort filter:');
  console.log('[BookingsDashboard]   - Outgoing:', filteredOutgoing.length);
  console.log('[BookingsDashboard]   - Incoming:', filteredIncoming.length);

  const activeOutgoing = filteredOutgoing.filter(
    (b) => b.status === BookingStatus.pending || b.status === BookingStatus.confirmed
  );
  const historyOutgoing = filteredOutgoing.filter(
    (b) => b.status === BookingStatus.completed || b.status === BookingStatus.cancelled
  );

  const activeIncoming = filteredIncoming.filter(
    (b) => b.status === BookingStatus.pending || b.status === BookingStatus.confirmed
  );
  const historyIncoming = filteredIncoming.filter(
    (b) => b.status === BookingStatus.completed || b.status === BookingStatus.cancelled
  );

  console.log('[BookingsDashboard] 📈 Active vs History breakdown:');
  console.log('[BookingsDashboard]   - Active outgoing:', activeOutgoing.length);
  console.log('[BookingsDashboard]   - History outgoing:', historyOutgoing.length);
  console.log('[BookingsDashboard]   - Active incoming:', activeIncoming.length);
  console.log('[BookingsDashboard]   - History incoming:', historyIncoming.length);

  if (historyOutgoing.length > 0) {
    console.log('[BookingsDashboard] 📜 Outgoing history bookings:');
    historyOutgoing.forEach((booking) => {
      console.log('[BookingsDashboard]   -', {
        id: booking.id.toString(),
        status: booking.status,
        serviceType: booking.serviceType,
        targetLaborer: booking.targetLaborer.toString(),
      });
    });
  } else {
    console.warn('═══════════════════════════════════════════════════════════');
    console.warn('[BookingsDashboard] ⚠️ BACKEND ARCHITECTURE LIMITATION DETECTED');
    console.warn('[BookingsDashboard] No outgoing history bookings found');
    console.warn('[BookingsDashboard] REASON: Bookings are stored ONLY in the target laborer\'s record');
    console.warn('[BookingsDashboard] IMPACT: Requesters cannot see their outgoing bookings');
    console.warn('[BookingsDashboard] SOLUTION: Backend needs to store bookings in BOTH requester and target laborer records');
    console.warn('═══════════════════════════════════════════════════════════');
  }

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.pending:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case BookingStatus.confirmed:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case BookingStatus.completed:
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case BookingStatus.cancelled:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleString();
  };

  const handleStatusUpdate = (bookingId: bigint, status: BookingStatus, booking: Booking) => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('[BookingsDashboard] 🖱️ BUTTON CLICKED');
    console.log('[BookingsDashboard] Timestamp:', new Date().toISOString());
    console.log('[BookingsDashboard] Booking ID:', bookingId.toString());
    console.log('[BookingsDashboard] Current Status:', booking.status);
    console.log('[BookingsDashboard] Target Status:', status);
    console.log('[BookingsDashboard] isPending (mutation state):', isUpdating);
    console.log('[BookingsDashboard] User Principal:', myPrincipal);
    console.log('[BookingsDashboard] Booking Requester:', booking.requester.toString());
    console.log('[BookingsDashboard] Booking Target Laborer:', booking.targetLaborer.toString());
    console.log('═══════════════════════════════════════════════════════════');
    
    // Log booking context
    console.log('[BookingsDashboard] 📋 BOOKING CONTEXT:');
    console.log('[BookingsDashboard]   - Service Type:', booking.serviceType);
    console.log('[BookingsDashboard]   - Location:', booking.location);
    console.log('[BookingsDashboard]   - Duration:', booking.durationHours.toString(), 'hours');
    console.log('[BookingsDashboard]   - Date/Time:', formatDate(booking.dateTime));
    
    // Validation checks
    console.log('[BookingsDashboard] 🔍 VALIDATION CHECKS:');
    const isRequester = booking.requester.toString() === myPrincipal;
    const isTargetLaborer = booking.targetLaborer.toString() === myPrincipal;
    console.log('[BookingsDashboard]   - Is Requester:', isRequester);
    console.log('[BookingsDashboard]   - Is Target Laborer:', isTargetLaborer);
    console.log('[BookingsDashboard]   - Can Update:', isRequester || isTargetLaborer);
    
    if (!isRequester && !isTargetLaborer) {
      console.error('[BookingsDashboard] ❌ VALIDATION FAILED: User is neither requester nor target laborer');
      toast.error('You are not authorized to update this booking');
      return;
    }
    
    if (isUpdating) {
      console.warn('[BookingsDashboard] ⚠️ MUTATION IN PROGRESS: Ignoring click');
      return;
    }
    
    console.log('[BookingsDashboard] ✅ Validation passed, calling mutation...');
    
    try {
      updateStatus(
        { bookingId, status },
        {
          onSuccess: () => {
            console.log('[BookingsDashboard] ✅ Mutation success callback in component');
            toast.success(`Booking ${status} successfully`);
          },
          onError: (error) => {
            console.error('[BookingsDashboard] ❌ Mutation error callback in component');
            console.error('[BookingsDashboard] Error:', error);
            if (error instanceof Error) {
              toast.error(error.message);
            } else {
              toast.error('Failed to update booking status');
            }
          },
        }
      );
      console.log('[BookingsDashboard] 🚀 Mutation call initiated');
    } catch (error) {
      console.error('[BookingsDashboard] 💥 EXCEPTION during mutation call');
      console.error('[BookingsDashboard] Error:', error);
      if (error instanceof Error) {
        console.error('[BookingsDashboard] Error message:', error.message);
        console.error('[BookingsDashboard] Error stack:', error.stack);
      }
    }
  };

  const BookingCard = ({ booking, isIncoming }: { booking: Booking; isIncoming: boolean }) => (
    <Link
      to="/bookings/$bookingId"
      params={{ bookingId: booking.id.toString() }}
      className="block transition-transform hover:scale-[1.02] cursor-pointer"
    >
      <Card className="h-full hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{booking.serviceType}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <User className="w-3 h-3" />
                {isIncoming ? 'Requested by' : 'Booking with'}{' '}
                {isIncoming
                  ? booking.requester.toString().slice(0, 10)
                  : booking.targetLaborer.toString().slice(0, 10)}
                ...
              </CardDescription>
            </div>
            <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            {formatDate(booking.dateTime)}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            {booking.durationHours.toString()} hours
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            {booking.location}
          </div>

          {isIncoming && booking.status === BookingStatus.pending && (
            <div className="flex gap-2 pt-2" onClick={(e) => e.preventDefault()}>
              <Button
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  console.log('[BookingsDashboard] 🟢 CONFIRM button clicked for booking:', booking.id.toString());
                  handleStatusUpdate(booking.id, BookingStatus.confirmed, booking);
                }}
                disabled={isUpdating}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  'Confirm'
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  console.log('[BookingsDashboard] 🔴 DECLINE button clicked for booking:', booking.id.toString());
                  handleStatusUpdate(booking.id, BookingStatus.cancelled, booking);
                }}
                disabled={isUpdating}
                className="flex-1"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Declining...
                  </>
                ) : (
                  'Decline'
                )}
              </Button>
            </div>
          )}

          {isIncoming && booking.status === BookingStatus.confirmed && (
            <div onClick={(e) => e.preventDefault()}>
              <Button
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  console.log('[BookingsDashboard] ✅ MARK AS COMPLETED button clicked for booking:', booking.id.toString());
                  handleStatusUpdate(booking.id, BookingStatus.completed, booking);
                }}
                disabled={isUpdating}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Mark as Completed'
                )}
              </Button>
            </div>
          )}

          {!isIncoming && booking.status === BookingStatus.pending && (
            <div onClick={(e) => e.preventDefault()}>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  console.log('[BookingsDashboard] ❌ CANCEL BOOKING button clicked for booking:', booking.id.toString());
                  handleStatusUpdate(booking.id, BookingStatus.cancelled, booking);
                }}
                disabled={isUpdating}
                className="w-full"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel Booking'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );

  if (isLoading) {
    return (
      <div className="container py-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
        <p className="text-muted-foreground">Manage your booking requests and jobs</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as BookingStatus | 'all')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value={BookingStatus.pending}>Pending</SelectItem>
              <SelectItem value={BookingStatus.confirmed}>Confirmed</SelectItem>
              <SelectItem value={BookingStatus.completed}>Completed</SelectItem>
              <SelectItem value={BookingStatus.cancelled}>Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
          <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'newest' | 'oldest')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {statusFilter !== 'all' && (
          <Button variant="ghost" size="sm" onClick={() => setStatusFilter('all')}>
            Clear Filters
          </Button>
        )}
      </div>

      <Tabs defaultValue="incoming" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="incoming">Incoming ({incomingBookings.length})</TabsTrigger>
          <TabsTrigger value="outgoing">Outgoing ({outgoingBookings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="space-y-6">
          {activeIncoming.length === 0 && historyIncoming.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No incoming booking requests yet
              </CardContent>
            </Card>
          ) : (
            <>
              {activeIncoming.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Active Bookings</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {activeIncoming.map((booking) => (
                      <BookingCard key={booking.id.toString()} booking={booking} isIncoming={true} />
                    ))}
                  </div>
                </div>
              )}

              {historyIncoming.length > 0 && (
                <BookingHistorySection bookings={historyIncoming} isIncoming={true} />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="outgoing" className="space-y-6">
          {activeOutgoing.length === 0 && historyOutgoing.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No outgoing bookings yet.{' '}
                <a href="/discover" className="text-amber-600 hover:underline">
                  Find laborers
                </a>{' '}
                to book.
              </CardContent>
            </Card>
          ) : (
            <>
              {activeOutgoing.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Active Bookings</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {activeOutgoing.map((booking) => (
                      <BookingCard key={booking.id.toString()} booking={booking} isIncoming={false} />
                    ))}
                  </div>
                </div>
              )}

              {historyOutgoing.length > 0 && (
                <BookingHistorySection bookings={historyOutgoing} isIncoming={false} />
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

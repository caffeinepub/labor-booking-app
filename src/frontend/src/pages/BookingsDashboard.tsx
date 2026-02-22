import { useEffect, useState } from 'react';
import { useGetBookings, useUpdateBookingStatus } from '../hooks/useQueries';
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
  const { data: bookingsData, isLoading, isRefetching, refetch } = useGetBookings();
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateBookingStatus();
  
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    if (!identity) {
      navigate({ to: '/' });
    }
  }, [identity, navigate]);

  // Refetch on mount to ensure fresh data
  useEffect(() => {
    refetch();
  }, [refetch]);

  const myPrincipal = identity?.getPrincipal().toString();

  console.log('═══════════════════════════════════════════════════════════');
  console.log('[BookingsDashboard] 📊 DASHBOARD STATE');
  console.log('[BookingsDashboard] Timestamp:', new Date().toISOString());
  console.log('[BookingsDashboard] Current user principal:', myPrincipal);
  console.log('[BookingsDashboard] Bookings data loaded:', !!bookingsData);
  console.log('[BookingsDashboard] Is refetching:', isRefetching);
  console.log('[BookingsDashboard] Outgoing bookings:', bookingsData?.outgoing.length || 0);
  console.log('[BookingsDashboard] Incoming bookings:', bookingsData?.incoming.length || 0);
  console.log('═══════════════════════════════════════════════════════════');

  const outgoingBookings = bookingsData?.outgoing || [];
  const incomingBookings = bookingsData?.incoming || [];

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
      </div>

      <Tabs defaultValue="outgoing" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="outgoing">
            Outgoing Requests ({activeOutgoing.length})
          </TabsTrigger>
          <TabsTrigger value="incoming">
            Incoming Requests ({activeIncoming.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="outgoing" className="space-y-6">
          {activeOutgoing.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No active outgoing bookings</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeOutgoing.map((booking) => (
                <BookingCard key={booking.id.toString()} booking={booking} isIncoming={false} />
              ))}
            </div>
          )}

          <BookingHistorySection
            bookings={historyOutgoing}
            isIncoming={false}
          />
        </TabsContent>

        <TabsContent value="incoming" className="space-y-6">
          {activeIncoming.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No active incoming bookings</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeIncoming.map((booking) => (
                <BookingCard key={booking.id.toString()} booking={booking} isIncoming={true} />
              ))}
            </div>
          )}

          <BookingHistorySection
            bookings={historyIncoming}
            isIncoming={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

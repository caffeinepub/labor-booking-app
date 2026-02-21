import { useEffect } from 'react';
import { useGetCallerLaborer, useUpdateBookingStatus } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Loader2, Calendar, MapPin, Clock, User } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { BookingStatus, type Booking } from '../backend';

export default function BookingsDashboard() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: laborer, isLoading } = useGetCallerLaborer();
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateBookingStatus();

  useEffect(() => {
    if (!identity) {
      navigate({ to: '/' });
    }
  }, [identity, navigate]);

  const myPrincipal = identity?.getPrincipal().toString();

  const outgoingBookings = laborer?.bookings.filter((b) => b.requester.toString() === myPrincipal) || [];
  const incomingBookings = laborer?.bookings.filter((b) => b.targetLaborer.toString() === myPrincipal) || [];

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

  const handleStatusUpdate = (bookingId: bigint, status: BookingStatus) => {
    updateStatus({ bookingId, status });
  };

  const BookingCard = ({ booking, isIncoming }: { booking: Booking; isIncoming: boolean }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{booking.serviceType}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <User className="w-3 h-3" />
              {isIncoming ? 'Requested by' : 'Booking with'} {isIncoming ? booking.requester.toString().slice(0, 10) : booking.targetLaborer.toString().slice(0, 10)}...
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
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={() => handleStatusUpdate(booking.id, BookingStatus.confirmed)}
              disabled={isUpdating}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              Confirm
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusUpdate(booking.id, BookingStatus.cancelled)}
              disabled={isUpdating}
              className="flex-1"
            >
              Decline
            </Button>
          </div>
        )}

        {isIncoming && booking.status === BookingStatus.confirmed && (
          <Button
            size="sm"
            onClick={() => handleStatusUpdate(booking.id, BookingStatus.completed)}
            disabled={isUpdating}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            Mark as Completed
          </Button>
        )}

        {!isIncoming && booking.status === BookingStatus.pending && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleStatusUpdate(booking.id, BookingStatus.cancelled)}
            disabled={isUpdating}
            className="w-full"
          >
            Cancel Booking
          </Button>
        )}
      </CardContent>
    </Card>
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

      <Tabs defaultValue="incoming" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="incoming">
            Incoming ({incomingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="outgoing">
            Outgoing ({outgoingBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="space-y-4">
          {incomingBookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No incoming booking requests yet
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {incomingBookings.map((booking) => (
                <BookingCard key={booking.id.toString()} booking={booking} isIncoming={true} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="outgoing" className="space-y-4">
          {outgoingBookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No outgoing bookings yet. <a href="/discover" className="text-amber-600 hover:underline">Find laborers</a> to book.
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {outgoingBookings.map((booking) => (
                <BookingCard key={booking.id.toString()} booking={booking} isIncoming={false} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

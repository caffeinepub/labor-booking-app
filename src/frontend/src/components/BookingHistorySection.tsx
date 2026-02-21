import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ChevronDown, ChevronUp, Calendar, MapPin, Clock, User } from 'lucide-react';
import { BookingStatus, type Booking } from '../backend';

interface BookingHistorySectionProps {
  bookings: Booking[];
  isIncoming: boolean;
}

export default function BookingHistorySection({ bookings, isIncoming }: BookingHistorySectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
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

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between"
      >
        <span className="font-semibold">Booking History ({bookings.length})</span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </Button>

      {isOpen && (
        <div className="grid md:grid-cols-2 gap-4">
          {bookings.map((booking) => (
            <Link
              key={booking.id.toString()}
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
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

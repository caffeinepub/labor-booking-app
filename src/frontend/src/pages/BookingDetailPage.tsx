import { useEffect, useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetBookingById, useUpdateBookingDetails, useGetUserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Loader2, Calendar, MapPin, Clock, User, ArrowLeft, FileText, Save } from 'lucide-react';
import { BookingStatus } from '../backend';
import { toast } from 'sonner';

export default function BookingDetailPage() {
  const { bookingId } = useParams({ from: '/bookings/$bookingId' });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: booking, isLoading } = useGetBookingById(BigInt(bookingId));
  const { mutate: updateDetails, isPending: isUpdatingDetails } = useUpdateBookingDetails();
  
  const [isEditing, setIsEditing] = useState(false);
  const [detailsText, setDetailsText] = useState('');

  const { data: requesterProfile } = useGetUserProfile(booking?.requester);
  const { data: providerProfile } = useGetUserProfile(booking?.targetLaborer);

  useEffect(() => {
    if (!identity) {
      navigate({ to: '/' });
    }
  }, [identity, navigate]);

  useEffect(() => {
    if (booking?.details) {
      setDetailsText(booking.details);
    }
  }, [booking]);

  const myPrincipal = identity?.getPrincipal().toString();
  const isProvider = booking?.targetLaborer.toString() === myPrincipal;

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
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSaveDetails = () => {
    if (!booking) return;
    
    if (!detailsText.trim()) {
      toast.error('Details cannot be empty');
      return;
    }

    updateDetails(
      { bookingId: booking.id, details: detailsText },
      {
        onSuccess: () => {
          toast.success('Booking details updated successfully');
          setIsEditing(false);
        },
        onError: (error: any) => {
          toast.error(error.message || 'Failed to update booking details');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="container py-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Booking not found</p>
            <Button onClick={() => navigate({ to: '/bookings' })}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Bookings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-12 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate({ to: '/bookings' })}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Bookings
      </Button>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{booking.serviceType}</CardTitle>
                <CardDescription className="mt-2">
                  Booking ID: {booking.id.toString()}
                </CardDescription>
              </div>
              <Badge className={getStatusColor(booking.status)}>
                {booking.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Requester</h3>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{requesterProfile?.name || 'Loading...'}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {booking.requester.toString().slice(0, 20)}...
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Service Provider</h3>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{providerProfile?.name || 'Loading...'}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {booking.targetLaborer.toString().slice(0, 20)}...
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Date & Time</p>
                    <p className="font-medium">{formatDate(booking.dateTime)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Duration</p>
                    <p className="font-medium">{booking.durationHours.toString()} hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Location</p>
                    <p className="font-medium">{booking.location}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-600" />
                <CardTitle>Booking Details & Notes</CardTitle>
              </div>
              {isProvider && !isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Details
                </Button>
              )}
            </div>
            <CardDescription>
              {isProvider
                ? 'Add or update special instructions, requirements, or notes for this booking'
                : 'View booking details and special instructions'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="details">Details</Label>
                  <Textarea
                    id="details"
                    value={detailsText}
                    onChange={(e) => setDetailsText(e.target.value)}
                    placeholder="Enter booking details, special instructions, or requirements..."
                    className="min-h-[150px] mt-2"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveDetails}
                    disabled={isUpdatingDetails || !detailsText.trim()}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    {isUpdatingDetails ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Details
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setDetailsText(booking.details || '');
                    }}
                    disabled={isUpdatingDetails}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {booking.details ? (
                  <p className="whitespace-pre-wrap">{booking.details}</p>
                ) : (
                  <p className="text-muted-foreground italic">
                    {isProvider
                      ? 'No details added yet. Click "Edit Details" to add information.'
                      : 'No details available for this booking.'}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

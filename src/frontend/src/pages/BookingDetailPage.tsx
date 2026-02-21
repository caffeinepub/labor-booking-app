import { useEffect, useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetBookingById, useUpdateBookingDetails, useGetUserProfile, useGetLaborerById } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Loader2, Calendar, MapPin, Clock, User, FileText, Smartphone, Phone } from 'lucide-react';
import { BookingStatus } from '../backend';

export default function BookingDetailPage() {
  const { bookingId } = useParams({ from: '/bookings/$bookingId' });
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: booking, isLoading: bookingLoading } = useGetBookingById(BigInt(bookingId));
  const { mutate: updateDetails, isPending: isUpdating } = useUpdateBookingDetails();

  const [detailsText, setDetailsText] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Fetch user profiles for requester and target laborer
  const { data: requesterProfile } = useGetUserProfile(booking?.requester);
  const { data: targetProfile } = useGetUserProfile(booking?.targetLaborer);

  // Fetch full laborer data for mobile numbers
  const { data: requesterLaborer } = useGetLaborerById(booking?.requester.toString());
  const { data: targetLaborer } = useGetLaborerById(booking?.targetLaborer.toString());

  const myPrincipal = identity?.getPrincipal().toString();
  const isProvider = booking?.targetLaborer.toString() === myPrincipal;

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

  const handleSaveDetails = () => {
    if (booking && detailsText.trim()) {
      updateDetails(
        { bookingId: booking.id, details: detailsText },
        {
          onSuccess: () => {
            setIsEditing(false);
          },
        }
      );
    }
  };

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

  if (bookingLoading) {
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
            <p className="text-muted-foreground">Booking not found</p>
            <Button onClick={() => navigate({ to: '/bookings' })} className="mt-4">
              Back to Bookings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-12 max-w-4xl">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate({ to: '/bookings' })} className="mb-4">
          ← Back to Bookings
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Booking Details</h1>
            <p className="text-muted-foreground">ID: {booking.id.toString()}</p>
          </div>
          <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Service Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Service Type</Label>
                <p className="text-lg font-medium">{booking.serviceType}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Duration</Label>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <p className="text-lg font-medium">{booking.durationHours.toString()} hours</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-muted-foreground">Date & Time</Label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <p className="text-lg font-medium">{formatDate(booking.dateTime)}</p>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-muted-foreground">Location</Label>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <p className="text-lg font-medium">{booking.location}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Mobile numbers for direct communication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Requester</Label>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <p className="font-medium">{requesterProfile?.name || 'Loading...'}</p>
                  </div>
                  {requesterLaborer?.mobileNumber && (
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <Smartphone className="w-4 h-4" />
                      <p className="font-semibold">{requesterLaborer.mobileNumber}</p>
                    </div>
                  )}
                  {requesterLaborer?.contact && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      <p>{requesterLaborer.contact}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Provider</Label>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <p className="font-medium">{targetProfile?.name || 'Loading...'}</p>
                  </div>
                  {targetLaborer?.mobileNumber && (
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <Smartphone className="w-4 h-4" />
                      <p className="font-semibold">{targetLaborer.mobileNumber}</p>
                    </div>
                  )}
                  {targetLaborer?.contact && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      <p>{targetLaborer.contact}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Booking Details & Notes
                </CardTitle>
                <CardDescription>
                  {isProvider ? 'Add or update notes about this booking' : 'View booking details'}
                </CardDescription>
              </div>
              {isProvider && !isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditing && isProvider ? (
              <div className="space-y-4">
                <Textarea
                  value={detailsText}
                  onChange={(e) => setDetailsText(e.target.value)}
                  placeholder="Add notes about the booking, special requirements, or updates..."
                  rows={6}
                  className="resize-none"
                />
                <div className="flex gap-2">
                  <Button onClick={handleSaveDetails} disabled={isUpdating}>
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Details'
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isUpdating}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="min-h-[100px] p-4 bg-muted/50 rounded-lg">
                {booking.details ? (
                  <p className="whitespace-pre-wrap">{booking.details}</p>
                ) : (
                  <p className="text-muted-foreground italic">No details added yet</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

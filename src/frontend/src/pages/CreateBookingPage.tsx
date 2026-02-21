import { useState, useEffect } from 'react';
import { useCreateBooking, useGetBookablesNearLocation } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate, useParams } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { Principal } from '@dfinity/principal';
import type { BookingInput } from '../backend';

export default function CreateBookingPage() {
  const { laborerId } = useParams({ from: '/book/$laborerId' });
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const { mutate: createBooking, isPending } = useCreateBooking();
  const { data: laborers } = useGetBookablesNearLocation('', BigInt(100));

  const [formData, setFormData] = useState({
    serviceType: '',
    dateTime: '',
    durationHours: '',
    location: '',
  });

  useEffect(() => {
    if (!identity) {
      navigate({ to: '/' });
    }
  }, [identity, navigate]);

  const laborer = laborers?.find((l) => l.id.toString() === laborerId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const bookingInput: BookingInput = {
      targetLaborer: Principal.fromText(laborerId),
      serviceType: formData.serviceType,
      dateTime: BigInt(new Date(formData.dateTime).getTime() * 1000000),
      durationHours: BigInt(formData.durationHours),
      location: formData.location,
    };

    createBooking(bookingInput, {
      onSuccess: () => {
        navigate({ to: '/booking-success' });
      },
    });
  };

  if (!laborer) {
    return (
      <div className="container py-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container py-12 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Book {laborer.name}</h1>
        <p className="text-muted-foreground">Fill in the details for your booking request</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
            <CardDescription>Provide information about the service you need</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serviceType">Service Type</Label>
              <Input
                id="serviceType"
                value={formData.serviceType}
                onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                placeholder="e.g., Plumbing repair, Carpentry work"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTime">Date & Time</Label>
              <Input
                id="dateTime"
                type="datetime-local"
                value={formData.dateTime}
                onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="durationHours">Duration (hours)</Label>
              <Input
                id="durationHours"
                type="number"
                min="1"
                value={formData.durationHours}
                onChange={(e) => setFormData({ ...formData, durationHours: e.target.value })}
                placeholder="e.g., 2"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Where should the work be done?"
                required
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => navigate({ to: '/discover' })} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Booking...
              </>
            ) : (
              'Submit Booking'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

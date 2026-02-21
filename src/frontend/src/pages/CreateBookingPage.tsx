import { useState, useEffect } from 'react';
import { useCreateBooking, useGetLaborerById } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate, useParams } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';
import type { BookingInput } from '../backend';

export default function CreateBookingPage() {
  const { laborerId } = useParams({ from: '/book/$laborerId' });
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const { mutate: createBooking, isPending, isError, error, reset } = useCreateBooking();
  const { data: laborer, isLoading: laborerLoading, isError: laborerError, error: laborerQueryError } = useGetLaborerById(laborerId);

  const [formData, setFormData] = useState({
    serviceType: '',
    dateTime: '',
    durationHours: '',
    location: '',
  });

  useEffect(() => {
    console.log('[CreateBookingPage] Component mounted');
    console.log('[CreateBookingPage] Laborer ID from params:', laborerId);
    console.log('[CreateBookingPage] Identity present:', !!identity);
    
    if (!identity) {
      console.warn('[CreateBookingPage] No identity found, redirecting to home');
      navigate({ to: '/' });
    }
  }, [identity, navigate, laborerId]);

  useEffect(() => {
    console.log('[CreateBookingPage] Laborer query state changed');
    console.log('[CreateBookingPage] Loading:', laborerLoading);
    console.log('[CreateBookingPage] Error:', laborerError);
    console.log('[CreateBookingPage] Laborer data:', laborer ? 'Found' : 'Not found');
    
    if (laborer) {
      console.log('[CreateBookingPage] Laborer details:', {
        id: laborer.id.toString(),
        name: laborer.name,
        location: laborer.location,
        skills: laborer.skills,
      });
    }
    
    if (laborerError) {
      console.error('[CreateBookingPage] Laborer query error:', laborerQueryError);
    }
  }, [laborer, laborerLoading, laborerError, laborerQueryError]);

  useEffect(() => {
    if (laborerError) {
      console.error('[CreateBookingPage] Error loading laborer:', laborerQueryError);
      toast.error('Failed to load laborer information. Please try again.');
    }
  }, [laborerError, laborerQueryError]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[CreateBookingPage] Form submission started at:', new Date().toISOString());
    console.log('[CreateBookingPage] Form data:', formData);
    
    reset(); // Clear any previous errors

    // Validate form data
    if (!formData.serviceType.trim()) {
      console.warn('[CreateBookingPage] Validation failed: Service type is empty');
      toast.error('Please enter a service type');
      return;
    }

    if (!formData.dateTime) {
      console.warn('[CreateBookingPage] Validation failed: Date/time is empty');
      toast.error('Please select a date and time');
      return;
    }

    if (!formData.durationHours || parseInt(formData.durationHours) < 1) {
      console.warn('[CreateBookingPage] Validation failed: Invalid duration');
      toast.error('Please enter a valid duration (at least 1 hour)');
      return;
    }

    if (!formData.location.trim()) {
      console.warn('[CreateBookingPage] Validation failed: Location is empty');
      toast.error('Please enter a location');
      return;
    }

    console.log('[CreateBookingPage] Validation passed, preparing booking input...');

    try {
      const bookingInput: BookingInput = {
        targetLaborer: Principal.fromText(laborerId),
        serviceType: formData.serviceType,
        dateTime: BigInt(new Date(formData.dateTime).getTime() * 1000000),
        durationHours: BigInt(formData.durationHours),
        location: formData.location,
      };

      console.log('[CreateBookingPage] Booking input prepared:', {
        targetLaborer: laborerId,
        serviceType: bookingInput.serviceType,
        dateTime: bookingInput.dateTime.toString(),
        durationHours: bookingInput.durationHours.toString(),
        location: bookingInput.location,
      });

      console.log('[CreateBookingPage] Invoking createBooking mutation...');

      createBooking(bookingInput, {
        onSuccess: (bookingId) => {
          console.log('[CreateBookingPage] Mutation onSuccess callback triggered');
          console.log('[CreateBookingPage] Booking ID received:', bookingId.toString());
          console.log('[CreateBookingPage] Showing success toast...');
          toast.success('Booking request submitted successfully!');
          console.log('[CreateBookingPage] Navigating to success page...');
          navigate({ to: '/booking-success' });
          console.log('[CreateBookingPage] Navigation initiated at:', new Date().toISOString());
        },
        onError: (err) => {
          console.error('[CreateBookingPage] Mutation onError callback triggered');
          console.error('[CreateBookingPage] Error object:', err);
          console.error('[CreateBookingPage] Error type:', typeof err);
          console.error('[CreateBookingPage] Error constructor:', err?.constructor?.name);
          
          let errorMessage = 'Failed to create booking. Please try again.';
          
          if (err instanceof Error) {
            console.error('[CreateBookingPage] Error message:', err.message);
            console.error('[CreateBookingPage] Error stack:', err.stack);
            errorMessage = err.message;
            
            // Check if it's a timeout error
            if (err.message.includes('timed out')) {
              console.error('[CreateBookingPage] Timeout error detected');
              errorMessage = 'The request timed out. The server may be busy. Please try again in a moment.';
            }
          }
          
          console.log('[CreateBookingPage] Showing error toast with message:', errorMessage);
          toast.error(errorMessage);
          console.log('[CreateBookingPage] Error handling completed at:', new Date().toISOString());
        },
      });

      console.log('[CreateBookingPage] createBooking mutation invoked, waiting for response...');
    } catch (err) {
      console.error('[CreateBookingPage] Exception during booking submission:', err);
      toast.error('An unexpected error occurred. Please try again.');
    }
  };

  const handleCancel = () => {
    console.log('[CreateBookingPage] Cancel button clicked');
    try {
      navigate({ to: '/discover' });
      console.log('[CreateBookingPage] Navigation to discover page initiated');
    } catch (err) {
      console.error('[CreateBookingPage] Error navigating to discover page:', err);
      toast.error('Navigation failed. Please try again.');
    }
  };

  if (laborerLoading) {
    console.log('[CreateBookingPage] Loading laborer...');
    return (
      <div className="container py-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!laborer) {
    console.error('[CreateBookingPage] Laborer not found for ID:', laborerId);
    return (
      <div className="container py-12 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="w-12 h-12 text-destructive" />
              <div>
                <h2 className="text-xl font-semibold mb-2">Laborer Not Found</h2>
                <p className="text-muted-foreground mb-4">
                  The laborer you're trying to book could not be found.
                </p>
                <Button onClick={() => navigate({ to: '/discover' })}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Discovery
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('[CreateBookingPage] Rendering booking form for:', laborer.name);

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
            {isError && error && (
              <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">
                    {error instanceof Error ? error.message : 'An error occurred'}
                  </p>
                  {error instanceof Error && error.message.includes('timed out') && (
                    <p className="text-xs text-destructive/80 mt-1">
                      Your form data has been preserved. You can try submitting again.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="serviceType">Service Type</Label>
              <Input
                id="serviceType"
                value={formData.serviceType}
                onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                placeholder="e.g., Plumbing repair, Carpentry work"
                required
                disabled={isPending}
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
                disabled={isPending}
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
                disabled={isPending}
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
                disabled={isPending}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancel}
            className="flex-1"
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isPending} 
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
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

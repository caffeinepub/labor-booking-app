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
    console.log('═══════════════════════════════════════════════════════════');
    console.log('[CreateBookingPage] 🎬 COMPONENT MOUNTED');
    console.log('[CreateBookingPage] Timestamp:', new Date().toISOString());
    console.log('[CreateBookingPage] Laborer ID from params:', laborerId);
    console.log('[CreateBookingPage] Identity present:', !!identity);
    console.log('[CreateBookingPage] Identity principal:', identity?.getPrincipal().toString() || 'N/A');
    console.log('═══════════════════════════════════════════════════════════');
    
    if (!identity) {
      console.warn('[CreateBookingPage] ⚠️ No identity found, redirecting to home');
      navigate({ to: '/' });
    }
  }, [identity, navigate, laborerId]);

  useEffect(() => {
    console.log('[CreateBookingPage] 📊 LABORER QUERY STATE CHANGED');
    console.log('[CreateBookingPage]   - Loading:', laborerLoading);
    console.log('[CreateBookingPage]   - Error:', laborerError);
    console.log('[CreateBookingPage]   - Data present:', !!laborer);
    
    if (laborer) {
      console.log('[CreateBookingPage] 👤 LABORER DETAILS:');
      console.log('[CreateBookingPage]   - ID:', laborer.id.toString());
      console.log('[CreateBookingPage]   - Name:', laborer.name);
      console.log('[CreateBookingPage]   - Location:', laborer.location);
      console.log('[CreateBookingPage]   - Skills:', laborer.skills.join(', '));
      console.log('[CreateBookingPage]   - Services count:', laborer.services.length);
    }
    
    if (laborerError) {
      console.error('[CreateBookingPage] ❌ LABORER QUERY ERROR:', laborerQueryError);
    }
  }, [laborer, laborerLoading, laborerError, laborerQueryError]);

  useEffect(() => {
    if (laborerError) {
      console.error('[CreateBookingPage] 🚨 Error loading laborer:', laborerQueryError);
      toast.error('Failed to load laborer information. Please try again.');
    }
  }, [laborerError, laborerQueryError]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('[CreateBookingPage] 📝 FORM SUBMISSION STARTED');
    console.log('[CreateBookingPage] Timestamp:', new Date().toISOString());
    console.log('═══════════════════════════════════════════════════════════');
    
    console.log('[CreateBookingPage] 📋 RAW FORM DATA:');
    console.log('[CreateBookingPage]   - Service Type:', formData.serviceType);
    console.log('[CreateBookingPage]   - Date/Time:', formData.dateTime);
    console.log('[CreateBookingPage]   - Duration Hours:', formData.durationHours);
    console.log('[CreateBookingPage]   - Location:', formData.location);
    console.log('[CreateBookingPage]   - Target Laborer ID:', laborerId);
    
    reset(); // Clear any previous errors

    // Validate form data
    console.log('[CreateBookingPage] 🔍 VALIDATING FORM DATA...');
    
    if (!formData.serviceType.trim()) {
      console.warn('[CreateBookingPage] ⚠️ Validation failed: Service type is empty');
      toast.error('Please enter a service type');
      return;
    }

    if (!formData.dateTime) {
      console.warn('[CreateBookingPage] ⚠️ Validation failed: Date/time is empty');
      toast.error('Please select a date and time');
      return;
    }

    if (!formData.durationHours || parseInt(formData.durationHours) < 1) {
      console.warn('[CreateBookingPage] ⚠️ Validation failed: Invalid duration');
      toast.error('Please enter a valid duration (at least 1 hour)');
      return;
    }

    if (!formData.location.trim()) {
      console.warn('[CreateBookingPage] ⚠️ Validation failed: Location is empty');
      toast.error('Please enter a location');
      return;
    }

    console.log('[CreateBookingPage] ✅ Validation passed');
    console.log('[CreateBookingPage] 🔧 Preparing BookingInput object...');

    try {
      const targetLaborerPrincipal = Principal.fromText(laborerId);
      const dateTimeTimestamp = BigInt(new Date(formData.dateTime).getTime() * 1000000);
      const durationHoursBigInt = BigInt(formData.durationHours);
      
      const bookingInput: BookingInput = {
        targetLaborer: targetLaborerPrincipal,
        serviceType: formData.serviceType,
        dateTime: dateTimeTimestamp,
        durationHours: durationHoursBigInt,
        location: formData.location,
      };

      console.log('[CreateBookingPage] 📦 BOOKING INPUT PREPARED:');
      console.log('[CreateBookingPage]   - Target Laborer:', laborerId);
      console.log('[CreateBookingPage]   - Target Laborer (Principal):', targetLaborerPrincipal.toString());
      console.log('[CreateBookingPage]   - Service Type:', bookingInput.serviceType);
      console.log('[CreateBookingPage]   - Date/Time (BigInt):', bookingInput.dateTime.toString());
      console.log('[CreateBookingPage]   - Date/Time (ISO):', new Date(formData.dateTime).toISOString());
      console.log('[CreateBookingPage]   - Duration Hours:', bookingInput.durationHours.toString());
      console.log('[CreateBookingPage]   - Location:', bookingInput.location);
      console.log('[CreateBookingPage]   - Details:', bookingInput.details || '(none)');

      console.log('[CreateBookingPage] 🚀 Invoking createBooking mutation...');

      createBooking(bookingInput, {
        onSuccess: (bookingId) => {
          console.log('═══════════════════════════════════════════════════════════');
          console.log('[CreateBookingPage] 🎉 MUTATION SUCCESS CALLBACK');
          console.log('[CreateBookingPage] Booking ID:', bookingId.toString());
          console.log('[CreateBookingPage] Timestamp:', new Date().toISOString());
          console.log('═══════════════════════════════════════════════════════════');
          
          console.log('[CreateBookingPage] 📢 Showing success toast...');
          toast.success('Booking request submitted successfully!');
          
          console.log('[CreateBookingPage] 🧭 Navigating to success page...');
          navigate({ to: '/booking-success' });
          
          console.log('[CreateBookingPage] ✅ Navigation initiated');
        },
        onError: (err) => {
          console.error('═══════════════════════════════════════════════════════════');
          console.error('[CreateBookingPage] 🔴 MUTATION ERROR CALLBACK');
          console.error('[CreateBookingPage] Timestamp:', new Date().toISOString());
          console.error('[CreateBookingPage] Error object:', err);
          console.error('[CreateBookingPage] Error type:', typeof err);
          console.error('[CreateBookingPage] Error constructor:', err?.constructor?.name);
          console.error('═══════════════════════════════════════════════════════════');
          
          let errorMessage = 'Failed to create booking. Please try again.';
          
          if (err instanceof Error) {
            console.error('[CreateBookingPage] 📝 Error details:');
            console.error('[CreateBookingPage]   - Message:', err.message);
            console.error('[CreateBookingPage]   - Name:', err.name);
            console.error('[CreateBookingPage]   - Stack:', err.stack);
            
            errorMessage = err.message;
            
            // Check for specific error types
            if (err.message.includes('timed out')) {
              console.error('[CreateBookingPage] 🔍 Timeout error detected');
              errorMessage = 'The request timed out after 15 seconds. The server may be busy. Please try again in a moment.';
            } else if (err.message.includes('not found')) {
              console.error('[CreateBookingPage] 🔍 Not found error detected');
            } else if (err.message.includes('not authorized')) {
              console.error('[CreateBookingPage] 🔍 Authorization error detected');
            } else if (err.message.includes('Invalid')) {
              console.error('[CreateBookingPage] 🔍 Validation error detected');
            }
          }
          
          console.log('[CreateBookingPage] 📢 Showing error toast with message:', errorMessage);
          toast.error(errorMessage);
          console.log('[CreateBookingPage] ❌ Error handling completed');
        },
      });

      console.log('[CreateBookingPage] ⏳ Mutation invoked, waiting for response...');
    } catch (err) {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('[CreateBookingPage] 💥 EXCEPTION DURING BOOKING SUBMISSION');
      console.error('[CreateBookingPage] Exception:', err);
      if (err instanceof Error) {
        console.error('[CreateBookingPage] Exception message:', err.message);
        console.error('[CreateBookingPage] Exception stack:', err.stack);
      }
      console.error('═══════════════════════════════════════════════════════════');
      toast.error('An unexpected error occurred. Please try again.');
    }
  };

  const handleCancel = () => {
    console.log('[CreateBookingPage] 🔙 Cancel button clicked');
    try {
      navigate({ to: '/discover' });
      console.log('[CreateBookingPage] ✅ Navigation to discover page initiated');
    } catch (err) {
      console.error('[CreateBookingPage] ❌ Error navigating to discover page:', err);
      toast.error('Navigation failed. Please try again.');
    }
  };

  if (laborerLoading) {
    console.log('[CreateBookingPage] ⏳ Loading laborer data...');
    return (
      <div className="container py-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!laborer) {
    console.error('[CreateBookingPage] ❌ Laborer not found for ID:', laborerId);
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

  console.log('[CreateBookingPage] 🎨 Rendering booking form for:', laborer.name);

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
                Creating booking...
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

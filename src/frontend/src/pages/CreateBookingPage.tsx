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
          console.error('[CreateBookingPage] Error object:', err);
          console.error('[CreateBookingPage] Error type:', typeof err);
          console.error('[CreateBookingPage] Error constructor:', err?.constructor?.name);
          console.error('[CreateBookingPage] Timestamp:', new Date().toISOString());
          console.error('═══════════════════════════════════════════════════════════');
          
          let errorMessage = 'Failed to create booking. Please try again.';
          
          if (err && typeof err === 'object') {
            console.error('[CreateBookingPage] 🔍 Analyzing error object...');
            console.error('[CreateBookingPage] Error keys:', Object.keys(err));
            
            if ('message' in err && typeof err.message === 'string') {
              console.error('[CreateBookingPage] Error message:', err.message);
              errorMessage = err.message;
            }
          }
          
          console.error('[CreateBookingPage] 📢 Showing error toast with message:', errorMessage);
          toast.error(errorMessage);
        },
      });
    } catch (err) {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('[CreateBookingPage] 💥 EXCEPTION DURING BOOKING PREPARATION');
      console.error('[CreateBookingPage] Exception:', err);
      console.error('[CreateBookingPage] Timestamp:', new Date().toISOString());
      console.error('═══════════════════════════════════════════════════════════');
      
      toast.error('An unexpected error occurred. Please try again.');
    }
  };

  const selectedService = laborer?.services.find((s) => s.name === formData.serviceType);

  if (laborerLoading) {
    return (
      <div className="container py-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (laborerError || !laborer) {
    return (
      <div className="container py-12 max-w-2xl">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Error Loading Laborer
            </CardTitle>
            <CardDescription>
              We couldn't load the laborer information. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate({ to: '/discover' })} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Discovery
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-12 max-w-2xl">
      <Button variant="ghost" onClick={() => navigate({ to: '/discover' })} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Discovery
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create Booking</h1>
        <p className="text-muted-foreground">Book {laborer.name} for a service</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Laborer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="text-sm text-muted-foreground">Name: </span>
            <span className="font-medium">{laborer.name}</span>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Location: </span>
            <span className="font-medium">{laborer.location}</span>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Skills: </span>
            <span className="font-medium">{laborer.skills.join(', ')}</span>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
            <CardDescription>Fill in the details for your booking request</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serviceType">Service Type</Label>
              <select
                id="serviceType"
                value={formData.serviceType}
                onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
                required
              >
                <option value="">Select a service</option>
                {laborer.services.map((service, idx) => (
                  <option key={idx} value={service.name}>
                    {service.name} - ₹{service.priceInInr.toString()}
                  </option>
                ))}
              </select>
              {selectedService && (
                <p className="text-sm text-muted-foreground">
                  {selectedService.description} • ₹{selectedService.priceInInr.toString()}
                </p>
              )}
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
                placeholder="Where should the service be performed?"
                required
              />
            </div>
          </CardContent>
        </Card>

        {isError && error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-start gap-2 text-destructive">
                <AlertCircle className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-medium">Booking Failed</p>
                  <p className="text-sm">
                    {typeof error === 'object' && 'message' in error
                      ? String(error.message)
                      : 'An error occurred while creating the booking. Please try again.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Booking...
            </>
          ) : (
            'Submit Booking Request'
          )}
        </Button>
      </form>
    </div>
  );
}

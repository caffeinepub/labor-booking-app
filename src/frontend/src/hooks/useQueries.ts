import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { LaborerInput, LaborerData, UserProfile, BookingInput, BookingStatus, BookingResponse, Booking } from '../backend';
import { Principal } from '@dfinity/principal';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetUserProfile(principal: Principal | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', principal?.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!principal) return null;
      return actor.getUserProfile(principal);
    },
    enabled: !!actor && !actorFetching && !!principal,
  });
}

export function useGetCallerLaborer() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<LaborerData | null>({
    queryKey: ['callerLaborer'],
    queryFn: async () => {
      console.log('[useGetCallerLaborer] 🔄 Query function executing...');
      console.log('[useGetCallerLaborer] Timestamp:', new Date().toISOString());
      
      if (!actor) throw new Error('Actor not available');
      
      console.log('[useGetCallerLaborer] Calling backend getCallerLaborer...');
      const result = await actor.getCallerLaborer();
      
      console.log('[useGetCallerLaborer] ✅ Backend response received');
      console.log('[useGetCallerLaborer] Result:', result ? 'Laborer data found' : 'null (no profile)');
      
      if (result) {
        console.log('[useGetCallerLaborer] 📊 Laborer data summary:');
        console.log('[useGetCallerLaborer]   - Name:', result.name);
        console.log('[useGetCallerLaborer]   - Labor ID:', result.laborId);
        console.log('[useGetCallerLaborer]   - Total bookings:', result.bookings.length);
        console.log('[useGetCallerLaborer]   - Bookings:', result.bookings.map(b => ({
          id: b.id.toString(),
          requester: b.requester.toString(),
          targetLaborer: b.targetLaborer.toString(),
          status: b.status,
        })));
      }
      
      return result;
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSaveCallerLaborer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (laborerInput: LaborerInput) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerLaborer(laborerInput);
    },
    onSuccess: () => {
      console.log('[useSaveCallerLaborer] ✅ Profile saved successfully, invalidating queries...');
      queryClient.invalidateQueries({ queryKey: ['callerLaborer'] });
    },
  });
}

export function useGetLaborerById(laborerId: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<LaborerData | null>({
    queryKey: ['laborer', laborerId],
    queryFn: async () => {
      console.log('[useGetLaborerById] Query function called with laborerId:', laborerId);
      
      if (!actor) {
        console.error('[useGetLaborerById] Actor not available');
        throw new Error('Actor not available');
      }

      if (!laborerId) {
        console.error('[useGetLaborerById] No laborerId provided');
        return null;
      }

      try {
        console.log('[useGetLaborerById] Converting laborerId to Principal:', laborerId);
        const principal = Principal.fromText(laborerId);
        console.log('[useGetLaborerById] Principal created successfully:', principal.toString());
        
        console.log('[useGetLaborerById] Calling backend getLaborerById...');
        const result = await actor.getLaborerById(principal);
        
        console.log('[useGetLaborerById] Backend response received:', result ? 'Laborer found' : 'Laborer not found (null)');
        if (result) {
          console.log('[useGetLaborerById] Laborer details:', {
            id: result.id.toString(),
            name: result.name,
            location: result.location,
            mobileNumber: result.mobileNumber,
          });
        }
        
        return result;
      } catch (error) {
        console.error('[useGetLaborerById] Error during query:', error);
        if (error instanceof Error) {
          console.error('[useGetLaborerById] Error message:', error.message);
          console.error('[useGetLaborerById] Error stack:', error.stack);
        }
        throw error;
      }
    },
    enabled: !!actor && !actorFetching && !!laborerId,
    retry: false,
  });
}

export function useGetBookingById(bookingId: bigint | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Booking | null>({
    queryKey: ['booking', bookingId?.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!bookingId) return null;

      // Fetch caller's laborer data which contains bookings
      const laborerData = await actor.getCallerLaborer();
      if (!laborerData) return null;

      // Find the booking in the laborer's bookings array
      const booking = laborerData.bookings.find((b) => b.id === bookingId);
      return booking || null;
    },
    enabled: !!actor && !actorFetching && bookingId !== undefined,
  });
}

export function useGetLaborersByNeighborhood(neighborhood: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<LaborerData[]>({
    queryKey: ['laborers', 'neighborhood', neighborhood],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getLaborersByNeighborhood(neighborhood);
    },
    enabled: !!actor && !actorFetching && !!neighborhood,
  });
}

export function useGetBookablesNearLocation(location: string, radius: bigint) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<LaborerData[]>({
    queryKey: ['laborers', 'location', location, radius.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getBookablesNearLocation(location, radius);
    },
    enabled: !!actor && !actorFetching && !!location,
  });
}

export function useCreateBooking() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingInput: BookingInput): Promise<bigint> => {
      const requestStartTime = Date.now();
      console.log('═══════════════════════════════════════════════════════════');
      console.log('[useCreateBooking] 🚀 BOOKING CREATION STARTED');
      console.log('[useCreateBooking] Timestamp:', new Date().toISOString());
      console.log('[useCreateBooking] Request start time (ms):', requestStartTime);
      console.log('═══════════════════════════════════════════════════════════');
      
      // Log authentication state
      console.log('[useCreateBooking] 🔐 AUTHENTICATION STATE:');
      console.log('[useCreateBooking]   - Identity present:', !!identity);
      console.log('[useCreateBooking]   - Principal:', identity?.getPrincipal().toString() || 'N/A');
      console.log('[useCreateBooking]   - Is anonymous:', identity?.getPrincipal().isAnonymous() || 'N/A');
      
      // Log actor state
      console.log('[useCreateBooking] 🎭 ACTOR STATE:');
      console.log('[useCreateBooking]   - Actor available:', !!actor);
      console.log('[useCreateBooking]   - Actor type:', actor ? typeof actor : 'N/A');
      
      if (!actor) {
        console.error('[useCreateBooking] ❌ CRITICAL: Actor not available');
        throw new Error('Actor not available. Please ensure you are logged in.');
      }

      // Log complete request payload
      console.log('[useCreateBooking] 📦 REQUEST PAYLOAD:');
      console.log('[useCreateBooking]   - Target Laborer:', bookingInput.targetLaborer.toString());
      console.log('[useCreateBooking]   - Service Type:', bookingInput.serviceType);
      console.log('[useCreateBooking]   - Date/Time (raw):', bookingInput.dateTime.toString());
      console.log('[useCreateBooking]   - Date/Time (formatted):', new Date(Number(bookingInput.dateTime) / 1000000).toISOString());
      console.log('[useCreateBooking]   - Duration (hours):', bookingInput.durationHours.toString());
      console.log('[useCreateBooking]   - Location:', bookingInput.location);
      console.log('[useCreateBooking]   - Details:', bookingInput.details || '(none)');

      console.log('[useCreateBooking] 🔄 Initiating backend call...');

      // Create a timeout promise (15 seconds as per requirements)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          const timeoutDuration = Date.now() - requestStartTime;
          console.error('═══════════════════════════════════════════════════════════');
          console.error('[useCreateBooking] ⏱️ TIMEOUT ERROR');
          console.error('[useCreateBooking] Duration:', timeoutDuration, 'ms');
          console.error('[useCreateBooking] Timeout threshold: 15000 ms');
          console.error('[useCreateBooking] Request payload at timeout:', {
            targetLaborer: bookingInput.targetLaborer.toString(),
            serviceType: bookingInput.serviceType,
            location: bookingInput.location,
          });
          console.error('═══════════════════════════════════════════════════════════');
          reject(new Error('Request timed out after 15 seconds. The server may be busy. Please try again in a moment.'));
        }, 15000);
      });

      try {
        // Race between the actual call and the timeout
        console.log('[useCreateBooking] Racing between backend call and 15s timeout...');
        const response: BookingResponse = await Promise.race([
          actor.createBooking(bookingInput),
          timeoutPromise,
        ]);

        const responseDuration = Date.now() - requestStartTime;
        console.log('═══════════════════════════════════════════════════════════');
        console.log('[useCreateBooking] ✅ BACKEND RESPONSE RECEIVED');
        console.log('[useCreateBooking] Response time:', responseDuration, 'ms');
        console.log('[useCreateBooking] Response type:', response.__kind__);
        console.log('═══════════════════════════════════════════════════════════');

        // Handle the discriminated union response
        if (response.__kind__ === 'ok') {
          console.log('[useCreateBooking] ✨ SUCCESS - Booking created!');
          console.log('[useCreateBooking] Booking ID:', response.ok.toString());
          console.log('[useCreateBooking] Total processing time:', responseDuration, 'ms');
          return response.ok;
        } else if (response.__kind__ === 'laborerNotFound') {
          console.error('[useCreateBooking] ❌ ERROR: laborerNotFound');
          console.error('[useCreateBooking] Target laborer principal:', bookingInput.targetLaborer.toString());
          throw new Error('The selected laborer could not be found. They may have deleted their profile.');
        } else if (response.__kind__ === 'callerNotAuthorizedToBook') {
          console.error('[useCreateBooking] ❌ ERROR: callerNotAuthorizedToBook');
          console.error('[useCreateBooking] Caller principal:', identity?.getPrincipal().toString());
          throw new Error('You are not authorized to create bookings. Please ensure you are logged in with a valid account.');
        } else if (response.__kind__ === 'invalidFieldValues') {
          console.error('[useCreateBooking] ❌ ERROR: invalidFieldValues');
          console.error('[useCreateBooking] Submitted values:', {
            serviceType: bookingInput.serviceType,
            location: bookingInput.location,
            durationHours: bookingInput.durationHours.toString(),
          });
          throw new Error('Invalid booking details. Please ensure all required fields are filled correctly (service type, location, and duration must not be empty).');
        } else {
          console.error('[useCreateBooking] ❌ ERROR: Unexpected response type');
          console.error('[useCreateBooking] Response:', response);
          throw new Error('An unexpected error occurred. Please try again.');
        }
      } catch (error) {
        const errorDuration = Date.now() - requestStartTime;
        console.error('═══════════════════════════════════════════════════════════');
        console.error('[useCreateBooking] 💥 EXCEPTION CAUGHT');
        console.error('[useCreateBooking] Time elapsed:', errorDuration, 'ms');
        console.error('[useCreateBooking] Error type:', error instanceof Error ? error.constructor.name : typeof error);
        
        if (error instanceof Error) {
          console.error('[useCreateBooking] Error message:', error.message);
          console.error('[useCreateBooking] Error stack:', error.stack);
          
          // Check for specific error patterns
          if (error.message.includes('timed out')) {
            console.error('[useCreateBooking] 🔍 Timeout error detected');
          } else if (error.message.includes('not found')) {
            console.error('[useCreateBooking] 🔍 Not found error detected');
          } else if (error.message.includes('not authorized')) {
            console.error('[useCreateBooking] 🔍 Authorization error detected');
          } else if (error.message.includes('Invalid')) {
            console.error('[useCreateBooking] 🔍 Validation error detected');
          }
        } else {
          console.error('[useCreateBooking] Non-Error exception:', error);
        }
        console.error('═══════════════════════════════════════════════════════════');
        throw error;
      }
    },
    onSuccess: async (bookingId) => {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('[useCreateBooking] 🎉 MUTATION SUCCESS CALLBACK');
      console.log('[useCreateBooking] Booking ID:', bookingId.toString());
      console.log('[useCreateBooking] Invalidating queries and waiting for refetch...');
      console.log('═══════════════════════════════════════════════════════════');
      
      // Invalidate and wait for refetch to complete
      await queryClient.invalidateQueries({ queryKey: ['callerLaborer'] });
      await queryClient.invalidateQueries({ queryKey: ['laborers'] });
      
      // Add a small delay to ensure backend consistency
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('[useCreateBooking] ✅ Query invalidation and refetch complete');
    },
    onError: (error) => {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('[useCreateBooking] 🔴 MUTATION ERROR CALLBACK');
      console.error('[useCreateBooking] Error:', error);
      if (error instanceof Error) {
        console.error('[useCreateBooking] Error name:', error.name);
        console.error('[useCreateBooking] Error message:', error.message);
      }
      console.error('═══════════════════════════════════════════════════════════');
    },
    retry: (failureCount, error) => {
      console.log('[useCreateBooking] 🔄 RETRY LOGIC EVALUATION');
      console.log('[useCreateBooking] Failure count:', failureCount);
      console.log('[useCreateBooking] Max retries: 2');
      
      // Don't retry on timeout errors
      if (error instanceof Error && error.message.includes('timed out')) {
        console.log('[useCreateBooking] ⛔ Not retrying: Timeout error');
        return false;
      }
      
      // Don't retry on business logic errors
      if (error instanceof Error && (
        error.message.includes('not found') ||
        error.message.includes('not authorized') ||
        error.message.includes('Invalid')
      )) {
        console.log('[useCreateBooking] ⛔ Not retrying: Business logic error');
        return false;
      }
      
      // Retry up to 2 times for other errors
      const shouldRetry = failureCount < 2;
      console.log('[useCreateBooking] Retry decision:', shouldRetry ? 'YES' : 'NO');
      return shouldRetry;
    },
    retryDelay: (attemptIndex) => {
      const delay = Math.min(1000 * 2 ** attemptIndex, 5000);
      console.log('[useCreateBooking] ⏳ Retry delay for attempt', attemptIndex + 1, ':', delay, 'ms');
      return delay;
    },
  });
}

export function useUpdateBookingStatus() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: bigint; status: BookingStatus }) => {
      const requestStartTime = Date.now();
      console.log('═══════════════════════════════════════════════════════════');
      console.log('[useUpdateBookingStatus] 🔄 STATUS UPDATE STARTED');
      console.log('[useUpdateBookingStatus] Timestamp:', new Date().toISOString());
      console.log('[useUpdateBookingStatus] Request start time (ms):', requestStartTime);
      console.log('═══════════════════════════════════════════════════════════');
      
      // Log authentication state
      console.log('[useUpdateBookingStatus] 🔐 AUTHENTICATION STATE:');
      console.log('[useUpdateBookingStatus]   - Identity present:', !!identity);
      console.log('[useUpdateBookingStatus]   - Principal:', identity?.getPrincipal().toString() || 'N/A');
      console.log('[useUpdateBookingStatus]   - Is anonymous:', identity?.getPrincipal().isAnonymous() || 'N/A');
      
      // Log actor state
      console.log('[useUpdateBookingStatus] 🎭 ACTOR STATE:');
      console.log('[useUpdateBookingStatus]   - Actor available:', !!actor);
      console.log('[useUpdateBookingStatus]   - Actor type:', actor ? typeof actor : 'N/A');
      
      if (!actor) {
        console.error('[useUpdateBookingStatus] ❌ CRITICAL: Actor not available');
        throw new Error('Actor not available. Please ensure you are logged in.');
      }

      // Log mutation parameters
      console.log('[useUpdateBookingStatus] 📦 MUTATION PARAMETERS:');
      console.log('[useUpdateBookingStatus]   - Booking ID:', bookingId.toString());
      console.log('[useUpdateBookingStatus]   - Target Status:', status);
      console.log('[useUpdateBookingStatus]   - Caller Principal:', identity?.getPrincipal().toString() || 'N/A');

      try {
        console.log('[useUpdateBookingStatus] 🔄 Calling backend updateBookingStatus...');
        await actor.updateBookingStatus(bookingId, status);
        
        const responseDuration = Date.now() - requestStartTime;
        console.log('═══════════════════════════════════════════════════════════');
        console.log('[useUpdateBookingStatus] ✅ BACKEND RESPONSE RECEIVED');
        console.log('[useUpdateBookingStatus] Response time:', responseDuration, 'ms');
        console.log('[useUpdateBookingStatus] Status updated successfully');
        console.log('═══════════════════════════════════════════════════════════');
      } catch (error) {
        const errorDuration = Date.now() - requestStartTime;
        console.error('═══════════════════════════════════════════════════════════');
        console.error('[useUpdateBookingStatus] 💥 EXCEPTION CAUGHT');
        console.error('[useUpdateBookingStatus] Time elapsed:', errorDuration, 'ms');
        console.error('[useUpdateBookingStatus] Error:', error);
        if (error instanceof Error) {
          console.error('[useUpdateBookingStatus] Error message:', error.message);
          console.error('[useUpdateBookingStatus] Error stack:', error.stack);
        }
        console.error('═══════════════════════════════════════════════════════════');
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[useUpdateBookingStatus] ✅ Mutation success, invalidating queries...');
      queryClient.invalidateQueries({ queryKey: ['callerLaborer'] });
      queryClient.invalidateQueries({ queryKey: ['booking'] });
    },
    onError: (error) => {
      console.error('[useUpdateBookingStatus] ❌ Mutation error:', error);
    },
  });
}

export function useUpdateBookingDetails() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, details }: { bookingId: bigint; details: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateBookingDetails(bookingId, details);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callerLaborer'] });
      queryClient.invalidateQueries({ queryKey: ['booking'] });
    },
  });
}

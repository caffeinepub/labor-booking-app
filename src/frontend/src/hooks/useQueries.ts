import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
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
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerLaborer();
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingInput: BookingInput): Promise<bigint> => {
      console.log('[useCreateBooking] Mutation started at:', new Date().toISOString());
      console.log('[useCreateBooking] Request payload:', {
        targetLaborer: bookingInput.targetLaborer.toString(),
        serviceType: bookingInput.serviceType,
        dateTime: bookingInput.dateTime.toString(),
        durationHours: bookingInput.durationHours.toString(),
        location: bookingInput.location,
        details: bookingInput.details,
      });

      if (!actor) {
        console.error('[useCreateBooking] Actor not available');
        throw new Error('Actor not available');
      }

      console.log('[useCreateBooking] Actor available, initiating backend call...');

      // Create a timeout promise (10 seconds)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          console.error('[useCreateBooking] Request timed out after 10 seconds');
          reject(new Error('Request timed out after 10 seconds. The server may be busy. Please try again.'));
        }, 10000);
      });

      try {
        // Race between the actual call and the timeout
        console.log('[useCreateBooking] Racing between backend call and timeout...');
        const response: BookingResponse = await Promise.race([
          actor.createBooking(bookingInput),
          timeoutPromise,
        ]);

        console.log('[useCreateBooking] Response received:', response);

        // Handle the discriminated union response
        if (response.__kind__ === 'ok') {
          console.log('[useCreateBooking] Success! Booking ID:', response.ok.toString());
          return response.ok;
        } else if (response.__kind__ === 'laborerNotFound') {
          console.error('[useCreateBooking] Error: Laborer not found');
          throw new Error('The selected laborer could not be found. Please try selecting a different laborer.');
        } else if (response.__kind__ === 'callerNotAuthorizedToBook') {
          console.error('[useCreateBooking] Error: Caller not authorized');
          throw new Error('You are not authorized to create bookings. Please log in and try again.');
        } else if (response.__kind__ === 'invalidFieldValues') {
          console.error('[useCreateBooking] Error: Invalid field values');
          throw new Error('Invalid booking details. Please check that all fields are filled correctly.');
        } else {
          console.error('[useCreateBooking] Error: Unexpected response type:', response);
          throw new Error('An unexpected error occurred. Please try again.');
        }
      } catch (error) {
        console.error('[useCreateBooking] Exception caught:', error);
        if (error instanceof Error) {
          console.error('[useCreateBooking] Error message:', error.message);
          console.error('[useCreateBooking] Error stack:', error.stack);
        }
        throw error;
      }
    },
    onSuccess: (bookingId) => {
      console.log('[useCreateBooking] onSuccess callback - Booking created with ID:', bookingId.toString());
      queryClient.invalidateQueries({ queryKey: ['callerLaborer'] });
      queryClient.invalidateQueries({ queryKey: ['laborers'] });
    },
    onError: (error) => {
      console.error('[useCreateBooking] onError callback - Mutation failed:', error);
    },
    retry: (failureCount, error) => {
      console.log('[useCreateBooking] Retry attempt:', failureCount);
      
      // Don't retry on timeout errors
      if (error instanceof Error && error.message.includes('timed out')) {
        console.log('[useCreateBooking] Not retrying timeout error');
        return false;
      }
      
      // Don't retry on business logic errors
      if (error instanceof Error && (
        error.message.includes('not found') ||
        error.message.includes('not authorized') ||
        error.message.includes('Invalid')
      )) {
        console.log('[useCreateBooking] Not retrying business logic error');
        return false;
      }
      
      // Retry up to 2 times for other errors with exponential backoff
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => {
      const delay = Math.min(1000 * 2 ** attemptIndex, 5000);
      console.log('[useCreateBooking] Retry delay:', delay, 'ms');
      return delay;
    },
  });
}

export function useUpdateBookingStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: bigint; status: BookingStatus }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateBookingStatus(bookingId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callerLaborer'] });
      queryClient.invalidateQueries({ queryKey: ['laborers'] });
      queryClient.invalidateQueries({ queryKey: ['booking'] });
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
      queryClient.invalidateQueries({ queryKey: ['laborers'] });
      queryClient.invalidateQueries({ queryKey: ['booking'] });
    },
  });
}

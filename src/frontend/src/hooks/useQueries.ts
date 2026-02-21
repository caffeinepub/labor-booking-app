import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { LaborerInput, LaborerData, UserProfile, BookingInput, BookingStatus } from '../backend';

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
    mutationFn: async (bookingInput: BookingInput) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createBooking(bookingInput);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callerLaborer'] });
      queryClient.invalidateQueries({ queryKey: ['laborers'] });
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
    },
  });
}

import { BookingStatus, type Booking } from '../backend';

export function useBookingFilters() {
  const filterAndSortBookings = (
    bookings: Booking[],
    statusFilter: BookingStatus | 'all',
    sortOrder: 'newest' | 'oldest'
  ): Booking[] => {
    let filtered = bookings;

    if (statusFilter !== 'all') {
      filtered = bookings.filter((b) => b.status === statusFilter);
    }

    const sorted = [...filtered].sort((a, b) => {
      const aTime = Number(a.dateTime);
      const bTime = Number(b.dateTime);
      return sortOrder === 'newest' ? bTime - aTime : aTime - bTime;
    });

    return sorted;
  };

  return { filterAndSortBookings };
}

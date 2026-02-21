# Specification

## Summary
**Goal:** Fix the issue where outgoing service bookings are not appearing in the BookingsDashboard when a laborer creates a booking for another laborer (target laborer).

**Planned changes:**
- Add comprehensive debug logging to BookingsDashboard.tsx to track data flow, query refetch status, and booking classification logic
- Verify and fix query invalidation in the createBooking mutation to ensure automatic refetch after booking creation
- Investigate and resolve timing issues or race conditions preventing newly created outgoing bookings from displaying immediately
- Fix the booking classification logic to correctly identify and display bookings where the current user is the requester

**User-visible outcome:** When a laborer creates a booking request for another laborer, the booking immediately appears in their outgoing requests section without requiring a manual page refresh.

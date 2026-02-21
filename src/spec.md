# Specification

## Summary
**Goal:** Add unique labour IDs and mobile number fields to laborer profiles, display contact information throughout the app, and fix the issue where outgoing bookings don't appear after creation.

**Planned changes:**
- Add unique labour ID field to Laborer type with automatic sequential generation (LAB-00001, LAB-00002, etc.)
- Add mobile number field to Laborer type with basic validation
- Display labour ID (read-only) on profile page
- Add mobile number input field to profile form
- Show mobile numbers on discovery page laborer cards
- Display both provider and requester mobile numbers on booking detail page
- Debug and fix outgoing bookings display issue in BookingsDashboard
- Add comprehensive logging to outgoing bookings filtering and rendering flow
- Verify createBooking mutation properly invalidates query cache for immediate display

**User-visible outcome:** Each laborer has a unique labour ID and mobile number on their profile. Contact information is visible on discovery cards and booking details for easy communication. Newly created bookings appear immediately in the outgoing requests section without requiring manual refresh.

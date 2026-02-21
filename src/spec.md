# Specification

## Summary
**Goal:** Fix the "labour not found" error on the booking creation page.

**Planned changes:**
- Debug and fix the laborer data fetching logic in CreateBookingPage.tsx
- Verify laborId parameter is correctly extracted from URL and passed to backend
- Add comprehensive error logging to track laborId value, query execution, and backend responses
- Verify backend getLaborerById function properly retrieves laborer data for valid Principal IDs
- Ensure appropriate error handling displays user-friendly messages for invalid or missing laborIds

**User-visible outcome:** Users can successfully view laborer information when creating a booking, with no "labour not found" errors appearing for valid laborers.

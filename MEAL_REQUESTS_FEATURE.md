# Meal Requests Feature (Issue 5.3)

## Overview

The Meal Requests Queue allows household members to request meals for planning and enables triage of those requests.

## Accessing the Feature

**URL**: `/requests`

Since global navigation is not yet implemented in the app, access the feature by navigating directly to:

- `http://localhost:3000/requests` (development)
- `https://your-domain.com/requests` (production)

## Features

### Status Workflow

1. **`open`** (default) - New request awaiting triage
2. **`planned`** - Added to calendar
3. **`dismissed`** - Rejected without planning

### Functionality

- ✅ Add meal request (recipe + date + meal slot + notes)
- ✅ Filter by status (All / Open / Planned / Dismissed)
- ✅ Adjust priority (up/down arrows)
- ✅ Add to calendar (creates calendar entry + updates status to 'planned')
- ✅ Dismiss request (updates status to 'dismissed')
- ✅ View requester name on each request
- ✅ Sorted by priority (DESC), requested date (ASC), created at (ASC)

### Validation

- Must provide either a recipe OR notes (enforced at service layer)
- Date and meal slot are required
- Notes max 500 characters

## Database Migration

✅ **Migration Applied**: The migration `20260121000003_add_meal_request_status_priority.sql` has been successfully applied to the remote database.

This migration added:

- `status` enum column (open/planned/dismissed)
- `priority` integer column for manual ordering
- `updated_at` timestamp with automatic trigger
- Indexes for efficient filtering and sorting

## Components

### Service Layer

- `MealRequestService` - CRUD operations + addToCalendar
- Tests: `MealRequestService.test.ts` (12 passing tests, 100% coverage)

### Client Hooks

- `useMealRequests` - State management with optimistic updates
- Tests: `useMealRequests.test.ts` (10 passing tests)

### UI Components

- `AddMealRequestDialog` - Form to add new requests
- `MealRequestList` - List container with empty state
- `MealRequestListItem` - Individual request with actions
- `MealRequestFilterBar` - Status filter tabs

### Page

- `/requests/page.tsx` - Main requests page

### Server Actions

- `createMealRequest()`
- `updateMealRequestStatus()`
- `updateMealRequestPriority()`
- `addMealRequestToCalendar()`
- `deleteMealRequest()`

## Design System Compliance

All components follow DESIGN_SYSTEM.md:

- ✅ Material UI components only
- ✅ 3 button variants (contained primary, outlined primary, contained error)
- ✅ 4 typography variants (h5, h6, body1, body2)
- ✅ Allowed spacing values (4, 8, 16, 24, 32, 48)
- ✅ Theme color palette only
- ✅ Elevation ≤ 2
- ✅ No emojis
- ✅ Material Icons (@mui/icons-material)
- ✅ Calm, neutral tone

## Future Navigation Integration

When global navigation is implemented, add a link to `/requests`:

```tsx
import { FormatListBulleted as RequestsIcon } from '@mui/icons-material';

<Link href="/requests">
  <ListItemButton>
    <ListItemIcon>
      <RequestsIcon />
    </ListItemIcon>
    <ListItemText primary="Requests" />
  </ListItemButton>
</Link>;
```

Suggested icon: `FormatListBulleted` or `Assignment` from `@mui/icons-material`

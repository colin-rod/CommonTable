# QA Flows - CommonTable

This document contains critical user flows for manual testing before each release. All flows must pass before deploying to production.

---

## How to Use This Document

1. **Before Each Release**: Complete all flows in this document
2. **Check Each Step**: Mark checkboxes as you validate each step
3. **Report Issues**: Create Linear issues for any failures
4. **Block Release**: If any critical flow fails, block the release until fixed

---

## Authentication Flows

### Flow 1: Sign Up

**Objective**: New user can create an account

#### Steps
1. [ ] Navigate to `/signup` page
2. [ ] Enter valid email (e.g., `test+${timestamp}@example.com`)
3. [ ] Enter strong password (min 8 characters)
4. [ ] Click "Sign Up" button
5. [ ] Verify email confirmation sent (check inbox or Supabase email logs)
6. [ ] Click confirmation link in email
7. [ ] Verify redirected to onboarding or dashboard
8. [ ] Verify user session created (refresh page, still logged in)

#### Expected Results
- ✅ Account created in Supabase Auth
- ✅ Confirmation email sent
- ✅ User redirected after email confirmation
- ✅ Session persisted across page refreshes

#### Error Cases to Test
- [ ] Invalid email format (e.g., `notanemail`)
- [ ] Weak password (e.g., `123`)
- [ ] Duplicate email (sign up with same email twice)
- [ ] Network error during sign up (disconnect network)

---

### Flow 2: Login

**Objective**: Existing user can log in

#### Steps
1. [ ] Navigate to `/login` page
2. [ ] Enter valid email
3. [ ] Enter correct password
4. [ ] Click "Login" button
5. [ ] Verify redirected to dashboard
6. [ ] Verify session persisted (refresh page, still logged in)

#### Expected Results
- ✅ User authenticated
- ✅ Redirected to dashboard
- ✅ Session cookie set
- ✅ Session persists across page refreshes

#### Error Cases to Test
- [ ] Invalid email (email not in database)
- [ ] Wrong password
- [ ] Empty email or password
- [ ] Network error during login

---

### Flow 3: Logout

**Objective**: User can log out and session is cleared

#### Steps
1. [ ] Log in as valid user
2. [ ] Click "Logout" button
3. [ ] Verify redirected to `/login` page
4. [ ] Verify session cleared (cannot access `/dashboard` without redirect)
5. [ ] Attempt to navigate to protected route (e.g., `/recipes`)
6. [ ] Verify redirected back to `/login`

#### Expected Results
- ✅ User logged out
- ✅ Session cookie cleared
- ✅ Protected routes inaccessible
- ✅ User redirected to login

---

### Flow 4: Password Reset

**Objective**: User can reset forgotten password

#### Steps
1. [ ] Navigate to `/login` page
2. [ ] Click "Forgot password" link
3. [ ] Enter valid email
4. [ ] Click "Send reset email" button
5. [ ] Verify reset email sent (check inbox or Supabase logs)
6. [ ] Click reset link in email
7. [ ] Enter new password
8. [ ] Click "Reset password" button
9. [ ] Verify redirected to login page
10. [ ] Log in with new password
11. [ ] Verify login successful

#### Expected Results
- ✅ Reset email sent
- ✅ Reset link valid
- ✅ Password updated in Supabase Auth
- ✅ Can log in with new password

#### Error Cases to Test
- [ ] Email not in database (should still show success message for security)
- [ ] Expired reset link (test after token expiry time)
- [ ] Weak new password

---

## Household Management

### Flow 5: Create Household

**Objective**: New user can create their first household

#### Steps
1. [ ] Log in as new user (no household yet)
2. [ ] Complete onboarding flow (if exists)
3. [ ] Enter household name (e.g., "Smith Family")
4. [ ] Click "Create Household" button
5. [ ] Verify household appears in dashboard
6. [ ] Verify user is admin of household (check `household_members` table)

#### Expected Results
- ✅ Household created in database
- ✅ User added as admin
- ✅ Household ID set in user context
- ✅ Dashboard displays household name

---

### Flow 6: Invite Member

**Objective**: Admin can invite new member to household

#### Steps
1. [ ] Log in as household admin
2. [ ] Navigate to household settings or members page
3. [ ] Click "Invite Member" button
4. [ ] Enter invitee email (e.g., `invitee@example.com`)
5. [ ] Click "Send Invitation" button
6. [ ] Verify invitation email sent
7. [ ] **As invitee**: Check email and click invitation link
8. [ ] **As invitee**: Sign up or log in
9. [ ] **As invitee**: Accept invitation
10. [ ] Verify invitee appears in household members list

#### Expected Results
- ✅ Invitation created in database
- ✅ Invitation email sent
- ✅ Invitee can accept invitation
- ✅ Invitee added to household as member (not admin)

#### Error Cases to Test
- [ ] Non-admin tries to invite member (should fail)
- [ ] Invite already-existing member (should show error)

---

### Flow 7: Switch Households

**Objective**: User in multiple households can switch between them

#### Steps
1. [ ] User belongs to at least 2 households
2. [ ] Log in
3. [ ] Verify currently in Household A
4. [ ] Click household switcher
5. [ ] Select Household B
6. [ ] Verify context switched to Household B
7. [ ] Verify recipes from Household A are NOT visible
8. [ ] Verify recipes from Household B ARE visible

#### Expected Results
- ✅ Household context switches
- ✅ Data isolation enforced (RLS policies work)
- ✅ Only current household's data displayed

---

## Recipe Management

### Flow 8: Create Recipe

**Objective**: User can create a new recipe

#### Steps
1. [ ] Log in and navigate to `/recipes`
2. [ ] Click "Add Recipe" button
3. [ ] Fill in recipe details:
   - Title: "Pasta Carbonara"
   - Servings: 4
   - Ingredients:
     - Pasta, 400g
     - Eggs, 2
     - Bacon, 100g
   - Steps:
     - 1. Boil pasta
     - 2. Cook bacon
     - 3. Mix with eggs
4. [ ] Click "Save Recipe" button
5. [ ] Verify recipe appears in recipe list
6. [ ] Click on recipe to view detail page
7. [ ] Verify all fields display correctly

#### Expected Results
- ✅ Recipe created in database
- ✅ Initial version created (version_number = 1)
- ✅ Recipe visible in list
- ✅ Recipe detail page displays correctly

#### Error Cases to Test
- [ ] Empty title (should show validation error)
- [ ] No ingredients (should show validation error)
- [ ] No steps (should show validation error)

---

### Flow 9: Edit Recipe (Create New Version)

**Objective**: User can edit a recipe, creating a new version

#### Steps
1. [ ] Open existing recipe (e.g., "Pasta Carbonara")
2. [ ] Click "Edit" or "Improve Recipe" button
3. [ ] Modify ingredients (e.g., change bacon to pancetta)
4. [ ] Modify steps (e.g., add step "Add pepper")
5. [ ] Click "Save Changes" button
6. [ ] Verify new version created
7. [ ] Verify version number incremented (now version 2)
8. [ ] Verify previous version accessible in version history

#### Expected Results
- ✅ New recipe version created
- ✅ `current_version_id` updated to new version
- ✅ Previous version still in database
- ✅ Version number incremented correctly

---

### Flow 10: Delete Recipe

**Objective**: User can delete a recipe

#### Steps
1. [ ] Open recipe detail page
2. [ ] Click "Delete Recipe" button
3. [ ] Verify confirmation dialog appears
4. [ ] Click "Confirm Delete" button
5. [ ] Verify recipe removed from recipe list
6. [ ] Attempt to navigate to recipe detail page directly (e.g., `/recipes/{id}`)
7. [ ] Verify 404 or "Recipe not found" message displayed

#### Expected Results
- ✅ Recipe deleted from database (soft or hard delete)
- ✅ Recipe not visible in list
- ✅ Recipe detail page returns 404

#### Error Cases to Test
- [ ] Non-owner tries to delete recipe (should fail if ownership rules exist)

---

### Flow 11: View Recipe History

**Objective**: User can view previous versions of a recipe

#### Steps
1. [ ] Open recipe with multiple versions (e.g., "Pasta Carbonara" v2)
2. [ ] Navigate to version history or "View History" button
3. [ ] Verify all versions displayed (v1, v2)
4. [ ] Click on previous version (v1)
5. [ ] Verify v1 ingredients and steps displayed
6. [ ] (Optional) Compare v1 and v2 side-by-side

#### Expected Results
- ✅ All versions displayed
- ✅ Can view previous versions
- ✅ Previous versions are read-only (cannot edit)

---

### Flow 12: Fork Recipe

**Objective**: User can fork a recipe to create a new recipe

#### Steps
1. [ ] Open existing recipe (e.g., "Pasta Carbonara")
2. [ ] Click "Fork Recipe" button
3. [ ] Modify title (e.g., "Pasta Carbonara (Spicy)")
4. [ ] Modify ingredients (e.g., add chili flakes)
5. [ ] Click "Save as New Recipe" button
6. [ ] Verify new recipe created
7. [ ] Verify original recipe unchanged
8. [ ] (Optional) Verify fork relationship visible (if tracked)

#### Expected Results
- ✅ New recipe created
- ✅ Original recipe unchanged
- ✅ Fork metadata stored (if tracked in `recipe_forks` table)

---

## Calendar Management

### Flow 13: Add Recipe to Calendar

**Objective**: User can add a recipe to the meal calendar

#### Steps
1. [ ] Navigate to `/calendar` page
2. [ ] Click on a future date
3. [ ] Select recipe from list (e.g., "Pasta Carbonara")
4. [ ] Choose meal slot (e.g., "Dinner")
5. [ ] Click "Add to Calendar" button
6. [ ] Verify recipe appears on calendar on selected date

#### Expected Results
- ✅ Calendar entry created in database
- ✅ Recipe displayed on calendar
- ✅ Correct date and meal slot

---

### Flow 14: Move Calendar Entry

**Objective**: User can reschedule a calendar entry

#### Steps
1. [ ] Navigate to `/calendar` page
2. [ ] Locate existing calendar entry
3. [ ] **Option A (Drag-Drop)**: Drag entry to new date
4. [ ] **Option B (Edit)**: Click entry, change date, save
5. [ ] Verify entry moved to new date
6. [ ] Verify entry removed from old date

#### Expected Results
- ✅ Calendar entry updated in database
- ✅ Entry appears on new date
- ✅ Entry removed from old date

---

### Flow 15: Remove Calendar Entry

**Objective**: User can remove a recipe from the calendar

#### Steps
1. [ ] Navigate to `/calendar` page
2. [ ] Click on calendar entry
3. [ ] Click "Delete" or "Remove" button
4. [ ] Verify confirmation dialog appears
5. [ ] Click "Confirm Delete" button
6. [ ] Verify entry removed from calendar

#### Expected Results
- ✅ Calendar entry deleted from database
- ✅ Entry not visible on calendar

---

### Flow 16: Mark Recipe as Cooked

**Objective**: User can mark a calendar entry as cooked

#### Steps
1. [ ] Navigate to `/calendar` page
2. [ ] Click on today's calendar entry
3. [ ] Click "Mark as Cooked" button
4. [ ] Verify `last_cooked_at` timestamp updated on recipe
5. [ ] Verify cooking event created in database
6. [ ] (Optional) Rating prompt displayed

#### Expected Results
- ✅ `recipes.last_cooked_at` updated
- ✅ Cooking event created
- ✅ Calendar entry marked as cooked

---

## Offline/PWA Functionality

### Flow 17: Offline Mode

**Objective**: App works offline and syncs when back online

#### Steps
1. [ ] Load app while online
2. [ ] Navigate to `/recipes` page
3. [ ] **Disconnect network** (turn off Wi-Fi or enable airplane mode)
4. [ ] Navigate to recipe list (should load from cache/IndexedDB)
5. [ ] Click on recipe to view details (should load from IndexedDB)
6. [ ] Create new recipe or edit existing recipe
7. [ ] Verify action queued for sync (not immediate error)
8. [ ] **Reconnect network**
9. [ ] Verify changes synced to Supabase automatically

#### Expected Results
- ✅ App loads offline (from service worker cache)
- ✅ Recipe data accessible offline (from IndexedDB)
- ✅ Mutations queued while offline
- ✅ Queued mutations synced when online

#### Error Cases to Test
- [ ] Network disconnects mid-operation (during recipe creation)

---

### Flow 18: Install PWA

**Objective**: User can install PWA on mobile or desktop

#### Steps
1. [ ] Visit app in Chrome or Safari
2. [ ] Look for "Add to Home Screen" or "Install" prompt
3. [ ] Click "Install" button
4. [ ] Verify app installed on home screen or desktop
5. [ ] Launch PWA from home screen/desktop
6. [ ] Verify app opens in standalone mode (no browser chrome)
7. [ ] Verify app icon and name correct

#### Expected Results
- ✅ PWA installable
- ✅ App launches in standalone mode
- ✅ Correct icon and name displayed

---

## Sync & Conflict Resolution

### Flow 19: Multi-Device Sync

**Objective**: Changes on one device appear on another device

#### Steps
1. [ ] **Device A**: Create recipe "Test Recipe"
2. [ ] Wait for sync (should be automatic)
3. [ ] **Device B**: Open app or refresh page
4. [ ] Verify "Test Recipe" appears on Device B

#### Expected Results
- ✅ Changes on Device A synced to Supabase
- ✅ Device B pulls changes from Supabase
- ✅ Recipe visible on both devices

---

### Flow 20: Conflict Resolution (Concurrent Edits)

**Objective**: Conflicts are detected and resolved when same recipe edited on multiple devices

#### Steps
1. [ ] **Device A**: Go offline
2. [ ] **Device A**: Edit recipe "Pasta Carbonara" (change ingredient to "500g pasta")
3. [ ] **Device B**: Go offline
4. [ ] **Device B**: Edit same recipe (change ingredient to "450g pasta")
5. [ ] **Device A**: Go online (sync occurs)
6. [ ] **Device B**: Go online (sync occurs, conflict detected)
7. [ ] Verify conflict detected
8. [ ] Verify conflict resolution strategy applied (e.g., last-write-wins, manual merge UI)

#### Expected Results
- ✅ Conflict detected when both devices sync
- ✅ Conflict resolution strategy applied
- ✅ Final state consistent across both devices

---

## Search & Filtering

### Flow 21: Search Recipes

**Objective**: User can search for recipes by title or ingredients

#### Steps
1. [ ] Navigate to `/recipes` page
2. [ ] Enter search term in search bar (e.g., "pasta")
3. [ ] Verify results filtered in real-time
4. [ ] Verify only recipes matching "pasta" displayed
5. [ ] Click on search result
6. [ ] Verify navigated to recipe detail page

#### Expected Results
- ✅ Search filters results in real-time
- ✅ Only matching recipes displayed
- ✅ Can click result to view detail

#### Edge Cases to Test
- [ ] Search with no results (e.g., "xyz123")
- [ ] Search with special characters (e.g., "pasta & bacon")

---

### Flow 22: Filter Recipes

**Objective**: User can filter recipes by category or metadata

#### Steps
1. [ ] Navigate to `/recipes` page
2. [ ] Apply filter (e.g., "Recently Cooked" or "Favorites")
3. [ ] Verify filtered results displayed
4. [ ] Verify only recipes matching filter criteria shown
5. [ ] Clear filter
6. [ ] Verify all recipes displayed again

#### Expected Results
- ✅ Filters apply correctly
- ✅ Only matching recipes displayed
- ✅ Clearing filter shows all recipes

---

## Error Handling

### Flow 23: Network Error

**Objective**: App handles network errors gracefully

#### Steps
1. [ ] Start creating a recipe
2. [ ] **Disconnect network** mid-operation
3. [ ] Click "Save Recipe" button
4. [ ] Verify error message displayed
5. [ ] Verify error message is calm and neutral (no emojis)
6. [ ] Verify retry option available
7. [ ] **Reconnect network**
8. [ ] Click "Retry" button
9. [ ] Verify recipe saved successfully

#### Expected Results
- ✅ Error message displayed
- ✅ Error message is calm and neutral
- ✅ Retry option available
- ✅ Operation succeeds after retry

---

### Flow 24: Validation Error

**Objective**: App validates user input and shows helpful errors

#### Steps
1. [ ] Navigate to "Add Recipe" page
2. [ ] Leave title field empty
3. [ ] Click "Save Recipe" button
4. [ ] Verify validation error displayed (e.g., "Recipe title is required")
5. [ ] Verify error message is short and neutral
6. [ ] Verify form NOT submitted
7. [ ] Fill in title
8. [ ] Click "Save Recipe" button
9. [ ] Verify recipe saved successfully

#### Expected Results
- ✅ Validation error displayed
- ✅ Error message is short and neutral
- ✅ Form not submitted when invalid

---

### Flow 25: 404 Not Found

**Objective**: App handles missing resources gracefully

#### Steps
1. [ ] Navigate to non-existent recipe (e.g., `/recipes/invalid-id-123`)
2. [ ] Verify "Recipe not found" message displayed
3. [ ] Verify user can navigate back (browser back button or "Go Back" link)

#### Expected Results
- ✅ 404 message displayed
- ✅ Message is calm and neutral
- ✅ User can navigate back

---

## Performance Testing

### Flow 26: Large Recipe List Performance

**Objective**: App performs well with large datasets

#### Steps
1. [ ] Create or seed database with 100+ recipes
2. [ ] Navigate to `/recipes` page
3. [ ] Verify page loads in <2 seconds
4. [ ] Scroll through recipe list
5. [ ] Verify smooth scrolling (60fps or close)
6. [ ] Search for recipe
7. [ ] Verify search results appear in <500ms

#### Expected Results
- ✅ Page loads quickly even with large datasets
- ✅ Smooth scrolling
- ✅ Fast search

---

## Accessibility Testing

### Flow 27: Keyboard Navigation

**Objective**: App is fully navigable via keyboard

#### Steps
1. [ ] Navigate to `/recipes` page
2. [ ] Use **Tab** key to navigate through UI
3. [ ] Verify focus indicators visible on all interactive elements
4. [ ] Use **Enter** or **Space** to activate buttons
5. [ ] Verify all actions accessible via keyboard

#### Expected Results
- ✅ All interactive elements focusable
- ✅ Focus indicators visible
- ✅ All actions accessible via keyboard

---

### Flow 28: Screen Reader Compatibility

**Objective**: App is usable with screen readers

#### Steps
1. [ ] Enable screen reader (VoiceOver on macOS/iOS, TalkBack on Android)
2. [ ] Navigate to `/recipes` page
3. [ ] Verify recipe titles announced correctly
4. [ ] Navigate to recipe detail page
5. [ ] Verify ingredients and steps announced correctly
6. [ ] Verify buttons have descriptive labels

#### Expected Results
- ✅ All content announced correctly
- ✅ Buttons have descriptive labels
- ✅ Screen reader can navigate all content

---

## Summary

**Total Flows**: 28

**Critical Flows** (must pass before release):
- Authentication (Flows 1-4)
- Create Recipe (Flow 8)
- View Recipe (part of Flow 8)
- Add Recipe to Calendar (Flow 13)
- Offline Mode (Flow 17)

**Nice-to-Have Flows** (can defer if time-constrained):
- Fork Recipe (Flow 12)
- Conflict Resolution (Flow 20)
- Screen Reader Compatibility (Flow 28)

---

## Related Documentation

- [Release Checklist](./RELEASE_CHECKLIST.md)
- [Definition of Done](./DEFINITION_OF_DONE.md)
- [Migration & Rollback Procedures](./MIGRATION_ROLLBACK.md)
- [Development Guide](./claude.md)

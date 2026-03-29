

# Fix: SchoolSetup Must Create Verification Request

## Problem
`SchoolSetup.tsx` (line 84-95) directly updates the profile with `role` and `district_id` and then redirects to the dashboard. It never:
1. Creates an `account_verification_request` row
2. Sets `is_verified = false`
3. Redirects to `/pending-verification`

So users who go through the SchoolSetup flow completely bypass admin verification and never show up in the Account Verification Requests panel.

## Fix

### `src/pages/SchoolSetup.tsx`
Replace the `handleSubmit` logic (lines 79-117):

1. After updating the profile with role + district_id, also ensure `is_verified` is set to `false`
2. Look up the district name from the local `districts` array using the selected `district_code`
3. Insert a row into `account_verification_requests` with status `pending`, including `user_id`, `profile_id`, `district_id`, `district_name`, `full_name` (from profile), `email` (from auth user), and `requested_role`
4. Redirect to `/pending-verification` instead of the dashboard
5. Show a toast saying "Your account is pending approval from your district administrator"

The updated flow:
```text
User selects role + district → profile updated (is_verified=false) 
→ verification request created → redirect to /pending-verification
```

No other files need changes — the `AccountVerificationRequests` admin component already queries pending requests correctly.


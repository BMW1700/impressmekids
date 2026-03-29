

# Plan: Deny = Reset School Setup, Not Delete Account

## Problem
When an admin denies a verification request, the current code deletes the user's entire account via the `delete-user-account` edge function. Instead, it should just deny the request and reset the user's school profile so they can re-do school setup.

## Changes

### `src/components/admin/AccountVerificationRequests.tsx`
In the `denyMutation` (lines 107-135):

1. **Remove** the call to `supabase.functions.invoke('delete-user-account', ...)` (lines 122-126)
2. **Add** a profile reset: update the user's profile to clear `role`, `district_id`, `district_name`, and set `is_verified` to `false`
3. **Remove** the user's entry from `user_roles` table
4. Update the success toast to say "Account request denied. The user can re-submit with different details."
5. Rename button label from "Deny & Delete" to "Deny"

This way, the denied user's account stays intact. Next time they try to access school mode, `RequireSchoolProfile` will redirect them to `/school/setup` since their role and district are cleared.


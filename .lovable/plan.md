## Goal
Give `a@gmail.com` super_admin access so they can open `/super-admin` and upload new Nabu videos.

## Steps

1. **Look up the user** in `auth.users` by email `a@gmail.com`.
   - If not found: stop and tell the user the account must sign up first.
2. **Insert a `user_roles` row** with `role = 'super_admin'` for that user_id (ON CONFLICT DO NOTHING so it's idempotent).
3. **Log the grant** in `security_audit_log` (`action_type = 'super_admin_granted'`) for the audit trail.

## What the user will be able to do after this
- Visit `/super-admin` → dashboard loads (gated by `useIsSuperAdmin`).
- Open `/super-admin/prek` → manage Pre-K worlds.
- Drill into a world → manage levels and upload new videos for Nabu (opening/closing clips + per-word prompt/action clips) via the existing level builder.

## Not in scope
- No code changes — the super_admin role, route guards (`RequireSuperAdmin`), CMS pages, and video upload pipeline already exist.
- Password is not changed; `a@gmail.com` keeps its current password.

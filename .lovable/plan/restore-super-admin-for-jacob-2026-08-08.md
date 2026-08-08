# Restore Super Admin for Jacob

Ignore the earlier App Store plan — this is the only item here.

## What I found

`jacob.besser0@gmail.com` exists, but his role is currently **student** in both
places that matter: his profile record and his role record. That is why the
Super Admin icon vanished — the app looks for `super_admin` and finds `student`.

Each user has exactly one role, so this is a role change, not an addition.

## The fix

One data change, no code:

1. Change his role record from `student` to `super_admin`.
2. Update his profile role to `super_admin` so both stay in sync.

## After it lands

He signs out and back in once. The Super Admin card appears on the home screen,
giving him Pre-K Worlds access to add more Benny videos.

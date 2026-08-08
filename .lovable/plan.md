# Restore Super Admin for Jacob

## What I found

Jacob's account (`jacob.besser0@gmail.com`) exists, but his role is currently
**student** in both places that matter:

- his profile record says `student`
- his role record says `student`

That is exactly why the Super Admin icon disappeared — the app checks the role
record for `super_admin`, finds `student`, and hides the entry point.

There is only ever one role per user, so this is a role change, not an addition.

## The fix

One data change, no code:

1. Change his role record from `student` to `super_admin`.
2. Change his profile role to `super_admin` so both stay in sync.

## After it lands

He signs out and back in once. The Super Admin card then appears on the home
screen, giving him access to Pre-K Worlds where the Benny videos are added.

## Note

Super admin is full platform access — content management across every world,
plus site-wide settings. Confirming that is what you want for him.

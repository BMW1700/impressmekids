

# Remove Remaining "ImpressMe" References

## File 1: `public/sw.js` (User-Facing — Priority)
- Rename cache: `impressme-kids-v2` → `nabulearn-v2`
- Update comment: "Service Worker for ImpressMe Kids" → "Service Worker for NabuLearn"
- Update default push notification title: `'ImpressMe Kids'` → `'NabuLearn'`

## File 2: `supabase/migrations/20251001163755_...sql` (Internal Only)
- Update seed email domains: `@impressme.com` → `@nabulearn.com`
- This is a historical migration so it won't re-run, but keeps the codebase clean

Two files, ~10 line changes total.


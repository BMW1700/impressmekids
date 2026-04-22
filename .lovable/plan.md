

## Quick Answers

**1. "Open the Bulk Import UI" — already exists?**
Yes. It's live at **Admin Dashboard → "Import" tab** (`src/components/admin/BulkStudentImport.tsx`, mounted in `AdminDashboard.tsx` line 473–475). Any logged-in admin can drop a CSV (`email, full_name, classroom_code, grade`) and it pipes through the `bulk-create-students` edge function we hardened last round. **No new UI needed for the smoke test** — you can run the live-fire test from your existing admin account in 60 seconds.

**2. Toggle the "blocker code" (DemoGate / `Brecon50` / "Private Preview" screen) on/off — possible?**
Yes, completely. Today it's hardcoded in `src/components/DemoGate.tsx` and gates everyone who hasn't typed `Brecon50`. We'll convert it into a global, server-driven kill-switch that Ben can flip from his student account.

---

## Plan — Global DemoGate kill-switch

### Database (1 migration)
- New table `app_settings` (singleton, `id=1`)
  - `demo_gate_enabled boolean default true`
  - `updated_at`, `updated_by`
- RLS:
  - Anyone authenticated → `SELECT` (gate needs to read it before login too — public read is fine, no PII)
  - `UPDATE` → only `benmaxweiner@gmail.com` (matched by `auth.email()`) **OR** any user with `admin` role
- Seed row: `(1, true)` so behavior is unchanged on day one

### DemoGate component refactor
- Replace `localStorage`-only check with: `if (settings.demo_gate_enabled === false) → render children directly`
- Keeps the Brecon50 fallback for when it's enabled (no regression)
- Subscribes to realtime on `app_settings` so flipping the toggle updates every open tab in <1s
- Loading state: render children optimistically (don't block paint) while fetching — falls back to gate only if fetch confirms `enabled=true`

### Ben's student dashboard — new "Site Settings" tab
- Add one entry to `StudentDashboardSidebar.tsx` sections array, **conditionally rendered only when `user.email === 'benmaxweiner@gmail.com'`**
  - `{ id: "site-settings", label: "Site Settings", icon: Shield, color: "from-red-500 to-orange-500" }`
- New `src/components/student/sections/SiteSettingsSection.tsx`:
  - Single big toggle: "Show 'Private Preview' access code screen to all visitors"
  - Status indicator (green = gate off / public, red = gate on / locked)
  - Last-changed timestamp + who changed it
  - Calls `UPDATE app_settings SET demo_gate_enabled = ... WHERE id = 1`
- Wire it into the section switcher in `StudentDashboard.tsx`

### What this gives you
- Ben logs into his student account → sees a red-shield "Site Settings" tab nobody else sees
- One click flips the gate for everyone, everywhere, instantly (realtime)
- Safe to flip back on for demos, off for pilots, no redeploy needed
- Admins keep the same power as a backup
- Brecon50 still works as the unlock when the gate is on

### Out of scope
- No changes to Bulk Import (already shipped)
- No changes to email/Capacitor/auth/RLS elsewhere
- No new routes — uses the existing student dashboard section pattern

### Time
~15 min, fully autonomous.


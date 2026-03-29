

# Plan: School Mode Requires Role + District; Game Mode Does Not

## Summary
Users without a role and district can freely use Game Mode. When they try to access School Mode protected pages, they get prompted to select a role and district before proceeding.

## Changes

### 1. Create `src/components/auth/RequireSchoolProfile.tsx`
A new route guard wrapper (like RequireAuth but stricter) used only around school-mode protected routes. It checks:
- If user has a valid school role (teacher/student/parent/admin/district_admin) AND a district_id → allow through
- If user is missing role or district_id → redirect to a new `/school/setup` page where they pick role + district
- Game players without school profile get redirected to setup if they want school access

### 2. Create `src/pages/SchoolSetup.tsx`
A simple page (matching app theme) that shows:
- Role selection buttons (Student, Parent, Teacher, Admin) — reusing the same UI pattern from Auth.tsx
- District selection dropdown (reusing DistrictCombobox)
- On submit: updates the user's profile with the selected role and district, then redirects to appropriate dashboard
- If user already has role+district, auto-redirect to dashboard

### 3. Update `src/App.tsx` routing
- Wrap all school-mode protected routes (teacher/*, student/*, parent/*, admin/*, district/*) in a new `<RequireSchoolProfile />` layout route nested inside `<RequireAuth />`
- Game mode routes (`/game/dashboard`, `/game/play`, `/game/analytics`) stay under just `<RequireAuth />` — no school profile needed
- Add `/school/setup` as a protected route (requires auth but not school profile)

### 4. Update `src/components/auth/RequireAuth.tsx`
- No changes needed for game mode redirect logic — it already redirects game routes to `/game/auth`

## Route Structure After Changes

```text
<RequireAuth>
  /school/setup        → SchoolSetup (pick role + district)
  /game/dashboard      → GameDashboard (no school profile needed)
  /game/play           → GamePlay
  /game/analytics      → GameAnalytics

  <RequireSchoolProfile>
    /teacher/*          → requires role + district
    /student/*          → requires role + district
    /parent/*           → requires role + district
    /admin/*            → requires role + district
    /district/*         → requires role + district
    /calendar, /games/* → requires role + district
  </RequireSchoolProfile>
</RequireAuth>
```

## Files
1. `src/components/auth/RequireSchoolProfile.tsx` — **new** — checks role + district_id, redirects to `/school/setup`
2. `src/pages/SchoolSetup.tsx` — **new** — role + district selection page
3. `src/App.tsx` — nest school routes under RequireSchoolProfile, keep game routes under just RequireAuth


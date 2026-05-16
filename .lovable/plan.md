## What's actually wrong

The last "fix" in `src/pages/game/GameAuth.tsx` changed `<IdentityInput/>` and `<LoginModeToggle/>` from JSX components to function calls (`{IdentityInput({ idPrefix: "login" })}`). That pattern works *most* of the time but is fragile here for two reasons that combine to break input on the small viewport you're using (622px wide):

1. **Inner-function identity inputs** — `IdentityInput` is redeclared every render of `GameAuth`. Every keystroke triggers a re-render → a brand-new function instance → React still reconciles the DOM `<input>`, but during the same render the freshly-created `onChange` closure captures the *previous* `studentIdInput` value when paired with React 18's automatic batching + the controlled-input + `maxLength={8}` + value-sanitizer combo. On fast typing the sanitizer (`e.target.value.replace(/\D/g, '')`) wins races against the controlled value, which is why one keystroke "sticks" and the next one looks dropped. The robust fix is to stop nesting these as functions and inline the inputs directly in each tab.
2. **Full-bleed decorative overlay swallows taps** — line 289 has `<div className="absolute inset-0 bg-[url(...)] opacity-20" />` with **no `pointer-events-none`**. The form has `relative z-10` so it *paints* above the overlay, but on Safari/iPad and inside the Lovable preview iframe the overlay still intercepts the first tap on focusable elements that sit inside `backdrop-blur` cards. That matches your "can't even click into it" report.

## The fix (UI-only, no auth or business logic changes)

Edit only `src/pages/game/GameAuth.tsx`:

### 1. Kill the nested render helpers

Delete the `LoginModeToggle = () => (...)` and `IdentityInput = ({ idPrefix }) => (...)` definitions (lines 227–285).

### 2. Inline the toggle + identity input in both tabs

In the **Login** tab `<CardContent>` (around lines 316–318) and the **Sign Up** tab `<CardContent>` (around lines 360–378), paste the toggle JSX and the email-or-student-id input JSX directly. Same markup as today, but written once per tab with stable `id` attributes (`login-email`/`login-student-id` and `signup-email`/`signup-student-id`).

This is the React-canonical pattern and the one that actually survives re-render on every keystroke.

### 3. Make the decorative overlay non-interactive

Line 289 — add `pointer-events-none`:
```tsx
<div className="absolute inset-0 bg-[url('...')] opacity-20 pointer-events-none" />
```

### 4. Defensive input hardening for the Student ID field

On the `<Input>` for Student ID (both tabs):
- Add `autoComplete="off"` and `autoCorrect="off"` so iOS/Safari and 1Password don't fight the field.
- Replace `onChange={(e) => setStudentIdInput(e.target.value.replace(/\D/g, ''))}` with a slightly safer version that reads `e.currentTarget.value` and only updates state if the sanitized value actually changed (prevents an extra render that can re-collide with the next keystroke on slow devices):
  ```tsx
  onChange={(e) => {
    const next = e.currentTarget.value.replace(/\D/g, '').slice(0, 8);
    setStudentIdInput((prev) => (prev === next ? prev : next));
  }}
  ```

### 5. Sanity-check the other auth page

`src/pages/Auth.tsx` already inlines its Student ID input directly in the JSX (lines 1206–1244, 1404–1443) — no nested helper, no overlay. It's fine and doesn't need changes. The "both pages" you experienced are the **Login tab and Sign Up tab of `/game/auth`**, both of which share the same broken `IdentityInput` helper. The single edit above fixes both tabs at once.

## Out of scope (intentionally)

- No DB, auth, edge function, or RLS changes
- No changes to `src/pages/Auth.tsx`
- No changes to rate-limit, synthetic email mapping, or sign-up logic
- No styling redesign — visuals stay identical

## Files touched

- `src/pages/game/GameAuth.tsx` (single file, ~3 small edits)

## Verification after implementation

1. Open `/game/auth` in the preview at 622px wide.
2. Switch to Student ID, click into the field — focus ring appears on first click.
3. Type `12345678` at normal speed — all 8 digits appear in one fluid pass, Login button enables.
4. Switch to Sign Up tab, repeat — same behavior in the Player Name, Student ID, Class Code, and Password fields.
5. Submit — handler runs (the network call itself was never the bug).

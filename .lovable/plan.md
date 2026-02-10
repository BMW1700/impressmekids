

# Demo Access Gate Implementation

## Overview
Lock the entire app behind a passcode screen. No one can see anything until they enter the credentials.

## Credentials
- **Username:** Brecon69
- **Password:** Jordansucks22

## Changes

### 1. New File: `src/components/DemoGate.tsx`
- Full-screen lock screen with username and password fields
- Branded with "Impress Me Kids" styling
- On correct entry, sets `localStorage` flag (`imk_demo_access`) so the user doesn't have to re-enter on refresh
- Case-sensitive credential check
- Shows error on wrong credentials
- Uses existing UI components (Card, Input, Button, Label)

### 2. Modified File: `src/App.tsx`
- Import `DemoGate`
- Wrap the entire app content (everything inside the outermost `ThemeProvider`) with `<DemoGate>`
- This blocks ALL routes (landing page, auth, dashboards, everything) until credentials are entered

## Removal
When you're ready to open the app back up, I remove the `<DemoGate>` wrapper from `App.tsx` and delete the component file.


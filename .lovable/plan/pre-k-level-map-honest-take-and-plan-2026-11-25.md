# Pre-K level map: honest take and plan

## My take
The design is a big improvement. Going from 28 huge "world" cards to a compact numbered grid is the right move. It scales, kids can find levels, and it feels like a real game. Benny and the bedroom stay. One thing in the image is off: it says "8 / 30" and shows 30 levels, but you have 28 published levels right now, so the first section would show 28.

The **$2.99-per-section payments** are the risky part:
- **iPhone app:** Apple requires its own in-app purchase for digital lessons and takes 15–30%. A card checkout inside the app gets rejected. The app currently hides all pricing for exactly this reason.
- **Kids' privacy laws (COPPA):** a kid can't be the one paying. A parent check ("grown-ups only" gate) is needed before checkout.
- **Your school pricing** is per student per year. Selling sections to families is a new second business model. That's fine, but it should be a deliberate choice.

So I'd ship the new map first and add payments as a separate phase.

## Phase 1: new level map (no payments)
1. Replace the Pre-K world cards with the level-map grid: 5 columns on desktop, fewer on iPad and phone. Benny stays on the left. Section and stage dropdowns go at the top.
2. Put all 28 published levels into Section 1, numbered in their current order. Admins can reorder them and name sections.
3. Real status on every tile:
   - green check when passed
   - soft coral with "Try again!" when attempted but not passed
   - purple when not tried yet
   The best result is always kept.
4. Hover or tap shows a bubble with the level name and "Tap to open", like in your image. Tapping opens the same lesson as today.
5. A section progress bar based on real results.
6. Kindergarten and up (the RPG) stays exactly as it is.

## Phase 2: section unlocks (separate approval)
- The first 3 levels of each section are free. The rest unlock with one purchase per section, with a lock icon on locked tiles.
- Website: card checkout. iPhone: Apple in-app purchase. Both behind a parent gate.
- Purchases are checked on the server and never trusted from the device.

## Technical details
- Results are already saved per child (best stars and best score). Add a table of every attempt plus a pass flag, so the coral "failed" state is real data and replays never lower the best result.
- Add Pre-K sections (name, order) and a level order within each section. Existing worlds stay in the database so nothing breaks.
- The new grid replaces the Pre-K world cards only. The lesson player, video editor and redub tools stay untouched.

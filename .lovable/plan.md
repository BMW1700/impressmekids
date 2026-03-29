

# Add RPG Demo to School Interactive Demos Page

## Change
Add the RPG Game Demo as a 5th card on the `/demos` page alongside Student, Teacher, Parent, and Admin demos. Keep it on the Game Dashboard (`/game/demo`) as well.

## Implementation

### 1. Update `src/pages/Demos.tsx`
- Import `Swords` (or `Gamepad2`) icon from lucide-react
- Add a 5th entry to the `roles` array:
  - Title: "RPG Reading Game"
  - Description: "Experience the LexiQuest RPG — battle enemies by reading aloud in this interactive combat demo."
  - Icon: Swords
  - Path: `/game/demo` (reuses the existing GameRPGDemo page)
  - Color: `from-red-500 to-rose-500`
- The grid will naturally accommodate 5 cards (2-2-1 layout on desktop)

### 2. No routing changes needed
The `/game/demo` route already exists and is publicly accessible. The demos page just links to it.


## Add Settings Menu to Game Mode Header

The `SettingsMenu` component already exists (theme + language dropdown) and is used in the main `Header`. The Game Mode pages use a separate `GameHeader` (`src/components/game/GameHeader.tsx`) which does not include it.

### Change
- In `src/components/game/GameHeader.tsx`, import `SettingsMenu` and render it in the right-side action group (before the Home/Sign-In buttons, after `{children}`), for both signed-in and signed-out states.

This automatically gives every Game Mode page (Dashboard, Play, Analytics, RPG Demo, Castle Swarm via its parent flows) the gear icon with Theme (Light/Dark/System) and Language dropdown shown in the reference screenshot.

No other files need changes.
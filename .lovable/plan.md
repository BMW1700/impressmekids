

# Plan: Game Mode — Consumer AURA Ecosystem

## Summary
Game Mode gives individual consumers (parents buying for their kids) access to the full AURA reading ecosystem — RPG, Story Mode, regular reading — plus a personal analytics dashboard showing their own phoneme heatmap, reading stats, ML insights, and progress. School-mode users can also access Game Mode with their existing accounts.

## Architecture

```text
/                  → ModeSelect (existing)
/game              → Game Mode landing/auth page
/game/auth         → Game Mode signup/login (simplified, no district/school)
/game/dashboard    → Game Mode home (RPG, Stories, Reading entry points)
/game/play         → AURA reading (reuses AuraPractice components)
/game/analytics    → Personal AURA analytics (single-user version of teacher AuraAnalytics)
```

## Database Changes

### 1. Add `game_player` to `app
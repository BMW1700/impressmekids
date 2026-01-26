
# Plan: Fix UI Cutoff Issues - Compact Modal & Flash Button

## Problems Identified

1. **WordFeedbackOverlay ("Magic" popup)**: The modal is too tall and gets cut off on smaller/non-fullscreen displays, making the action buttons (Try Again, Skip & Continue) invisible.

2. **Start Reading → Pause button**: When the button changes from "Start Reading" to "Pause", it causes layout shifts that push content off-screen.

---

## Solution Overview

### Fix 1: Make WordFeedbackOverlay Compact (No Scrolling Needed)

Reduce the size of everything in the modal so it fits on any screen without scrolling:

| Element | Before | After |
|---------|--------|-------|
| Icon circle | `w-16 h-16` | `w-10 h-10` |
| Icon inside | `h-10 w-10` | `h-6 w-6` |
| Title | `text-xl mb-4` | `text-lg mb-2` |
| Word display padding | `p-4 mb-4` | `p-3 mb-3` |
| Expected word size | `text-3xl my-2` | `text-2xl my-1` |
| Phonetic breakdown | `text-lg` | `text-base` |
| "You said" section | `mb-3`, `text-lg` | `mb-2`, `text-base` |
| Tip box padding | `p-3 mb-4` | `p-2 mb-3` |
| Container padding | `p-6` | `p-4` |
| Button gap | `gap-3` | `gap-2` |
| Retry hint margin | `mt-3` | `mt-2` |

This makes the entire modal ~30% shorter, ensuring it never needs scrolling.

**File**: `src/components/aura/game/rpg/WordFeedbackOverlay.tsx`

---

### Fix 2: Flash Button Instead of Swapping to "Pause"

Instead of replacing "Start Reading" with a "Pause" button (which can cause layout issues), keep the same button but:

1. **Always show "Start Reading" button** (never swap to "Pause")
2. **When active**: Button flashes/pulses with an amber glow to indicate "active" state
3. **Click while active**: Pauses reading (same functionality, no text change)
4. **When paused**: Show "Resume" button (this is fine since it's a recovery state)

This eliminates the layout shift entirely because the button never changes size or position.

**Implementation**:

```typescript
// Combine isIdle and isActive into one button
{(isIdle || isActive) && (
  <motion.div
    animate={isActive ? { 
      boxShadow: ['0 0 0px rgba(251, 191, 36, 0)', '0 0 15px rgba(251, 191, 36, 0.6)', '0 0 0px rgba(251, 191, 36, 0)'] 
    } : {}}
    transition={isActive ? { repeat: Infinity, duration: 1 } : {}}
    className="rounded-xl"
  >
    <Button
      size="lg"
      onClick={isActive ? pauseReading : startReading}
      disabled={disabled || !cleanWord}
      className={`min-w-[180px] font-bold transition-all ${
        isActive 
          ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700' 
          : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700'
      }`}
    >
      {isActive ? (
        <>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 0.6 }}
          >
            <Mic className="h-5 w-5 mr-2" />
          </motion.div>
          Reading...
        </>
      ) : (
        <>
          <Play className="h-5 w-5 mr-2" />
          Start Reading
        </>
      )}
    </Button>
  </motion.div>
)}

{isPaused && (
  <Button ... >
    <Play /> Resume
  </Button>
)}
```

**File**: `src/components/aura/game/rpg/RPGWordReader.tsx`

---

## Technical Details

### Why Flash Instead of Swap?
- **No layout shift**: Button stays the same width/position
- **Clear visual feedback**: Pulsing glow shows "active" state
- **Intuitive**: User can tap the same button to pause without hunting for a new button
- **Mobile-friendly**: No content pushed off-screen

### Compact Modal Math
The current modal height breakdown:
- Header icon: ~80px
- Title: ~32px  
- Word display box: ~120px
- Tip box: ~56px
- Buttons: ~44px
- Retry hint: ~24px
- Padding: ~48px
- **Total: ~404px**

After compacting:
- Header icon: ~48px (-32)
- Title: ~24px (-8)
- Word display box: ~90px (-30)
- Tip box: ~40px (-16)
- Buttons: ~40px (-4)
- Retry hint: ~20px (-4)
- Padding: ~32px (-16)
- **Total: ~294px** (~27% smaller)

This fits comfortably within any mobile viewport without scrolling.

---

## Summary of Changes

| File | Changes |
|------|---------|
| `src/components/aura/game/rpg/WordFeedbackOverlay.tsx` | Reduce all sizes to make modal compact |
| `src/components/aura/game/rpg/RPGWordReader.tsx` | Replace Start/Pause button swap with unified flash button |

**Lines Changed**: ~40-50 lines modified across 2 files

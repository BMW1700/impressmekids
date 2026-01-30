
# Fix Corrupted Data and Cap Accuracy Values

## Problem Summary
The audit revealed:
- **41 corrupted records** with `accuracy_percent` values exceeding 100% (max 738%)
- **12 impossible WPM records** exceeding 500 WPM (max 7,643 WPM)
- **ProsodyInsights component** doesn't cap individual student accuracy values in the table

## Implementation

### Step 1: Database Migration to Clean Corrupted Data
Run a SQL migration to fix the existing corrupted records:

```sql
-- Cap all accuracy_percent values at 100
UPDATE reading_sessions 
SET accuracy_percent = 100 
WHERE accuracy_percent > 100;

-- Set impossible WPM values (>500) to NULL since they're clearly corrupted
-- 500 WPM is physically impossible for reading aloud
UPDATE reading_sessions 
SET wpm = NULL 
WHERE wpm > 500;
```

### Step 2: Fix ProsodyInsights Component
**File:** `src/components/aura/ProsodyInsights.tsx`

In the `getStudentStats()` function (lines 208-227), cap individual student accuracy values:

```typescript
// Current (uncapped):
const avgAccuracy = sessions.length > 0
  ? Math.round(sessions.reduce((sum, s) => sum + (s.accuracy_percent || 0), 0) / sessions.length)
  : 0;

// Fixed (capped at 100):
const avgAccuracy = sessions.length > 0
  ? Math.min(100, Math.round(sessions.reduce((sum, s) => sum + Math.min(100, s.accuracy_percent || 0), 0) / sessions.length))
  : 0;
```

This applies the same defensive clamping pattern used in other components (LeaderboardCard, ReadingProgressDashboard, etc.).

## Technical Details

| Location | Issue | Fix |
|----------|-------|-----|
| `reading_sessions.accuracy_percent` | 41 records > 100% | UPDATE to cap at 100 |
| `reading_sessions.wpm` | 12 records > 500 WPM | UPDATE to set NULL |
| `ProsodyInsights.tsx` line 213-215 | Individual student avgAccuracy uncapped | Add `Math.min(100, ...)` |

## Verification
After migration:
- Query `SELECT COUNT(*) FROM reading_sessions WHERE accuracy_percent > 100` should return 0
- Query `SELECT COUNT(*) FROM reading_sessions WHERE wpm > 500` should return 0
- Individual Student Performance table in ProsodyInsights will show capped values

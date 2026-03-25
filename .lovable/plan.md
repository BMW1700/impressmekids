

# Generate Plain-English Patent Document for Attorney

## What This Is
A comprehensive, jargon-free document explaining exactly how NabuLearn's invention works — written so a non-technical patent attorney can understand every step and file a provisional patent within days.

## Document Structure

The document will be a professional DOCX file with these sections:

### Section 1: What the Invention Is (One Page)
Plain-English summary: "A system that turns a child's voice into a video game controller for reading practice."

### Section 2: How It Works — Step by Step (The Core)
A numbered walkthrough of the exact technical pipeline, written like "imagine you're watching over a kid's shoulder":

1. **The Screen** — Child sees an RPG battle scene with a hero on the left and a monster on the right. Both have health bars.
2. **Words Appear** — The story text appears in batches of 5 words at a time.
3. **The Microphone Listens** — The device microphone activates using the browser's built-in Web Speech API (no external service needed).
4. **The System Compares** — What the child said is compared to the word on screen. Exact match = correct. Close match (fuzzy matching) = also accepted.
5. **If Correct → Player Attacks Enemy** — Damage is calculated using a formula with 4 inputs:
   - Word length (longer words = more base damage)
   - Response speed in milliseconds (under 1.5 seconds = critical hit bonus)
   - Consecutive correct streak (every 2 correct words in a row adds +5 damage)
   - Overall session accuracy (90%+ = 1.2x multiplier)
   - **No dice rolls. No randomness. Pure skill.**
6. **If Incorrect → Streak Resets + Enemy Counter-Attacks** — The enemy hits back for fixed damage. Streak goes to zero.
7. **Random Enemy Attacks** — Independent of player performance, the enemy randomly attacks every 3-4 words (40-50% chance), triggering a "Quick Block" mini-game where the child must read a word fast to block damage.
8. **Mini-Game Interruptions** — At HP thresholds (75%, 50%, 25%), the enemy triggers special mini-games (20+ types) that are all reading-based combat variants.
9. **Victory or Defeat** — Enemy HP hits 0 = victory. Player HP hits 0 = defeat. XP and gold are awarded based on accuracy, streak, and speed.

### Section 3: The Damage Formula (Exact Math)
Written out as simple arithmetic with examples:
- "If a child reads the word 'elephant' (8 letters) in 1.2 seconds, on a streak of 6, with 92% session accuracy..."
- Show the exact calculation step by step

### Section 4: The Adaptive Learning System (AURA + RL)
Plain-English explanation of:
- **Q-Learning Agent**: A table that tracks "if the student knows sound X, what sound should they practice next?" Updated after every session.
- **Articulatory Fatigue Model**: Tracks which mouth muscles are tired. 8 muscle groups (lips, tongue tip, tongue back, etc.), each with fatigue levels and recovery rates. If tongue-tip muscles are tired from practicing /t/, /d/, /n/, the system switches to lip sounds like /p/, /b/, /m/.
- **How they connect to RPG mode**: The words chosen for battle are influenced by which phonemes the student needs to practice.

### Section 5: What Makes This Different from Everything Else
Side-by-side comparison:
- Competitors (Epic, Reading Eggs, Lexia): Reading happens BEFORE or AFTER gameplay. Games are rewards.
- NabuLearn: Reading IS the gameplay. The microphone is the controller. Every syllable directly modifies game state in real-time.

### Section 6: System Architecture Diagram
A simple flowchart (text-based, converted to visual):
```
Microphone → Speech Recognition → Word Comparison → Damage Formula → Game State Update → Visual Feedback
```

### Section 7: Database & Backend
What gets stored and why:
- Student skill vectors (phoneme mastery scores)
- Q-learning tables (persisted per student)
- Session records (words read, accuracy, streaks, time)
- Battle results (XP, gold, enemies defeated)

## Technical Approach
- Generate as a DOCX using the `docx` npm package
- US Letter format, clean professional styling
- Include the flowchart as a formatted table/diagram
- Include the damage formula as a clear worked example
- Target: 8-12 pages, plain English throughout

## Output
A single DOCX file at `/home/lovable/NabuLearn_Patent_Technical_Description.docx`


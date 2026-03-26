

# Plan: Draft Precise Answers to Patent Attorney Questions

## What
Generate a clean, professional document answering Christopher Pfister's 8 questions with code-accurate, plain-English explanations. Every answer will be verified against the actual production code.

## Approach
Create a DOCX file at `/mnt/documents/NabuLearn_Patent_Attorney_Response.docx` with each question quoted verbatim, followed by a clear, jargon-free answer. All technical claims will be backed by what the code actually does.

## Answer Summary (from code audit)

1. **Web Speech API** — Not ours. It is a free tool built into Google Chrome (and other browsers). The child's microphone captures audio, the browser converts it to text locally on the device. No audio is sent to our servers. We chose this specifically because it is free and keeps children's voice data private.

2. **Muscle fatigue** — Yes, a fixed 15% fatigue is added per practice attempt to each muscle group used by that sound. But TWO other factors affect it: (a) natural recovery over time (each muscle group has a different recovery rate, e.g., lips recover at 10%/min, tongue-tip at 8%/min), and (b) practice duration multiplies the 15% base. The system tracks 8 distinct muscle groups (lips, tongue tip, tongue back, etc.).

3. **Fuzzy matching and Speech API flaws** — Yes, explicitly designed for this. The system uses a 4-layer matching pipeline: (1) exact match, (2) homophone dictionary (e.g., "two"/"to"/"too"), (3) Levenshtein distance (allows 1-2 character differences depending on word length), (4) phoneme-level comparison using CMU Pronouncing Dictionary with 70% similarity threshold. The Web Speech API also returns multiple alternative transcriptions, and the system checks ALL of them.

4. **"Almost" situations (elefant/elephant)** — The child still gets credit (the word counts as correct) because "elefant" is only 1 character different from "elephant" (within the 20% tolerance for 8+ letter words). However, the system records this as a "needs verification" flag for the teacher, and the per-phoneme accuracy data captures exactly which sounds were wrong. In RPG mode, the child deals damage but does NOT get streak bonus or speed bonus if it took multiple attempts.

5. **Plateau / speech impediment** — Yes, there is a specific mechanism. The Phoneme Progress Chart scans the last 4 weeks of data per phoneme. If improvement is less than 5% over 4 weeks, it flags that sound as "Plateau Detected" with a red badge and recommends "targeted intervention." The RL agent also handles this: when a phoneme stays in the "struggling" list despite practice, the Q-Learning agent lowers its expected reward, causing the system to try different approach phonemes or reduce difficulty. The system does NOT assume consistent improvement.

6. **500ms timing** — The 500ms refers to the browser's local processing (speech recognition + word matching + damage calculation). This will NOT change because there are no remote modules involved. All three steps happen inside the child's browser with zero server calls. The only server communication happens AFTER the battle ends (saving results), which does not affect gameplay timing.

7. **Cross-Modal Transfer Network vs. microphone-as-controller** — These are completely separate functions. The microphone-as-controller is the RPG game (speech drives combat in real-time). The Cross-Modal Transfer Network is an offline prediction model that runs in the background — it takes a student's reading comprehension scores (annotation quality, vocabulary complexity, critical thinking score, reading time, etc.) and predicts how well they will perform on speaking/presentation tasks, or vice versa. The network accounts for the reading-faster-than-speaking difference because it uses 7 distinct input features (not just speed), including comprehension depth and annotation quality, which correlate with speaking confidence regardless of speed differences.

8. **"Confidence" metrics** — Confidence is measured by combining two separate scores: (a) the Speech API's own confidence rating (0-100%, how certain the browser is about what it heard), and (b) the match score (how closely the spoken word matches the expected word, calculated by Levenshtein distance). These two numbers are averaged. If the combined score is 90%+, confidence is "high." If 70-89%, "medium." Below 70%, "low." Low-confidence words are automatically flagged for teacher review.

## Deliverable
A clean DOCX document ready to email to Chris, written so a non-technical person can understand every answer on first read.


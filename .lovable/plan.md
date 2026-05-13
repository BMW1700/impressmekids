I found the failure path in `RPGWordReader`: the reader starts recognition after an awaited microphone check, then repeatedly creates new recognition instances from timers/`onend`. Browser speech APIs are fragile here; stale `onend` callbacks and async restarts can kill the current session or leave the UI saying “Reading...” while the new word is not actually registered.

Plan:
1. Refactor `RPGWordReader` speech startup so the `SpeechRecognition` instance is created inside the button click path before async microphone work can break the gesture chain.
2. Add session/version guards so old recognition instances cannot flip `isRecognitionRunningRef`, `recognitionState`, or restart over the current instance.
3. Replace recursive `startRecognitionSession()` restarts with a safe in-place restart of the same guarded instance, and clear `recognitionRef` only for the active instance.
4. Fix the “after 2 words” issue by keeping processing transitions from disabling/remounting the reader while speech recognition is still settling, so word 3+ continue comparing against the current target word.
5. Add focused console diagnostics for speech state changes, word index, active target, and ignored stale events so we can verify the next preview run immediately.
6. Validate by running the relevant checks and confirming the code path no longer depends on stale closures or async user-gesture restarts.
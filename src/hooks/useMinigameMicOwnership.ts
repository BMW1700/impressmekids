import { useEffect, type MutableRefObject } from "react";
import { speechManager } from "@/lib/speechRecognitionManager";
import { killRecognition } from "@/lib/speech/micWatchdog";

type Owner = Parameters<typeof speechManager.claimExternal>[0];

/**
 * Registers a mini-game that drives its own SpeechRecognition object with the
 * global mic owner. On mount the main reader is suspended (so two sessions
 * never fight over the mic); on unmount our session is killed and the mic is
 * released so the reader's watchdog resumes it.
 */
export function useMinigameMicOwnership(owner: Owner, recognitionRef: MutableRefObject<any>) {
  useEffect(() => {
    speechManager.claimExternal(owner, () => {
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      killRecognition(rec);
    });
    return () => {
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      killRecognition(rec);
      speechManager.releaseExternal(owner);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner]);
}

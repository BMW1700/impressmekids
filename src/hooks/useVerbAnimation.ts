import { useEffect, useRef, useState } from "react";
import { resolveVerbAnimation, type VerbDescriptor } from "@/lib/verbAnimations";

export type VerbTrigger = { word: string; nonce: number } | null | undefined;

export type ResolvedVerb = {
  /** Unique id so children can key off it for AnimatePresence / reset. */
  id: number;
  descriptor: VerbDescriptor;
};

const COOLDOWN_MS = 400;

/**
 * Resolves a verb trigger into a descriptor, with a small cooldown to prevent
 * rapid-fire stacking. Returns null when no verb matches or trigger is empty.
 */
export function useVerbAnimation(trigger: VerbTrigger): ResolvedVerb | null {
  const [resolved, setResolved] = useState<ResolvedVerb | null>(null);
  const lastFiredRef = useRef(0);
  const lastNonceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!trigger || !trigger.word) return;
    if (lastNonceRef.current === trigger.nonce) return;
    lastNonceRef.current = trigger.nonce;

    const now = Date.now();
    if (now - lastFiredRef.current < COOLDOWN_MS) return;

    const descriptor = resolveVerbAnimation(trigger.word);
    if (!descriptor) return;

    lastFiredRef.current = now;
    setResolved({ id: trigger.nonce, descriptor });
  }, [trigger]);

  return resolved;
}

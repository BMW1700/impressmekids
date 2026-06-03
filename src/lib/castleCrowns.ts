// Castle Swarm — Crowns (premium currency) scaffolding.
// Local-only stub for now; Stripe / IAP wiring lands in a follow-up.

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "castle.crowns.v1";

export interface CrownBundle {
  id: string;
  label: string;
  crowns: number;
  bonus: number;          // extra crowns thrown in
  priceUsd: number;       // display price
  highlight?: "best" | "popular";
}

export const CROWN_BUNDLES: CrownBundle[] = [
  { id: "starter",  label: "Starter Chest",   crowns: 100,  bonus: 0,    priceUsd: 1.99 },
  { id: "knight",   label: "Knight's Hoard",  crowns: 550,  bonus: 50,   priceUsd: 9.99,  highlight: "popular" },
  { id: "kingdom",  label: "Kingdom Vault",   crowns: 1200, bonus: 250,  priceUsd: 19.99, highlight: "best" },
];

function readCrowns(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function writeCrowns(n: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, String(Math.max(0, Math.floor(n))));
  window.dispatchEvent(new CustomEvent("castle-crowns-changed"));
}

/** React hook — read & mutate the player's crown balance. */
export function useCastleCrowns() {
  const [crowns, setCrowns] = useState<number>(() => readCrowns());

  useEffect(() => {
    const sync = () => setCrowns(readCrowns());
    window.addEventListener("castle-crowns-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("castle-crowns-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const grant = useCallback((amount: number) => {
    const next = readCrowns() + Math.max(0, Math.floor(amount));
    writeCrowns(next);
  }, []);

  const spend = useCallback((amount: number): boolean => {
    const cur = readCrowns();
    if (cur < amount) return false;
    writeCrowns(cur - amount);
    return true;
  }, []);

  /** Stub — wire to Stripe checkout in a later pass. */
  const purchaseBundle = useCallback(async (bundleId: string) => {
    const b = CROWN_BUNDLES.find(x => x.id === bundleId);
    if (!b) return { ok: false as const, reason: "unknown_bundle" };
    // TODO: open Stripe checkout session here.
    grant(b.crowns + b.bonus);
    return { ok: true as const, granted: b.crowns + b.bonus };
  }, [grant]);

  return { crowns, grant, spend, purchaseBundle };
}

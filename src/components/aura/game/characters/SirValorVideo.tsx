// Sir Valor — video-driven hero for the RPG combat screen.
//
// Three MP4 clips (idle / attack / hit) are stacked and crossfaded, identical
// pattern to BennyDog. All three videos stay mounted and playing so switching
// state is instantaneous and never shows a black first-frame.
//
// The source videos have a pure white background (no alpha in MP4). We knock
// that out with `mix-blend-mode: multiply` so the knight sits cleanly on top
// of whatever combat-arena background is behind him.
//
// Skins (future): drop a new entry into VALOR_VARIANTS with three new
// .asset.json pointers and pass `variant="skinId"`. Nothing else changes.

import { useEffect, useMemo, useRef, useState } from "react";
import idleAsset from "@/assets/valor-idle.mp4.asset.json";
import attackAsset from "@/assets/valor-attack.mp4.asset.json";
import hitAsset from "@/assets/valor-hit.mp4.asset.json";
import idlePosterAsset from "@/assets/valor-idle-poster.png.asset.json";

export type ValorMood = "idle" | "attack" | "hit";

type VariantAssets = { idle: string; attack: string; hit: string; poster: string };

const VALOR_VARIANTS: Record<string, VariantAssets> = {
  default: {
    idle: idleAsset.url,
    attack: attackAsset.url,
    hit: hitAsset.url,
    poster: idlePosterAsset.url,
  },
};

const MOODS: ValorMood[] = ["idle", "attack", "hit"];

interface SirValorVideoProps {
  /** Current mood. Caller manages timing via useTransientValorMood or directly. */
  mood?: ValorMood;
  /** Pixel size (square). */
  size?: number;
  /** Flip horizontally — useful if hero is on the right side. */
  flipX?: boolean;
  /** Skin pack key, see VALOR_VARIANTS. */
  variant?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const SirValorVideo = ({
  mood = "idle",
  size = 280,
  flipX = false,
  variant = "default",
  className,
  style,
}: SirValorVideoProps) => {
  const assets = VALOR_VARIANTS[variant] ?? VALOR_VARIANTS.default;
  const reducedMotion = useReducedMotion();

  // Reduced-motion users get the static poster — no looping video at all.
  if (reducedMotion) {
    return (
      <div
        className={className}
        style={{
          position: "relative",
          width: size,
          height: size,
          pointerEvents: "none",
          userSelect: "none",
          transform: flipX ? "scaleX(-1)" : undefined,
          ...style,
        }}
      >
        <img
          src={assets.poster}
          alt="Sir Valor"
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            mixBlendMode: "multiply",
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: size,
        height: size,
        pointerEvents: "none",
        userSelect: "none",
        transform: flipX ? "scaleX(-1)" : undefined,
        ...style,
      }}
    >
      {MOODS.map((m) => (
        <ValorClip
          key={m}
          src={assets[m]}
          poster={assets.poster}
          active={m === mood}
          ariaLabel={m === mood ? "Sir Valor" : undefined}
        />
      ))}
    </div>
  );
};

interface ValorClipProps {
  src: string;
  poster: string;
  active: boolean;
  ariaLabel?: string;
}

const ValorClip = ({ src, poster, active, ariaLabel }: ValorClipProps) => {
  const ref = useRef<HTMLVideoElement>(null);

  // When this clip becomes active, restart from frame 0 so attack/hit animations
  // play cleanly from the beginning every time the mood transitions to them.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active) {
      try {
        v.currentTime = 0;
        const p = v.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      } catch {
        /* iOS sometimes throws if not yet ready — autoplay will pick it up */
      }
    }
  }, [active]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "contain",
        opacity: active ? 1 : 0,
        transition: "opacity 0.3s ease-in-out",
        // Knocks out the pure-white background baked into the MP4s.
        mixBlendMode: "multiply",
        pointerEvents: "none",
        userSelect: "none",
      }}
    />
  );
};

// ────────────────────────────────────────────────────────────────────────────
// Helper hook: drive mood from event triggers with automatic revert-to-idle.

const ATTACK_MS = 2000;
const HIT_MS = 1500;

/**
 * Returns the current ValorMood, automatically reverting to 'idle' after
 * the attack/hit animation duration. Trigger via nonce numbers — incrementing
 * `attackTrigger` plays the attack clip; incrementing `hitTrigger` plays hit.
 *
 * Hit beats attack if both fire simultaneously.
 */
export function useTransientValorMood(
  attackTrigger: number | undefined,
  hitTrigger: number | undefined,
): ValorMood {
  const [mood, setMood] = useState<ValorMood>("idle");
  const lastAttack = useRef<number | undefined>(undefined);
  const lastHit = useRef<number | undefined>(undefined);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (hitTrigger === undefined || hitTrigger === lastHit.current) return;
    lastHit.current = hitTrigger;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMood("hit");
    timeoutRef.current = setTimeout(() => setMood("idle"), HIT_MS);
  }, [hitTrigger]);

  useEffect(() => {
    if (attackTrigger === undefined || attackTrigger === lastAttack.current) return;
    lastAttack.current = attackTrigger;
    // Don't interrupt an in-flight hit animation.
    if (mood === "hit") return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMood("attack");
    timeoutRef.current = setTimeout(() => setMood("idle"), ATTACK_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attackTrigger]);

  return mood;
}

// Tiny prefers-reduced-motion hook so we don't pull in another dependency.
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mql.matches);
    update();
    mql.addEventListener?.("change", update);
    return () => mql.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

export default SirValorVideo;

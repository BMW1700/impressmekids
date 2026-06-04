// Sir Valor — video-driven hero for the RPG combat screen.
//
// Three MP4 clips (idle / attack / hit) are stacked and crossfaded, identical
// pattern to BennyDog. All three videos stay mounted and playing so switching
// state is instantaneous and never shows a black first-frame.
//
// Modern browsers use transparent WebM clips rebuilt from the source MP4s with
// a border-only alpha matte. MP4 remains as a graceful fallback for old Safari.
//
// ─── Skins ──────────────────────────────────────────────────────────────────
// One set of base videos powers unlimited skins. A skin is a tiny JSON
// descriptor (CSS filter + optional silhouette tint + anchored PNG
// accessories). No re-shooting per skin — see VALOR_SKINS below.
//
// ─── HP bar ─────────────────────────────────────────────────────────────────
// When `showHealthBar` is true the component renders the name + HP bar
// directly beneath the video, matching the goblin/Elara style so the two
// sides of the arena read as a fair fight.
//
// ─── Sword shine ────────────────────────────────────────────────────────────
// A subtle, periodic radial halo + diagonal sweep is overlayed at the sword
// tip. Pure CSS, GPU-cheap, respects prefers-reduced-motion.

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import idleWebm from "@/assets/valor-idle.webm.asset.json";
import attackWebm from "@/assets/valor-attack.webm.asset.json";
import hitWebm from "@/assets/valor-hit.webm.asset.json";
import idleMp4 from "@/assets/valor-idle.mp4.asset.json";
import attackMp4 from "@/assets/valor-attack.mp4.asset.json";
import hitMp4 from "@/assets/valor-hit.mp4.asset.json";
import idlePosterAsset from "@/assets/valor-idle-poster-transparent.png.asset.json";

export type ValorMood = "idle" | "attack" | "hit";

type ClipSources = { webm: string; mp4: string };

// ─── Skin system ────────────────────────────────────────────────────────────
// Each skin is described declaratively. No video re-encodes needed.
type ValorAccessory = {
  /** CDN url from a .asset.json pointer (transparent PNG). */
  asset: string;
  /** Anchor point in % of the character box. */
  anchor: { xPct: number; yPct: number };
  /** Width in % of the box. Height auto. */
  widthPct: number;
  /** Render under or over the video stack. */
  z?: "under" | "over";
  /** Gentle CSS bob — useful for plumes/capes. */
  sway?: boolean;
};

type ValorSkin = {
  /** CSS filter applied to the video element (and poster). */
  filter?: string;
  /** Optional silhouette tint via mix-blend-mode. */
  tint?: { color: string; opacity: number; blend: "color" | "multiply" | "overlay" | "screen" };
  /** Anchored PNG accessories. */
  accessories?: ValorAccessory[];
};

const VALOR_SKINS: Record<string, ValorSkin> = {
  default: {},
  // Examples for future use — add filters or accessories without touching code:
  // crimson:   { filter: "hue-rotate(-40deg) saturate(1.2)" },
  // obsidian:  { filter: "saturate(0.3) brightness(0.7) contrast(1.1)", tint: { color: "#1a1a2e", opacity: 0.25, blend: "color" } },
  // royal:     { filter: "hue-rotate(20deg) saturate(1.1) brightness(1.05)" },
};

const BASE_SOURCES: Record<ValorMood, ClipSources> = {
  idle: { webm: idleWebm.url, mp4: idleMp4.url },
  attack: { webm: attackWebm.url, mp4: attackMp4.url },
  hit: { webm: hitWebm.url, mp4: hitMp4.url },
};
const BASE_POSTER = idlePosterAsset.url;

const MOODS: ValorMood[] = ["idle", "attack", "hit"];

interface SirValorVideoProps {
  /** Current mood. Caller manages timing via useTransientValorMood or directly. */
  mood?: ValorMood;
  /** Pixel size (square). */
  size?: number;
  /** Flip horizontally — useful if hero is on the right side. */
  flipX?: boolean;
  /** Skin pack key, see VALOR_SKINS. */
  variant?: string;
  /** Show name label + HP bar beneath the character. */
  showHealthBar?: boolean;
  /** HP values for the bar. Ignored when showHealthBar is false. */
  currentHp?: number;
  maxHp?: number;
  /** Name shown above the bar (defaults to "Sir Valor"). */
  name?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const SirValorVideo = ({
  mood = "idle",
  size = 220,
  flipX = false,
  variant = "default",
  showHealthBar = false,
  currentHp,
  maxHp,
  name = "Sir Valor",
  className,
  style,
}: SirValorVideoProps) => {
  const skin = VALOR_SKINS[variant] ?? VALOR_SKINS.default;
  const reducedMotion = useReducedMotion();

  const accessoriesUnder = (skin.accessories ?? []).filter((a) => a.z !== "over");
  const accessoriesOver = (skin.accessories ?? []).filter((a) => a.z === "over");

  const hpPct =
    showHealthBar && typeof currentHp === "number" && typeof maxHp === "number" && maxHp > 0
      ? Math.max(0, Math.min(100, (currentHp / maxHp) * 100))
      : 100;

  const hpColor =
    hpPct > 50
      ? "linear-gradient(90deg, #3B82F6, #60A5FA)"
      : hpPct > 25
        ? "linear-gradient(90deg, #eab308, #facc15)"
        : "linear-gradient(90deg, #dc2626, #ef4444)";

  // Outer wrapper holds the character box + (optional) HP bar so both share
  // a single horizontal center and the bar sits cleanly beneath the feet.
  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: size,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pointerEvents: "none",
        userSelect: "none",
        ...style,
      }}
    >
      {/* Character box — videos + accessories + sword shine */}
      <div
        style={{
          position: "relative",
          width: size,
          height: size,
          transform: flipX ? "scaleX(-1)" : undefined,
        }}
      >
        {accessoriesUnder.map((a, i) => (
          <AccessoryLayer key={`u-${i}`} acc={a} />
        ))}

        {reducedMotion ? (
          <img
            src={BASE_POSTER}
            alt={name}
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              filter: skin.filter,
            }}
          />
        ) : (
          MOODS.map((m) => (
            <ValorClip
              key={m}
              sources={BASE_SOURCES[m]}
              poster={BASE_POSTER}
              active={m === mood}
              ariaLabel={m === mood ? name : undefined}
              filter={skin.filter}
            />
          ))
        )}

        {skin.tint && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: skin.tint.color,
              opacity: skin.tint.opacity,
              mixBlendMode: skin.tint.blend,
              pointerEvents: "none",
            }}
          />
        )}

        {accessoriesOver.map((a, i) => (
          <AccessoryLayer key={`o-${i}`} acc={a} />
        ))}

        {/* Sword shine — periodic halo + diagonal sweep at the sword tip. */}
        {!reducedMotion && <SwordShine />}
      </div>

      {/* HP bar — matches Elara/goblin (no name; the name chip already sits above the character). */}
      {showHealthBar && (
        <div className="mt-1 flex flex-col items-center" style={{ width: 90 }}>
          {typeof currentHp === "number" && typeof maxHp === "number" && (
            <div
              className="text-center text-xs font-bold text-white mb-0.5"
              style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.9)" }}
            >
              {Math.max(0, Math.round(currentHp))}/{maxHp}
            </div>
          )}
          <div className="h-2.5 w-full bg-black/60 rounded-full overflow-hidden border border-black/40">
            <motion.div
              className="h-full rounded-full"
              style={{ background: hpColor }}
              initial={{ width: "100%" }}
              animate={{ width: `${hpPct}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// Sub-components

const AccessoryLayer = ({ acc }: { acc: ValorAccessory }) => (
  <img
    src={acc.asset}
    alt=""
    aria-hidden
    draggable={false}
    style={{
      position: "absolute",
      left: `${acc.anchor.xPct}%`,
      top: `${acc.anchor.yPct}%`,
      width: `${acc.widthPct}%`,
      transform: "translate(-50%, -50%)",
      pointerEvents: "none",
      animation: acc.sway ? "valor-accessory-sway 4s ease-in-out infinite" : undefined,
    }}
  />
);

/**
 * Static halo + slow diagonal "shine sliver" pinned at the sword tip in the
 * idle frame. Anchored as % of the character box so it scales with `size`.
 * Pure CSS — GPU-friendly, no JS timers.
 */
const SwordShine = () => (
  <>
    <div
      aria-hidden
      style={{
        position: "absolute",
        // Sword tip in the idle poster sits roughly upper-left of the figure.
        top: "12%",
        left: "32%",
        width: "28%",
        height: "28%",
        transform: "translate(-50%, -50%)",
        background:
          "radial-gradient(circle, rgba(255,255,210,0.55) 0%, rgba(255,255,180,0.15) 40%, rgba(255,255,160,0) 70%)",
        mixBlendMode: "screen",
        pointerEvents: "none",
        animation: "valor-sword-halo 7s ease-in-out infinite",
      }}
    />
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: "4%",
        left: "32%",
        width: "22%",
        height: "44%",
        transform: "translate(-50%, 0)",
        overflow: "hidden",
        pointerEvents: "none",
        borderRadius: "8px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(115deg, transparent 38%, rgba(255,255,230,0.85) 50%, transparent 62%)",
          mixBlendMode: "screen",
          animation: "valor-sword-shine 7s ease-in-out infinite",
          transform: "translateX(-120%)",
        }}
      />
    </div>
    {/* Local keyframes — kept inline so we don't need to touch tailwind.config */}
    <style>{`
      @keyframes valor-sword-halo {
        0%, 80%, 100% { opacity: 0.25; }
        88% { opacity: 0.9; }
      }
      @keyframes valor-sword-shine {
        0%, 78% { transform: translateX(-120%); opacity: 0; }
        85% { opacity: 1; }
        100% { transform: translateX(140%); opacity: 0; }
      }
      @keyframes valor-accessory-sway {
        0%, 100% { transform: translate(-50%, -50%) rotate(-2deg); }
        50%      { transform: translate(-50%, -50%) rotate(2deg); }
      }
    `}</style>
  </>
);

interface ValorClipProps {
  sources: ClipSources;
  poster: string;
  active: boolean;
  ariaLabel?: string;
  filter?: string;
}

const ValorClip = ({ sources, poster, active, ariaLabel, filter }: ValorClipProps) => {
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
        pointerEvents: "none",
        userSelect: "none",
        filter,
      }}
    >
      {/* VP9 WebM with real alpha — modern browsers (Chrome/Edge/Firefox, Safari 16+). */}
      <source src={sources.webm} type="video/webm" />
      {/* MP4 fallback for older Safari — no transparency but plays. */}
      <source src={sources.mp4} type="video/mp4" />
    </video>
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

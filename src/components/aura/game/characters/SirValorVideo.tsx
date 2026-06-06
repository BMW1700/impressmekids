// Sir Valor — sprite-sheet hero for the RPG combat screen.
//
// Three CSS sprite sheets (idle / attack / hit) are stacked and crossfaded.
// Sprite sheets composite through the GPU and run identically on every
// browser including Safari, where animated WebP / alpha-WebM stutter or
// fail outright. Same pattern as BennyDog after the Safari fix.
//
// ─── Skins ──────────────────────────────────────────────────────────────────
// One set of base sprites powers unlimited skins. A skin is a tiny JSON
// descriptor (CSS filter + optional silhouette tint + anchored PNG
// accessories). No re-rendering per skin — see VALOR_SKINS below.
//
// ─── HP bar ─────────────────────────────────────────────────────────────────
// When `showHealthBar` is true the component renders the name + HP bar
// directly beneath the sprite, matching the goblin/Elara style so the two
// sides of the arena read as a fair fight.
//
// ─── Sword shine ────────────────────────────────────────────────────────────
// A subtle, periodic radial halo + diagonal sweep is overlayed at the sword
// tip. Pure CSS, GPU-cheap, respects prefers-reduced-motion.

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import idleSprite from "@/assets/valor-idle-sprite.png.asset.json";
import attackSprite from "@/assets/valor-attack-sprite.png.asset.json";
import hitSprite from "@/assets/valor-hit-sprite.png.asset.json";
import idlePosterAsset from "@/assets/valor-idle-poster-transparent.png.asset.json";
import { SirValor, type ValorSkinVariant } from "./SirValor";

export type ValorMood = "idle" | "attack" | "hit";

/** Pixel offset applied to the bottom of the sprite so the rendered
 *  character's feet line up with the goblin/enemy feet across the arena.
 *  Tune here if the art changes. */
const VALOR_BASELINE_OFFSET_RATIO = -28 / 220;

/** Sprite-sheet geometry — every state is a 30-frame single-row strip of
 *  420×420 cells. */
const SPRITE_FRAMES = 30;
const SPRITE_CELL_W = 420;
const SPRITE_CELL_H = 420;
const SPRITE_ASPECT = SPRITE_CELL_H / SPRITE_CELL_W; // 1.0 for Valor

const SPRITE_URLS: Record<ValorMood, string> = {
  idle: idleSprite.url,
  attack: attackSprite.url,
  hit: hitSprite.url,
};

const MOODS: ValorMood[] = ["idle", "attack", "hit"];

/** Map any incoming variant string to a SVG-renderable variant for the
 *  Classic art tier. Sprite-only variants fall back to the base SVG knight. */
const toSvgVariant = (variant: string): ValorSkinVariant => {
  const svgSet: ValorSkinVariant[] = ["default", "golden", "crystal", "flame", "ice", "dragon", "shadow"];
  return (svgSet as string[]).includes(variant) ? (variant as ValorSkinVariant) : "default";
};

// ─── Skin system ────────────────────────────────────────────────────────────
// Each skin is described declaratively. No sprite re-renders needed.
type ValorAccessory = {
  asset: string;
  anchor: { xPct: number; yPct: number };
  widthPct: number;
  z?: "under" | "over";
  sway?: boolean;
};

type ValorSkin = {
  filter?: string;
  tint?: { color: string; opacity: number; blend: "color" | "multiply" | "overlay" | "screen" };
  accessories?: ValorAccessory[];
};

const VALOR_SKINS: Record<string, ValorSkin> = {
  default: {},
};

interface SirValorVideoProps {
  mood?: ValorMood;
  size?: number;
  flipX?: boolean;
  variant?: string;
  showHealthBar?: boolean;
  currentHp?: number;
  maxHp?: number;
  name?: string;
  /**
   * 'sprite' = always render the realistic sprite sheets.
   * 'svg'    = render the Classic SVG knight (e.g. for SVG skins).
   * 'auto'   = render sprite (works on every browser). Kept for callers that
   *            still want SVG for explicit SVG skin variants.
   * 'video'  = legacy alias for 'sprite'.
   */
  renderMode?: "video" | "sprite" | "svg" | "auto";
  className?: string;
  style?: React.CSSProperties;
}

// Inject keyframes once. Each state strip has 30 frames; we step through 29
// times (frame index 0 → 29). Idle loops continuously; attack/hit play once
// and freeze on the last frame — the parent reverts to idle after their
// duration via useTransientValorMood.
const VALOR_STYLE_ID = "valor-sprite-keyframes-v1";
const ensureValorKeyframes = () => {
  if (typeof document === "undefined") return;
  if (document.getElementById(VALOR_STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = VALOR_STYLE_ID;
  el.textContent = `
@keyframes valor-sprite-walk {
  from { background-position-x: 0px; }
  to   { background-position-x: var(--valor-sprite-end, -6090px); }
}
@keyframes valor-sprite-once {
  from { background-position-x: 0px; }
  to   { background-position-x: var(--valor-sprite-end, -6090px); }
}
.valor-sprite {
  background-repeat: no-repeat;
  background-position: 0px 0px;
  will-change: background-position;
}
.valor-sprite-idle   { animation: valor-sprite-walk 2.5s steps(29, end) infinite; }
.valor-sprite-attack { animation: valor-sprite-once 1.6s steps(29, end) 1 forwards; }
.valor-sprite-hit    { animation: valor-sprite-once 1.2s steps(29, end) 1 forwards; }
@media (prefers-reduced-motion: reduce) {
  .valor-sprite-idle, .valor-sprite-attack, .valor-sprite-hit {
    animation: none;
    background-position-x: 0px;
  }
}
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
`;
  document.head.appendChild(el);
};

export const SirValorVideo = ({
  mood = "idle",
  size = 220,
  flipX = false,
  variant = "default",
  showHealthBar = false,
  currentHp,
  maxHp,
  name = "Sir Valor",
  renderMode = "auto",
  className,
  style,
}: SirValorVideoProps) => {
  const reducedMotion = useReducedMotion();
  ensureValorKeyframes();

  const resolvedMode: "sprite" | "svg" = useMemo(() => {
    if (renderMode === "svg") return "svg";
    // Anything else — including legacy 'video' and 'auto' — renders the
    // sprite sheet. Sprite sheets work in every browser.
    return "sprite";
  }, [renderMode]);

  const skin = VALOR_SKINS[variant] ?? VALOR_SKINS.default;
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

  const baselineOffsetPx = Math.round(size * VALOR_BASELINE_OFFSET_RATIO);

  // ─── SVG branch ──────────────────────────────────────────────────────────
  if (resolvedMode === "svg") {
    const svgVariant = toSvgVariant(variant);
    const svgSize: "small" | "medium" | "large" = "medium";
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
          marginBottom: baselineOffsetPx,
          ...style,
        }}
      >
        <div style={{ transform: flipX ? "scaleX(-1)" : undefined }}>
          <SirValor
            state={mood === "attack" ? "attacking" : mood === "hit" ? "hit" : "idle"}
            healthPercent={hpPct}
            currentHp={currentHp}
            maxHp={maxHp}
            size={svgSize}
            showHealthBar={showHealthBar}
            skinVariant={svgVariant}
          />
        </div>
      </div>
    );
  }

  // ─── Sprite branch ───────────────────────────────────────────────────────
  // Render all three state sprites in a stack and crossfade the active one.
  // Reduced motion → poster PNG only.
  const spriteH = Math.round(size * SPRITE_ASPECT); // square for Valor

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
        marginBottom: baselineOffsetPx,
        ...style,
      }}
    >
      <div
        style={{
          position: "relative",
          width: size,
          height: spriteH,
          transform: flipX ? "scaleX(-1)" : undefined,
        }}
      >
        {accessoriesUnder.map((a, i) => (
          <AccessoryLayer key={`u-${i}`} acc={a} />
        ))}

        {reducedMotion ? (
          <img
            src={idlePosterAsset.url}
            alt={name}
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "50% 100%",
              filter: skin.filter,
            }}
          />
        ) : (
          MOODS.map((m) => (
            <ValorSpriteLayer
              key={m}
              mood={m}
              active={m === mood}
              width={size}
              height={spriteH}
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

        {!reducedMotion && <SwordShine />}
      </div>

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

interface ValorSpriteLayerProps {
  mood: ValorMood;
  active: boolean;
  width: number;
  height: number;
  ariaLabel?: string;
  filter?: string;
}

/**
 * One sprite-sheet layer. Mounted via React key so that whenever the active
 * mood changes to attack/hit the animation restarts from frame 0 (the layer
 * remounts). Idle stays mounted and loops continuously underneath.
 */
const ValorSpriteLayer = ({
  mood,
  active,
  width,
  height,
  ariaLabel,
  filter,
}: ValorSpriteLayerProps) => {
  // For attack/hit, remount whenever they become active so the once-through
  // animation plays from frame 0. Idle is always mounted.
  const [activationKey, setActivationKey] = useState(0);
  const wasActive = useRef(active);
  useEffect(() => {
    if (mood !== "idle" && active && !wasActive.current) {
      setActivationKey((k) => k + 1);
    }
    wasActive.current = active;
  }, [active, mood]);

  return (
    <div
      key={mood === "idle" ? "idle" : `${mood}-${activationKey}`}
      className={`valor-sprite valor-sprite-${mood}`}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        backgroundImage: `url(${SPRITE_URLS[mood]})`,
        backgroundSize: `${width * SPRITE_FRAMES}px ${height}px`,
        ["--valor-sprite-end" as any]: `${-(SPRITE_FRAMES - 1) * width}px`,
        opacity: active ? 1 : 0,
        transition: "opacity 0.2s ease-in-out",
        filter,
        pointerEvents: "none",
      }}
    />
  );
};

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

const SwordShine = () => (
  <>
    <div
      aria-hidden
      style={{
        position: "absolute",
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
  </>
);

// ────────────────────────────────────────────────────────────────────────────
// Helper hook: drive mood from event triggers with automatic revert-to-idle.

const ATTACK_MS = 1600;
const HIT_MS = 1200;

/**
 * Returns the current ValorMood, automatically reverting to 'idle' after the
 * attack/hit animation duration. Trigger via nonce numbers — incrementing
 * `attackTrigger` plays the attack sprite; incrementing `hitTrigger` plays hit.
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
    if (mood === "hit") return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMood("attack");
    timeoutRef.current = setTimeout(() => setMood("idle"), ATTACK_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attackTrigger]);

  return mood;
}

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

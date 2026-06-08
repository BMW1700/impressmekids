// Benny the Dog — Pre-K adventure character.
//
// Idle is a CSS sprite-sheet animation (30 frames, single-row strip). We use
// background-position steps instead of animated WebP because Safari decodes
// WebP single-threaded on the main thread, causing visible stutter. Sprite
// sheets composite through the GPU and run identically on every browser.
//
// Walk / jump reuse the sprite sheet at faster timing and add a small paw
// cycle overlay so Benny's legs visibly move even when the source frame is
// mostly front-facing. Celebrate / sad keep their still PNGs with CSS motion.

import { useEffect, useRef, useState } from "react";
import bennySprite from "@/assets/benny-idle-sprite.png.asset.json";
import idleAsset from "@/assets/benny-idle.png.asset.json";
import celebrateAsset from "@/assets/benny-celebrate.png.asset.json";
import sadAsset from "@/assets/benny-sad.png.asset.json";

export type BennyMood = "idle" | "walk" | "jump" | "climb" | "celebrate" | "sad";

interface BennyDogProps {
  mood?: BennyMood;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

// Sprite-sheet geometry: 30 frames laid out in a single row of 420×450 cells.
// Bottom 30px of each source frame was cropped so feet sit on the cell's
// bottom edge — the rendering parent positions feet directly.
const SPRITE_FRAMES = 30;
const SPRITE_CELL_W = 420;
const SPRITE_CELL_H = 450;
const SPRITE_ASPECT = SPRITE_CELL_H / SPRITE_CELL_W; // ≈1.0714

const STILL_SOURCES: Record<Extract<BennyMood, "celebrate" | "sad">, string> = {
  celebrate: celebrateAsset.url,
  sad: sadAsset.url,
};

// Fallback used if the sprite sheet itself fails to load on a very old browser.
const IDLE_FALLBACK_PNG = idleAsset.url;

// Inject keyframes once. The animation walks background-position right 30
// steps, then holds the last frame for ~1s before looping — "breathe →
// settle → breathe" without a continuous wobble.
const STYLE_ID = "benny-dog-sprite-keyframes-v6-rigged-legs";
const ensureKeyframes = () => {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = `
@keyframes benny-idle-sprite-walk {
  0%   { background-position-x: 0px; }
  86%  { background-position-x: var(--benny-sprite-end, -8120px); }
  100% { background-position-x: var(--benny-sprite-end, -8120px); }
}
.benny-sprite-action-idle { animation-duration: 3.2s; }
.benny-sprite-action-walk { animation-duration: 0.6s; }
.benny-sprite-action-jump { animation-duration: 0.5s; }
.benny-sprite-action-climb { animation-duration: 0.6s; }
.benny-idle-sprite {
  background-repeat: no-repeat;
  background-position: 0px 0px;
  animation-name: benny-idle-sprite-walk;
  animation-timing-function: steps(29, end);
  animation-iteration-count: infinite;
  will-change: background-position;
}
.benny-legs {
  position: absolute;
  left: 0; right: 0; bottom: -2%;
  height: 30%;
  pointer-events: none;
  opacity: 0;
}
.benny-legs-walk, .benny-legs-jump, .benny-legs-climb { opacity: 1; }
.benny-leg {
  position: absolute;
  bottom: 14%;
  width: 17%;
  height: 60%;
  border-radius: 42% 42% 50% 50% / 28% 28% 60% 60%;
  background: linear-gradient(180deg, #f6b86b 0%, #e29142 60%, #c97623 100%);
  box-shadow:
    inset 0 -0.35em 0 rgba(120, 60, 12, 0.22),
    inset 0 0.18em 0 rgba(255, 232, 188, 0.35),
    0 0.18em 0.25em rgba(0,0,0,0.18);
  transform-origin: 50% 6%;
}
.benny-leg-paw {
  position: absolute;
  left: -14%; right: -14%; bottom: -22%;
  height: 42%;
  border-radius: 50% 50% 48% 48% / 40% 40% 60% 60%;
  background: radial-gradient(ellipse at 50% 30%, #fff3d6 0 18%, #f4b25a 38% 70%, #a85e1c 100%);
  box-shadow: 0 0.18em 0.22em rgba(0,0,0,0.2);
}
.benny-leg-left  { left: 30%; }
.benny-leg-right { right: 30%; }
@keyframes benny-leg-swing-a {
  0%, 100% { transform: rotate(-30deg); }
  50%      { transform: rotate(30deg); }
}
@keyframes benny-leg-swing-b {
  0%, 100% { transform: rotate(30deg); }
  50%      { transform: rotate(-30deg); }
}
.benny-legs-walk .benny-leg-left  { animation: benny-leg-swing-a 0.5s ease-in-out infinite; }
.benny-legs-walk .benny-leg-right { animation: benny-leg-swing-b 0.5s ease-in-out infinite; }
.benny-legs-jump .benny-leg-left  { animation: benny-leg-swing-a 0.38s ease-in-out infinite; }
.benny-legs-jump .benny-leg-right { animation: benny-leg-swing-b 0.38s ease-in-out infinite; }
@keyframes benny-leg-climb-a {
  0%, 100% { transform: rotate(-8deg) translateY(0); }
  50%      { transform: rotate(-18deg) translateY(-22%); }
}
@keyframes benny-leg-climb-b {
  0%, 100% { transform: rotate(8deg) translateY(-22%); }
  50%      { transform: rotate(18deg) translateY(0); }
}
.benny-legs-climb .benny-leg-left  { animation: benny-leg-climb-a 0.7s ease-in-out infinite; }
.benny-legs-climb .benny-leg-right { animation: benny-leg-climb-b 0.7s ease-in-out infinite; }
@keyframes benny-celebrate-bounce {
  0%, 100% { transform: translateY(0) scale(1); }
  50%      { transform: translateY(-18px) scale(1.15); }
}
@keyframes benny-sad-shake {
  0%, 100% { transform: translateX(0); }
  20%      { transform: translateX(-8px); }
  40%      { transform: translateX(8px); }
  60%      { transform: translateX(-6px); }
  80%      { transform: translateX(6px); }
}
.benny-anim-celebrate { animation: benny-celebrate-bounce 0.4s ease-in-out infinite; }
.benny-anim-sad       { animation: benny-sad-shake       0.4s ease-in-out 3; }
@media (prefers-reduced-motion: reduce) {
  .benny-idle-sprite { animation: none; background-position-x: calc(var(--benny-sprite-end, -8120px) / 2); }
  .benny-leg { animation: none !important; }
  .benny-anim-celebrate, .benny-anim-sad { animation: none; }
}
`;
  document.head.appendChild(el);
};

export const BennyDog = ({
  mood = "idle",
  size = 280,
  className,
  style,
}: BennyDogProps) => {
  ensureKeyframes();

  // Replay sad animation each time mood transitions back to "sad".
  const [sadNonce, setSadNonce] = useState(0);
  const prevMood = useRef<BennyMood>(mood);
  useEffect(() => {
    if (mood === "sad" && prevMood.current !== "sad") {
      setSadNonce((n) => n + 1);
    }
    prevMood.current = mood;
  }, [mood]);

  // Sprite cell height in CSS pixels, given the requested square `size`. We
  // render the sprite into a `size`×`spriteH` box, vertically aligned to the
  // bottom of the surrounding `size` square so feet sit on the same baseline
  // as the celebrate/sad PNGs.
  const spriteH = Math.round(size * SPRITE_ASPECT);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: size,
        height: size,
        pointerEvents: "none",
        userSelect: "none",
        ...style,
      }}
    >
      {/* Sprite-backed Benny — idle/walk/jump all keep visible leg motion. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          width: size,
          height: spriteH,
          opacity: mood === "idle" || mood === "walk" || mood === "jump" ? 1 : 0,
          transition: "opacity 0.3s ease-in-out",
        }}
      >
        <div
          className={`benny-idle-sprite benny-sprite-action-${mood === "walk" || mood === "jump" ? mood : "idle"}`}
          style={{
            width: size,
            height: spriteH,
            backgroundImage: `url(${bennySprite.url})`,
            backgroundSize: `${size * SPRITE_FRAMES}px ${spriteH}px`,
            ["--benny-sprite-end" as any]: `${-(SPRITE_FRAMES - 1) * size}px`,
          }}
          aria-label={mood === "idle" || mood === "walk" || mood === "jump" ? "Benny the puppy" : undefined}
          role={mood === "idle" || mood === "walk" || mood === "jump" ? "img" : undefined}
        />
        <div className={`benny-action-paws benny-action-${mood === "walk" || mood === "jump" ? mood : "idle"}`}>
          <span className="benny-action-paw benny-action-paw-left" />
          <span className="benny-action-paw benny-action-paw-right" />
        </div>
      </div>

      {/* Celebrate / sad stills with their own CSS animation wrapper. */}
      {(["celebrate", "sad"] as const).map((m) => (
        <div
          key={m === "sad" ? `${m}-${sadNonce}` : m}
          className={m === mood ? `benny-anim-${m}` : undefined}
          style={{
            position: "absolute",
            inset: 0,
            opacity: m === mood ? 1 : 0,
            transition: "opacity 0.3s ease-in-out",
          }}
        >
          <img
            src={STILL_SOURCES[m]}
            alt={m === mood ? `Benny ${m}` : ""}
            aria-hidden={m === mood ? undefined : true}
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              pointerEvents: "none",
              userSelect: "none",
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default BennyDog;

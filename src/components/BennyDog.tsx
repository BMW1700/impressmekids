// Benny the Dog — Pre-K adventure character.
//
// Idle is a CSS sprite-sheet animation (30 frames, single-row strip). We use
// background-position steps instead of animated WebP because Safari decodes
// WebP single-threaded on the main thread, causing visible stutter. Sprite
// sheets composite through the GPU and run identically on every browser.
//
// Walk / jump reuse the sprite sheet and replace the visible front-leg area
// with clipped sprite copies so Benny never shows extra pasted-on legs.
// Celebrate / sad keep their still PNGs with CSS motion.

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
const STYLE_ID = "benny-dog-sprite-keyframes-v9-cutout-leg-copies";
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
.benny-idle-sprite {
  background-repeat: no-repeat;
  background-position: 0px 0px;
  animation-name: benny-idle-sprite-walk;
  animation-timing-function: steps(29, end);
  animation-iteration-count: infinite;
  will-change: background-position;
}
.benny-rig { position: relative; width: 100%; height: 100%; transform-origin: 50% 100%; }
.benny-rig-body { position: relative; z-index: 1; width: 100%; height: 100%; }
.benny-rig-hips { position: absolute; z-index: 3; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none; }
.benny-rig-leg {
  position: absolute; left: 50%; top: 72%;
  width: 8.5%; height: 21%; margin-left: -4.25%;
  border-radius: 46% 46% 42% 42% / 18% 18% 55% 55%;
  background: linear-gradient(180deg, #f8b64f 0%, #e88d27 58%, #bd6419 100%);
  box-shadow: inset -0.22em 0 0 rgba(151, 79, 13, 0.22), inset 0.16em 0.12em 0 rgba(255, 235, 188, 0.28), 0 0.12em 0.18em rgba(0,0,0,0.12);
  transform-origin: 50% 0%;
  opacity: 0;
}
.benny-rig-leg::after {
  content: ""; position: absolute; left: -45%; bottom: -20%; width: 190%; height: 42%;
  border-radius: 48% 52% 55% 45%;
  background: radial-gradient(ellipse at 42% 35%, #fff0cf 0 24%, #f6ba6b 48% 78%, #b35e17 100%);
  box-shadow: inset 0 -0.12em 0 rgba(139, 69, 12, 0.22), 0 0.12em 0.18em rgba(0,0,0,0.16);
}
.benny-rig-moving .benny-rig-leg { opacity: 1; }
.benny-rig-leg-l { transform: translate(-155%, 0) rotate(0deg); }
.benny-rig-leg-r { transform: translate(68%, 0) rotate(0deg); }
@keyframes benny-leg-walk-l {
  0%, 100% { transform: translate(-155%, 0) rotate(-18deg) scaleY(1); }
  50%      { transform: translate(-155%, 0) rotate(24deg) scaleY(0.96); }
}
@keyframes benny-leg-walk-r {
  0%, 100% { transform: translate(68%, 0) rotate(24deg) scaleY(0.96); }
  50%      { transform: translate(68%, 0) rotate(-18deg) scaleY(1); }
}
.benny-rig-walk .benny-rig-leg-l { animation: benny-leg-walk-l 0.36s ease-in-out infinite; }
.benny-rig-walk .benny-rig-leg-r { animation: benny-leg-walk-r 0.36s ease-in-out infinite; }
@keyframes benny-leg-jump-pair {
  0%, 100% { transform: translate(var(--lx,-155%), 0) rotate(var(--lr,-8deg)) scaleY(1); }
  50%      { transform: translate(var(--lx,-155%), 0) rotate(var(--lr,-8deg)) scaleY(0.72); }
}
.benny-rig-jump .benny-rig-leg-l { --lx: -155%; --lr: -10deg; animation: benny-leg-jump-pair 0.45s ease-in-out infinite; }
.benny-rig-jump .benny-rig-leg-r { --lx:   68%; --lr:  10deg; animation: benny-leg-jump-pair 0.45s ease-in-out infinite; }
@keyframes benny-leg-climb-l {
  0%, 100% { transform: translate(-155%, 0) rotate(-14deg) scaleY(1); }
  50%      { transform: translate(-155%, 0) rotate(18deg) scaleY(0.86); }
}
@keyframes benny-leg-climb-r {
  0%, 100% { transform: translate(68%, 0) rotate(18deg) scaleY(0.86); }
  50%      { transform: translate(68%, 0) rotate(-14deg) scaleY(1); }
}
.benny-rig-climb .benny-rig-leg-l { animation: benny-leg-climb-l 0.7s ease-in-out infinite; }
.benny-rig-climb .benny-rig-leg-r { animation: benny-leg-climb-r 0.7s ease-in-out infinite; }
@keyframes benny-body-bob {
  0%, 100% { transform: translateY(0) rotate(-1deg); }
  50%      { transform: translateY(-4%) rotate(1deg); }
}
@keyframes benny-body-jump {
  0%, 100% { transform: translateY(0)    scaleY(1); }
  35%      { transform: translateY(-12%) scaleY(1.04); }
  60%      { transform: translateY(-12%) scaleY(1.04); }
}
.benny-rig-walk  { animation: none; }
.benny-rig-jump  { animation: benny-body-jump 0.45s ease-in-out infinite; }
.benny-rig-climb { animation: none; }
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
  .benny-rig, .benny-rig-leg { animation: none !important; }
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
      {/* Sprite-backed Benny body wrapped in an attached leg rig. Body stays
          whole and bobs as a unit; hind legs swing past the silhouette only
          during walk/jump/climb. */}
      {(() => {
        const isSprite = mood === "idle" || mood === "walk" || mood === "jump" || mood === "climb";
        const isMoving = mood === "walk" || mood === "jump" || mood === "climb";
        const rigClass = isMoving ? `benny-rig benny-rig-moving benny-rig-${mood}` : "benny-rig";
        return (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              width: size,
              height: spriteH,
              opacity: isSprite ? 1 : 0,
              transition: "opacity 0.3s ease-in-out",
            }}
          >
            <div className={rigClass}>
              {isMoving && (
                <div className="benny-rig-hips" aria-hidden="true">
                  <span className="benny-rig-leg benny-rig-leg-l" />
                  <span className="benny-rig-leg benny-rig-leg-r" />
                </div>
              )}
              <div
                className="benny-idle-sprite benny-rig-body benny-sprite-action-idle"
                style={{
                  backgroundImage: `url(${bennySprite.url})`,
                  backgroundSize: `${size * SPRITE_FRAMES}px ${spriteH}px`,
                  ["--benny-sprite-end" as any]: `${-(SPRITE_FRAMES - 1) * size}px`,
                }}
                aria-label={isSprite ? "Benny the puppy" : undefined}
                role={isSprite ? "img" : undefined}
              />
            </div>
          </div>
        );
      })()}

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

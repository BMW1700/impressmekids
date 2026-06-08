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
import bennyWalkSprite from "@/assets/benny-walk-sprite.png.asset.json";
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

// Walking sprite sheet (transparent cutout from real walking video).
const WALK_FRAMES = 24;
const WALK_ASPECT = 1; // 360×360 cells
const WALK_VISIBLE_BOTTOM_PAD = 38;


const STILL_SOURCES: Record<Extract<BennyMood, "celebrate" | "sad">, string> = {
  celebrate: celebrateAsset.url,
  sad: sadAsset.url,
};

// Fallback used if the sprite sheet itself fails to load on a very old browser.
const IDLE_FALLBACK_PNG = idleAsset.url;

// Inject keyframes once.
const STYLE_ID = "benny-dog-sprite-keyframes-v8-walk-grounded-face";
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
@keyframes benny-walk-cycle {
  0%   { background-position-x: 0px; }
  100% { background-position-x: var(--benny-walk-end, -8640px); }
}
.benny-idle-sprite {
  background-repeat: no-repeat;
  background-position: 0px 0px;
  animation: benny-idle-sprite-walk 3.2s steps(29, end) infinite;
  will-change: background-position;
}
.benny-walk-sprite {
  background-repeat: no-repeat;
  background-position: 0px 0px;
  animation: benny-walk-cycle 2.6s steps(${WALK_FRAMES - 1}, end) infinite;
  will-change: background-position;
}
.benny-walk-sprite-jump { animation-duration: 1.6s; }
.benny-walk-sprite-climb { animation-duration: 2.8s; }
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
  .benny-idle-sprite, .benny-walk-sprite { animation: none; }
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
      {/* Idle Benny: original sprite sheet (still pose breathing). */}
      {(() => {
        const isIdle = mood === "idle";
        return (
          <div
            style={{
              position: "absolute",
              left: 0, right: 0, bottom: 0,
              width: size, height: spriteH,
              opacity: isIdle ? 1 : 0,
              transition: "opacity 0.3s ease-in-out",
            }}
          >
            <div
              className="benny-idle-sprite"
              style={{
                width: size,
                height: spriteH,
                backgroundImage: `url(${bennySprite.url})`,
                backgroundSize: `${size * SPRITE_FRAMES}px ${spriteH}px`,
                ["--benny-sprite-end" as any]: `${-(SPRITE_FRAMES - 1) * size}px`,
              }}
              aria-label={isIdle ? "Benny the puppy" : undefined}
              role={isIdle ? "img" : undefined}
            />
          </div>
        );
      })()}

      {/* Walking Benny (real video-cutout sprite): plays for walk/jump/climb. */}
      {(() => {
        const isMoving = mood === "walk" || mood === "jump" || mood === "climb";
        const walkSize = size;
        const walkGroundCorrection = Math.round(walkSize * WALK_VISIBLE_BOTTOM_PAD / 360);
        return (
          <div
            style={{
              position: "absolute",
              left: 0, right: 0, bottom: -walkGroundCorrection,
              width: walkSize, height: walkSize,
              opacity: isMoving ? 1 : 0,
              transition: "opacity 0.2s ease-in-out",
            }}
          >
            <div
              className={`benny-walk-sprite${mood === "jump" ? " benny-walk-sprite-jump" : ""}${mood === "climb" ? " benny-walk-sprite-climb" : ""}`}
              style={{
                width: walkSize,
                height: walkSize,
                backgroundImage: `url(${bennyWalkSprite.url})`,
                backgroundSize: `${walkSize * WALK_FRAMES}px ${walkSize}px`,
                ["--benny-walk-end" as any]: `${-(WALK_FRAMES - 1) * walkSize}px`,
              }}
              aria-label={isMoving ? "Benny walking" : undefined}
              role={isMoving ? "img" : undefined}
            />
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

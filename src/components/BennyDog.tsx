// Benny the Dog — Pre-K adventure character.
// Idle is an animated transparent WebP (universal: Chrome/FF/Edge/Safari 14+
// /iOS 14+). Celebrate / sad still use the PNG sprites with CSS bounce/shake
// because we don't have video clips for those moods yet. All three layers stay
// mounted so mood switches crossfade without flicker.

import { useEffect, useRef, useState } from "react";
import idleAnimAsset from "@/assets/benny-idle.webp.asset.json";
import idleAsset from "@/assets/benny-idle.png.asset.json";
import celebrateAsset from "@/assets/benny-celebrate.png.asset.json";
import sadAsset from "@/assets/benny-sad.png.asset.json";

export type BennyMood = "idle" | "celebrate" | "sad";

interface BennyDogProps {
  mood?: BennyMood;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

// Idle pulls the animated WebP — already has motion baked in, so we don't apply
// the CSS bounce on top of it. Celebrate/sad still use stills + CSS animation.
const SOURCES: Record<BennyMood, string> = {
  idle: idleAnimAsset.url,
  celebrate: celebrateAsset.url,
  sad: sadAsset.url,
};

// Fallback PNG used if the animated WebP fails to decode on a very old browser.
const IDLE_FALLBACK_PNG = idleAsset.url;

const MOODS: BennyMood[] = ["idle", "celebrate", "sad"];

// Inject keyframes once.
const STYLE_ID = "benny-dog-keyframes-v2";
const ensureKeyframes = () => {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = `
@keyframes benny-idle-bounce {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-8px); }
}
@keyframes benny-celebrate {
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
/* Blink: eyes-closed frame fades in for a brief moment every ~4s. */
@keyframes benny-blink {
  0%, 88%, 100% { opacity: 0; transform: scaleY(0.08); }
  91%, 96%      { opacity: 1; transform: scaleY(1); }
}
@keyframes benny-tail-wag {
  0%, 100% { transform: rotate(-16deg); }
  50%      { transform: rotate(18deg); }
}
.benny-anim-idle      { animation: benny-idle-bounce 1.8s ease-in-out infinite; }
.benny-anim-celebrate { animation: benny-celebrate    0.4s ease-in-out infinite; }
.benny-anim-sad       { animation: benny-sad-shake    0.4s ease-in-out 3; }
.benny-blink-layer    { animation: benny-blink 3.2s ease-in-out infinite; }
.benny-tail-layer {
  position: absolute;
  right: 8%;
  top: 38%;
  width: 25%;
  height: 10%;
  border-radius: 999px 999px 999px 25%;
  background: hsl(var(--primary));
  transform-origin: 8% 50%;
  animation: benny-tail-wag 0.42s ease-in-out infinite;
}
.benny-eye-blink {
  position: absolute;
  top: 28.4%;
  width: 10.5%;
  height: 9.5%;
  border-radius: 999px;
  background: hsl(var(--secondary));
  opacity: 0;
  transform-origin: center;
  animation: benny-blink 3.2s ease-in-out infinite;
  z-index: 3;
  box-shadow: inset 0 -0.35em 0 hsl(var(--foreground) / 0.55);
}
.benny-eye-blink-left { left: 36.3%; }
.benny-eye-blink-right { left: 56.3%; }
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
      <div
        key={mood === "sad" ? `sad-${sadNonce}` : mood}
        className={`benny-anim-${mood}`}
        style={{ position: "absolute", inset: 0 }}
      >
        {mood === "idle" && <span className="benny-tail-layer" aria-hidden />}
        {MOODS.map((m) => (
          <img
            key={m}
            src={SOURCES[m]}
            alt={m === mood ? "Benny the dog" : ""}
            aria-hidden={m === mood ? undefined : true}
            draggable={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              opacity: m === mood ? 1 : 0,
              transition: "opacity 0.3s ease-in-out",
              pointerEvents: "none",
              userSelect: "none",
            }}
          />
        ))}
        {/* Blink layer — only fades in while idle so it perfectly overlays the open-eye frame. */}
        {mood === "idle" && (
          <img
            src={idleBlinkAsset.url}
            alt=""
            aria-hidden
            draggable={false}
            className="benny-blink-layer"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              opacity: 0,
              pointerEvents: "none",
              userSelect: "none",
            }}
          />
        )}
        {mood === "idle" && (
          <>
            <span className="benny-eye-blink benny-eye-blink-left" aria-hidden />
            <span className="benny-eye-blink benny-eye-blink-right" aria-hidden />
          </>
        )}
      </div>
    </div>
  );
};

export default BennyDog;

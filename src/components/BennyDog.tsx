// Benny the Dog — Pre-K adventure character.
// Three moods crossfade smoothly; both images stay mounted to avoid flicker.

import { useEffect, useRef, useState } from "react";
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

const SOURCES: Record<BennyMood, string> = {
  idle: idleAsset.url,
  celebrate: celebrateAsset.url,
  sad: sadAsset.url,
};

const MOODS: BennyMood[] = ["idle", "celebrate", "sad"];

// Inject keyframes once.
const STYLE_ID = "benny-dog-keyframes";
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
@keyframes benny-blink {
  0%, 92%, 100% { transform: scaleY(0); }
  95%, 97%      { transform: scaleY(1); }
}
.benny-anim-idle      { animation: benny-idle-bounce 1.8s ease-in-out infinite; }
.benny-anim-celebrate { animation: benny-celebrate    0.4s ease-in-out infinite; }
.benny-anim-sad       { animation: benny-sad-shake    0.4s ease-in-out 3; }
.benny-eyelid {
  position: absolute;
  background: #d98a3d;
  border-radius: 50%;
  transform-origin: top center;
  transform: scaleY(0);
  animation: benny-blink 4.2s ease-in-out infinite;
  pointer-events: none;
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
      </div>
    </div>
  );
};

export default BennyDog;

// Benny the Dog — Pre-K adventure character.
// 9 moods crossfade smoothly; all images stay mounted to avoid flicker.

import { useEffect, useRef, useState } from "react";
import idleAsset from "@/assets/benny-idle.png.asset.json";
import celebrateAsset from "@/assets/benny-celebrate.png.asset.json";
import sadAsset from "@/assets/benny-sad.png.asset.json";
import happyAsset from "@/assets/benny-happy.png.asset.json";
import excitedAsset from "@/assets/benny-excited.png.asset.json";
import cheeringAsset from "@/assets/benny-cheering.png.asset.json";
import thinkingAsset from "@/assets/benny-thinking.png.asset.json";
import surprisedAsset from "@/assets/benny-surprised.png.asset.json";
import sleepyAsset from "@/assets/benny-sleepy.png.asset.json";

export type BennyMood =
  | "idle"
  | "celebrate"
  | "sad"
  | "happy"
  | "excited"
  | "cheering"
  | "thinking"
  | "surprised"
  | "sleepy";

interface BennyDogProps {
  mood?: BennyMood;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const BENNY_SOURCES: Record<BennyMood, string> = {
  idle: idleAsset.url,
  celebrate: celebrateAsset.url,
  sad: sadAsset.url,
  happy: happyAsset.url,
  excited: excitedAsset.url,
  cheering: cheeringAsset.url,
  thinking: thinkingAsset.url,
  surprised: surprisedAsset.url,
  sleepy: sleepyAsset.url,
};

const MOODS: BennyMood[] = [
  "idle",
  "celebrate",
  "sad",
  "happy",
  "excited",
  "cheering",
  "thinking",
  "surprised",
  "sleepy",
];

// One-shot moods replay each time they're (re)selected.
const ONE_SHOT: BennyMood[] = ["sad", "surprised"];

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
  50%      { transform: translateY(-20px) scale(1.15); }
}
@keyframes benny-sad-shake {
  0%, 100% { transform: translateX(0); }
  20%      { transform: translateX(-8px); }
  40%      { transform: translateX(8px); }
  60%      { transform: translateX(-6px); }
  80%      { transform: translateX(6px); }
}
@keyframes benny-excited {
  0%   { transform: translateY(0)    rotate(0deg); }
  50%  { transform: translateY(-16px) rotate(180deg); }
  100% { transform: translateY(0)    rotate(360deg); }
}
@keyframes benny-cheering {
  0%, 100% { transform: translateY(0)    scale(1); }
  50%      { transform: translateY(-22px) scale(1.2); }
}
@keyframes benny-happy {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
}
@keyframes benny-thinking {
  0%, 100% { transform: rotate(-6deg); }
  50%      { transform: rotate(6deg); }
}
@keyframes benny-surprised {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.2); }
  100% { transform: scale(1); }
}
@keyframes benny-sleepy {
  0%, 100% { transform: rotate(-3deg); }
  50%      { transform: rotate(3deg); }
}
.benny-anim-idle      { animation: benny-idle-bounce 1.8s ease-in-out infinite; }
.benny-anim-celebrate { animation: benny-celebrate    0.4s ease-in-out infinite; }
.benny-anim-sad       { animation: benny-sad-shake    0.4s ease-in-out 3; }
.benny-anim-excited   { animation: benny-excited      0.5s linear      infinite; }
.benny-anim-cheering  { animation: benny-cheering     0.6s ease-in-out infinite; }
.benny-anim-happy     { animation: benny-happy        1.0s ease-in-out infinite; }
.benny-anim-thinking  { animation: benny-thinking     2.0s ease-in-out infinite; }
.benny-anim-surprised { animation: benny-surprised    0.3s ease-out    1 both; }
.benny-anim-sleepy    { animation: benny-sleepy       3.0s ease-in-out infinite; }
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

  // Replay one-shot animations each time mood (re)enters those states.
  const [nonce, setNonce] = useState(0);
  const prevMood = useRef<BennyMood>(mood);
  useEffect(() => {
    if (ONE_SHOT.includes(mood) && prevMood.current !== mood) {
      setNonce((n) => n + 1);
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
        key={ONE_SHOT.includes(mood) ? `${mood}-${nonce}` : mood}
        className={`benny-anim-${mood}`}
        style={{ position: "absolute", inset: 0 }}
      >
        {MOODS.map((m) => (
          <img
            key={m}
            src={BENNY_SOURCES[m]}
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

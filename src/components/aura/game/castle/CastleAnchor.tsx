import { memo } from "react";

interface Props {
  side: "left" | "right";
  hp: number;
  maxHp: number;
  label: string;
}

type Tier = "healthy" | "light" | "heavy" | "critical";

const tierFor = (pct: number): Tier => {
  if (pct >= 0.7) return "healthy";
  if (pct >= 0.4) return "light";
  if (pct >= 0.15) return "heavy";
  return "critical";
};

/**
 * Invisible overlay anchored over the painted castle in the background.
 * Renders the HP label + damage-state overlays (cracks, smoke, glow).
 * Pure visuals — no gameplay state.
 */
export const CastleAnchor = memo(({ side, hp, maxHp, label }: Props) => {
  const pct = maxHp > 0 ? Math.max(0, hp / maxHp) : 0;
  const tier = tierFor(pct);
  const isEnemy = side === "left";

  const sideClass = side === "left" ? "left-[3%]" : "right-[3%]";
  const barColor = isEnemy
    ? "from-rose-500 to-red-700"
    : "from-sky-400 to-blue-600";
  const labelColor = isEnemy ? "text-rose-200" : "text-sky-100";
  const borderColor = isEnemy ? "border-rose-900/70" : "border-sky-900/70";

  return (
    <div
      className={`absolute bottom-[8%] ${sideClass} pointer-events-none z-10`}
      style={{ width: "clamp(120px, 18vw, 200px)", height: "clamp(140px, 22vw, 220px)" }}
      aria-hidden
    >
      {/* HP label floating just above the painted battlements */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-center select-none">
        <div className={`text-[10px] font-black tracking-wider drop-shadow ${labelColor}`}>
          {label}
        </div>
        <div
          className={`mx-auto bg-slate-900/85 rounded-full overflow-hidden border ${borderColor} mt-1 ${
            tier === "critical" ? "animate-pulse" : ""
          }`}
          style={{ width: "clamp(80px, 14vw, 140px)", height: 8 }}
        >
          <div
            className={`h-full bg-gradient-to-r ${barColor} transition-all duration-300`}
            style={{ width: `${pct * 100}%` }}
          />
        </div>
        <div className={`text-[9px] mt-0.5 font-bold drop-shadow ${labelColor}`}>
          {Math.max(0, Math.round(hp))} / {maxHp}
        </div>
      </div>

      {/* Damage overlay layer — sits on top of painted castle art */}
      {tier !== "healthy" && (
        <div className="absolute inset-x-0 bottom-0 top-8 overflow-hidden">
          {/* Cracks (SVG, multiply blend so they read on light + dark castles) */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full"
            style={{ mixBlendMode: "multiply", opacity: tier === "light" ? 0.45 : tier === "heavy" ? 0.7 : 0.9 }}
          >
            <g stroke="#0a0a0a" strokeWidth="0.6" fill="none" strokeLinecap="round">
              <path d="M30 20 L34 40 L28 60 L36 80" />
              <path d="M65 25 L60 45 L68 65 L62 85" />
              {(tier === "heavy" || tier === "critical") && (
                <>
                  <path d="M45 15 L48 35 L42 55 L50 75" strokeWidth="0.8" />
                  <path d="M20 50 L40 55 L55 50" />
                  <path d="M55 60 L75 65 L88 60" />
                </>
              )}
              {tier === "critical" && (
                <>
                  <path d="M10 30 L25 40 L18 55" strokeWidth="1" />
                  <path d="M80 40 L90 55 L82 70" strokeWidth="1" />
                </>
              )}
            </g>
          </svg>

          {/* Dimming wash */}
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: tier === "light" ? 0.06 : tier === "heavy" ? 0.14 : 0.22 }}
          />

          {/* Rising smoke puffs */}
          <div
            className="absolute left-[28%] bottom-[55%] rounded-full bg-slate-700/60 castle-smoke"
            style={{ width: 22, height: 22, animationDuration: "3.2s" }}
          />
          {(tier === "heavy" || tier === "critical") && (
            <div
              className="absolute left-[58%] bottom-[60%] rounded-full bg-slate-800/55 castle-smoke"
              style={{ width: 18, height: 18, animationDuration: "3.8s", animationDelay: "0.9s" }}
            />
          )}
          {tier === "critical" && (
            <>
              <div
                className="absolute left-[42%] bottom-[68%] rounded-full bg-slate-900/60 castle-smoke"
                style={{ width: 26, height: 26, animationDuration: "4.2s", animationDelay: "0.4s" }}
              />
              {/* Warning glow at the gate */}
              <div
                className="absolute left-1/2 bottom-0 -translate-x-1/2 rounded-full castle-glow"
                style={{
                  width: "60%",
                  height: 36,
                  background: "radial-gradient(ellipse at center, rgba(255,80,40,0.55) 0%, transparent 70%)",
                }}
              />
            </>
          )}
          {tier === "heavy" && (
            <div
              className="absolute left-1/2 bottom-0 -translate-x-1/2 rounded-full"
              style={{
                width: "50%",
                height: 28,
                background: "radial-gradient(ellipse at center, rgba(255,160,60,0.35) 0%, transparent 70%)",
              }}
            />
          )}

          {/* Rubble silhouette at base (critical only) */}
          {tier === "critical" && (
            <svg
              viewBox="0 0 100 20"
              preserveAspectRatio="none"
              className="absolute inset-x-0 bottom-0 w-full h-5"
              style={{ mixBlendMode: "multiply", opacity: 0.85 }}
            >
              <path
                d="M0 20 L10 14 L18 18 L26 12 L34 17 L44 13 L54 18 L62 14 L72 17 L82 13 L92 18 L100 14 L100 20 Z"
                fill="#1a1410"
              />
            </svg>
          )}
        </div>
      )}
    </div>
  );
});
CastleAnchor.displayName = "CastleAnchor";

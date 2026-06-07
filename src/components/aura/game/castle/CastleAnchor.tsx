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
 * Renders the HP label + realistic damage FX (fractal cracks, scorch,
 * missing battlements, drifting smoke, embers, heat shimmer).
 * Pure visuals — no gameplay state.
 *
 * The overlay box is tall and the damage layer is positioned on the upper
 * portion so FX land on stone, not on the grass/path in front of the castle.
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

  // Mirror crack pattern on the right-side castle so damage doesn't look identical.
  const mirror = side === "right" ? "scaleX(-1)" : undefined;

  // Scorch spots — base set; tier gates how many actually render.
  const scorches = [
    { l: 22, t: 18, s: 28 },
    { l: 58, t: 22, s: 24 },
    { l: 40, t: 35, s: 32 },
    { l: 70, t: 42, s: 22 },
    { l: 18, t: 50, s: 26 },
    { l: 52, t: 58, s: 30 },
    { l: 30, t: 70, s: 22 },
    { l: 64, t: 72, s: 26 },
    { l: 46, t: 84, s: 20 },
  ];
  const scorchCount = tier === "light" ? 3 : tier === "heavy" ? 6 : tier === "critical" ? 9 : 0;

  return (
    <div
      className={`absolute bottom-[18%] ${sideClass} pointer-events-none z-10`}
      style={{ width: "clamp(140px, 20vw, 220px)", height: "clamp(200px, 30vw, 300px)" }}
      aria-hidden
    >
      {/* HP label floating above the painted battlements */}
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

      {/* Damage overlay layer — sits on the stone tower/wall area of the painted castle */}
      {tier !== "healthy" && (
        <div
          className="absolute overflow-hidden"
          style={{
            left: "8%",
            right: "8%",
            top: "18%",
            bottom: "42%",
            transform: mirror,
          }}
        >
          {/* Fractal crack network — dark core + warm inner highlight for depth */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full"
            style={{
              mixBlendMode: "multiply",
              opacity: tier === "light" ? 0.55 : tier === "heavy" ? 0.8 : 0.95,
            }}
          >
            {/* Highlight stroke (offset slightly) — fakes a bevel inside the crack */}
            <g
              stroke="#3a2a1a"
              strokeWidth="0.45"
              fill="none"
              strokeLinecap="round"
              transform="translate(0.3 0.3)"
              opacity="0.7"
            >
              <path d="M28 8 L31 24 L26 40 L33 56 L27 74 L31 92" />
              <path d="M31 24 L22 30 M26 40 L35 44 M33 56 L24 62 M27 74 L36 80" />
              <path d="M62 12 L58 28 L66 44 L60 62 L64 82" />
              <path d="M58 28 L68 32 M66 44 L56 50 M60 62 L70 68" />
              {(tier === "heavy" || tier === "critical") && (
                <>
                  <path d="M45 6 L48 22 L42 38 L50 54 L44 72 L48 90" />
                  <path d="M48 22 L40 28 M42 38 L52 42 M50 54 L40 60 M44 72 L54 76" />
                  <path d="M14 36 L30 40 L46 38 L62 42 L78 40 L92 44" />
                  <path d="M16 64 L34 66 L52 62 L70 68 L88 66" />
                </>
              )}
              {tier === "critical" && (
                <>
                  <path d="M8 16 L20 26 L14 42 L24 56 L18 72 L26 88" />
                  <path d="M82 18 L92 30 L84 46 L94 60 L86 76" />
                </>
              )}
            </g>

            {/* Dark core stroke */}
            <g stroke="#0a0807" strokeWidth="0.55" fill="none" strokeLinecap="round">
              <path d="M28 8 L31 24 L26 40 L33 56 L27 74 L31 92" />
              <path d="M31 24 L22 30 M26 40 L35 44 M33 56 L24 62 M27 74 L36 80" />
              <path d="M62 12 L58 28 L66 44 L60 62 L64 82" />
              <path d="M58 28 L68 32 M66 44 L56 50 M60 62 L70 68" />
              {(tier === "heavy" || tier === "critical") && (
                <>
                  <path d="M45 6 L48 22 L42 38 L50 54 L44 72 L48 90" strokeWidth="0.7" />
                  <path d="M48 22 L40 28 M42 38 L52 42 M50 54 L40 60 M44 72 L54 76" />
                  <path d="M14 36 L30 40 L46 38 L62 42 L78 40 L92 44" />
                  <path d="M16 64 L34 66 L52 62 L70 68 L88 66" />
                </>
              )}
              {tier === "critical" && (
                <>
                  <path d="M8 16 L20 26 L14 42 L24 56 L18 72 L26 88" strokeWidth="0.85" />
                  <path d="M82 18 L92 30 L84 46 L94 60 L86 76" strokeWidth="0.85" />
                </>
              )}
            </g>
          </svg>

          {/* Scorch / soot wash — radial dark spots, multiply-blended into the stone */}
          {scorches.slice(0, scorchCount).map((s, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${s.l}%`,
                top: `${s.t}%`,
                width: s.s,
                height: s.s,
                background: "radial-gradient(circle, rgba(15,10,8,0.7) 0%, rgba(15,10,8,0.3) 45%, transparent 75%)",
                mixBlendMode: "multiply",
                filter: "blur(4px)",
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}

          {/* Battlement chunks knocked out (heavy+) — dark notches biting into the top edge */}
          {(tier === "heavy" || tier === "critical") && (
            <svg
              viewBox="0 0 100 14"
              preserveAspectRatio="none"
              className="absolute inset-x-0 top-0 w-full"
              style={{ height: "14%", mixBlendMode: "multiply", opacity: 0.92 }}
            >
              <path
                d={
                  tier === "critical"
                    ? "M0 0 L18 0 L22 9 L30 2 L40 0 L48 11 L58 3 L66 0 L74 8 L84 1 L92 0 L100 0 L100 14 L0 14 Z"
                    : "M0 0 L24 0 L30 7 L42 2 L54 0 L62 8 L74 2 L86 0 L100 0 L100 14 L0 14 Z"
                }
                fill="#120b08"
              />
            </svg>
          )}

          {/* Drifting smoke puffs — dual-layer soft */}
          <div
            className="absolute left-[28%] bottom-[40%] rounded-full bg-slate-900/45 castle-smoke"
            style={{ width: 24, height: 24, animationDuration: "5.2s" }}
          />
          {(tier === "heavy" || tier === "critical") && (
            <div
              className="absolute left-[58%] bottom-[48%] rounded-full bg-slate-800/40 castle-smoke"
              style={{ width: 22, height: 22, animationDuration: "5.8s", animationDelay: "1.4s" }}
            />
          )}
          {tier === "critical" && (
            <>
              <div
                className="absolute left-[42%] bottom-[55%] rounded-full bg-slate-900/50 castle-smoke"
                style={{ width: 30, height: 30, animationDuration: "6.2s", animationDelay: "0.6s" }}
              />
              <div
                className="absolute left-[20%] bottom-[60%] rounded-full bg-slate-800/40 castle-smoke"
                style={{ width: 20, height: 20, animationDuration: "5.5s", animationDelay: "2.2s" }}
              />
            </>
          )}

          {/* Embers (critical only) — slow-rising orange motes */}
          {tier === "critical" && (
            <>
              <div
                className="absolute left-[34%] bottom-[10%] rounded-full castle-ember"
                style={{
                  width: 3,
                  height: 3,
                  background: "#ffb84a",
                  boxShadow: "0 0 4px 1px rgba(255,140,40,0.7)",
                  animationDuration: "3.4s",
                }}
              />
              <div
                className="absolute left-[52%] bottom-[18%] rounded-full castle-ember"
                style={{
                  width: 2.5,
                  height: 2.5,
                  background: "#ffc864",
                  boxShadow: "0 0 4px 1px rgba(255,160,60,0.7)",
                  animationDuration: "4.1s",
                  animationDelay: "0.7s",
                }}
              />
              <div
                className="absolute left-[44%] bottom-[6%] rounded-full castle-ember"
                style={{
                  width: 3,
                  height: 3,
                  background: "#ffa030",
                  boxShadow: "0 0 5px 1px rgba(255,120,30,0.7)",
                  animationDuration: "3.8s",
                  animationDelay: "1.3s",
                }}
              />
              <div
                className="absolute left-[62%] bottom-[12%] rounded-full castle-ember"
                style={{
                  width: 2.5,
                  height: 2.5,
                  background: "#ffd070",
                  boxShadow: "0 0 4px 1px rgba(255,170,80,0.7)",
                  animationDuration: "4.6s",
                  animationDelay: "2.1s",
                }}
              />
            </>
          )}

          {/* Warm fire-lit wash (heavy+) — replaces the harsh neon ring */}
          {(tier === "heavy" || tier === "critical") && (
            <div
              className={`absolute left-1/2 bottom-0 -translate-x-1/2 rounded-full ${
                tier === "critical" ? "castle-glow" : ""
              }`}
              style={{
                width: "70%",
                height: 50,
                background:
                  tier === "critical"
                    ? "radial-gradient(ellipse at center, rgba(255,90,30,0.45) 0%, rgba(255,140,40,0.18) 45%, transparent 75%)"
                    : "radial-gradient(ellipse at center, rgba(255,150,60,0.28) 0%, transparent 70%)",
                mixBlendMode: "screen",
              }}
            />
          )}
        </div>
      )}

      {/* Heat shimmer band over the gate area (critical only, outside the damage box so it
          can extend down toward the gate) */}
      {tier === "critical" && (
        <div
          className="absolute castle-heat"
          style={{
            left: "20%",
            right: "20%",
            bottom: "38%",
            height: 18,
            background: "linear-gradient(to top, rgba(255,180,90,0.18), transparent)",
          }}
        />
      )}
    </div>
  );
});
CastleAnchor.displayName = "CastleAnchor";

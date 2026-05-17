import { memo } from "react";

/**
 * Layered parallax background for Castle Swarm Defense.
 * Stormy crimson sky, distant mountain silhouettes, midground
 * torch-lit battlements, foreground stone ground with perspective tilt.
 */
export const ArenaBackground = memo(() => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Sky gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-rose-950/70 to-slate-900" />

      {/* Distant clouds / smoke */}
      <div className="absolute top-[12%] left-[10%] w-40 h-12 rounded-full bg-rose-900/20 blur-2xl" />
      <div className="absolute top-[18%] right-[20%] w-60 h-14 rounded-full bg-rose-950/30 blur-2xl" />
      <div className="absolute top-[8%] left-[55%] w-32 h-10 rounded-full bg-slate-800/40 blur-xl" />

      {/* Far mountains */}
      <svg viewBox="0 0 1200 240" className="absolute bottom-[28%] left-0 right-0 w-full" preserveAspectRatio="none">
        <path
          d="M0 240 L0 160 L100 110 L180 140 L260 80 L360 130 L460 70 L560 120 L660 90 L760 130 L860 70 L960 110 L1060 90 L1140 130 L1200 100 L1200 240 Z"
          fill="#1a1a26"
          opacity="0.85"
        />
      </svg>

      {/* Mid mountains with battlements silhouettes */}
      <svg viewBox="0 0 1200 200" className="absolute bottom-[20%] left-0 right-0 w-full" preserveAspectRatio="none">
        <path
          d="M0 200 L0 130 L80 90 L160 120 L240 70 L320 110 L400 80 L480 120 L560 90 L640 130 L720 80 L800 110 L880 90 L960 120 L1040 80 L1120 110 L1200 90 L1200 200 Z"
          fill="#0f0f18"
        />
      </svg>

      {/* Distant torches glow */}
      <div className="absolute bottom-[26%] left-[18%] w-3 h-3 rounded-full bg-amber-400/70 blur-md" />
      <div className="absolute bottom-[28%] left-[42%] w-3 h-3 rounded-full bg-amber-400/70 blur-md" />
      <div className="absolute bottom-[27%] right-[30%] w-3 h-3 rounded-full bg-amber-400/70 blur-md" />
      <div className="absolute bottom-[29%] right-[12%] w-3 h-3 rounded-full bg-amber-400/70 blur-md" />

      {/* Ground plane with subtle perspective tilt */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[20%]"
        style={{
          background: "linear-gradient(to top, #1f1410 0%, #2a1a14 60%, transparent 100%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-[16%] opacity-50"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(0,0,0,0.4) 0px, rgba(0,0,0,0.4) 1px, transparent 1px, transparent 60px)",
          transform: "perspective(400px) rotateX(50deg)",
          transformOrigin: "center bottom",
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{ boxShadow: "inset 0 0 220px 40px rgba(0,0,0,0.7)" }}
      />
    </div>
  );
});
ArenaBackground.displayName = "ArenaBackground";

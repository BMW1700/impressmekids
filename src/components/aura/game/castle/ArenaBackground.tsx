import { memo } from "react";
import bgAsset from "@/assets/castle-swarm-bg.png.asset.json";

/**
 * Premium enchanted battlefield backdrop for Castle Swarm Defense.
 * Pure decoration — sits beneath all gameplay layers (castles, units, HP bars, HUD, reading panel).
 * Painted scene aligns naturally with arena: dark enemy keep on the LEFT, blue hero castle on the RIGHT.
 */
export const ArenaBackground = memo(() => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <img
        src={bgAsset.url}
        alt=""
        draggable={false}
        loading="eager"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover select-none"
      />

      {/* Soft readability scrim behind top HUD only */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/55 via-black/25 to-transparent" />

      {/* Soft readability scrim behind bottom reading panel only */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />

      {/* Subtle edge vignette to focus attention on the lane */}
      <div
        className="absolute inset-0"
        style={{ boxShadow: "inset 0 0 180px 30px rgba(0,0,0,0.45)" }}
      />
    </div>
  );
});
ArenaBackground.displayName = "ArenaBackground";

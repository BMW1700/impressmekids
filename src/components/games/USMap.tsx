import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface USMapProps {
  onStateClick: (stateName: string) => void;
  highlightCorrect?: string;
  highlightIncorrect?: string;
  disabled?: boolean;
}

type StateShape = {
  id: string;
  name: string;
  shape: string;
};

export function USMap({
  onStateClick,
  highlightCorrect,
  highlightIncorrect,
  disabled,
}: USMapProps) {
  const [states, setStates] = useState<StateShape[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/us-states-paths.json", { cache: "force-cache" });
        if (!res.ok) throw new Error(`Failed to load US map data (${res.status})`);
        const data = (await res.json()) as StateShape[];
        if (!cancelled) setStates(data);
      } catch (err) {
        console.error(err);
        if (!cancelled) setStates([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const getStateColor = (stateName: string) => {
    if (stateName === highlightCorrect) return "hsl(142 76% 36%)"; // green
    if (stateName === highlightIncorrect) return "hsl(0 84% 60%)"; // red
    return "hsl(220 14% 85%)"; // default
  };

  if (states === null) {
    return (
      <div className="w-full h-[60vh] grid place-items-center text-sm text-muted-foreground">
        Loading map...
      </div>
    );
  }

  return (
    <svg
      viewBox="0 0 959 593"
      className="w-full h-full"
      style={{ maxHeight: "70vh" }}
      role="img"
      aria-label="Clickable map of the United States"
    >
      {states.map((state) => (
        <motion.path
          key={state.id}
          d={state.shape}
          fill={getStateColor(state.name)}
          stroke="hsl(220 13% 65%)"
          strokeWidth="1"
          className={disabled ? "cursor-not-allowed" : "cursor-pointer"}
          whileHover={!disabled ? { scale: 1.02, filter: "brightness(0.95)" } : {}}
          onClick={() => !disabled && onStateClick(state.name)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, fill: getStateColor(state.name) }}
          transition={{ duration: 0.2 }}
        />
      ))}
    </svg>
  );
}

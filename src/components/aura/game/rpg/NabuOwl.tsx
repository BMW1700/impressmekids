// Simple, friendly SVG owl mascot — Yubi.
// Pure visual, no behavior. Sized via the `size` prop. Used in episode
// intro/outro panels for the Pre-K story shell.

interface YubiOwlProps {
  size?: number;
  className?: string;
  mood?: "happy" | "curious" | "cheer";
}

export const YubiOwl = ({ size = 140, className = "", mood = "happy" }: YubiOwlProps) => {
  const pupilY = mood === "curious" ? 33 : 35;
  const beakDip = mood === "cheer" ? 2 : 0;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
      role="presentation"
    >
      {/* tail feathers */}
      <ellipse cx="50" cy="82" rx="22" ry="10" fill="#8b5a2b" opacity="0.35" />
      {/* body */}
      <ellipse cx="50" cy="60" rx="30" ry="32" fill="#c98a4b" />
      {/* belly */}
      <ellipse cx="50" cy="66" rx="20" ry="22" fill="#f6d8a8" />
      {/* left wing */}
      <path d="M22 55 q-4 18 12 26 q-2 -16 -2 -28 z" fill="#a36a30" />
      {/* right wing */}
      <path d="M78 55 q4 18 -12 26 q2 -16 2 -28 z" fill="#a36a30" />
      {/* ear tufts */}
      <path d="M28 30 l6 -14 l4 12 z" fill="#8b5a2b" />
      <path d="M72 30 l-6 -14 l-4 12 z" fill="#8b5a2b" />
      {/* eye whites */}
      <circle cx="40" cy="38" r="9" fill="#ffffff" />
      <circle cx="60" cy="38" r="9" fill="#ffffff" />
      {/* pupils */}
      <circle cx="40" cy={pupilY} r="4" fill="#1a1a1a" />
      <circle cx="60" cy={pupilY} r="4" fill="#1a1a1a" />
      {/* glints */}
      <circle cx="41.5" cy={pupilY - 1.5} r="1.2" fill="#ffffff" />
      <circle cx="61.5" cy={pupilY - 1.5} r="1.2" fill="#ffffff" />
      {/* beak */}
      <path d={`M50 44 l-4 ${6 + beakDip} h8 z`} fill="#f0a040" stroke="#b06b18" strokeWidth="0.6" />
      {/* feet */}
      <path d="M44 90 l-3 4 m3 -4 l0 5 m0 -5 l3 4" stroke="#b06b18" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M56 90 l-3 4 m3 -4 l0 5 m0 -5 l3 4" stroke="#b06b18" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
};

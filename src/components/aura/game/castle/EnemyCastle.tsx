interface Props {
  hp: number;
  maxHp: number;
}

export const EnemyCastle = ({ hp, maxHp }: Props) => {
  const pct = Math.max(0, (hp / maxHp) * 100);
  return (
    <div className="absolute left-0 top-0 bottom-0 w-20 flex flex-col items-center justify-end pb-2">
      <div className="text-[10px] text-rose-300 mb-1 font-bold">ENEMY KEEP</div>
      <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden mb-1">
        <div className="h-full bg-gradient-to-r from-rose-500 to-red-600 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-5xl pb-2 grayscale" style={{ filter: "hue-rotate(150deg)" }}>🏯</div>
    </div>
  );
};

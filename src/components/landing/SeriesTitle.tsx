interface SeriesTitleProps {
  /** Use the light-background treatment (mode-select light theme). */
  light?: boolean;
  className?: string;
}

/**
 * "SIR BOOKEARS™ — A Literary Adventure" series lockup.
 * Sits directly above the hero video on the family-facing pages.
 * The exact wordmark spelling is fixed for trademark consistency.
 */
export const SeriesTitle = ({ light = false, className = "" }: SeriesTitleProps) => (
  <div className={`text-center ${className}`}>
    <h2
      className={`text-3xl font-extrabold uppercase leading-none tracking-[0.14em] md:text-5xl ${
        light
          ? "bg-gradient-to-r from-[hsl(28_95%_45%)] via-[hsl(20_95%_50%)] to-[hsl(340_85%_55%)] bg-clip-text text-transparent"
          : "bg-gradient-to-r from-[hsl(48_100%_78%)] via-[hsl(48_100%_62%)] to-[hsl(30_100%_60%)] bg-clip-text text-transparent"
      }`}
    >
      Sir Bookears
      <sup className="ml-1 align-super text-[0.4em] tracking-normal">™</sup>
    </h2>
    <p
      className={`mt-2 text-[0.7rem] uppercase tracking-[0.35em] md:text-xs ${
        light ? "text-[hsl(270_30%_35%)]" : "text-white/60"
      }`}
    >
      A Literary Adventure
    </p>
  </div>
);

export default SeriesTitle;

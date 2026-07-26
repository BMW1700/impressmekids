import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

/**
 * RPG v2 — onboarding coach marks.
 *
 * Lightweight spotlight tour that teaches the depth systems (Gear Locker,
 * equipping, Daily Quests, Season Pass, Ranks & sharing). Purely presentational:
 * it never mutates game state.
 *
 * Targets are found via `[data-coach="<id>"]`. Steps without a `target`
 * render as a centered card, so the tour still completes if a target is
 * missing from the current screen.
 */

export const RPG_COACH_STORAGE_KEY = 'yubi.rpg.coachmarks.v1';

export interface CoachStep {
  id: string;
  title: string;
  body: string;
  /** Value of the `data-coach` attribute to spotlight. Omit for a centered card. */
  target?: string;
}

export const RPG_COACH_STEPS: CoachStep[] = [
  {
    id: 'gear-locker',
    target: 'gear-locker',
    title: 'Your Gear Locker',
    body: 'Bosses drop weapons, armour and trinkets. Everything you win is stored here.',
  },
  {
    id: 'equip',
    target: 'gear-locker',
    title: 'Equip what you win',
    body: 'Tap an item to equip it. Equipped gear adds real health, attack power and health regeneration in battle.',
  },
  {
    id: 'daily',
    target: 'daily-hub',
    title: 'Daily quests',
    body: 'Three fresh quests every day. Finishing them earns Season XP — come back tomorrow for a new set.',
  },
  {
    id: 'season',
    target: 'daily-hub',
    title: 'Season Pass',
    body: 'Season XP unlocks tiers. Claim a tier to equip its title, badge or banner — everyone sees it on the leaderboard.',
  },
  {
    id: 'ranks',
    target: 'daily-hub',
    title: 'Ranks & sharing',
    body: 'The Ranks tab shows the season leaderboard. Beat a boss and you get a highlight card with a link you can share.',
  },
];

export function hasSeenRPGCoachMarks(): boolean {
  try {
    return localStorage.getItem(RPG_COACH_STORAGE_KEY) === 'done';
  } catch {
    return true;
  }
}

export function markRPGCoachMarksSeen(): void {
  try {
    localStorage.setItem(RPG_COACH_STORAGE_KEY, 'done');
  } catch {
    /* storage unavailable — tour simply repeats next session */
  }
}

export function resetRPGCoachMarks(): void {
  try {
    localStorage.removeItem(RPG_COACH_STORAGE_KEY);
  } catch {
    /* no-op */
  }
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  steps?: CoachStep[];
}

const PAD = 8;

export const RPGCoachMarks = ({ open, onClose, steps = RPG_COACH_STEPS }: Props) => {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const step = steps[index];

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  const measure = useCallback(() => {
    if (!open || !step?.target) {
      setRect(null);
      return;
    }
    const el = document.querySelector<HTMLElement>(`[data-coach="${step.target}"]`);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({
      top: r.top - PAD,
      left: r.left - PAD,
      width: r.width + PAD * 2,
      height: r.height + PAD * 2,
    });
  }, [open, step?.target]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, measure]);

  const finish = useCallback(() => {
    markRPGCoachMarksSeen();
    onClose();
  }, [onClose]);

  const next = useCallback(() => {
    if (index >= steps.length - 1) finish();
    else setIndex((i) => i + 1);
  }, [index, steps.length, finish]);

  if (typeof document === 'undefined') return null;

  // Card sits under the spotlight when there is room, otherwise above it.
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800;
  const below = rect ? rect.top + rect.height + 16 : 0;
  const placeBelow = rect ? below + 190 < viewportH : true;

  return createPortal(
    <AnimatePresence>
      {open && step && (
        <motion.div
          key="rpg-coach"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[200]"
          role="dialog"
          aria-modal="true"
          aria-label="Adventure guide"
        >
          {/* Dimmer with a cut-out over the target */}
          <div className="absolute inset-0 bg-background/85" style={rect ? { clipPath: cutOut(rect) } : undefined} />

          {rect && (
            <motion.div
              layout
              transition={{ duration: 0.35 }}
              className="absolute rounded-xl border-2 border-primary pointer-events-none"
              style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
            />
          )}

          {/* Step card */}
          <motion.div
            layout
            transition={{ duration: 0.35 }}
            className="absolute w-[min(22rem,calc(100vw-2rem))] rounded-xl border bg-card p-5 shadow-2xl"
            style={
              rect
                ? {
                    top: placeBelow ? rect.top + rect.height + 16 : undefined,
                    bottom: placeBelow ? undefined : viewportH - rect.top + 16,
                    left: Math.max(16, Math.min(rect.left, (typeof window !== 'undefined' ? window.innerWidth : 1024) - 368)),
                  }
                : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
            }
          >
            <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Step {index + 1} of {steps.length}
            </div>
            <h3 className="text-lg font-black mb-1.5">{step.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{step.body}</p>

            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-1.5" aria-hidden>
                {steps.map((s, i) => (
                  <span
                    key={s.id}
                    className={`h-1.5 w-1.5 rounded-full transition-colors ${i === index ? 'bg-primary' : 'bg-muted'}`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={finish}>
                  Skip
                </Button>
                <Button size="sm" onClick={next}>
                  {index >= steps.length - 1 ? 'Got it' : 'Next'}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

/** Even-odd clip path: full viewport minus the target rectangle. */
function cutOut(r: Rect): string {
  const x1 = Math.max(0, r.left);
  const y1 = Math.max(0, r.top);
  const x2 = x1 + r.width;
  const y2 = y1 + r.height;
  return `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${x1}px ${y1}px, ${x1}px ${y2}px, ${x2}px ${y2}px, ${x2}px ${y1}px, ${x1}px ${y1}px)`;
}

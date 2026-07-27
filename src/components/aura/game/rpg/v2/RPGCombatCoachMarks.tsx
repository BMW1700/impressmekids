import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Swords, ShieldCheck, Zap } from 'lucide-react';

/**
 * RPG v2 — combat coach marks.
 *
 * The meta coach marks (RPGCoachMarks) teach the Gear Locker, quests and
 * ranks. This one teaches the FIGHT: read to attack, read inside the wind-up
 * to block, and save the meter for the Ultimate.
 *
 * Shown once per device, on the student's first battle. Purely presentational:
 * it never mutates battle state and it pauses nothing — the arena waits for
 * speech anyway, so a child can read the cards at their own pace.
 */

export const RPG_COMBAT_COACH_KEY = 'yubi.rpg.combatcoach.v1';

export function hasSeenCombatCoach() {
  try {
    return localStorage.getItem(RPG_COMBAT_COACH_KEY) === '1';
  } catch {
    return true;
  }
}

export function markCombatCoachSeen() {
  try {
    localStorage.setItem(RPG_COMBAT_COACH_KEY, '1');
  } catch {
    /* private mode — the tour simply shows again next session */
  }
}

const STEPS = [
  {
    id: 'attack',
    Icon: Swords,
    title: 'Read to attack',
    body: 'Say the word out loud. Every word you read right is a hit on the monster. Get words right in a row to hit even harder.',
  },
  {
    id: 'block',
    Icon: ShieldCheck,
    title: 'Read fast to BLOCK',
    body: 'When the screen flashes red, the monster is winding up. Read the next word before it swings and you block almost all of the damage.',
  },
  {
    id: 'ultimate',
    Icon: Zap,
    title: 'Fill your Ultimate',
    body: 'Reading fills the Ultimate bar. When it says ULTIMATE READY, tap it for one giant attack.',
  },
] as const;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function RPGCombatCoachMarks({ open, onClose }: Props) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  if (!open) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const { Icon } = current;

  const finish = () => {
    markCombatCoachSeen();
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="absolute inset-0 z-[95] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-label="How to battle"
      >
        <motion.div
          key={current.id}
          className="w-full max-w-md rounded-2xl border-2 border-primary/40 bg-card p-6 text-center shadow-2xl"
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.25 }}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Icon className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="mb-2 text-2xl font-black tracking-tight text-foreground">{current.title}</h2>
          <p className="mb-6 text-base leading-relaxed text-muted-foreground">{current.body}</p>

          <div className="mb-4 flex items-center justify-center gap-2" aria-hidden="true">
            {STEPS.map((s, i) => (
              <span
                key={s.id}
                className={`h-2 rounded-full transition-all ${
                  i === step ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button variant="ghost" onClick={finish}>
              Skip
            </Button>
            <Button size="lg" onClick={() => (isLast ? finish() : setStep((s) => s + 1))}>
              {isLast ? "Let's fight!" : 'Next'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default RPGCombatCoachMarks;

import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Copy, Zap, Shield, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export interface HighlightPayload {
  enemyName: string;
  worldNumber?: number | null;
  damageDealt: number;
  turnsTaken: number;
  perfectBlocks: number;
  shareableSlug?: string | null;
}

interface Props {
  open: boolean;
  payload: HighlightPayload | null;
  onClose: () => void;
}

/**
 * Post-boss "Battle Highlight" card. Purely additive celebration overlay
 * shown 2 seconds after victory. Includes a copy-link button when a
 * shareable slug is present.
 */
export const RPGHighlightCard = ({ open, payload, onClose }: Props) => {
  const { toast } = useToast();

  if (!payload) return null;

  const shareUrl = payload.shareableSlug
    ? `${window.location.origin}/rpg/highlight/${payload.shareableSlug}`
    : null;

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: 'Link copied!', description: 'Share your victory anywhere.' });
    } catch {
      toast({ title: 'Copy failed', description: shareUrl, variant: 'destructive' });
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[220] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.7, rotateY: -20, opacity: 0 }}
            animate={{ scale: 1, rotateY: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className="relative w-full max-w-sm rounded-2xl border-2 border-amber-400/60 bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950 p-6 shadow-2xl"
            style={{ boxShadow: '0 0 60px rgba(251,191,36,0.4)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 rounded-full bg-slate-800/70 hover:bg-slate-700 p-1.5 text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center mb-4">
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 260 }}
              >
                <Trophy className="h-16 w-16 text-amber-400 mx-auto drop-shadow-[0_0_20px_rgba(251,191,36,0.7)]" />
              </motion.div>
              <div className="text-xs font-black text-amber-300 tracking-[0.3em] uppercase mt-2">
                Battle Highlight
              </div>
              <h3 className="text-2xl font-black text-white mt-1">
                {payload.enemyName} DEFEATED
              </h3>
              {payload.worldNumber != null && (
                <div className="text-xs text-amber-200/70 mt-1">World {payload.worldNumber}</div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 mb-5">
              <StatCell icon={<Zap className="h-4 w-4 text-orange-400" />} label="Damage" value={payload.damageDealt} />
              <StatCell icon={<Timer className="h-4 w-4 text-cyan-400" />} label="Turns" value={payload.turnsTaken} />
              <StatCell icon={<Shield className="h-4 w-4 text-blue-400" />} label="Blocks" value={payload.perfectBlocks} />
            </div>

            {shareUrl && (
              <Button
                onClick={copyLink}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
              >
                <Copy className="h-4 w-4 mr-2" /> Copy share link
              </Button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const StatCell = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <div className="rounded-lg border border-amber-500/20 bg-black/40 p-2 text-center">
    <div className="flex justify-center mb-1">{icon}</div>
    <div className="text-lg font-black text-white">{value}</div>
    <div className="text-[10px] uppercase tracking-wider text-slate-400">{label}</div>
  </div>
);

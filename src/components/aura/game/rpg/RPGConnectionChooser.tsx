import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Wifi, Smartphone, ArrowLeft, Users, Swords } from "lucide-react";

export type ConnectionMode = 'local' | 'online';

interface RPGConnectionChooserProps {
  battleMode: 'pvp' | 'coop';
  onSelect: (mode: ConnectionMode) => void;
  onBack: () => void;
}

export const RPGConnectionChooser = ({ battleMode, onSelect, onBack }: RPGConnectionChooserProps) => {
  const isPvP = battleMode === 'pvp';
  const ModeIcon = isPvP ? Swords : Users;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-white hover:bg-white/10">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </div>

        <div className="text-center mb-8">
          <ModeIcon className={`h-12 w-12 mx-auto mb-3 ${isPvP ? 'text-red-400' : 'text-blue-400'}`} />
          <h2 className="text-3xl font-black text-white mb-2">
            {isPvP ? 'Parent vs Kid PvP' : 'Co-op Team Battle'}
          </h2>
          <p className="text-slate-400">How do you want to play?</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Local */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect('local')}
            className="relative overflow-hidden rounded-2xl border-2 border-slate-600 hover:border-emerald-400 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-left transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shrink-0">
                <Smartphone className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-emerald-300 mb-1">🏠 Local — Same Device</h3>
                <p className="text-slate-400 text-sm">
                  {isPvP
                    ? 'Take turns on this device. Parent picks abilities, kid reads words.'
                    : 'Two players share this device, taking turns reading words.'}
                </p>
              </div>
            </div>
          </motion.button>

          {/* Online */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect('online')}
            className="relative overflow-hidden rounded-2xl border-2 border-slate-600 hover:border-blue-400 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-left transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                <Wifi className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-blue-300 mb-1">🌐 Online — Two Devices</h3>
                <p className="text-slate-400 text-sm">
                  {isPvP
                    ? 'Each player uses their own device. Share a room code to connect.'
                    : 'Each hero plays on their own device. Share a room code to team up.'}
                </p>
              </div>
            </div>
            <div className="absolute top-3 right-3 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
              NEW
            </div>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

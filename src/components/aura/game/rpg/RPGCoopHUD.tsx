import { motion } from "framer-motion";
import { Heart, User, Star, Shield } from "lucide-react";

interface RPGCoopHUDProps {
  player1Hp: number;
  player1MaxHp: number;
  player1Name: string;
  player2Hp: number;
  player2MaxHp: number;
  player2Name: string;
  activePlayer: 1 | 2;
  player1Words: number;
  player2Words: number;
  enemyHp: number;
  enemyMaxHp: number;
  enemyName: string;
}

export const RPGCoopHUD = ({
  player1Hp, player1MaxHp, player1Name,
  player2Hp, player2MaxHp, player2Name,
  activePlayer,
  player1Words, player2Words,
  enemyHp, enemyMaxHp, enemyName,
}: RPGCoopHUDProps) => {
  return (
    <div className="absolute top-0 left-0 right-0 z-[80] p-3">
      {/* Enemy HP */}
      <div className="max-w-md mx-auto mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-red-400 font-bold text-sm">{enemyName}</span>
          <span className="text-red-300 text-xs ml-auto">{enemyHp}/{enemyMaxHp}</span>
        </div>
        <div className="h-3 bg-red-950 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-red-600 to-red-400"
            animate={{ width: `${(enemyHp / enemyMaxHp) * 100}%` }}
            transition={{ type: "spring", damping: 15 }}
          />
        </div>
      </div>

      {/* Player HP Bars */}
      <div className="flex gap-4 max-w-2xl mx-auto">
        {/* Player 1 */}
        <div className={`flex-1 p-2 rounded-lg border-2 transition-all ${
          activePlayer === 1 ? 'border-blue-400 bg-blue-950/50 shadow-lg shadow-blue-500/20' : 'border-slate-700 bg-slate-900/50'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              activePlayer === 1 ? 'bg-blue-500' : 'bg-slate-600'
            }`}>
              <User className="h-3 w-3 text-white" />
            </div>
            <span className={`text-sm font-bold ${activePlayer === 1 ? 'text-blue-300' : 'text-slate-400'}`}>
              {player1Name}
            </span>
            {activePlayer === 1 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold ml-auto"
              >
                ACTIVE
              </motion.span>
            )}
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
              animate={{ width: `${(player1Hp / player1MaxHp) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-slate-400">
              <Heart className="inline h-3 w-3 text-red-400 mr-1" />
              {player1Hp}/{player1MaxHp}
            </span>
            <span className="text-xs text-slate-400">
              <Star className="inline h-3 w-3 text-yellow-400 mr-1" />
              {player1Words}
            </span>
          </div>
          {player1Hp <= 0 && (
            <div className="text-center text-red-400 text-xs font-bold mt-1">☠️ DEFEATED</div>
          )}
        </div>

        {/* Player 2 */}
        <div className={`flex-1 p-2 rounded-lg border-2 transition-all ${
          activePlayer === 2 ? 'border-purple-400 bg-purple-950/50 shadow-lg shadow-purple-500/20' : 'border-slate-700 bg-slate-900/50'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              activePlayer === 2 ? 'bg-purple-500' : 'bg-slate-600'
            }`}>
              <User className="h-3 w-3 text-white" />
            </div>
            <span className={`text-sm font-bold ${activePlayer === 2 ? 'text-purple-300' : 'text-slate-400'}`}>
              {player2Name}
            </span>
            {activePlayer === 2 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-xs bg-purple-500 text-white px-1.5 py-0.5 rounded font-bold ml-auto"
              >
                ACTIVE
              </motion.span>
            )}
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
              animate={{ width: `${(player2Hp / player2MaxHp) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-slate-400">
              <Heart className="inline h-3 w-3 text-red-400 mr-1" />
              {player2Hp}/{player2MaxHp}
            </span>
            <span className="text-xs text-slate-400">
              <Star className="inline h-3 w-3 text-yellow-400 mr-1" />
              {player2Words}
            </span>
          </div>
          {player2Hp <= 0 && (
            <div className="text-center text-red-400 text-xs font-bold mt-1">☠️ DEFEATED</div>
          )}
        </div>
      </div>
    </div>
  );
};

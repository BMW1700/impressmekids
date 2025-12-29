import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Coins, Star } from "lucide-react";

interface Coin {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  amount: number;
  type: 'gold' | 'xp';
  delay: number;
}

interface RPGCoinDropProps {
  goldAmount: number;
  xpAmount: number;
  sourceX?: number;
  sourceY?: number;
  onCollectionComplete?: (gold: number, xp: number) => void;
}

export const RPGCoinDrop = ({
  goldAmount,
  xpAmount,
  sourceX = 25,
  sourceY = 50,
  onCollectionComplete,
}: RPGCoinDropProps) => {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [collectedGold, setCollectedGold] = useState(0);
  const [collectedXp, setCollectedXp] = useState(0);
  const [showTotals, setShowTotals] = useState(false);

  useEffect(() => {
    if (goldAmount <= 0 && xpAmount <= 0) return;

    const newCoins: Coin[] = [];
    
    // Generate gold coins
    const goldCoins = Math.min(8, Math.max(1, Math.floor(goldAmount / 5)));
    const goldPerCoin = Math.floor(goldAmount / goldCoins);
    
    for (let i = 0; i < goldCoins; i++) {
      newCoins.push({
        id: `gold-${i}`,
        startX: sourceX + (Math.random() - 0.5) * 10,
        startY: sourceY + (Math.random() - 0.5) * 10,
        endX: 85 + (Math.random() - 0.5) * 5,
        endY: 15 + Math.random() * 5,
        amount: goldPerCoin,
        type: 'gold',
        delay: i * 0.08,
      });
    }
    
    // Generate XP stars
    const xpStars = Math.min(5, Math.max(1, Math.floor(xpAmount / 15)));
    const xpPerStar = Math.floor(xpAmount / xpStars);
    
    for (let i = 0; i < xpStars; i++) {
      newCoins.push({
        id: `xp-${i}`,
        startX: sourceX + (Math.random() - 0.5) * 10,
        startY: sourceY + (Math.random() - 0.5) * 10,
        endX: 80 + (Math.random() - 0.5) * 5,
        endY: 20 + Math.random() * 5,
        amount: xpPerStar,
        type: 'xp',
        delay: goldCoins * 0.08 + i * 0.1,
      });
    }
    
    setCoins(newCoins);

    // Trigger collection animation
    const collectionDelay = (goldCoins + xpStars) * 0.1 + 0.5;
    
    setTimeout(() => {
      setCollectedGold(goldAmount);
      setCollectedXp(xpAmount);
      setShowTotals(true);
    }, collectionDelay * 1000);

    // Cleanup and callback
    setTimeout(() => {
      setShowTotals(false);
      onCollectionComplete?.(goldAmount, xpAmount);
    }, collectionDelay * 1000 + 1500);
  }, [goldAmount, xpAmount, sourceX, sourceY, onCollectionComplete]);

  if (goldAmount <= 0 && xpAmount <= 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {/* Flying Coins & Stars */}
      <AnimatePresence>
        {coins.map((coin) => (
          <motion.div
            key={coin.id}
            className="absolute"
            style={{
              left: `${coin.startX}%`,
              top: `${coin.startY}%`,
            }}
            initial={{ 
              scale: 0,
              opacity: 0,
            }}
            animate={{
              left: [`${coin.startX}%`, `${coin.startX + (coin.endX - coin.startX) * 0.3}%`, `${coin.endX}%`],
              top: [`${coin.startY}%`, `${coin.startY - 30}%`, `${coin.endY}%`],
              scale: [0, 1.5, 1, 0.8],
              opacity: [0, 1, 1, 0],
              rotate: coin.type === 'gold' ? [0, 360, 720] : [0, 180, 360],
            }}
            transition={{
              duration: 0.8,
              delay: coin.delay,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            {coin.type === 'gold' ? (
              <div className="relative">
                <motion.div
                  className="w-8 h-8 rounded-full bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-600 
                    border-2 border-yellow-500 flex items-center justify-center"
                  style={{
                    boxShadow: '0 0 15px rgba(250, 204, 21, 0.8), inset 0 -2px 4px rgba(0,0,0,0.2)',
                  }}
                >
                  <span className="text-yellow-900 font-bold text-xs">$</span>
                </motion.div>
                {/* Sparkle trail */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-yellow-300/50"
                  animate={{ scale: [1, 1.5, 0], opacity: [0.5, 0.3, 0] }}
                  transition={{ duration: 0.3, repeat: 2 }}
                />
              </div>
            ) : (
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Star 
                    className="h-8 w-8 text-purple-400 fill-purple-300" 
                    style={{
                      filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.8))',
                    }}
                  />
                </motion.div>
                {/* Glow effect */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-purple-400/30 blur-sm"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Collection Totals Display */}
      <AnimatePresence>
        {showTotals && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <div className="flex flex-col gap-3 items-center">
              {/* Gold Total */}
              {collectedGold > 0 && (
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="flex items-center gap-2 bg-gradient-to-r from-yellow-900/80 to-amber-900/80 
                    px-6 py-3 rounded-full border-2 border-yellow-500"
                  style={{
                    boxShadow: '0 0 30px rgba(250, 204, 21, 0.5)',
                  }}
                >
                  <Coins className="h-6 w-6 text-yellow-400" />
                  <motion.span
                    className="text-2xl font-black text-yellow-300"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.3 }}
                  >
                    +{collectedGold}
                  </motion.span>
                </motion.div>
              )}

              {/* XP Total */}
              {collectedXp > 0 && (
                <motion.div
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-900/80 to-pink-900/80 
                    px-6 py-3 rounded-full border-2 border-purple-500"
                  style={{
                    boxShadow: '0 0 30px rgba(168, 85, 247, 0.5)',
                  }}
                >
                  <Star className="h-6 w-6 text-purple-400 fill-purple-300" />
                  <motion.span
                    className="text-2xl font-black text-purple-300"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.3 }}
                  >
                    +{collectedXp} XP
                  </motion.span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

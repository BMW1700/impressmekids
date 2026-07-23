import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sword, Shield, Heart } from "lucide-react";
import { RPGCharacter } from "./RPGCharacter";
import { heroKnight, RPGEnemy } from "@/lib/rpgBattleData";
import { RPGBossSpectacle } from "./v2/RPGBossSpectacle";
import { awardQuestProgress } from "@/hooks/useDailyQuests";
import { isBossType } from "@/lib/rpgBossSpectacle";

interface RPGCombatPhaseProps {
  enemy: RPGEnemy;
  enemyHp: number;
  playerHp: number;
  playerMaxHp: number;
  onPlayerAttack: (damage: number) => void;
  onEnemyAttack: (damage: number) => void;
  onVictory: () => void;
  onDefeat: () => void;
}

type CombatAction = 'idle' | 'player_attack' | 'enemy_attack' | 'player_block' | 'victory' | 'defeat';

export const RPGCombatPhase = ({
  enemy,
  enemyHp,
  playerHp,
  playerMaxHp,
  onPlayerAttack,
  onEnemyAttack,
  onVictory,
  onDefeat,
}: RPGCombatPhaseProps) => {
  const [combatAction, setCombatAction] = useState<CombatAction>('idle');
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isBlocking, setIsBlocking] = useState(false);
  const [showDamage, setShowDamage] = useState<{ target: 'player' | 'enemy', amount: number } | null>(null);
  const [attackTiming, setAttackTiming] = useState<number>(0);
  const [blockWindow, setBlockWindow] = useState(false);

  // Check for victory/defeat
  useEffect(() => {
    if (enemyHp <= 0) {
      setCombatAction('victory');
      setTimeout(onVictory, 1500);
    } else if (playerHp <= 0) {
      setCombatAction('defeat');
      setTimeout(onDefeat, 1500);
    }
  }, [enemyHp, playerHp, onVictory, onDefeat]);

  // Enemy attack timing
  useEffect(() => {
    if (!isPlayerTurn && combatAction === 'idle') {
      // Random delay before enemy attacks
      const delay = 1000 + Math.random() * 1500;
      
      // Show block window
      const blockTimer = setTimeout(() => {
        setBlockWindow(true);
      }, delay - 500);

      const attackTimer = setTimeout(() => {
        if (!isBlocking) {
          const damage = enemy.attack + Math.floor(Math.random() * 5);
          setCombatAction('enemy_attack');
          setShowDamage({ target: 'player', amount: damage });
          onEnemyAttack(damage);
          
          setTimeout(() => {
            setCombatAction('idle');
            setShowDamage(null);
            setBlockWindow(false);
            setIsPlayerTurn(true);
          }, 800);
        } else {
          // Blocked!
          setCombatAction('player_block');
          setTimeout(() => {
            setCombatAction('idle');
            setIsBlocking(false);
            setBlockWindow(false);
            setIsPlayerTurn(true);
          }, 600);
        }
      }, delay);

      return () => {
        clearTimeout(blockTimer);
        clearTimeout(attackTimer);
      };
    }
  }, [isPlayerTurn, combatAction, enemy.attack, isBlocking, onEnemyAttack]);

  const handleAttack = useCallback(() => {
    if (!isPlayerTurn || combatAction !== 'idle') return;

    // Calculate damage with some randomness
    const baseDamage = heroKnight.attack;
    const variance = Math.floor(Math.random() * 10) - 5;
    const damage = Math.max(1, baseDamage + variance - enemy.defense);

    setCombatAction('player_attack');
    setShowDamage({ target: 'enemy', amount: damage });
    onPlayerAttack(damage);

    setTimeout(() => {
      setCombatAction('idle');
      setShowDamage(null);
      setIsPlayerTurn(false);
    }, 600);
  }, [isPlayerTurn, combatAction, enemy.defense, onPlayerAttack]);

  const handleBlock = useCallback(() => {
    if (isPlayerTurn || !blockWindow) return;
    setIsBlocking(true);
  }, [isPlayerTurn, blockWindow]);

  return (
    <div className="w-full space-y-6">
      <RPGBossSpectacle enemy={enemy} currentHp={enemyHp} maxHp={enemy.maxHp} />
      {/* Combat Header */}
      <div className="text-center">
        <h3 className="text-xl font-bold">⚔️ Combat Phase ⚔️</h3>
        <p className="text-sm text-muted-foreground">
          {isPlayerTurn ? "Your turn! Attack or wait for an opening!" : "Enemy's turn - Watch for attacks!"}
        </p>
      </div>

      {/* Battle Arena */}
      <div className="flex items-center justify-between px-4 py-8 bg-gradient-to-b from-muted/30 to-muted/50 rounded-xl">
        {/* Player */}
        <div className="relative">
          <RPGCharacter
            character={heroKnight}
            currentHp={playerHp}
            isAttacking={combatAction === 'player_attack'}
            isTakingDamage={combatAction === 'enemy_attack' && !isBlocking}
            damageNumber={showDamage?.target === 'player' ? showDamage.amount : 0}
            showDamage={showDamage?.target === 'player'}
          />
          
          {/* Block Shield Effect */}
          <AnimatePresence>
            {(isBlocking || combatAction === 'player_block') && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="text-6xl">🛡️</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* VS Indicator */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-3xl font-black text-muted-foreground"
        >
          VS
        </motion.div>

        {/* Enemy */}
        <RPGCharacter
          character={enemy}
          currentHp={enemyHp}
          isEnemy
          isAttacking={combatAction === 'enemy_attack'}
          isTakingDamage={combatAction === 'player_attack'}
          damageNumber={showDamage?.target === 'enemy' ? showDamage.amount : 0}
          showDamage={showDamage?.target === 'enemy'}
        />
      </div>

      {/* Block Window Warning */}
      <AnimatePresence>
        {blockWindow && !isBlocking && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <motion.p
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 0.3 }}
              className="text-red-500 font-bold"
            >
              ⚠️ INCOMING ATTACK! Press Block! ⚠️
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button
          size="lg"
          onClick={handleAttack}
          disabled={!isPlayerTurn || combatAction !== 'idle'}
          className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
        >
          <Sword className="h-5 w-5 mr-2" />
          Attack
        </Button>
        
        <Button
          size="lg"
          variant="outline"
          onClick={handleBlock}
          disabled={isPlayerTurn || !blockWindow || isBlocking}
          className={blockWindow && !isPlayerTurn ? 'animate-pulse border-yellow-500' : ''}
        >
          <Shield className="h-5 w-5 mr-2" />
          Block
        </Button>
      </div>

      {/* Victory/Defeat Overlay */}
      <AnimatePresence>
        {(combatAction === 'victory' || combatAction === 'defeat') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50 z-50"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`text-4xl md:text-6xl font-black ${
                combatAction === 'victory' ? 'text-yellow-400' : 'text-red-500'
              }`}
            >
              {combatAction === 'victory' ? '🎉 VICTORY! 🎉' : '💀 DEFEAT 💀'}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

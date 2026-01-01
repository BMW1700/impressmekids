import { motion, AnimatePresence } from "framer-motion";
import { Heart, Shield } from "lucide-react";
import { RPGCharacter as RPGCharacterType, RPGEnemy } from "@/lib/rpgBattleData";
import { RPGCharacterSprite } from "./RPGCharacterSprite";
import { GoblinGuard, GoblinState } from "../characters/GoblinGuard";
import { SirValor, KnightState } from "../characters/SirValor";
import { Elara, WizardState } from "../characters/Elara";
import { DrakeTheDragon, DragonState } from "../characters/DrakeTheDragon";
import { IceGolem, IceGolemState } from "../characters/IceGolem";
import { ShadowWraith, WraithState } from "../characters/ShadowWraith";
import { StoneGuardian, GuardianState } from "../characters/StoneGuardian";

interface RPGCharacterProps {
  character: RPGCharacterType | RPGEnemy;
  currentHp: number;
  isEnemy?: boolean;
  isAttacking?: boolean;
  isTakingDamage?: boolean;
  damageNumber?: number;
  showDamage?: boolean;
  isDefending?: boolean;
  showSprite?: boolean;
  usePremiumSprites?: boolean;
  currentStreak?: number;
}

// Map character/enemy types to sprite types
type SpriteType = 'knight' | 'wizard' | 'goblin' | 'boss' | 'sorcerer' | 'dragon' | 'ice_golem' | 'shadow_wraith' | 'stone_guardian';

const getSpriteType = (character: RPGCharacterType | RPGEnemy, isEnemy: boolean): SpriteType => {
  if (isEnemy) {
    const enemy = character as RPGEnemy;
    switch (enemy.type) {
      case 'final_boss': return 'sorcerer';
      case 'boss': return 'boss';
      case 'dragon': return 'dragon';
      case 'ice_golem': return 'ice_golem';
      case 'shadow_wraith': return 'shadow_wraith';
      case 'stone_guardian': return 'stone_guardian';
      default: return 'goblin';
    }
  }
  const hero = character as RPGCharacterType;
  return hero.type === 'ally' ? 'wizard' : 'knight';
};

// Get state for premium characters
const getGoblinState = (isAttacking: boolean, isTakingDamage: boolean, currentHp: number, maxHp: number): GoblinState => {
  if (currentHp <= 0) return 'defeated';
  if (isTakingDamage) return 'hit';
  if (isAttacking) return 'attacking';
  return 'idle';
};

const getKnightState = (isAttacking: boolean, isTakingDamage: boolean, isDefending: boolean, currentHp: number, maxHp: number): KnightState => {
  if (currentHp <= 0) return 'defeated';
  if (isTakingDamage) return 'hit';
  if (isDefending) return 'blocking';
  if (isAttacking) return 'attacking';
  return 'idle';
};

const getWizardState = (isAttacking: boolean, isTakingDamage: boolean, currentHp: number, maxHp: number): WizardState => {
  if (currentHp <= 0) return 'defeated';
  if (isTakingDamage) return 'hit';
  if (isAttacking) return 'casting';
  return 'idle';
};

export const RPGCharacter = ({
  character,
  currentHp,
  isEnemy = false,
  isAttacking = false,
  isTakingDamage = false,
  damageNumber = 0,
  showDamage = false,
  isDefending = false,
  showSprite = true,
  usePremiumSprites = true,
  currentStreak = 0,
}: RPGCharacterProps) => {
  const hpPercentage = (currentHp / character.maxHp) * 100;
  const hpColor = hpPercentage > 50 ? 'from-emerald-400 to-green-500' : 
                  hpPercentage > 25 ? 'from-yellow-400 to-amber-500' : 
                  'from-red-400 to-rose-500';

  const spriteType = getSpriteType(character, isEnemy);

  // Render premium sprite based on type
  const renderPremiumSprite = () => {
    const commonState = currentHp <= 0 ? 'defeated' : isTakingDamage ? 'hit' : isAttacking ? 'attacking' : 'idle';
    
    if (isEnemy) {
      if (spriteType === 'dragon') {
        return (
          <DrakeTheDragon
            state={commonState as DragonState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="medium"
          />
        );
      }
      if (spriteType === 'ice_golem') {
        return (
          <IceGolem
            state={commonState as IceGolemState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="medium"
          />
        );
      }
      if (spriteType === 'shadow_wraith') {
        return (
          <ShadowWraith
            state={commonState as WraithState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="medium"
          />
        );
      }
      if (spriteType === 'stone_guardian') {
        return (
          <StoneGuardian
            state={commonState as GuardianState}
            healthPercent={hpPercentage}
            currentHp={currentHp}
            maxHp={character.maxHp}
            size="medium"
          />
        );
      }
      // Goblin types
      return (
        <GoblinGuard
          state={getGoblinState(isAttacking, isTakingDamage, currentHp, character.maxHp)}
          healthPercent={hpPercentage}
          currentHp={currentHp}
          maxHp={character.maxHp}
          size="medium"
        />
      );
    }
    
    // For heroes
    if (spriteType === 'knight') {
      return (
        <SirValor
          state={getKnightState(isAttacking, isTakingDamage, isDefending, currentHp, character.maxHp)}
          healthPercent={hpPercentage}
          currentHp={currentHp}
          maxHp={character.maxHp}
          size="medium"
          currentStreak={currentStreak}
        />
      );
    }
    
    if (spriteType === 'wizard') {
      return (
        <Elara
          state={getWizardState(isAttacking, isTakingDamage, currentHp, character.maxHp)}
          healthPercent={hpPercentage}
          currentHp={currentHp}
          maxHp={character.maxHp}
          size="medium"
        />
      );
    }

    // Fallback
    return (
      <RPGCharacterSprite
        type={spriteType}
        isEnemy={isEnemy}
        isAttacking={isAttacking}
        isTakingDamage={isTakingDamage}
        isDefending={isDefending}
        size="lg"
      />
    );
  };

  return (
    <div className={`relative flex flex-col items-center ${isEnemy ? '' : ''}`}>
      {/* Damage Number - Floats up (only for non-premium or when premium doesn't handle it) */}
      {!usePremiumSprites && (
        <AnimatePresence>
          {showDamage && damageNumber > 0 && (
            <motion.div
              initial={{ opacity: 1, y: 0, scale: 1.5 }}
              animate={{ opacity: 0, y: -80, scale: 2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute -top-4 z-30 pointer-events-none"
            >
              <span 
                className="text-3xl md:text-4xl font-black text-red-500"
                style={{ 
                  textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
                  WebkitTextStroke: '1px black',
                }}
              >
                -{damageNumber}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Critical Hit Effect */}
      <AnimatePresence>
        {showDamage && damageNumber >= 20 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -top-8 z-30 text-yellow-400 font-black text-sm"
          >
            ⚡ CRITICAL! ⚡
          </motion.div>
        )}
      </AnimatePresence>

      {/* Name Plate */}
      <motion.div 
        className="mb-2 text-center"
        animate={isTakingDamage ? { x: [-3, 3, -3, 3, 0] } : {}}
        transition={{ duration: 0.3 }}
      >
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg
          bg-gradient-to-r ${character.color} shadow-lg`}>
          <span className="font-bold text-sm text-white tracking-wide drop-shadow-md">
            {character.name}
          </span>
          {isDefending && <Shield className="h-3 w-3 text-blue-200" />}
        </div>
        
        {'title' in character && character.title && (
          <p className="text-xs text-slate-400 mt-0.5">{character.title}</p>
        )}

        {/* HP Bar - Only show if not using premium sprites (they have built-in HP bars) */}
        {!usePremiumSprites && (
          <div className="mt-2 flex items-center gap-2">
            <Heart className="h-3 w-3 text-red-400" />
            <div className="relative w-28 h-3 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700">
              <motion.div
                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${hpColor} rounded-full`}
                initial={{ width: '100%' }}
                animate={{ width: `${hpPercentage}%` }}
                transition={{ type: 'spring', stiffness: 100, damping: 15 }}
              />
              {/* Shine */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent h-1/2 rounded-full" />
            </div>
            <span className="text-xs font-mono text-slate-300 w-14 text-right">
              {currentHp}/{character.maxHp}
            </span>
          </div>
        )}
      </motion.div>

      {/* Character Sprite */}
      {showSprite && (
        usePremiumSprites ? renderPremiumSprite() : (
          <RPGCharacterSprite
            type={spriteType}
            isEnemy={isEnemy}
            isAttacking={isAttacking}
            isTakingDamage={isTakingDamage}
            isDefending={isDefending}
            size="lg"
          />
        )
      )}

      {/* Magical particles for boss enemies */}
      {isEnemy && (character as RPGEnemy).type === 'final_boss' && showSprite && !usePremiumSprites && (
        <div className="absolute top-20 inset-x-0 overflow-hidden pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-purple-400 rounded-full"
              style={{
                left: `${20 + i * 15}%`,
                bottom: '10%',
              }}
              animate={{
                y: [0, -60, 0],
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                delay: i * 0.3,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

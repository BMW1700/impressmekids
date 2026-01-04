import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Flame, Trophy, Skull, Star, AlertTriangle, Coins, Volume2, VolumeX } from "lucide-react";
import { RPGBattleBackground } from "./RPGBattleBackground";
import { RPGCharacter } from "./RPGCharacter";
import { RPGDialogueBox } from "./RPGDialogueBox";
import { RPGCommandMenu } from "./RPGCommandMenu";
import { RPGPartyStats } from "./RPGPartyStats";
import { RPGWordAttack } from "./RPGWordAttack";
import { RPGWordReader } from "./RPGWordReader";
import { RPGWordBarrage } from "./RPGWordBarrage";
import { RPGFireballBarrage } from "./RPGFireballBarrage";
import { RPGAsteroidBarrage } from "./RPGAsteroidBarrage";
import { RPGBeastSwarm } from "./RPGBeastSwarm";
import { RPGIceCrystalBarrage } from "./RPGIceCrystalBarrage";
import { RPGGhostlyWhispers } from "./RPGGhostlyWhispers";
import { RPGRollingBoulders } from "./RPGRollingBoulders";
import { RPGEnemyTransition } from "./RPGEnemyTransition";
import { RPGSpellEffects } from "./RPGSpellEffects";
import { RPGCoinDrop } from "./RPGCoinDrop";
// NEW: Import the attack mini-games (Word Blitz removed - caused crashes)
import { RPGWordShield } from "./RPGWordShield";
import { RPGSpellCombo } from "./RPGSpellCombo";
// NEW: Import 2 new mini-games
import { RPGRhymeChain } from "./RPGRhymeChain";
import { RPGSpeedTypist } from "./RPGSpeedTypist";
// NEW: Import Quick Block for enemy attacks
import { RPGQuickBlock } from "./RPGQuickBlock";
// NEW: Import Tug of War and Balloon Battle modes
import { RPGTugOfWar } from "./RPGTugOfWar";
import { RPGBalloonBattle } from "./RPGBalloonBattle";
import { RPGGoblinHorde } from "./RPGGoblinHorde";
// NEW: Import Fireball Defense mode
import { RPGFireballDefense } from "./RPGFireballDefense";
// NEW: Import 6 new world mini-games
import { RPGWordEcho } from "./RPGWordEcho";
import { RPGWindChase } from "./RPGWindChase";
import { RPGInkSplash } from "./RPGInkSplash";
import { RPGCrystalPrison } from "./RPGCrystalPrison";
import { RPGLightningStorm } from "./RPGLightningStorm";
import { RPGVoidPull } from "./RPGVoidPull";
// NEW: Import character selection
import { RPGCharacterSelect, PlayableCharacter } from "./RPGCharacterSelect";
import { Spell } from "./RPGSpellMenu";
import { Item } from "./RPGItemMenu";
import { 
  heroKnight, 
  allyWizard,
  princessElla,
  getEnemyForBattle,
  heroDialogue,
  wizardDialogue,
  RPGEnemy,
  MiniGameType,
  RPGCharacter as RPGCharacterType,
} from "@/lib/rpgBattleData";
import { CuratedStory } from "@/data/curatedStories";
import { calculateGoldEarned, calculateXpEarned } from "@/lib/gameEconomy";
import { SoundEffects } from "@/lib/pronunciationPlayer";
import { speechManager } from "@/lib/speechRecognitionManager";
import { supabase } from "@/integrations/supabase/client";
import { useMLIntegration } from "@/hooks/useMLIntegration";

// Sound effects singleton
const battleSounds = new SoundEffects();

type EnemyType = 'minion' | 'guard' | 'elite' | 'boss' | 'final_boss' | 'dragon' | 'mini_beast' | 'ice_golem' | 'shadow_wraith' | 'stone_guardian' | 'cave_troll' | 'crystal_spider' | 'echo_wraith' | 'storm_harpy' | 'cloud_giant' | 'zephyr' | 'ink_kraken' | 'reef_guardian' | 'leviathan' | 'void_phantom' | 'reality_shifter' | 'word_eater';
// UPDATED: Added goblin_horde for Classic mode mini-game + quick_block for enemy attacks
type BattlePhase = 'intro' | 'dialogue' | 'reading' | 'combat' | 'barrage' | 'fireball_barrage' | 'asteroid_barrage' | 'beast_swarm' | 'ice_crystal_barrage' | 'ghostly_whispers' | 'rolling_boulders' | 'word_shield' | 'spell_combo' | 'dodge_words' | 'rhyme_chain' | 'speed_typist' | 'tug_of_war' | 'balloon_battle' | 'goblin_horde' | 'fireball_defense' | 'quick_block' | 'enemy_turn' | 'enemy_transition' | 'victory' | 'defeat' | 'word_echo' | 'wind_chase' | 'ink_splash' | 'crystal_prison' | 'lightning_storm' | 'void_pull';
type InventoryKey = 'health_potion' | 'magic_potion';
type CommandType = 'read' | 'magic' | 'defend' | 'items';

export type BattleModeType = 'classic' | 'tug_of_war' | 'balloon';

interface RPGBattleArenaProps {
  story: CuratedStory;
  enemyType: EnemyType;
  studentId: string;
  battleMode?: BattleModeType;
  worldNumber?: number;
  onBack: () => void;
  onComplete: (victory: boolean, stats: BattleStats) => void;
}

interface BattleStats {
  wordsRead: number;
  correctWords: number;
  longestStreak: number;
  damageDealt: number;
  xpEarned: number;
}

export const RPGBattleArena = ({
  story,
  enemyType,
  studentId,
  battleMode = 'classic',
  worldNumber = 1,
  onBack,
  onComplete,
}: RPGBattleArenaProps) => {
  // ML Integration for saving training data
  const { saveToAuraRecords } = useMLIntegration();
  // Multi-enemy queue system
  const buildEnemyQueue = useCallback((primaryType: EnemyType): EnemyType[] => {
    // For certain levels, add Drake the Dragon after the primary enemy
    if (primaryType === 'guard' || primaryType === 'elite') {
      return [primaryType, 'dragon'];
    }
    return [primaryType];
  }, []);
  
  const [enemyQueue] = useState<EnemyType[]>(() => buildEnemyQueue(enemyType));
  const [currentEnemyIndex, setCurrentEnemyIndex] = useState(0);
  const currentEnemyType = enemyQueue[currentEnemyIndex];
  const enemy = getEnemyForBattle(currentEnemyType);
  const [defeatedEnemy, setDefeatedEnemy] = useState<RPGEnemy | null>(null);
  
  // Battle state
  const [phase, setPhase] = useState<BattlePhase>('intro');
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [currentSpeaker, setCurrentSpeaker] = useState<'hero' | 'wizard' | 'enemy'>('hero');
  const [currentCommand, setCurrentCommand] = useState<CommandType | null>(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [screenShake, setScreenShake] = useState(false);
  // REMOVED: HP-based barrage triggers - now all mini-games are random
  
  // Character selection state for Classic mode
  const [showCharacterSelect, setShowCharacterSelect] = useState(battleMode === 'classic');
  const [selectedCharacter, setSelectedCharacter] = useState<PlayableCharacter | null>(null);
  const [companionCharacter, setCompanionCharacter] = useState<PlayableCharacter | null>(null);
  
  // Get character data from selection
  const getCharacterData = useCallback((charId: PlayableCharacter | null): RPGCharacterType => {
    switch (charId) {
      case 'elara': return allyWizard;
      case 'ella': return princessElla;
      default: return heroKnight;
    }
  }, []);
  
  const playerCharacter = getCharacterData(selectedCharacter);
  const companion = getCharacterData(companionCharacter);
  
  // Mini-game trigger states - track which games have been triggered this battle
  const [triggeredMiniGames, setTriggeredMiniGames] = useState<Set<MiniGameType>>(new Set());
  const [lastMiniGameCheck, setLastMiniGameCheck] = useState(0); // Track words read since last check
  
  // Dynamic HP-based mini-game trigger tracking - thresholds based on enemy maxHp
  const [triggeredThresholds, setTriggeredThresholds] = useState<Set<number>>(new Set());
  
  // Calculate HP thresholds based on enemy max HP
  const getHPThresholds = useCallback((maxHp: number): number[] => {
    if (maxHp >= 500) return [90, 80, 65, 50, 35, 25, 10]; // 7 triggers
    if (maxHp >= 300) return [85, 70, 55, 50, 40, 25, 10]; // 6-7 triggers
    if (maxHp >= 200) return [80, 60, 50, 40, 25]; // 4-5 triggers
    if (maxHp >= 120) return [75, 50, 25]; // 3 triggers
    return [50, 25]; // 2 triggers for 80-120 HP enemies
  }, []);
  
  // Random enemy attack tracking for quick block
  const [lastAttackCheck, setLastAttackCheck] = useState(0);
  const [quickBlockWords, setQuickBlockWords] = useState<string[]>([]);
  
  // Combat stats - player HP initialized based on selected character
  const [playerHp, setPlayerHp] = useState(heroKnight.maxHp);
  const [wizardMp, setWizardMp] = useState(50);
  const [enemyHp, setEnemyHp] = useState(enemy.maxHp);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [wordsRead, setWordsRead] = useState(0);
  const [correctWords, setCorrectWords] = useState(0);
  const [totalDamage, setTotalDamage] = useState(0);
  const [inventory, setInventory] = useState<Record<InventoryKey, number>>({ health_potion: 2, magic_potion: 1 });
  
  // Elara-specific: 5-word charge system for plasma barrage
  const [elaraChargeCount, setElaraChargeCount] = useState(0);
  const elaraChargeRef = useRef(0); // For stable reference in callbacks
  
  // Keep ref in sync
  useEffect(() => {
    elaraChargeRef.current = elaraChargeCount;
  }, [elaraChargeCount]);
  
  // Status effects
  const [isPoisoned, setIsPoisoned] = useState(false);
  const [poisonDamage, setPoisonDamage] = useState(0);
  const [isDebuffed, setIsDebuffed] = useState(false);
  const [debuffTurns, setDebuffTurns] = useState(0);
  
  // Word reading state
  const [words, setWords] = useState<string[]>([]);
  const [batchStartIndex, setBatchStartIndex] = useState(0); // Start of current 5-word batch (0, 5, 10, ...)
  const [lastSpokenGlobalIndex, setLastSpokenGlobalIndex] = useState(-1); // For attack display
  const [currentWordResult, setCurrentWordResult] = useState<boolean | null>(null);
  const [attackType, setAttackType] = useState<'fire' | 'ice' | 'lightning' | 'slash' | 'nature' | 'heal' | 'wind'>('lightning');
  const [barrageWords, setBarrageWords] = useState<string[]>([]);

  // Animation states
  const [heroAttacking, setHeroAttacking] = useState(false);
  const [enemyAttacking, setEnemyAttacking] = useState(false);
  const [enemyTakingDamage, setEnemyTakingDamage] = useState(false);
  const [heroTakingDamage, setHeroTakingDamage] = useState(false);
  const [showDamageNumber, setShowDamageNumber] = useState(false);
  const [damageAmount, setDamageAmount] = useState(0);
  const [enemyAbilityMessage, setEnemyAbilityMessage] = useState<string | null>(null);
  
  // Spell effects state
  const [activeSpell, setActiveSpell] = useState<'fire' | 'ice' | 'lightning' | 'slash' | 'nature' | 'heal' | 'wind' | null>(null);
  const [showSpellEffect, setShowSpellEffect] = useState(false);
  
  // Currency/rewards state
  const [goldEarned, setGoldEarned] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [showCoinDrop, setShowCoinDrop] = useState(false);
  const [pendingGold, setPendingGold] = useState(0);
  const [pendingXp, setPendingXp] = useState(0);
  
  // Combo power-up announcements
  const [comboAnnouncement, setComboAnnouncement] = useState<string | null>(null);
  const [comboPowerLevel, setComboPowerLevel] = useState<'normal' | 'power' | 'mega' | 'ultra'>('normal');
  
  // Floating damage numbers
  const [floatingDamages, setFloatingDamages] = useState<{id: number; damage: number; x: number; y: number; isPlayer: boolean; isCritical?: boolean}[]>([]);
  
  // Sound toggle
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Update sound effects when toggle changes
  useEffect(() => {
    battleSounds.setSoundEnabled(soundEnabled);
  }, [soundEnabled]);
  
  // Helper function to check if this is the final enemy
  const isFinalEnemy = useMemo(() => currentEnemyIndex >= enemyQueue.length - 1, [currentEnemyIndex, enemyQueue.length]);
  
  // Helper function to return to reading state cleanly after any mini-game/barrage
  // CRITICAL: Also checks for victory condition
  const returnToReading = useCallback(() => {
    console.log('[RPGBattle] Returning to reading state, enemyHp:', enemyHp, 'isFinalEnemy:', isFinalEnemy);
    // Force stop any lingering recognition
    speechManager.forceStop();
    
    // Check if we should trigger victory instead
    if (enemyHp <= 0 && isFinalEnemy) {
      console.log('[RPGBattle] Enemy defeated during mini-game - triggering victory');
      setPhase('victory');
      return;
    }
    
    // Check if we should transition to next enemy
    if (enemyHp <= 0 && !isFinalEnemy) {
      console.log('[RPGBattle] Enemy defeated - transitioning to next enemy');
      setDefeatedEnemy(enemy);
      setPhase('enemy_transition');
      return;
    }
    
    // Clear any pending state immediately
    setCurrentWordResult(null);
    setEnemyAbilityMessage(null);
    
    // Small delay to ensure cleanup completes
    setTimeout(() => {
      setPhase('reading');
      setCurrentCommand('read');
      setIsPlayerTurn(true);
      console.log('[RPGBattle] State reset complete - phase: reading, command: read');
    }, 100);
  }, [enemyHp, isFinalEnemy, enemy]);

  // Parse story into words - memoized for stability
  const storyWords = useMemo(() => {
    if (!story?.passage_text) return [];
    return story.passage_text.split(/\s+/).filter(w => w.length > 0);
  }, [story?.passage_text]);

  // Set words on mount
  useEffect(() => {
    setWords(storyWords);
  }, [storyWords]);

  // Handle non-classic battle modes - skip intro and go directly to the selected mode
  useEffect(() => {
    if (battleMode === 'tug_of_war' && storyWords.length > 0) {
      console.log('[RPGBattle] Starting in Tug of War mode with', storyWords.length, 'words');
      setBarrageWords(storyWords);
      setPhase('tug_of_war');
      setShowCharacterSelect(false);
    } else if (battleMode === 'balloon' && storyWords.length > 0) {
      console.log('[RPGBattle] Starting in Balloon Bonanza mode with', storyWords.length, 'words');
      setBarrageWords(storyWords);
      setPhase('balloon_battle');
      setShowCharacterSelect(false);
    }
  }, [battleMode, storyWords]);

  // Handle character selection for Classic mode
  const handleCharacterSelect = useCallback((character: PlayableCharacter) => {
    console.log('[RPGBattle] Character selected:', character);
    setSelectedCharacter(character);
    
    // Pick random companion from remaining 2 characters
    const allCharacters: PlayableCharacter[] = ['valor', 'elara', 'ella'];
    const remaining = allCharacters.filter(c => c !== character);
    const randomCompanion = remaining[Math.floor(Math.random() * remaining.length)];
    setCompanionCharacter(randomCompanion);
    
    // Set player HP based on selected character
    const charData = getCharacterData(character);
    setPlayerHp(charData.maxHp);
    
    // Hide selection and start battle
    setShowCharacterSelect(false);
  }, [getCharacterData]);

  // HYBRID COMBAT SYSTEM:
  // 1. HP-based mini-game triggers at 50% and 25% enemy HP (anticipation moments)
  // 2. Random enemy attacks every 4 words (40% chance) - player must quick block
  // This creates exciting rhythm: READ -> ATTACK -> BLOCK -> MINI-GAME -> READ...
  const triggerRandomMiniGame = useCallback((gameType: MiniGameType) => {
    const wordCount = gameType === 'speed_typist' ? 12 : 
                      gameType === 'tug_of_war' ? 15 : 
                      gameType === 'goblin_horde' ? 6 :
                      gameType === 'rhyme_chain' ? 6 : 5;
    const availableWords = words.slice(batchStartIndex, batchStartIndex + wordCount + 10);
    setBarrageWords(availableWords.slice(0, wordCount));
    
    // Different announcements per mini-game
    const announcements: Record<MiniGameType, string> = {
      'word_shield': `${enemy.name} charges a devastating attack!`,
      'spell_combo': `POWER SURGE! Chain a spell combo!`,
      'dodge_words': `INCOMING ATTACK! Dodge the wrong words!`,
      'rhyme_chain': `RHYME TIME! Chain rhyming words!`,
      'speed_typist': `SPEED BLITZ! Read as fast as you can!`,
      'tug_of_war': `TUG OF WAR! Pull the rope with reading power!`,
      'goblin_horde': `⚔️ GOBLIN HORDE! Speak words to defeat them! ⚔️`,
      'fireball_defense': `🔥 ${enemy.name} UNLEASHES FIREBALLS! 🔥`,
      'beast_swarm': `${enemy.name} summons BEAST SWARM!`,
      'ice_crystal_barrage': `${enemy.name} unleashes ICE CRYSTAL BARRAGE!`,
      'ghostly_whispers': `${enemy.name} summons GHOSTLY WHISPERS!`,
      'rolling_boulders': `${enemy.name} triggers ROLLING BOULDERS!`,
      'word_barrage': `${enemy.name} launches WORD BARRAGE!`,
      'fireball_barrage': `🔥 ${enemy.name} unleashes FIREBALL BARRAGE! 🔥`,
      'asteroid_barrage': `${enemy.name} summons WORD PRISON!`,
      // NEW mini-games
      'word_echo': `🗣️ WORD ECHO! Say each word TWICE! 🗣️`,
      'wind_chase': `💨 WIND CHASE! Catch the words! 💨`,
      'ink_splash': `🦑 INK SPLASH! Read through the ink! 🦑`,
      'crystal_prison': `❄️ CRYSTAL PRISON! Break the ice! ❄️`,
      'lightning_storm': `⚡ LIGHTNING STORM! Speak FAST! ⚡`,
      'void_pull': `🕳️ VOID PULL! Save words from the void! 🕳️`,
    };
    
    setEnemyAbilityMessage(announcements[gameType] || `${enemy.name} attacks!`);
    battleSounds.miniGameStart();
    
    // Mark this mini-game as triggered
    setTriggeredMiniGames(prev => new Set([...prev, gameType]));
    
    setTimeout(() => {
      setEnemyAbilityMessage(null);
      // Map game type to phase
      const phaseMap: Record<MiniGameType, BattlePhase> = {
        'word_shield': 'word_shield',
        'spell_combo': 'spell_combo',
        'dodge_words': 'dodge_words',
        'rhyme_chain': 'rhyme_chain',
        'speed_typist': 'speed_typist',
        'tug_of_war': 'tug_of_war',
        'goblin_horde': 'goblin_horde',
        'fireball_defense': 'fireball_defense',
        'beast_swarm': 'beast_swarm',
        'ice_crystal_barrage': 'ice_crystal_barrage',
        'ghostly_whispers': 'ghostly_whispers',
        'rolling_boulders': 'rolling_boulders',
        'word_barrage': 'barrage',
        'fireball_barrage': 'fireball_barrage',
        'asteroid_barrage': 'asteroid_barrage',
        // NEW mini-games
        'word_echo': 'word_echo',
        'wind_chase': 'wind_chase',
        'ink_splash': 'ink_splash',
        'crystal_prison': 'crystal_prison',
        'lightning_storm': 'lightning_storm',
        'void_pull': 'void_pull',
      };
      setPhase(phaseMap[gameType]);
    }, 1000);
  }, [words, batchStartIndex, enemy.name]);
  
  // HP-BASED mini-game triggers - DYNAMIC based on enemy maxHp
  // Uses signatureMiniGame at 50% HP, random from miniGames at other thresholds
  const checkHPBasedMiniGame = useCallback(() => {
    if (phase !== 'reading') return;
    if (battleMode !== 'classic') return;
    if (!enemy.miniGames || enemy.miniGames.length === 0) return;
    
    const hpPercent = (enemyHp / enemy.maxHp) * 100;
    const thresholds = getHPThresholds(enemy.maxHp);
    
    // Check each threshold in order (highest to lowest)
    for (const threshold of thresholds) {
      if (triggeredThresholds.has(threshold)) continue;
      if (hpPercent > threshold) continue;
      
      // This threshold has been crossed and not yet triggered
      setTriggeredThresholds(prev => new Set([...prev, threshold]));
      
      // At 50% HP - ALWAYS use the signature mini-game!
      if (threshold === 50 && enemy.signatureMiniGame) {
        console.log(`[RPGBattle] Triggering SIGNATURE mini-game: ${enemy.signatureMiniGame} at ${threshold}% HP`);
        triggerRandomMiniGame(enemy.signatureMiniGame);
        return;
      }
      
      // At other thresholds - random selection from available games
      const availableGames = enemy.miniGames.filter(game => !triggeredMiniGames.has(game));
      if (availableGames.length > 0) {
        const randomGame = availableGames[Math.floor(Math.random() * availableGames.length)];
        console.log(`[RPGBattle] Triggering random mini-game: ${randomGame} at ${threshold}% HP`);
        triggerRandomMiniGame(randomGame);
        return;
      } else {
        // All games used, pick from full list
        const randomGame = enemy.miniGames[Math.floor(Math.random() * enemy.miniGames.length)];
        console.log(`[RPGBattle] All mini-games used, repeating: ${randomGame} at ${threshold}% HP`);
        triggerRandomMiniGame(randomGame);
        return;
      }
    }
  }, [phase, battleMode, enemy.miniGames, enemy.signatureMiniGame, enemy.maxHp, enemyHp, triggeredThresholds, triggeredMiniGames, triggerRandomMiniGame, getHPThresholds]);
  
  // Check for RANDOM ENEMY ATTACK - Bosses attack more frequently!
  // Bosses: 50% chance every 3 words
  // Regular enemies: 40% chance every 4 words
  const checkRandomEnemyAttack = useCallback(() => {
    if (phase !== 'reading') return;
    if (battleMode !== 'classic') return;
    
    // Bosses and final bosses attack more frequently
    const isBoss = enemy.type === 'boss' || enemy.type === 'final_boss';
    const attackInterval = isBoss ? 3 : 4;
    const attackChance = isBoss ? 0.5 : 0.4;
    
    const wordsSinceLastAttack = correctWords - lastAttackCheck;
    if (wordsSinceLastAttack < attackInterval) return;
    
    // Chance to trigger attack
    if (Math.random() > attackChance) {
      setLastAttackCheck(correctWords);
      return;
    }
    
    // Trigger quick block!
    setLastAttackCheck(correctWords);
    const blockWordSelection = words.slice(batchStartIndex, batchStartIndex + 3);
    setQuickBlockWords(blockWordSelection);
    setEnemyAbilityMessage(`${enemy.name} ATTACKS!`);
    battleSounds.incorrectWord(); // Use as attack warning sound
    
    setTimeout(() => {
      setEnemyAbilityMessage(null);
      setPhase('quick_block');
    }, 800);
  }, [phase, battleMode, correctWords, lastAttackCheck, words, batchStartIndex, enemy.name, enemy.type]);
  
  // Call HP-based mini-game check when enemyHp changes
  useEffect(() => {
    if (battleMode === 'classic' && phase === 'reading') {
      checkHPBasedMiniGame();
    }
  }, [enemyHp, battleMode, phase, checkHPBasedMiniGame]);
  
  // Call random enemy attack check when correctWords changes
  useEffect(() => {
    if (battleMode === 'classic' && phase === 'reading') {
      checkRandomEnemyAttack();
    }
  }, [correctWords, battleMode, phase, checkRandomEnemyAttack]);
  
  // Trigger Tug of War - for use in tug_of_war battle mode only
  const triggerTugOfWar = useCallback(() => {
    const wordCount = 15;
    const availableWords = words.slice(batchStartIndex, batchStartIndex + wordCount + 10);
    setBarrageWords(availableWords.slice(0, wordCount));
    setEnemyAbilityMessage(`TUG OF WAR! Pull the rope with reading power!`);
    battleSounds.miniGameStart();
    setTimeout(() => {
      setEnemyAbilityMessage(null);
      setPhase('tug_of_war');
    }, 1000);
  }, [words, batchStartIndex]);
  
  // Handle Fireball Defense complete
  const handleFireballDefenseComplete = useCallback((blocked: number, hit: number, damage: number) => {
    console.log('[RPGBattle] Fireball Defense complete:', { blocked, hit, damage });
    if (damage > 0) {
      setPlayerHp(prev => Math.max(0, prev - damage));
    }
    const bonusDamage = blocked * 10;
    if (bonusDamage > 0) {
      setEnemyHp(prev => Math.max(0, prev - bonusDamage));
      setTotalDamage(prev => prev + bonusDamage);
    }
    setCorrectWords(prev => prev + blocked);
    setBatchStartIndex(prev => prev + barrageWords.length);
    returnToReading();
  }, [barrageWords.length, returnToReading]);
  
  // Handle Word Shield complete - uses returnToReading for clean state
  const handleWordShieldComplete = useCallback((shieldStrength: number, damage: number) => {
    console.log('[RPGBattle] Word Shield complete:', { shieldStrength, damage });
    // Play shield block sound
    if (shieldStrength > 50) {
      battleSounds.shieldBlock();
    }
    
    const reducedDamage = Math.floor(20 * (1 - shieldStrength / 100));
    if (reducedDamage > 0) {
      setPlayerHp(prev => Math.max(0, prev - reducedDamage));
    }
    if (shieldStrength > 50) {
      setEnemyHp(prev => Math.max(0, prev - damage));
      setTotalDamage(prev => prev + damage);
    }
    setBatchStartIndex(prev => prev + barrageWords.length);
    returnToReading();
  }, [barrageWords.length, returnToReading]);
  
  // Handle Spell Combo complete - uses returnToReading for clean state
  const handleSpellComboComplete = useCallback((success: boolean, multiplier: number) => {
    console.log('[RPGBattle] Spell Combo complete:', { success, multiplier });
    if (success) {
      battleSounds.comboSuccess();
      battleSounds.magicSparkle();
      const damage = Math.floor(50 * multiplier);
      setEnemyHp(prev => Math.max(0, prev - damage));
      setTotalDamage(prev => prev + damage);
      setCorrectWords(prev => prev + barrageWords.length);
    }
    setBatchStartIndex(prev => prev + barrageWords.length);
    returnToReading();
  }, [barrageWords.length, returnToReading]);
  
  // Handle Dodge Words complete
  const handleDodgeWordsComplete = useCallback((correctHits: number, wrongHits: number, dodged: number) => {
    console.log('[RPGBattle] Dodge Words complete:', { correctHits, wrongHits, dodged });
    const damage = correctHits * 15;
    setEnemyHp(prev => Math.max(0, prev - damage));
    setTotalDamage(prev => prev + damage);
    setCorrectWords(prev => prev + correctHits);
    returnToReading();
  }, [returnToReading]);
  
  // (handleDodgeWordsDamage removed - Word Blitz replaced with Word Shield)
  
  // Handle Rhyme Chain complete - uses returnToReading for clean state
  const handleRhymeChainComplete = useCallback((score: number, damage: number) => {
    console.log('[RPGBattle] Rhyme Chain complete:', { score, damage });
    if (damage > 0) {
      battleSounds.magicSparkle();
      setEnemyHp(prev => Math.max(0, prev - damage));
      setTotalDamage(prev => prev + damage);
    }
    setCorrectWords(prev => prev + score);
    setBatchStartIndex(prev => prev + barrageWords.length);
    returnToReading();
  }, [barrageWords.length, returnToReading]);
  
  // Handle Speed Typist complete - uses returnToReading for clean state
  const handleSpeedTypistComplete = useCallback((wordsSpoken: number, damage: number) => {
    console.log('[RPGBattle] Speed Typist complete:', { wordsSpoken, damage });
    if (damage > 0) {
      battleSounds.lightningCrack();
      setEnemyHp(prev => Math.max(0, prev - damage));
      setTotalDamage(prev => prev + damage);
    }
    setCorrectWords(prev => prev + wordsSpoken);
    setBatchStartIndex(prev => prev + barrageWords.length);
    returnToReading();
  }, [barrageWords.length, returnToReading]);
  
  // Handle Tug of War complete
  const handleTugOfWarComplete = useCallback((victory: boolean, stats: { wordsRead: number; correctWords: number; incorrectWords: number }) => {
    console.log('[RPGBattle] Tug of War complete:', { victory, stats, battleMode });
    setWordsRead(prev => prev + stats.wordsRead);
    setCorrectWords(prev => prev + stats.correctWords);
    
    // If this is the main battle mode (not a mini-game), trigger full victory/defeat
    if (battleMode === 'tug_of_war') {
      if (victory) {
        battleSounds.celebrationSound();
        setTotalDamage(stats.correctWords * 5);
      }
      setPhase(victory ? 'victory' : 'defeat');
      return;
    }
    
    // Mini-game behavior
    if (victory) {
      const bonusDamage = Math.floor(stats.correctWords * 5);
      battleSounds.celebrationSound();
      setEnemyHp(prev => Math.max(0, prev - bonusDamage));
      setTotalDamage(prev => prev + bonusDamage);
    } else {
      setPlayerHp(prev => Math.max(0, prev - 20));
    }
    setBatchStartIndex(prev => prev + barrageWords.length);
    returnToReading();
  }, [barrageWords.length, returnToReading, battleMode]);
  
  // Handle Balloon Battle complete
  const handleBalloonBattleComplete = useCallback((victory: boolean, stats: { wordsRead: number; correctWords: number; balloonsLost: number }) => {
    console.log('[RPGBattle] Balloon Battle complete:', { victory, stats, battleMode });
    setWordsRead(prev => prev + stats.wordsRead);
    setCorrectWords(prev => prev + stats.correctWords);
    
    // If this is the main battle mode (not a mini-game), trigger full victory/defeat
    if (battleMode === 'balloon') {
      if (victory) {
        battleSounds.celebrationSound();
        setTotalDamage(stats.correctWords * 3 + (stats.balloonsLost === 0 ? 50 : 0));
      }
      setPhase(victory ? 'victory' : 'defeat');
      return;
    }
    
    // Mini-game behavior
    if (victory) {
      const bonusDamage = Math.floor(stats.correctWords * 3) + (stats.balloonsLost === 0 ? 50 : 0);
      battleSounds.celebrationSound();
      setEnemyHp(prev => Math.max(0, prev - bonusDamage));
      setTotalDamage(prev => prev + bonusDamage);
    } else {
      setPlayerHp(prev => Math.max(0, prev - 30));
    }
    setBatchStartIndex(prev => prev + barrageWords.length);
    returnToReading();
  }, [barrageWords.length, returnToReading, battleMode]);
  
  // Handle Goblin Horde complete (mini goblin attack mini-game in Classic mode)
  const handleGoblinHordeComplete = useCallback((result: { success: boolean; wordsSpoken: number; totalWords: number }) => {
    console.log('[RPGBattle] Goblin Horde complete:', result);
    const bonusDamage = result.wordsSpoken * 8;
    if (bonusDamage > 0) {
      battleSounds.celebrationSound();
      setEnemyHp(prev => Math.max(0, prev - bonusDamage));
      setTotalDamage(prev => prev + bonusDamage);
    }
    setCorrectWords(prev => prev + result.wordsSpoken);
    setBatchStartIndex(prev => prev + barrageWords.length);
    returnToReading();
  }, [barrageWords.length, returnToReading]);
  
  // Handle Quick Block complete (enemy attack defense)
  const handleQuickBlockComplete = useCallback((blocked: number, total: number, counterDamage: number) => {
    console.log('[RPGBattle] Quick Block complete:', { blocked, total, counterDamage });
    
    // Calculate damage based on block success
    const fullDamage = 15; // Base enemy attack damage
    let damageTaken = fullDamage;
    
    if (blocked === total) {
      // Perfect block - no damage + counter attack
      damageTaken = 0;
      if (counterDamage > 0) {
        battleSounds.comboSuccess();
        setEnemyHp(prev => Math.max(0, prev - counterDamage));
        setTotalDamage(prev => prev + counterDamage);
      }
    } else if (blocked >= 2) {
      // Good block - 50% damage
      damageTaken = Math.floor(fullDamage * 0.5);
    } else if (blocked === 1) {
      // Weak block - 75% damage
      damageTaken = Math.floor(fullDamage * 0.75);
    }
    
    if (damageTaken > 0) {
      setPlayerHp(prev => Math.max(0, prev - damageTaken));
      triggerScreenShake();
    }
    
    // Advance past the words used
    setBatchStartIndex(prev => prev + 3);
    returnToReading();
  }, [returnToReading]);
  
  // Handle mini-game damage
  const handleMiniGameDamage = useCallback((damage: number) => {
    setPlayerHp(prev => Math.max(0, prev - damage));
    triggerScreenShake();
  }, []);

  // Trigger word barrage attack
  const triggerWordBarrage = useCallback(() => {
    const wordCount = enemy.barrageWordCount || 5;
    const availableWords = words.slice(batchStartIndex, batchStartIndex + wordCount + 10);
    const barrageSelection = availableWords.slice(0, wordCount);
    setBarrageWords(barrageSelection);
    setPhase('barrage');
  }, [words, batchStartIndex, enemy.barrageWordCount]);

  // Trigger special barrage based on enemy type
  const triggerSpecialBarrage = useCallback(() => {
    const wordCount = (enemy.barrageWordCount || 5) + 2;
    const availableWords = words.slice(batchStartIndex, batchStartIndex + wordCount + 10);
    const barrageSelection = availableWords.slice(0, wordCount);
    setBarrageWords(barrageSelection);
    
    // Different attacks based on enemy type
    if (currentEnemyType === 'dragon') {
      setEnemyAbilityMessage(`${enemy.name} unleashes FIREBALL BARRAGE!`);
      setTimeout(() => {
        setEnemyAbilityMessage(null);
        setPhase('fireball_barrage');
      }, 1000);
    } else if (currentEnemyType === 'ice_golem') {
      setEnemyAbilityMessage(`${enemy.name} unleashes ICE CRYSTAL BARRAGE!`);
      setTimeout(() => {
        setEnemyAbilityMessage(null);
        setPhase('ice_crystal_barrage');
      }, 1000);
    } else if (currentEnemyType === 'shadow_wraith') {
      setEnemyAbilityMessage(`${enemy.name} summons GHOSTLY WHISPERS!`);
      setTimeout(() => {
        setEnemyAbilityMessage(null);
        setPhase('ghostly_whispers');
      }, 1000);
    } else if (currentEnemyType === 'stone_guardian') {
      setEnemyAbilityMessage(`${enemy.name} triggers ROLLING BOULDERS!`);
      setTimeout(() => {
        setEnemyAbilityMessage(null);
        setPhase('rolling_boulders');
      }, 1000);
    } else {
      setEnemyAbilityMessage(`${enemy.name} summons WORD PRISON!`);
      setTimeout(() => {
        setEnemyAbilityMessage(null);
        setPhase('asteroid_barrage');
      }, 1000);
    }
  }, [words, batchStartIndex, enemy.barrageWordCount, enemy.name, currentEnemyType]);

  // Trigger beast swarm attack (Drake only)
  const triggerBeastSwarm = useCallback(() => {
    const wordCount = 6;
    const availableWords = words.slice(batchStartIndex, batchStartIndex + wordCount + 10);
    const swarmSelection = availableWords.slice(0, wordCount);
    setBarrageWords(swarmSelection);
    setEnemyAbilityMessage(`${enemy.name} summons BEAST SWARM!`);
    setTimeout(() => {
      setEnemyAbilityMessage(null);
      setPhase('beast_swarm');
    }, 1000);
  }, [words, batchStartIndex, enemy.name]);

  // Handle barrage completion - CRITICAL: advance batchStartIndex by words used in barrage
  const handleBarrageComplete = useCallback((destroyed: number, missed: number) => {
    console.log('[RPGBattle] Barrage complete:', { destroyed, missed });
    if (destroyed > 0) {
      setCorrectWords(prev => prev + destroyed);
    }
    // Advance past the words used in the barrage so we don't repeat them
    const wordsUsedInBarrage = barrageWords.length;
    setBatchStartIndex(prev => prev + wordsUsedInBarrage);
    returnToReading();
  }, [barrageWords.length, returnToReading]);

  // Handle barrage word hit
  const handleBarrageWordHit = useCallback((damage: number) => {
    setPlayerHp(prev => Math.max(0, prev - damage));
    // Add floating damage number
    setFloatingDamages(prev => [...prev, {
      id: Date.now(),
      damage,
      x: 70 + Math.random() * 10,
      y: 60 + Math.random() * 10,
      isPlayer: true
    }]);
    triggerScreenShake();
  }, []);

  // Get current dialogue
  const getCurrentDialogue = useCallback(() => {
    if (phase === 'intro') {
      if (currentSpeaker === 'hero') {
        return heroDialogue.intro[dialogueIndex % heroDialogue.intro.length];
      } else if (currentSpeaker === 'wizard') {
        return wizardDialogue.intro[dialogueIndex % wizardDialogue.intro.length];
      } else {
        return enemy.dialogueIntro[dialogueIndex % enemy.dialogueIntro.length];
      }
    }
    return "";
  }, [phase, currentSpeaker, dialogueIndex, enemy.dialogueIntro]);

  // Handle dialogue progression
  const handleDialogueComplete = useCallback(() => {
    if (phase === 'intro') {
      if (currentSpeaker === 'hero' && dialogueIndex === 0) {
        setCurrentSpeaker('wizard');
      } else if (currentSpeaker === 'wizard') {
        setCurrentSpeaker('enemy');
        setDialogueIndex(0);
      } else if (currentSpeaker === 'enemy') {
        if (dialogueIndex < enemy.dialogueIntro.length - 1) {
          setDialogueIndex(prev => prev + 1);
        } else {
          setPhase('reading');
          setCurrentCommand('read');
        }
      } else {
        setDialogueIndex(prev => prev + 1);
      }
    }
  }, [phase, currentSpeaker, dialogueIndex, enemy.dialogueIntro.length]);

  // Calculate word damage
  const calculateDamage = useCallback((wordLength: number, currentStreak: number) => {
    let baseDamage = Math.max(8, wordLength * 3);
    const streakBonus = Math.floor(currentStreak / 2) * 5;
    const criticalBonus = Math.random() > 0.85 ? 15 : 0;
    
    // Apply debuff if active
    if (isDebuffed) {
      baseDamage = Math.floor(baseDamage * 0.7);
    }
    
    return baseDamage + streakBonus + criticalBonus;
  }, [isDebuffed]);

  // Trigger screen shake
  const triggerScreenShake = () => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 300);
  };

  // Handle command selection
  const handleCommand = (command: CommandType) => {
    setCurrentCommand(command);
    if (command === 'defend') {
      setIsPlayerTurn(false);
      setTimeout(() => {
        setIsPlayerTurn(true);
        setCurrentCommand(null);
      }, 1500);
    }
  };

  // Handle spell casting - spells are powerful and DON'T trigger enemy counter-attack
  const handleCastSpell = useCallback((spell: Spell) => {
    if (wizardMp < spell.mpCost) return;
    
    setWizardMp(prev => prev - spell.mpCost);
    setAttackType(spell.effect);
    setDamageAmount(spell.damage);
    
    // Handle healing spells differently - they target the player
    if (spell.effect === 'heal') {
      battleSounds.magicSparkle();
      battleSounds.healingChime();
      setActiveSpell('heal');
      setShowSpellEffect(true);
      
      // Heal the player
      setPlayerHp(prev => Math.min(playerCharacter.maxHp, prev + 25));
      
      // Clear poison on healing
      setIsPoisoned(false);
      setPoisonDamage(0);
      
      // Add floating heal number
      setFloatingDamages(prev => [...prev, {
        id: Date.now(),
        damage: 25,
        x: 70 + Math.random() * 10,
        y: 30 + Math.random() * 10,
        isPlayer: true,
        isCritical: true
      }]);
      
      setTimeout(() => {
        setCurrentCommand(null);
      }, 600);
      return;
    }
    
    setHeroAttacking(true);
    
    // Play appropriate spell sound based on effect
    switch (spell.effect) {
      case 'fire':
        battleSounds.fireWhoosh();
        break;
      case 'ice':
        battleSounds.iceShimmer();
        break;
      case 'lightning':
        battleSounds.lightningCrack();
        break;
      case 'slash':
        battleSounds.rockCrumble();
        break;
      case 'nature':
        battleSounds.petalBurst();
        break;
      case 'wind':
        battleSounds.windGust();
        break;
    }
    
    // Trigger spell visual effect
    setActiveSpell(spell.effect);
    setShowSpellEffect(true);
    
    setTimeout(() => {
      setHeroAttacking(false);
      setEnemyTakingDamage(true);
      setShowDamageNumber(true);
      
      // Apply spell damage with bonus effects
      let finalDamage = spell.damage;
      
      // Ice spell has freeze effect - reduce enemy's next attack
      if (spell.effect === 'ice') {
        setIsDebuffed(false); // Clear any debuffs on player as bonus
      }
      
      setEnemyHp(prev => Math.max(0, prev - finalDamage));
      setTotalDamage(prev => prev + finalDamage);
      triggerScreenShake();
      
      // Add floating damage number for spell
      setFloatingDamages(prev => [...prev, {
        id: Date.now(),
        damage: finalDamage,
        x: 30 + Math.random() * 10,
        y: 30 + Math.random() * 10,
        isPlayer: false,
        isCritical: true
      }]);
      
      setTimeout(() => {
        setEnemyTakingDamage(false);
        setShowDamageNumber(false);
        // IMPORTANT: Spells are FREE ACTIONS - no enemy counter-attack!
        // This makes magic strategic and powerful
        setCurrentCommand(null); // Return to command menu
      }, 600);
    }, 400);
  }, [wizardMp, playerCharacter.maxHp]);

  // Handle item usage
  const handleUseItem = useCallback((item: Item) => {
    const itemKey = item.id as InventoryKey;
    if (!inventory[itemKey] || inventory[itemKey] <= 0) return;
    
    setInventory(prev => ({ ...prev, [itemKey]: prev[itemKey] - 1 }));
    
    if (item.effect === 'heal_hp') {
      setPlayerHp(prev => Math.min(heroKnight.maxHp, prev + item.value));
      // Clear poison on healing
      setIsPoisoned(false);
      setPoisonDamage(0);
    } else if (item.effect === 'restore_mp') {
      setWizardMp(prev => Math.min(50, prev + item.value));
    }
  }, [inventory]);

  // Enemy turn logic - with failsafe to prevent stuck state
  const triggerEnemyTurn = useCallback(() => {
    // FAILSAFE: If no abilities, skip enemy turn entirely
    if (!enemy.specialAbilities || enemy.specialAbilities.length === 0) {
      console.log('[RPGBattle] No enemy abilities, skipping enemy turn');
      return;
    }
    
    console.log('[RPGBattle] Starting enemy turn');
    setPhase('enemy_turn');
    setIsPlayerTurn(false);
    
    // Pick a random ability
    const ability = enemy.specialAbilities[Math.floor(Math.random() * enemy.specialAbilities.length)];
    setEnemyAbilityMessage(`${enemy.name} uses ${ability.name}!`);
    
    setTimeout(() => {
      setEnemyAttacking(true);
      
      setTimeout(() => {
        setEnemyAttacking(false);
        
        // Apply ability effects
        switch (ability.effect) {
          case 'poison':
            setIsPoisoned(true);
            setPoisonDamage(ability.damage);
            setPlayerHp(prev => Math.max(0, prev - Math.floor(ability.damage / 2)));
            break;
          case 'debuff':
            setIsDebuffed(true);
            setDebuffTurns(3);
            if (ability.damage > 0) {
              setPlayerHp(prev => Math.max(0, prev - ability.damage));
            }
            break;
          case 'silence':
            // Disable magic temporarily (handled in UI)
            setWizardMp(prev => Math.max(0, prev - 20));
            break;
          default:
            setPlayerHp(prev => Math.max(0, prev - ability.damage));
        }
        
        setHeroTakingDamage(true);
        triggerScreenShake();
        
        setTimeout(() => {
          setHeroTakingDamage(false);
          setEnemyAbilityMessage(null);
          console.log('[RPGBattle] Enemy turn complete, returning to reading');
          setPhase('reading');
          setIsPlayerTurn(true);
        }, 600);
      }, 400);
    }, 1000);
  }, [enemy]);
  
  // FAILSAFE: Force return to reading if stuck in enemy_turn for too long
  useEffect(() => {
    if (phase === 'enemy_turn') {
      const failsafe = setTimeout(() => {
        console.warn('[RPGBattle] Enemy turn failsafe triggered - forcing return to reading');
        setEnemyAbilityMessage(null);
        setEnemyAttacking(false);
        setHeroTakingDamage(false);
        setPhase('reading');
        setIsPlayerTurn(true);
      }, 6000); // 6 second failsafe
      return () => clearTimeout(failsafe);
    }
  }, [phase]);

  // Handle word result from RPGWordReader
  // wordIndex is 0-4 within the current batch
  const handleWordResult = useCallback((correct: boolean, spokenWord: string, wordIndex: number) => {
    // Calculate the global index in the full words array
    const globalIndex = batchStartIndex + wordIndex;
    const word = words[globalIndex] || "";
    
    console.log('[RPGBattle] handleWordResult:', { 
      batchStart: batchStartIndex, 
      wordIndex, 
      globalIndex, 
      expectedWord: word,
      spokenWord, 
      correct 
    });
    
    // Track this word for attack display
    setLastSpokenGlobalIndex(globalIndex);
    
    setWordsRead(prev => prev + 1);
    setCurrentWordResult(correct);

    // Apply poison damage if poisoned
    if (isPoisoned && poisonDamage > 0) {
      setPlayerHp(prev => Math.max(0, prev - 2));
    }

    // Reduce debuff turns
    if (isDebuffed && debuffTurns > 0) {
      setDebuffTurns(prev => {
        const newTurns = prev - 1;
        if (newTurns <= 0) setIsDebuffed(false);
        return newTurns;
      });
    }

    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setCorrectWords(prev => prev + 1);
      if (newStreak > longestStreak) {
        setLongestStreak(newStreak);
      }

      // Calculate base damage
      const baseDamage = Math.floor(calculateDamage(word.length || 5, newStreak) * enemy.wordDamageMultiplier);
      
      // ELARA-SPECIFIC: 5-word charge system for plasma barrage (3x damage)
      let actualDamage = baseDamage;
      let isElaraBarrage = false;
      
      if (selectedCharacter === 'elara') {
        const newChargeCount = elaraChargeRef.current + 1;
        elaraChargeRef.current = newChargeCount;
        setElaraChargeCount(newChargeCount);
        
        if (newChargeCount < 5) {
          // Charging - no damage yet, just count
          actualDamage = 0;
          setDamageAmount(0);
          
          // Show charging indicator
          setComboAnnouncement(`⚡ CHARGING ${newChargeCount}/5`);
          setComboPowerLevel('power');
          setTimeout(() => setComboAnnouncement(null), 600);
        } else {
          // 5th word - PLASMA BARRAGE! 3x damage
          actualDamage = baseDamage * 3;
          isElaraBarrage = true;
          elaraChargeRef.current = 0;
          setElaraChargeCount(0);
          setDamageAmount(actualDamage);
          
          // Epic announcement
          setComboAnnouncement('⚡ PLASMA BARRAGE! ×3 ⚡');
          setComboPowerLevel('ultra');
          battleSounds.lightningCrack();
          battleSounds.comboSuccess();
          setTimeout(() => setComboAnnouncement(null), 1000);
        }
      } else {
        // Normal characters - deal damage every word
        setDamageAmount(baseDamage);
      }
      
      setTotalDamage(prev => prev + actualDamage);
      
      // Calculate and trigger gold/XP rewards
      const goldAmount = calculateGoldEarned({ 
        wordCorrect: true, 
        streak: newStreak, 
        wordLength: word.length || 5 
      });
      const xpAmount = calculateXpEarned({ 
        wordCorrect: true, 
        streak: newStreak 
      });
      
      // Trigger coin drop animation
      if (goldAmount > 0 || xpAmount > 0) {
        setPendingGold(goldAmount);
        setPendingXp(xpAmount);
        setShowCoinDrop(true);
      }
      
      // Only show attack animation if damage is dealt (Elara charges don't attack until 5th word)
      if (actualDamage > 0) {
        // Attack animation sequence with spell effect
        setHeroAttacking(true);
        
        // Trigger spell effect based on attack type (lightning for Elara barrage)
        setActiveSpell(isElaraBarrage ? 'lightning' : attackType);
        setShowSpellEffect(true);
        
        // Play elemental sound effect
        if (!isElaraBarrage) {
          switch (attackType) {
            case 'fire':
              battleSounds.fireWhoosh();
              break;
            case 'ice':
              battleSounds.iceShimmer();
              break;
            case 'lightning':
              battleSounds.lightningCrack();
              break;
            case 'slash':
              battleSounds.rockCrumble();
              break;
          }
        }
        
        setTimeout(() => {
          setHeroAttacking(false);
          setEnemyTakingDamage(true);
          setShowDamageNumber(true);
          setEnemyHp(prev => Math.max(0, prev - actualDamage));
          triggerScreenShake();
          
          // Add floating damage for big hits
          if (isElaraBarrage) {
            setFloatingDamages(prev => [...prev, {
              id: Date.now(),
              damage: actualDamage,
              x: 30 + Math.random() * 10,
              y: 30 + Math.random() * 10,
              isPlayer: false,
              isCritical: true
            }]);
          }
          
          setTimeout(() => {
            setEnemyTakingDamage(false);
            setShowDamageNumber(false);
          }, 600);
        }, 300);
      }

      // Vary attack type based on streak (for non-Elara)
      if (selectedCharacter !== 'elara') {
        const types: ('fire' | 'ice' | 'lightning' | 'slash')[] = ['slash', 'fire', 'ice', 'lightning'];
        setAttackType(types[Math.min(Math.floor(newStreak / 3), types.length - 1)]);
      }
    } else {
      setStreak(0);
      // Enemy always counter-attacks on miss
      const damage = Math.floor(enemy.attack * 0.5);
      setEnemyAbilityMessage(`${enemy.name} strikes back!`);
      
      // Add floating damage for player
      setFloatingDamages(prev => [...prev, {
        id: Date.now(),
        damage,
        x: 70 + Math.random() * 10,
        y: 60 + Math.random() * 10,
        isPlayer: true
      }]);
      
      setTimeout(() => {
        setEnemyAttacking(true);
        setTimeout(() => {
          setEnemyAttacking(false);
          setHeroTakingDamage(true);
          setPlayerHp(prev => Math.max(0, prev - damage));
          triggerScreenShake();
          
          setTimeout(() => {
            setHeroTakingDamage(false);
            setEnemyAbilityMessage(null);
          }, 400);
        }, 300);
      }, 300);
    }

    // Only advance batch when we finish the current batch (wordIndex reaches end)
    // The batch size is 5, so when wordIndex === 4, we've finished the batch
    const batchSize = 5;
    if (wordIndex >= batchSize - 1) {
      // Move to next batch
      setBatchStartIndex(prev => prev + batchSize);
      console.log('[RPGBattle] Advancing to next batch:', batchStartIndex + batchSize);
    }

    // Clear result after animation
    setTimeout(() => {
      setCurrentWordResult(null);
    }, 800);
  }, [streak, longestStreak, words, batchStartIndex, enemy, calculateDamage, isPoisoned, poisonDamage, isDebuffed, debuffTurns, attackType, selectedCharacter]);
  
  // Handle coin collection complete
  const handleCoinCollectionComplete = useCallback(() => {
    setGoldEarned(prev => prev + pendingGold);
    setXpEarned(prev => prev + pendingXp);
    setShowCoinDrop(false);
    setPendingGold(0);
    setPendingXp(0);
  }, [pendingGold, pendingXp]);
  
  // Handle spell effect complete
  const handleSpellComplete = useCallback(() => {
    setShowSpellEffect(false);
    setActiveSpell(null);
  }, []);

  // Check for phase transitions - handle multi-enemy
  useEffect(() => {
    if (enemyHp <= 0 && phase !== 'victory' && phase !== 'enemy_transition') {
      // Check if there are more enemies
      if (currentEnemyIndex < enemyQueue.length - 1) {
        // Transition to next enemy
        setDefeatedEnemy(enemy);
        setPhase('enemy_transition');
      } else {
        setPhase('victory');
      }
    } else if (playerHp <= 0 && phase !== 'defeat') {
      setPhase('defeat');
    }
  }, [enemyHp, playerHp, phase, currentEnemyIndex, enemyQueue.length, enemy]);

  // Handle enemy transition complete
  const handleTransitionComplete = useCallback(() => {
    const nextIndex = currentEnemyIndex + 1;
    setCurrentEnemyIndex(nextIndex);
    const nextEnemy = getEnemyForBattle(enemyQueue[nextIndex]);
    setEnemyHp(nextEnemy.maxHp);
    // Reset random mini-game triggers for the new enemy
    setTriggeredMiniGames(new Set());
    setTriggeredThresholds(new Set()); // Reset HP-based thresholds for new enemy
    setLastMiniGameCheck(0);
    setLastAttackCheck(0); // Reset attack check for new enemy
    setDefeatedEnemy(null);
    setPhase('intro');
    setDialogueIndex(0);
    setCurrentSpeaker('enemy');
  }, [currentEnemyIndex, enemyQueue]);

  // Track battle start time for duration calculation
  const battleStartTime = useRef(Date.now());
  
  // Handle battle end - also saves reading session for teacher visibility
  const handleBattleEnd = useCallback(async (victory: boolean) => {
    const xpEarned = victory ? 
      Math.floor(100 + correctWords * 5 + longestStreak * 10 + totalDamage * 0.5) :
      Math.floor(correctWords * 2);
    
    // Calculate battle duration and WPM
    const durationSeconds = Math.max(1, (Date.now() - battleStartTime.current) / 1000);
    const wpm = Math.round((wordsRead / durationSeconds) * 60);
    const accuracyPercent = wordsRead > 0 ? Math.round((correctWords / wordsRead) * 100) : 0;
    
    // Save to reading_sessions for teacher visibility
    if (studentId && wordsRead > 0) {
      try {
        const { error } = await supabase.from('reading_sessions').insert({
          student_id: studentId,
          passage_text: story.passage_text?.slice(0, 500) || story.title,
          words_read: wordsRead,
          duration_seconds: Math.round(durationSeconds),
          wpm: wpm,
          accuracy_percent: accuracyPercent,
          fluency_score: Math.min(100, Math.round(accuracyPercent * 0.7 + Math.min(wpm, 150) * 0.3)),
          wcpm: Math.round(correctWords / (durationSeconds / 60)),
          fluency_level: accuracyPercent >= 95 ? 'independent' : accuracyPercent >= 90 ? 'instructional' : 'frustration',
          reading_mode: battleMode === 'tug_of_war' ? 'tug_of_war' : battleMode === 'balloon' ? 'balloon_battle' : 'rpg_battle',
        });
        
        if (error) {
          console.error('[RPGBattle] Failed to save reading session:', error);
        } else {
          console.log('[RPGBattle] Reading session saved for teacher visibility');
        }
        
        // ALSO save to aura_records for ML training pipeline
        await saveToAuraRecords({
          studentId,
          sessionId: `rpg_battle_${story.title}_${Date.now()}`,
          wpm,
          wcpm: Math.round(correctWords / (durationSeconds / 60)),
          accuracy: accuracyPercent,
          wordsRead,
          durationSeconds: Math.round(durationSeconds),
          pauseCount: 0,
          phonemeScores: {},
          includeSpeakingData: true,
        });
        console.log('[RPGBattle] ML training data saved to aura_records');
      } catch (err) {
        console.error('[RPGBattle] Error saving reading data:', err);
      }
    }

    onComplete(victory, {
      wordsRead,
      correctWords,
      longestStreak,
      damageDealt: totalDamage,
      xpEarned,
    });
  }, [correctWords, longestStreak, totalDamage, wordsRead, onComplete, studentId, story, battleMode, saveToAuraRecords]);

  // Get current batch of words for reading - MEMOIZED for stable reference
  // batchStartIndex only changes when we complete a full batch, keeping this stable
  const currentWordBatch = useMemo(() => {
    // If we've read all words, show a message batch instead of empty
    if (batchStartIndex >= words.length) {
      // Return empty - UI will handle showing "all words read" message
      return [];
    }
    return words.slice(batchStartIndex, batchStartIndex + 5);
  }, [words, batchStartIndex]);
  
  // Check if all words have been read
  const allWordsRead = batchStartIndex >= words.length && words.length > 0;
  
  // AUTO-VICTORY: If all words read AND enemy HP is low, trigger victory
  useEffect(() => {
    if (allWordsRead && enemyHp <= enemy.maxHp * 0.3 && phase === 'reading') {
      console.log('[RPGBattle] All words read + enemy weak - auto victory!');
      setPhase('victory');
    }
  }, [allWordsRead, enemyHp, enemy.maxHp, phase]);

  // If character select is shown for Classic mode, render it instead of battle
  if (showCharacterSelect && battleMode === 'classic') {
    return (
      <RPGCharacterSelect onSelect={handleCharacterSelect} />
    );
  }

  return (
    <motion.div 
      className="fixed inset-0 z-50 overflow-hidden"
      animate={screenShake ? { x: [-5, 5, -5, 5, 0] } : {}}
      transition={{ duration: 0.3 }}
    >
      {/* Battle Background */}
      <RPGBattleBackground enemyType={currentEnemyType} worldNumber={worldNumber} />

      {/* Enemy Transition Overlay */}
      <RPGEnemyTransition
        isActive={phase === 'enemy_transition'}
        defeatedEnemy={defeatedEnemy}
        nextEnemy={currentEnemyIndex < enemyQueue.length - 1 ? getEnemyForBattle(enemyQueue[currentEnemyIndex + 1]) : null}
        onTransitionComplete={handleTransitionComplete}
      />

      {/* Spell Effects Overlay */}
      <RPGSpellEffects
        spellType={activeSpell}
        isActive={showSpellEffect}
        onComplete={handleSpellComplete}
      />
      
      {/* Coin Drop Animation */}
      {showCoinDrop && (
        <RPGCoinDrop
          goldAmount={pendingGold}
          xpAmount={pendingXp}
          onCollectionComplete={handleCoinCollectionComplete}
        />
      )}
      
      {/* Gold/XP Display */}
      <div className="absolute top-20 left-4 z-30 flex flex-col gap-2">
        <div className="flex items-center gap-2 bg-amber-900/80 px-3 py-1.5 rounded-lg border border-amber-500">
          <Coins className="h-4 w-4 text-amber-300" />
          <span className="text-amber-300 text-sm font-bold">{goldEarned}</span>
        </div>
        <div className="flex items-center gap-2 bg-blue-900/80 px-3 py-1.5 rounded-lg border border-blue-500">
          <Star className="h-4 w-4 text-blue-300" />
          <span className="text-blue-300 text-sm font-bold">{xpEarned} XP</span>
        </div>
      </div>

      {/* Word Barrage Overlay */}
      <AnimatePresence>
        {phase === 'barrage' && (
          <RPGWordBarrage
            words={barrageWords}
            onComplete={handleBarrageComplete}
            onWordHit={handleBarrageWordHit}
          />
        )}
        {phase === 'fireball_barrage' && (
          <RPGFireballBarrage
            words={barrageWords}
            onComplete={handleBarrageComplete}
            onWordHit={handleBarrageWordHit}
          />
        )}
        {phase === 'asteroid_barrage' && (
          <RPGAsteroidBarrage
            words={barrageWords}
            onComplete={handleBarrageComplete}
            onWordHit={handleBarrageWordHit}
          />
        )}
        {phase === 'beast_swarm' && (
          <RPGBeastSwarm
            words={barrageWords}
            onComplete={handleBarrageComplete}
            onWordHit={handleBarrageWordHit}
          />
        )}
        {phase === 'ice_crystal_barrage' && (
          <RPGIceCrystalBarrage
            words={barrageWords}
            onComplete={handleBarrageComplete}
            onWordHit={handleBarrageWordHit}
          />
        )}
        {phase === 'ghostly_whispers' && (
          <RPGGhostlyWhispers
            words={barrageWords}
            onComplete={handleBarrageComplete}
            onWordHit={handleBarrageWordHit}
          />
        )}
        {phase === 'rolling_boulders' && (
          <RPGRollingBoulders
            words={barrageWords}
            onComplete={handleBarrageComplete}
            onWordHit={handleBarrageWordHit}
          />
        )}
        {/* NEW MINI-GAMES */}
        {phase === 'word_shield' && (
          <RPGWordShield
            words={barrageWords}
            onComplete={handleWordShieldComplete}
          />
        )}
        {phase === 'spell_combo' && (
          <RPGSpellCombo
            words={barrageWords}
            onComplete={handleSpellComboComplete}
          />
        )}
        {/* REPLACED: Word Blitz was causing crashes - now using Word Shield */}
        {phase === 'dodge_words' && (
          <RPGWordShield
            words={barrageWords}
            onComplete={(shieldStrength, damage) => {
              // Similar handling to word shield
              const reducedDamage = Math.floor(20 * (1 - shieldStrength / 100));
              if (reducedDamage > 0) {
                setPlayerHp(prev => Math.max(0, prev - reducedDamage));
              }
              if (shieldStrength > 50) {
                setEnemyHp(prev => Math.max(0, prev - damage));
                setTotalDamage(prev => prev + damage);
              }
              setCorrectWords(prev => prev + Math.floor(shieldStrength / 20));
              setBatchStartIndex(prev => prev + barrageWords.length);
              returnToReading();
            }}
          />
        )}
        {phase === 'rhyme_chain' && (
          <RPGRhymeChain
            words={barrageWords}
            onComplete={handleRhymeChainComplete}
            onDamage={handleMiniGameDamage}
          />
        )}
        {phase === 'speed_typist' && (
          <RPGSpeedTypist
            words={barrageWords}
            onComplete={handleSpeedTypistComplete}
            onDamage={handleMiniGameDamage}
          />
        )}
        {phase === 'tug_of_war' && (
          <RPGTugOfWar
            words={barrageWords}
            heroName={playerCharacter.name}
            enemyName={enemy.name}
            onComplete={handleTugOfWarComplete}
            onExit={onBack}
          />
        )}
        {phase === 'goblin_horde' && (
          <RPGGoblinHorde
            words={barrageWords}
            enemyName={enemy.name}
            onComplete={handleGoblinHordeComplete}
          />
        )}
        {phase === 'balloon_battle' && battleMode === 'balloon' && (
          <RPGBalloonBattle
            words={barrageWords}
            heroName={playerCharacter.name}
            enemyName={enemy.name}
            studentId={studentId}
            storyTitle={story.title}
            onComplete={handleBalloonBattleComplete}
          />
        )}
        {phase === 'fireball_defense' && (
          <RPGFireballDefense
            words={barrageWords}
            onComplete={handleFireballDefenseComplete}
          />
        )}
        {/* Quick Block for random enemy attacks */}
        {phase === 'quick_block' && (
          <RPGQuickBlock
            words={quickBlockWords}
            onComplete={handleQuickBlockComplete}
          />
        )}
        {/* NEW 6 MINI-GAMES */}
        {phase === 'word_echo' && (
          <RPGWordEcho
            words={barrageWords}
            onComplete={(completed, failed) => {
              setCorrectWords(prev => prev + completed);
              setTotalDamage(prev => prev + completed * 12);
              setEnemyHp(prev => Math.max(0, prev - completed * 12));
              setBatchStartIndex(prev => prev + barrageWords.length);
              returnToReading();
            }}
            onWordHit={(damage) => setPlayerHp(prev => Math.max(0, prev - damage))}
          />
        )}
        {phase === 'wind_chase' && (
          <RPGWindChase
            words={barrageWords}
            onComplete={(caught, missed) => {
              setCorrectWords(prev => prev + caught);
              setTotalDamage(prev => prev + caught * 10);
              setEnemyHp(prev => Math.max(0, prev - caught * 10));
              setBatchStartIndex(prev => prev + barrageWords.length);
              returnToReading();
            }}
            onWordHit={(damage) => setPlayerHp(prev => Math.max(0, prev - damage))}
          />
        )}
        {phase === 'ink_splash' && (
          <RPGInkSplash
            words={barrageWords}
            onComplete={(revealed, failed) => {
              setCorrectWords(prev => prev + revealed);
              setTotalDamage(prev => prev + revealed * 15);
              setEnemyHp(prev => Math.max(0, prev - revealed * 15));
              setBatchStartIndex(prev => prev + barrageWords.length);
              returnToReading();
            }}
            onWordHit={(damage) => setPlayerHp(prev => Math.max(0, prev - damage))}
          />
        )}
        {phase === 'crystal_prison' && (
          <RPGCrystalPrison
            words={barrageWords}
            onComplete={(freed, frozen) => {
              setCorrectWords(prev => prev + freed);
              setTotalDamage(prev => prev + freed * 14);
              setEnemyHp(prev => Math.max(0, prev - freed * 14));
              setBatchStartIndex(prev => prev + barrageWords.length);
              returnToReading();
            }}
            onWordHit={(damage) => setPlayerHp(prev => Math.max(0, prev - damage))}
          />
        )}
        {phase === 'lightning_storm' && (
          <RPGLightningStorm
            words={barrageWords}
            onComplete={(struck, missed) => {
              setCorrectWords(prev => prev + struck);
              setTotalDamage(prev => prev + struck * 12);
              setEnemyHp(prev => Math.max(0, prev - struck * 12));
              setBatchStartIndex(prev => prev + barrageWords.length);
              returnToReading();
            }}
            onWordHit={(damage) => setPlayerHp(prev => Math.max(0, prev - damage))}
          />
        )}
        {phase === 'void_pull' && (
          <RPGVoidPull
            words={barrageWords}
            onComplete={(saved, consumed) => {
              setCorrectWords(prev => prev + saved);
              setTotalDamage(prev => prev + saved * 16);
              setEnemyHp(prev => Math.max(0, prev - saved * 16));
              setBatchStartIndex(prev => prev + barrageWords.length);
              returnToReading();
            }}
            onWordHit={(damage) => setPlayerHp(prev => Math.max(0, prev - damage))}
          />
        )}
      </AnimatePresence>

      {/* Enemy Ability Message */}
      <AnimatePresence>
        {enemyAbilityMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-1/3 left-1/2 -translate-x-1/2 z-40"
          >
            <div className="bg-red-900/90 border-2 border-red-500 px-6 py-3 rounded-lg
              shadow-[0_0_30px_rgba(239,68,68,0.5)]">
              <span className="text-white font-bold text-lg">{enemyAbilityMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Effects Display */}
      <AnimatePresence>
        {(isPoisoned || isDebuffed) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-24 left-4 z-30 flex flex-col gap-2"
          >
            {isPoisoned && (
              <div className="flex items-center gap-2 bg-green-900/80 px-3 py-1.5 rounded-lg border border-green-500">
                <span className="text-lg">☠️</span>
                <span className="text-green-300 text-sm font-medium">Poisoned</span>
              </div>
            )}
            {isDebuffed && (
              <div className="flex items-center gap-2 bg-purple-900/80 px-3 py-1.5 rounded-lg border border-purple-500">
                <AlertTriangle className="h-4 w-4 text-purple-300" />
                <span className="text-purple-300 text-sm font-medium">Weakened ({debuffTurns})</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Battle Layout */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-3 bg-black/40 backdrop-blur-sm border-b border-white/10">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retreat
          </Button>
          <div className="flex items-center gap-4 text-white/80">
            <span className="text-sm font-medium truncate max-w-[200px]">{story.title}</span>
            {streak > 0 && (
              <motion.div 
                className="flex items-center gap-1 text-orange-400"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
              >
                <Flame className="h-4 w-4" />
                <span className="font-bold">x{streak}</span>
              </motion.div>
            )}
            {/* Sound Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-white/70 hover:text-white hover:bg-white/10 p-2"
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Battle Arena - Center Section */}
        <div className="flex-1 flex items-center justify-center px-4 py-2">
          <div className="w-full max-w-5xl flex items-end justify-between gap-8">
            {/* Enemy (Left Side) */}
            <motion.div
              className="flex-1 flex justify-center"
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <RPGCharacter
                character={enemy}
                currentHp={enemyHp}
                isEnemy
                isAttacking={enemyAttacking}
                isTakingDamage={enemyTakingDamage}
                damageNumber={damageAmount}
                showDamage={showDamageNumber}
                usePremiumSprites={true}
              />
            </motion.div>

            {/* VS Indicator */}
            <motion.div
              className="text-4xl font-black text-white/30"
              animate={{ 
                scale: phase === 'reading' ? [1, 1.1, 1] : 1,
                opacity: phase === 'reading' ? [0.3, 0.5, 0.3] : 0.3,
              }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              ⚔
            </motion.div>

            {/* Heroes (Right Side) */}
            <motion.div
              className="flex-1 flex justify-center gap-2 md:gap-4"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {/* Main player character - with health bar */}
              <RPGCharacter
                character={playerCharacter}
                currentHp={playerHp}
                isAttacking={heroAttacking}
                isTakingDamage={heroTakingDamage}
                isDefending={currentCommand === 'defend'}
                currentStreak={streak}
                usePremiumSprites={true}
                showHealthBar={true}
              />
              {/* Companion - NO health bar */}
              {companionCharacter && (
                <RPGCharacter
                  character={companion}
                  currentHp={companion.maxHp}
                  usePremiumSprites={true}
                  showHealthBar={false}
                />
              )}
            </motion.div>
          </div>
        </div>

        {/* Bottom UI Section */}
        <div className="bg-black/50 backdrop-blur-sm border-t border-white/10">
          <div className="max-w-5xl mx-auto p-4">
            <AnimatePresence mode="wait">
              {/* Intro Dialogue */}
              {phase === 'intro' && (
                <motion.div
                  key="intro"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="w-full"
                >
                  <RPGDialogueBox
                    speakerName={
                      currentSpeaker === 'hero' ? playerCharacter.name :
                      currentSpeaker === 'wizard' ? companion.name :
                      enemy.name
                    }
                    speakerColor={
                      currentSpeaker === 'hero' ? playerCharacter.color :
                      currentSpeaker === 'wizard' ? companion.color :
                      enemy.color
                    }
                    dialogue={getCurrentDialogue()}
                    onComplete={handleDialogueComplete}
                  />
                </motion.div>
              )}

              {/* Reading Phase */}
              {phase === 'reading' && (
                <motion.div
                  key="reading"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 md:grid-cols-[200px_1fr_200px] gap-4"
                >
                  {/* Command Menu */}
                  <div className="hidden md:block">
                    <RPGCommandMenu
                      onSelectCommand={handleCommand}
                      onCastSpell={handleCastSpell}
                      onUseItem={handleUseItem}
                      isPlayerTurn={isPlayerTurn}
                      currentCommand={currentCommand}
                      disabled={currentWordResult !== null}
                      currentMp={wizardMp}
                      inventory={inventory}
                      selectedCharacter={selectedCharacter}
                    />
                  </div>

                  {/* Center: Voice Reading */}
                  <div className="space-y-4">
                    {currentCommand === 'read' && currentWordBatch.length > 0 && (
                      <>
                        {/* Elara charge indicator */}
                        {selectedCharacter === 'elara' && elaraChargeCount > 0 && elaraChargeCount < 5 && (
                          <motion.div 
                            className="bg-gradient-to-r from-purple-900/90 to-indigo-900/90 border-2 border-purple-400 rounded-lg px-4 py-2 mb-2"
                            animate={{ scale: [1, 1.02, 1] }}
                            transition={{ repeat: Infinity, duration: 0.5 }}
                          >
                            <div className="flex items-center justify-center gap-3">
                              <span className="text-purple-300 font-bold">⚡ CHARGING</span>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(i => (
                                  <div 
                                    key={i}
                                    className={`w-6 h-6 rounded-full border-2 ${
                                      i <= elaraChargeCount 
                                        ? 'bg-purple-400 border-purple-300 shadow-[0_0_8px_rgba(192,132,252,0.8)]' 
                                        : 'bg-slate-700 border-slate-500'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-purple-200 text-sm">({elaraChargeCount}/5)</span>
                            </div>
                          </motion.div>
                        )}
                        <RPGWordReader
                          words={currentWordBatch}
                          onResult={handleWordResult}
                          disabled={currentWordResult !== null || !isPlayerTurn}
                          streak={streak}
                          batchSize={5}
                          enableEchoRetry={true}
                          mode={selectedCharacter === 'elara' ? 'fast' : 'normal'}
                        />
                      </>
                    )}
                    
                    {/* All words read message */}
                    {currentCommand === 'read' && allWordsRead && currentWordResult === null && (
                      <div className="bg-gradient-to-r from-amber-900/80 to-yellow-900/80 border-2 border-amber-500 rounded-xl p-6 text-center">
                        <div className="text-2xl mb-2">📚✨</div>
                        <p className="text-lg font-bold text-amber-300">All words read!</p>
                        <p className="text-sm text-amber-200/80 mt-1">Keep attacking with spells or items!</p>
                      </div>
                    )}

                    {/* Word Attack Effect */}
                    {currentWordResult !== null && (
                      <RPGWordAttack
                        word={words[lastSpokenGlobalIndex] || ""}
                        isCorrect={currentWordResult}
                        streak={streak}
                        damage={damageAmount}
                        attackType={attackType}
                      />
                    )}
                  </div>

                  {/* Party Stats */}
                  <div className="hidden md:block">
                    <RPGPartyStats
                      members={[
                        { 
                          name: playerCharacter.name, 
                          currentHp: playerHp, 
                          maxHp: playerCharacter.maxHp, 
                          isDefending: currentCommand === 'defend',
                          currentMp: selectedCharacter === 'elara' ? wizardMp : undefined,
                          maxMp: selectedCharacter === 'elara' ? 50 : undefined,
                        },
                      ]}
                      streak={streak}
                      longestStreak={longestStreak}
                    />
                  </div>
                </motion.div>
              )}

              {/* Enemy Turn Phase */}
              {phase === 'enemy_turn' && (
                <motion.div
                  key="enemy_turn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-8"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="text-2xl font-bold text-red-400"
                  >
                    {enemy.name}'s Turn!
                  </motion.div>
                </motion.div>
              )}

              {/* Victory Screen */}
              {phase === 'victory' && (
                <motion.div
                  key="victory"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8 space-y-6"
                >
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="flex justify-center gap-2"
                  >
                    <Trophy className="h-16 w-16 text-yellow-400" />
                  </motion.div>
                  <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
                    VICTORY!
                  </h2>
                  <p className="text-slate-300">
                    You defeated <span className="text-red-400 font-bold">{enemy.name}</span>!
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-xl mx-auto">
                    <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
                      <p className="text-3xl font-bold text-white">{correctWords}</p>
                      <p className="text-xs text-slate-400">Words Read</p>
                    </div>
                    <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
                      <p className="text-3xl font-bold text-orange-400">{longestStreak}</p>
                      <p className="text-xs text-slate-400">Best Streak</p>
                    </div>
                    <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
                      <p className="text-3xl font-bold text-red-400">{totalDamage}</p>
                      <p className="text-xs text-slate-400">Damage</p>
                    </div>
                    <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
                      <p className="text-3xl font-bold text-yellow-400 flex items-center justify-center gap-1">
                        <Star className="h-5 w-5" />
                        {Math.floor(100 + correctWords * 5 + longestStreak * 10)}
                      </p>
                      <p className="text-xs text-slate-400">XP Earned</p>
                    </div>
                  </div>

                  <Button 
                    onClick={() => handleBattleEnd(true)} 
                    size="lg"
                    className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 
                      text-black font-bold px-12 shadow-lg shadow-yellow-500/30"
                  >
                    Continue
                  </Button>
                </motion.div>
              )}

              {/* Defeat Screen */}
              {phase === 'defeat' && (
                <motion.div
                  key="defeat"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 space-y-6"
                >
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <Skull className="h-16 w-16 text-red-500 mx-auto" />
                  </motion.div>
                  <h2 className="text-4xl font-black text-red-500">DEFEAT</h2>
                  <p className="text-slate-300">
                    {enemy.name} was too powerful...
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={onBack} className="border-slate-600 text-slate-300">
                      Return to Map
                    </Button>
                    <Button 
                      onClick={() => window.location.reload()}
                      className="bg-gradient-to-r from-red-500 to-rose-600"
                    >
                      Try Again
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

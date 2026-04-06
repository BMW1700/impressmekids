import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { getIPAPronunciation } from "@/lib/cmuDictWrapper";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Flame, Trophy, Skull, Star, AlertTriangle, Coins, Volume2, VolumeX } from "lucide-react";
import { RPGBattleBackground } from "./RPGBattleBackground";
import { RPGCharacter } from "./RPGCharacter";
import { RPGDialogueBox } from "./RPGDialogueBox";
import { RPGCommandMenu } from "./RPGCommandMenu";
import { RPGPartyStats } from "./RPGPartyStats";

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
import { RPGDataBurstEffect } from "./RPGDataBurstEffect";
import { RPGCoinDrop } from "./RPGCoinDrop";
// NEW: Import the attack mini-games (Word Blitz removed - caused crashes)
import { RPGWordShield } from "./RPGWordShield";
import { RPGSpellCombo } from "./RPGSpellCombo";
// NEW: Import 2 new mini-games
import { RPGWordCannon } from "./RPGWordCannon";
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
import { RPGGroundRipple } from "./RPGGroundRipple";
import { RPGWebTrap } from "./RPGWebTrap";
// NEW: Import character selection
import { RPGCharacterSelect, PlayableCharacter } from "./RPGCharacterSelect";
import { Spell } from "./RPGSpellMenu";
import { Item } from "./RPGItemMenu";
// NEW: Literacy features
import { RPGWordPowerUp } from "./RPGWordPowerUp";
import { RPGVocabShield } from "./RPGVocabShield";
import { RPGContextClue } from "./RPGContextClue";
import { ComprehensionQuiz } from "./ComprehensionQuiz";
import { isPowerWord, getWordDefinition, WORD_DEFINITIONS } from "./VocabularyTracker";
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
import { getAgentHero, getAgentEnemy, getAgentBossForWorld, agentHeroDialogue, agentCompanionDialogue } from "@/lib/agentBattleData";
import { getStoredTheme } from "@/lib/gameTheme";
import { CuratedStory } from "@/data/curatedStories";
import { calculateGoldEarned, calculateXpEarned } from "@/lib/gameEconomy";
import { SoundEffects } from "@/lib/pronunciationPlayer";
import { speechManager } from "@/lib/speechRecognitionManager";
import { supabase } from "@/integrations/supabase/client";
import { updateStudentReadingStats as updateSharedReadingStats } from "@/lib/updateStudentReadingStats";
import { useMLIntegration } from "@/hooks/useMLIntegration";

// Sound effects singleton
const battleSounds = new SoundEffects();

type EnemyType = 'minion' | 'guard' | 'elite' | 'boss' | 'final_boss' | 'dragon' | 'mini_beast' | 'ice_golem' | 'shadow_wraith' | 'stone_guardian' | 'cave_troll' | 'crystal_spider' | 'echo_wraith' | 'storm_harpy' | 'cloud_giant' | 'zephyr' | 'ink_kraken' | 'reef_guardian' | 'leviathan' | 'void_phantom' | 'reality_shifter' | 'word_eater' | 'goblin_shaman';
// UPDATED: Added goblin_horde for Classic mode mini-game + quick_block for enemy attacks
type BattlePhase = 'intro' | 'dialogue' | 'reading' | 'combat' | 'barrage' | 'fireball_barrage' | 'asteroid_barrage' | 'beast_swarm' | 'ice_crystal_barrage' | 'ghostly_whispers' | 'rolling_boulders' | 'word_shield' | 'spell_combo' | 'dodge_words' | 'rhyme_chain' | 'speed_typist' | 'tug_of_war' | 'balloon_battle' | 'goblin_horde' | 'fireball_defense' | 'quick_block' | 'enemy_turn' | 'enemy_transition' | 'victory' | 'defeat' | 'word_echo' | 'wind_chase' | 'ink_splash' | 'crystal_prison' | 'lightning_storm' | 'void_pull' | 'ground_ripple' | 'web_trap' | 'vocab_shield' | 'context_clue' | 'boss_gate';
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
  goldEarned?: number; // NEW: Add gold to stats
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
  const { saveToAuraRecords, triggerQLearningUpdate } = useMLIntegration();
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
  const enemy = (() => {
    const theme = getStoredTheme();
    if (theme === 'agent') {
      if (currentEnemyType === 'boss' || currentEnemyType === 'final_boss') {
        return getAgentBossForWorld(worldNumber);
      }
      return getAgentEnemy(currentEnemyType);
    }
    return getEnemyForBattle(currentEnemyType);
  })();
  const [defeatedEnemy, setDefeatedEnemy] = useState<RPGEnemy | null>(null);
  
  // Battle state
  const [phase, setPhase] = useState<BattlePhase>('intro');
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [currentSpeaker, setCurrentSpeaker] = useState<'hero' | 'wizard' | 'enemy'>('hero');
  const [currentCommand, setCurrentCommand] = useState<CommandType | null>(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [screenShake, setScreenShake] = useState(false);
  
  // ========== TERMINAL STATE SAFETY INFRASTRUCTURE ==========
  // phaseRef tracks current phase synchronously for use in callbacks
  const phaseRef = useRef<BattlePhase>(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  
  // Timeout registry - all game timeouts go through this so we can cancel on game-over
  const timeoutsRef = useRef<number[]>([]);
  
  const scheduleTimeout = useCallback((fn: () => void, ms: number): number => {
    const id = window.setTimeout(() => {
      // Remove from registry when executed
      timeoutsRef.current = timeoutsRef.current.filter(t => t !== id);
      fn();
    }, ms);
    timeoutsRef.current.push(id);
    return id;
  }, []);
  
  const clearAllTimeouts = useCallback(() => {
    console.log('[RPGBattle] Clearing all pending timeouts:', timeoutsRef.current.length);
    timeoutsRef.current.forEach(id => window.clearTimeout(id));
    timeoutsRef.current = [];
  }, []);
  
  // Safe phase setter - BLOCKS changes if already in terminal state
  const setPhaseSafe = useCallback((next: BattlePhase, reason?: string) => {
    const current = phaseRef.current;
    // Terminal states cannot be overwritten
    if (current === 'victory' || current === 'defeat') {
      console.log('[RPGBattle] BLOCKED phase change:', next, '- already in terminal state:', current);
      return false;
    }
    console.log('[RPGBattle] Phase change:', current, '->', next, reason ? `(${reason})` : '');
    setPhase(next);
    return true;
  }, []);
  
  // Centralized game-over triggers
  const triggerVictory = useCallback((reason: string) => {
    if (phaseRef.current === 'victory' || phaseRef.current === 'defeat') {
      console.log('[RPGBattle] triggerVictory BLOCKED - already terminal');
      return;
    }
    console.log('[RPGBattle] 🏆 TRIGGERING VICTORY:', reason);
    clearAllTimeouts();
    speechManager.forceStop();
    
    // FIXED: Save collected power words to student_vocabulary on victory
    const wordsToSave = collectedPowerWordsRef.current;
    if (wordsToSave.length > 0) {
      const records = wordsToSave.map(w => ({
        student_id: studentId,
        word: w.toLowerCase(),
        definition: getWordDefinition(w),
        times_seen: 1,
        times_correct: 0,
        mastered: false,
      }));
      supabase
        .from('student_vocabulary')
        .upsert(records, { onConflict: 'student_id,word', ignoreDuplicates: true })
        .then(({ error }) => {
          if (error) console.error('[RPGBattle] Failed to save power words:', error);
          else console.log('[RPGBattle] Saved', records.length, 'power words');
        });
    }
    
    setPhase('victory');
  }, [clearAllTimeouts, studentId]);
  
  const triggerDefeat = useCallback((reason: string) => {
    if (phaseRef.current === 'victory' || phaseRef.current === 'defeat') {
      console.log('[RPGBattle] triggerDefeat BLOCKED - already terminal');
      return;
    }
    console.log('[RPGBattle] 💀 TRIGGERING DEFEAT:', reason);
    clearAllTimeouts();
    speechManager.forceStop();
    setPhase('defeat');
  }, [clearAllTimeouts]);
  // REMOVED: HP-based barrage triggers - now all mini-games are random
  
  // Character selection state for Classic mode
  const [showCharacterSelect, setShowCharacterSelect] = useState(battleMode === 'classic');
  const [selectedCharacter, setSelectedCharacter] = useState<PlayableCharacter | null>(null);
  const [companionCharacter, setCompanionCharacter] = useState<PlayableCharacter | null>(null);
  
  // Get character data from selection
  const getCharacterData = useCallback((charId: PlayableCharacter | null): RPGCharacterType => {
    const theme = getStoredTheme();
    if (theme === 'agent') {
      return getAgentHero(charId || 'valor');
    }
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
  
  // Refs for volatile combat counters (prevents stale closures in callbacks)
  const streakRef = useRef(0);
  const hasManualSpellRef = useRef(false);
  const longestStreakRef = useRef(0);
  const wordsReadRef = useRef(0);
  const correctWordsRef = useRef(0);
  const [inventory, setInventory] = useState<Record<InventoryKey, number>>({ health_potion: 2, magic_potion: 1 });
  
  // Ref to track latest enemyHp for use in callbacks (prevents stale closure issues in mini-games)
  const enemyHpRef = useRef(enemyHp);
  
  // Keep enemyHpRef in sync with state
  useEffect(() => {
    enemyHpRef.current = enemyHp;
  }, [enemyHp]);
  
  // Track which word indices have already been counted for accuracy (to prevent double-counting)
  // When onMiss fires, we count the miss immediately. When handleWordResult(false) fires later via "Continue",
  // we skip the wordsRead increment if already counted.
  const countedWordIndicesRef = useRef<Set<number>>(new Set());
  
  // Phoneme tracking: accumulate per-phoneme accuracy throughout the battle
  const phonemeAccumulatorRef = useRef<Record<string, { correct: number; total: number }>>({});
  
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
  const [attackType, setAttackType] = useState<'fire' | 'ice' | 'lightning' | 'slash' | 'nature' | 'heal' | 'wind' | 'data_burst'>('lightning');
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
  const [activeSpell, setActiveSpell] = useState<'fire' | 'ice' | 'lightning' | 'slash' | 'nature' | 'heal' | 'wind' | 'data_burst' | null>(null);
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
  
  // Speed/accuracy bonus HUD indicators (patent-visible mechanics)
  const [speedBonusFlash, setSpeedBonusFlash] = useState<{ tier: 'fast' | 'normal' | 'slow'; timeMs: number } | null>(null);
  const [accuracyTier, setAccuracyTier] = useState<{ multiplier: number; percent: number }>({ multiplier: 1.0, percent: 100 });
  
  // Sound toggle
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // === LITERACY FEATURES STATE ===
  const [activePowerWord, setActivePowerWord] = useState<{ id: number; word: string; definition: string | null } | null>(null);
  const [collectedPowerWords, setCollectedPowerWords] = useState<string[]>([]);
  const collectedPowerWordsRef = useRef<string[]>([]);
  const [vocabShieldData, setVocabShieldData] = useState<{ word: string; definition: string; distractors: string[] } | null>(null);
  const [contextClueData, setContextClueData] = useState<{ sentence: string; blankWord: string; options: string[] } | null>(null);
  const [bossGateTriggered, setBossGateTriggered] = useState(false);
  const [wordMasteryBonus, setWordMasteryBonus] = useState<{ word: string; multiplier: number } | null>(null);
  
  // Cross-session word mastery: cache DB vocabulary on mount
  const knownWordsRef = useRef<Record<string, number>>({});
  useEffect(() => {
    if (!studentId) return;
    supabase
      .from('student_vocabulary')
      .select('word, times_correct')
      .eq('student_id', studentId)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, number> = {};
          data.forEach((row: { word: string; times_correct: number }) => {
            map[row.word.toLowerCase()] = row.times_correct ?? 0;
          });
          knownWordsRef.current = map;
        }
      });
  }, [studentId]);
  
  // Update sound effects when toggle changes
  useEffect(() => {
    battleSounds.setSoundEnabled(soundEnabled);
  }, [soundEnabled]);
  
  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      console.log('[RPGBattle] Component unmounting - clearing all timeouts');
      clearAllTimeouts();
      speechManager.forceStop();
    };
  }, [clearAllTimeouts]);
  
  // Helper function to check if this is the final enemy
  const isFinalEnemy = useMemo(() => currentEnemyIndex >= enemyQueue.length - 1, [currentEnemyIndex, enemyQueue.length]);
  
  // Helper function to return to reading state cleanly after any mini-game/barrage
  // CRITICAL: Also checks for victory condition
  // CRITICAL: Uses enemyHpRef to get the LATEST HP value (prevents stale closure from mini-games)
  // CRITICAL: Uses setPhaseSafe to prevent overwriting terminal states
  const returnToReading = useCallback(() => {
    console.log('[RPGBattle] returnToReading called, enemyHpRef:', enemyHpRef.current, 'isFinalEnemy:', isFinalEnemy, 'currentPhase:', phaseRef.current);
    
    // BLOCK if already in terminal state
    if (phaseRef.current === 'victory' || phaseRef.current === 'defeat') {
      console.log('[RPGBattle] returnToReading BLOCKED - already terminal');
      return;
    }
    
    // Force stop any lingering recognition
    speechManager.forceStop();
    
    // Check if we should trigger victory instead - USE REF for latest value!
    if (enemyHpRef.current <= 0 && isFinalEnemy) {
      triggerVictory('Enemy HP reached 0 in returnToReading');
      return;
    }
    
    // Check if we should transition to next enemy - USE REF for latest value!
    if (enemyHpRef.current <= 0 && !isFinalEnemy) {
      console.log('[RPGBattle] Enemy defeated - transitioning to next enemy');
      setDefeatedEnemy(enemy);
      setPhaseSafe('enemy_transition', 'next enemy');
      return;
    }
    
    // Clear any pending state immediately
    setCurrentWordResult(null);
    setEnemyAbilityMessage(null);
    
    // Small delay to ensure cleanup completes - USE SAFE SETTER
    scheduleTimeout(() => {
      // Double-check we haven't entered terminal state during the timeout
      if (phaseRef.current === 'victory' || phaseRef.current === 'defeat') {
        console.log('[RPGBattle] returnToReading timeout BLOCKED - terminal state reached');
        return;
      }
      setPhaseSafe('reading', 'returnToReading');
      setCurrentCommand('read');
      setIsPlayerTurn(true);
      console.log('[RPGBattle] State reset complete - phase: reading, command: read');
    }, 100);
  }, [isFinalEnemy, enemy, triggerVictory, setPhaseSafe, scheduleTimeout]);

  // Parse story into words - memoized for stability
  const storyWords = useMemo(() => {
    if (!story?.passage_text) return [];
    return story.passage_text.split(/\s+/).filter(w => w.length > 0 && !/^[\u2014\u2013\u2012\-—–]+$/.test(w));
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
    const isAgent = getStoredTheme() === 'agent';
    const allCharacters: PlayableCharacter[] = isAgent ? ['agent_x', 'cipher', 'shadow'] : ['valor', 'elara', 'ella'];
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
    const isAgent = getStoredTheme() === 'agent';
    const announcements: Record<MiniGameType, string> = {
      'word_shield': `${enemy.name} charges a devastating attack!`,
      'spell_combo': `POWER SURGE! Chain a spell combo!`,
      'dodge_words': `INCOMING ATTACK! Dodge the wrong words!`,
      'rhyme_chain': `RHYME TIME! Chain rhyming words!`,
      'speed_typist': `SPEED BLITZ! Read as fast as you can!`,
      'tug_of_war': `TUG OF WAR! Pull the rope with reading power!`,
      'goblin_horde': isAgent ? `🎯 HOSTILE SQUAD! Speak words to eliminate them! 🎯` : `⚔️ GOBLIN HORDE! Speak words to defeat them! ⚔️`,
      'fireball_defense': isAgent ? `🚀 ${enemy.name} LAUNCHES MISSILES! 🚀` : `🔥 ${enemy.name} UNLEASHES FIREBALLS! 🔥`,
      'beast_swarm': isAgent ? `${enemy.name} deploys DRONE SWARM!` : `${enemy.name} summons BEAST SWARM!`,
      'ice_crystal_barrage': isAgent ? `${enemy.name} deploys EMP PULSE!` : `${enemy.name} unleashes ICE CRYSTAL BARRAGE!`,
      'ghostly_whispers': isAgent ? `${enemy.name} activates SIGNAL JAMMER!` : `${enemy.name} summons GHOSTLY WHISPERS!`,
      'rolling_boulders': isAgent ? `${enemy.name} triggers CONCUSSION GRENADES!` : `${enemy.name} triggers ROLLING BOULDERS!`,
      'word_barrage': isAgent ? `${enemy.name} launches DATA BARRAGE!` : `${enemy.name} launches WORD BARRAGE!`,
      'fireball_barrage': isAgent ? `🚀 ${enemy.name} launches MISSILE BARRAGE! 🚀` : `🔥 ${enemy.name} unleashes FIREBALL BARRAGE! 🔥`,
      'asteroid_barrage': isAgent ? `${enemy.name} activates CONTAINMENT FIELD!` : `${enemy.name} summons WORD PRISON!`,
      'ground_ripple': isAgent ? `💥 ${enemy.name} DETONATES CHARGES! 💥` : `🏔️ ${enemy.name} SMASHES THE GROUND! 🏔️`,
      'web_trap': isAgent ? `🔒 ${enemy.name} DEPLOYS SECURITY NET! 🔒` : `🕸️ ${enemy.name} TRAPS YOU IN A WEB! 🕸️`,
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
        'ground_ripple': 'ground_ripple',
        'web_trap': 'web_trap',
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
  // UPDATED: Syncs enemyHpRef for terminal state detection in returnToReading
  const handleFireballDefenseComplete = useCallback((blocked: number, hit: number, damage: number) => {
    console.log('[RPGBattle] Fireball Defense complete:', { blocked, hit, damage });
    if (damage > 0) {
      setPlayerHp(prev => Math.max(0, prev - damage));
    }
    const bonusDamage = blocked * 10;
    if (bonusDamage > 0) {
      const newHp = Math.max(0, enemyHpRef.current - bonusDamage);
      enemyHpRef.current = newHp;
      setEnemyHp(newHp);
      setTotalDamage(prev => prev + bonusDamage);
    }
    setCorrectWords(prev => prev + blocked);
    setWordsRead(prev => prev + blocked + hit);
    setBatchStartIndex(prev => prev + barrageWords.length);
    returnToReading();
  }, [barrageWords.length, returnToReading]);
  
  // Handle Word Shield complete - uses returnToReading for clean state
  // UPDATED: Syncs enemyHpRef for terminal state detection in returnToReading
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
      const newHp = Math.max(0, enemyHpRef.current - damage);
      enemyHpRef.current = newHp;
      setEnemyHp(newHp);
      setTotalDamage(prev => prev + damage);
    }
    // FIX: Track accuracy for words consumed by this mini-game
    const wordsCorrectInShield = Math.round((shieldStrength / 100) * barrageWords.length);
    setCorrectWords(prev => prev + wordsCorrectInShield);
    setWordsRead(prev => prev + barrageWords.length);
    setBatchStartIndex(prev => prev + barrageWords.length);
    returnToReading();
  }, [barrageWords.length, returnToReading]);
  
  // Handle Spell Combo complete - uses returnToReading for clean state
  // UPDATED: Syncs enemyHpRef for terminal state detection in returnToReading
  const handleSpellComboComplete = useCallback((success: boolean, multiplier: number) => {
    console.log('[RPGBattle] Spell Combo complete:', { success, multiplier });
    if (success) {
      battleSounds.comboSuccess();
      battleSounds.magicSparkle();
      const damage = Math.floor(50 * multiplier);
      const newHp = Math.max(0, enemyHpRef.current - damage);
      enemyHpRef.current = newHp;
      setEnemyHp(newHp);
      setTotalDamage(prev => prev + damage);
      setCorrectWords(prev => prev + barrageWords.length);
      setWordsRead(prev => prev + barrageWords.length);
    } else {
      setWordsRead(prev => prev + barrageWords.length);
    }
    setBatchStartIndex(prev => prev + barrageWords.length);
    returnToReading();
  }, [barrageWords.length, returnToReading]);
  
  // Handle Dodge Words complete
  // UPDATED: Syncs enemyHpRef for terminal state detection in returnToReading
  const handleDodgeWordsComplete = useCallback((correctHits: number, wrongHits: number, dodged: number) => {
    console.log('[RPGBattle] Dodge Words complete:', { correctHits, wrongHits, dodged });
    const damage = correctHits * 15;
    const newHp = Math.max(0, enemyHpRef.current - damage);
    enemyHpRef.current = newHp;
    setEnemyHp(newHp);
    setTotalDamage(prev => prev + damage);
    setCorrectWords(prev => prev + correctHits);
    setWordsRead(prev => prev + correctHits + wrongHits);
    returnToReading();
  }, [returnToReading]);
  
  // (handleDodgeWordsDamage removed - Word Blitz replaced with Word Shield)
  
  // Handle Rhyme Chain complete - uses returnToReading for clean state
  // UPDATED: Syncs enemyHpRef for terminal state detection in returnToReading
  const handleRhymeChainComplete = useCallback((score: number, damage: number) => {
    console.log('[RPGBattle] Word Cannon complete:', { score, damage });
    if (damage > 0) {
      battleSounds.magicSparkle();
      const newHp = Math.max(0, enemyHpRef.current - damage);
      enemyHpRef.current = newHp;
      setEnemyHp(newHp);
      setTotalDamage(prev => prev + damage);
    }
    setCorrectWords(prev => prev + score);
    setWordsRead(prev => prev + barrageWords.length);
    setBatchStartIndex(prev => prev + barrageWords.length);
    returnToReading();
  }, [barrageWords.length, returnToReading]);
  
  // Handle Speed Typist complete - uses returnToReading for clean state
  // UPDATED: Syncs enemyHpRef for terminal state detection in returnToReading
  const handleSpeedTypistComplete = useCallback((wordsSpoken: number, damage: number) => {
    console.log('[RPGBattle] Speed Typist complete:', { wordsSpoken, damage });
    if (damage > 0) {
      battleSounds.lightningCrack();
      const newHp = Math.max(0, enemyHpRef.current - damage);
      enemyHpRef.current = newHp;
      setEnemyHp(newHp);
      setTotalDamage(prev => prev + damage);
    }
    setCorrectWords(prev => prev + wordsSpoken);
    setWordsRead(prev => prev + barrageWords.length);
    setBatchStartIndex(prev => prev + barrageWords.length);
    returnToReading();
  }, [barrageWords.length, returnToReading]);
  
  // Handle Tug of War complete
  // UPDATED: Uses triggerVictory/triggerDefeat for terminal state safety
  const handleTugOfWarComplete = useCallback((victory: boolean, stats: { wordsRead: number; correctWords: number; incorrectWords: number }) => {
    console.log('[RPGBattle] Tug of War complete:', { victory, stats, battleMode });
    setWordsRead(prev => prev + stats.wordsRead);
    setCorrectWords(prev => prev + stats.correctWords);
    
    // If this is the main battle mode (not a mini-game), trigger full victory/defeat
    if (battleMode === 'tug_of_war') {
      if (victory) {
        battleSounds.celebrationSound();
        setTotalDamage(stats.correctWords * 5);
        triggerVictory('Tug of War won');
      } else {
        triggerDefeat('Tug of War lost');
      }
      return;
    }
    
    // Mini-game behavior
    if (victory) {
      const bonusDamage = Math.floor(stats.correctWords * 5);
      battleSounds.celebrationSound();
      const newHp = Math.max(0, enemyHpRef.current - bonusDamage);
      enemyHpRef.current = newHp;
      setEnemyHp(newHp);
      setTotalDamage(prev => prev + bonusDamage);
    } else {
      setPlayerHp(prev => Math.max(0, prev - 20));
    }
    setBatchStartIndex(prev => prev + barrageWords.length);
    returnToReading();
  }, [barrageWords.length, returnToReading, battleMode, triggerVictory, triggerDefeat]);
  
  // Handle Balloon Battle complete
  // UPDATED: Uses triggerVictory/triggerDefeat for terminal state safety
  const handleBalloonBattleComplete = useCallback((victory: boolean, stats: { wordsRead: number; correctWords: number; balloonsLost: number }) => {
    console.log('[RPGBattle] Balloon Battle complete:', { victory, stats, battleMode });
    setWordsRead(prev => prev + stats.wordsRead);
    setCorrectWords(prev => prev + stats.correctWords);
    
    // If this is the main battle mode (not a mini-game), trigger full victory/defeat
    if (battleMode === 'balloon') {
      if (victory) {
        battleSounds.celebrationSound();
        setTotalDamage(stats.correctWords * 3 + (stats.balloonsLost === 0 ? 50 : 0));
        triggerVictory('Balloon Battle won');
      } else {
        triggerDefeat('Balloon Battle lost');
      }
      return;
    }
    
    // Mini-game behavior
    if (victory) {
      const bonusDamage = Math.floor(stats.correctWords * 3) + (stats.balloonsLost === 0 ? 50 : 0);
      battleSounds.celebrationSound();
      const newHp = Math.max(0, enemyHpRef.current - bonusDamage);
      enemyHpRef.current = newHp;
      setEnemyHp(newHp);
      setTotalDamage(prev => prev + bonusDamage);
    } else {
      setPlayerHp(prev => Math.max(0, prev - 30));
    }
    setBatchStartIndex(prev => prev + barrageWords.length);
    returnToReading();
  }, [barrageWords.length, returnToReading, battleMode, triggerVictory, triggerDefeat]);
  
  // Handle Goblin Horde complete (mini goblin attack mini-game in Classic mode)
  // UPDATED: Syncs enemyHpRef for terminal state detection in returnToReading
  const handleGoblinHordeComplete = useCallback((result: { success: boolean; wordsSpoken: number; totalWords: number }) => {
    console.log('[RPGBattle] Goblin Horde complete:', result);
    const bonusDamage = result.wordsSpoken * 8;
    if (bonusDamage > 0) {
      battleSounds.celebrationSound();
      const newHp = Math.max(0, enemyHpRef.current - bonusDamage);
      enemyHpRef.current = newHp;
      setEnemyHp(newHp);
      setTotalDamage(prev => prev + bonusDamage);
    }
    setCorrectWords(prev => prev + result.wordsSpoken);
    setWordsRead(prev => prev + result.totalWords);
    setBatchStartIndex(prev => prev + barrageWords.length);
    returnToReading();
  }, [barrageWords.length, returnToReading]);
  
  // Handle Ground Ripple complete (Grog's signature mini-game)
  // UPDATED: Syncs enemyHpRef for terminal state detection in returnToReading
  const handleGroundRippleComplete = useCallback((destroyed: number, missed: number) => {
    console.log('[RPGBattle] Ground Ripple complete:', { destroyed, missed });
    const bonusDamage = destroyed * 12;
    if (bonusDamage > 0) {
      battleSounds.celebrationSound();
      const newHp = Math.max(0, enemyHpRef.current - bonusDamage);
      enemyHpRef.current = newHp;
      setEnemyHp(newHp);
      setTotalDamage(prev => prev + bonusDamage);
    }
    if (missed > 0) {
      setPlayerHp(prev => Math.max(0, prev - missed * 15));
    }
    setCorrectWords(prev => prev + destroyed);
    setWordsRead(prev => prev + destroyed + missed);
    setBatchStartIndex(prev => prev + barrageWords.length);
    returnToReading();
  }, [barrageWords.length, returnToReading]);
  
  // Handle Web Trap complete (Crystal Spider's signature mini-game)
  // UPDATED: Syncs enemyHpRef for terminal state detection in returnToReading
  const handleWebTrapComplete = useCallback((wordsFreed: number, damage: number) => {
    console.log('[RPGBattle] Web Trap complete:', { wordsFreed, damage });
    const bonusDamage = wordsFreed * 10;
    if (bonusDamage > 0) {
      battleSounds.celebrationSound();
      const newHp = Math.max(0, enemyHpRef.current - bonusDamage);
      enemyHpRef.current = newHp;
      setEnemyHp(newHp);
      setTotalDamage(prev => prev + bonusDamage);
    }
    if (damage > 0) {
      setPlayerHp(prev => Math.max(0, prev - damage));
    }
    setCorrectWords(prev => prev + wordsFreed);
    setWordsRead(prev => prev + barrageWords.length);
    setBatchStartIndex(prev => prev + barrageWords.length);
    returnToReading();
  }, [barrageWords.length, returnToReading]);
  
  // Handle Quick Block complete (enemy attack defense)
  // UPDATED: Syncs enemyHpRef for terminal state detection in returnToReading
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
        const newHp = Math.max(0, enemyHpRef.current - counterDamage);
        enemyHpRef.current = newHp;
        setEnemyHp(newHp);
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
    
    // FIX: Track accuracy for words consumed by quick block
    setCorrectWords(prev => prev + blocked);
    setWordsRead(prev => prev + total);
    // Advance past the words used
    setBatchStartIndex(prev => prev + 3);
    returnToReading();
  }, [returnToReading]);
  
  // Handle mini-game damage
  const handleMiniGameDamage = useCallback((damage: number) => {
    setPlayerHp(prev => Math.max(0, prev - damage));
    triggerScreenShake();
  }, []);

  // === LITERACY FEATURE HANDLERS ===
  
  // Handle power word detection (called after a correct word read)
  const handlePowerWordCheck = useCallback((word: string) => {
    if (!isPowerWord(word)) return;
    const definition = getWordDefinition(word);
    setActivePowerWord({ id: Date.now(), word, definition });
    setCollectedPowerWords(prev => [...prev, word.toLowerCase()]);
    collectedPowerWordsRef.current = [...collectedPowerWordsRef.current, word.toLowerCase()];
    // Bonus gold for power words
    setGoldEarned(prev => prev + 2);
    // Auto-dismiss after 2.5 seconds
    setTimeout(() => setActivePowerWord(null), 2500);
  }, []);

  // Generate context clue data from current story
  const generateContextClue = useCallback((): { sentence: string; blankWord: string; options: string[] } | null => {
    const sentences = (story.passage_text || '').split(/[.!?]+/).filter(s => s.trim().length > 15);
    if (sentences.length < 2) return null;
    
    const sentence = sentences[Math.floor(Math.random() * sentences.length)].trim();
    // Keep the raw word tokens so we can find them in the original sentence even with punctuation
    const wordTokens = sentence.split(/\s+/).filter(w => w.replace(/[^a-zA-Z]/g, '').length >= 4);
    if (wordTokens.length < 3) return null;
    
    const rawToken = wordTokens[Math.floor(Math.random() * wordTokens.length)];
    const blankWord = rawToken.replace(/[^a-zA-Z]/g, '');
    // Generate distractors from other words in passage
    const allWords = (story.passage_text || '').match(/\b[a-zA-Z]{4,}\b/g) || [];
    const uniqueWords = [...new Set(allWords.map(w => w.toLowerCase()))].filter(w => w !== blankWord.toLowerCase());
    const distractors = uniqueWords.sort(() => Math.random() - 0.5).slice(0, 2);
    if (distractors.length < 2) return null;
    
    const options = [blankWord, ...distractors].sort(() => Math.random() - 0.5);
    return { sentence: sentence + '.', blankWord, options };
  }, [story.passage_text]);

  // Generate vocab shield data — uses full WORD_DEFINITIONS from VocabularyTracker
  const generateVocabShield = useCallback((): { word: string; definition: string; distractors: string[] } | null => {
    const definedWords = Object.entries(WORD_DEFINITIONS) as [string, string][];
    if (definedWords.length < 4) return null;
    
    const picked = definedWords[Math.floor(Math.random() * definedWords.length)];
    const otherDefs = definedWords.filter(([w]) => w !== picked[0]).map(([, d]) => d as string);
    const distractors = otherDefs.sort(() => Math.random() - 0.5).slice(0, 2);
    
    return { word: picked[0], definition: picked[1], distractors };
  }, []);

  // Handle vocab shield complete
  const handleVocabShieldComplete = useCallback((correct: boolean, damage: number) => {
    if (correct && damage > 0) {
      const newHp = Math.max(0, enemyHpRef.current - damage);
      enemyHpRef.current = newHp;
      setEnemyHp(newHp);
      setTotalDamage(prev => prev + damage);
      battleSounds.comboSuccess();
    } else {
      // Boss counter-attacks
      setPlayerHp(prev => Math.max(0, prev - 15));
      triggerScreenShake();
    }
    setVocabShieldData(null);
    returnToReading();
  }, [returnToReading]);

  // Handle context clue complete
  const handleContextClueComplete = useCallback((correct: boolean, damage: number) => {
    if (correct && damage > 0) {
      const newHp = Math.max(0, enemyHpRef.current - damage);
      enemyHpRef.current = newHp;
      setEnemyHp(newHp);
      setTotalDamage(prev => prev + damage);
    } else {
      setPlayerHp(prev => Math.max(0, prev - 10));
      triggerScreenShake();
    }
    setContextClueData(null);
    returnToReading();
  }, [returnToReading]);

  // Handle boss gate complete
  const handleBossGateComplete = useCallback((score: number, total: number, bonusXp: number, bonusGold: number) => {
    if (score > 0) {
      // Correct - kill the boss!
      setXpEarned(prev => prev + bonusXp);
      setGoldEarned(prev => prev + bonusGold);
      enemyHpRef.current = 0;
      setEnemyHp(0);
      battleSounds.celebrationSound();
      // FIXED: Explicitly trigger victory since phase is 'boss_gate', not 'reading'/'combat'
      triggerVictory('Boss gate answered correctly — final blow!');
    } else {
      // Wrong - boss heals 15%
      const healAmount = Math.floor(enemy.maxHp * 0.15);
      const newHp = Math.min(enemy.maxHp, enemyHpRef.current + healAmount);
      enemyHpRef.current = newHp;
      setEnemyHp(newHp);
      setBossGateTriggered(false); // Allow re-trigger
      returnToReading();
    }
  }, [enemy.maxHp, returnToReading, triggerVictory]);

  // Check for vocab shield / context clue triggers at HP thresholds
  // These piggyback on the existing HP-based mini-game system
  const checkLiteracyMiniGame = useCallback(() => {
    if (phase !== 'reading' || battleMode !== 'classic') return;
    
    const hpPercent = (enemyHpRef.current / enemy.maxHp) * 100;
    
    // Boss gate at 25% HP for boss/elite enemies
    if (!bossGateTriggered && hpPercent <= 25 && hpPercent > 0 && 
        (enemy.type === 'boss' || enemy.type === 'final_boss' || enemy.type === 'elite')) {
      setBossGateTriggered(true);
      setEnemyAbilityMessage(`${enemy.name} ${getStoredTheme() === 'agent' ? 'deploys FIREWALL BARRIER!' : 'raises a LAST STAND BARRIER!'}`);
      battleSounds.miniGameStart();
      setTimeout(() => {
        setEnemyAbilityMessage(null);
        setPhaseSafe('boss_gate', 'boss gate trigger');
      }, 1200);
      return;
    }
    
    // Vocab shield at 65% HP for boss/elite (only once)
    if (hpPercent <= 65 && hpPercent > 60 && !triggeredThresholds.has(65) &&
        (enemy.type === 'boss' || enemy.type === 'final_boss' || enemy.type === 'elite')) {
      const shieldData = generateVocabShield();
      if (shieldData) {
        setTriggeredThresholds(prev => new Set([...prev, 65]));
        setVocabShieldData(shieldData);
        setEnemyAbilityMessage(`${enemy.name} ${getStoredTheme() === 'agent' ? 'activates ENCRYPTION!' : 'activates WORD SHIELD!'}`);
        battleSounds.miniGameStart();
        setTimeout(() => {
          setEnemyAbilityMessage(null);
          setPhaseSafe('vocab_shield', 'vocab shield trigger');
        }, 1000);
        return;
      }
    }
    
    // Context clue at 40% HP (only once)
    if (hpPercent <= 40 && hpPercent > 35 && !triggeredThresholds.has(40)) {
      const clueData = generateContextClue();
      if (clueData) {
        setTriggeredThresholds(prev => new Set([...prev, 40]));
        setContextClueData(clueData);
        setEnemyAbilityMessage(`${enemy.name} ${getStoredTheme() === 'agent' ? 'jams COMMS SIGNAL!' : 'casts WORD FOG!'}`);
        battleSounds.miniGameStart();
        setTimeout(() => {
          setEnemyAbilityMessage(null);
          setPhaseSafe('context_clue', 'context clue trigger');
        }, 1000);
        return;
      }
    }
  }, [phase, battleMode, enemy, bossGateTriggered, triggeredThresholds, generateVocabShield, generateContextClue, setPhaseSafe]);

  // Call literacy mini-game check when enemyHp changes
  useEffect(() => {
    if (battleMode === 'classic' && phase === 'reading') {
      checkLiteracyMiniGame();
    }
  }, [enemyHp, battleMode, phase, checkLiteracyMiniGame]);

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
      const isAgent = getStoredTheme() === 'agent';
      if (isAgent) {
        const agentAttacks: Record<string, string> = {
          minion: 'deploys PIPE BARRAGE!',
          guard: 'fires SUPPRESSION VOLLEY!',
          elite: 'uploads MALWARE SWARM!',
          boss: 'activates SCORCHED EARTH PROTOCOL!',
          final_boss: 'activates SCORCHED EARTH PROTOCOL!',
        };
        const msg = agentAttacks[currentEnemyType] || 'launches CYBER ASSAULT!';
        setEnemyAbilityMessage(`${enemy.name} ${msg}`);
      } else {
        setEnemyAbilityMessage(`${enemy.name} summons WORD PRISON!`);
      }
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
    setEnemyAbilityMessage(getStoredTheme() === 'agent' ? `${enemy.name} deploys DRONE SWARM!` : `${enemy.name} summons BEAST SWARM!`);
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
    setWordsRead(prev => prev + destroyed + missed);
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
      const isAgent = getStoredTheme() === 'agent';
      const heroLines = isAgent ? agentHeroDialogue : heroDialogue;
      const companionLines = isAgent ? agentCompanionDialogue : wizardDialogue;
      if (currentSpeaker === 'hero') {
        return heroLines.intro[dialogueIndex % heroLines.intro.length];
      } else if (currentSpeaker === 'wizard') {
        return companionLines.intro[dialogueIndex % companionLines.intro.length];
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

  // Calculate word damage — PATENT-CRITICAL: based on word length, reading speed, streak, and session accuracy
  // No random component — all damage is deterministic from reading performance
  const calculateDamage = useCallback((wordLength: number, currentStreak: number, responseTimeMs?: number, sessionAccuracy?: number): { damage: number; speedTier: 'fast' | 'normal' | 'slow'; isCritical: boolean; accuracyMultiplier: number } => {
    let baseDamage = Math.max(8, wordLength * 3);
    const streakBonus = Math.floor(currentStreak / 2) * 5;
    
    // SPEED BONUS: Based on response time (ms between word appearing and correct speech)
    let speedBonus = 0;
    let speedTier: 'fast' | 'normal' | 'slow' = 'normal';
    let isCritical = false;
    
    if (responseTimeMs !== undefined && responseTimeMs > 0) {
      if (responseTimeMs < 1500) {
        speedBonus = 15; // Fast reader — critical hit!
        speedTier = 'fast';
        isCritical = true;
      } else if (responseTimeMs < 3000) {
        speedBonus = 8; // Good pace
        speedTier = 'normal';
      } else {
        speedBonus = 0; // Slow — no bonus
        speedTier = 'slow';
      }
    }
    
    // ACCURACY MULTIPLIER: Based on session accuracy (correctWords / wordsRead)
    let accuracyMultiplier = 1.0;
    if (sessionAccuracy !== undefined) {
      if (sessionAccuracy >= 0.90) {
        accuracyMultiplier = 1.2; // 90%+ accuracy = 20% damage boost
      } else if (sessionAccuracy >= 0.75) {
        accuracyMultiplier = 1.1; // 75-89% = 10% boost
      }
    }
    
    // Apply debuff if active
    if (isDebuffed) {
      baseDamage = Math.floor(baseDamage * 0.7);
    }
    
    const totalDamage = Math.floor((baseDamage + streakBonus + speedBonus) * accuracyMultiplier);
    
    return { damage: totalDamage, speedTier, isCritical, accuracyMultiplier };
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
    hasManualSpellRef.current = true;
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
        setPhaseSafe('reading', 'heal complete');
        setCurrentCommand('read');
        setIsPlayerTurn(true);
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
      case 'data_burst':
        battleSounds.lightningCrack();
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
        setPhaseSafe('reading', 'spell complete');
        setCurrentCommand('read'); // Auto-switch to Read after spell
        setIsPlayerTurn(true);
      }, 600);
    }, 400);
  }, [wizardMp, playerCharacter.maxHp]);

  // Handle item usage
  const handleUseItem = useCallback((item: Item) => {
    const itemKey = item.id as InventoryKey;
    if (!inventory[itemKey] || inventory[itemKey] <= 0) return;
    
    setInventory(prev => ({ ...prev, [itemKey]: prev[itemKey] - 1 }));
    
    if (item.effect === 'heal_hp') {
      setPlayerHp(prev => Math.min(playerCharacter.maxHp, prev + item.value));
      // Clear poison on healing
      setIsPoisoned(false);
      setPoisonDamage(0);
    } else if (item.effect === 'restore_mp') {
      setWizardMp(prev => Math.min(50, prev + item.value));
    }
  }, [inventory]);

  // Enemy turn logic - with failsafe to prevent stuck state
  // UPDATED: Uses setPhaseSafe and scheduleTimeout for terminal state safety
  const triggerEnemyTurn = useCallback(() => {
    // FAILSAFE: If no abilities, skip enemy turn entirely
    if (!enemy.specialAbilities || enemy.specialAbilities.length === 0) {
      console.log('[RPGBattle] No enemy abilities, skipping enemy turn');
      return;
    }
    
    // Don't start enemy turn if game is over
    if (phaseRef.current === 'victory' || phaseRef.current === 'defeat') {
      console.log('[RPGBattle] Enemy turn blocked - game already over');
      return;
    }
    
    console.log('[RPGBattle] Starting enemy turn');
    setPhaseSafe('enemy_turn', 'triggerEnemyTurn');
    setIsPlayerTurn(false);
    
    // Pick a random ability
    const ability = enemy.specialAbilities[Math.floor(Math.random() * enemy.specialAbilities.length)];
    setEnemyAbilityMessage(`${enemy.name} uses ${ability.name}!`);
    
    scheduleTimeout(() => {
      // Check terminal state before proceeding
      if (phaseRef.current === 'victory' || phaseRef.current === 'defeat') return;
      
      setEnemyAttacking(true);
      
      scheduleTimeout(() => {
        // Check terminal state before proceeding
        if (phaseRef.current === 'victory' || phaseRef.current === 'defeat') return;
        
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
        
        scheduleTimeout(() => {
          // Check terminal state before returning to reading
          if (phaseRef.current === 'victory' || phaseRef.current === 'defeat') return;
          
          setHeroTakingDamage(false);
          setEnemyAbilityMessage(null);
          console.log('[RPGBattle] Enemy turn complete, returning to reading');
          setPhaseSafe('reading', 'enemy turn complete');
          setIsPlayerTurn(true);
        }, 600);
      }, 400);
    }, 1000);
  }, [enemy, setPhaseSafe, scheduleTimeout]);
  
  // FAILSAFE: Force return to reading if stuck in enemy_turn for too long
  // UPDATED: Uses setPhaseSafe to respect terminal states
  useEffect(() => {
    if (phase === 'enemy_turn') {
      const failsafe = scheduleTimeout(() => {
        // Check terminal state before forcing
        if (phaseRef.current === 'victory' || phaseRef.current === 'defeat') {
          console.log('[RPGBattle] Failsafe skipped - game already over');
          return;
        }
        console.warn('[RPGBattle] Enemy turn failsafe triggered - forcing return to reading');
        setEnemyAbilityMessage(null);
        setEnemyAttacking(false);
        setHeroTakingDamage(false);
        setPhaseSafe('reading', 'failsafe');
        setIsPlayerTurn(true);
      }, 6000); // 6 second failsafe
      return () => clearTimeout(failsafe);
    }
  }, [phase, scheduleTimeout, setPhaseSafe]);

  // Handle first-attempt miss (called immediately when miss is finalized, for accuracy tracking)
  // This counts the miss toward wordsRead immediately, before user decides Try Again or Continue
  const handleMiss = useCallback((spokenWord: string, wordIndex: number) => {
    const globalIndex = batchStartIndex + wordIndex;
    
    // Only count if not already counted
    if (!countedWordIndicesRef.current.has(globalIndex)) {
      countedWordIndicesRef.current.add(globalIndex);
      wordsReadRef.current += 1;
      setWordsRead(prev => prev + 1);
      // Reset streak on first miss (accuracy rigor)
      streakRef.current = 0;
      setStreak(0);
      console.log('[RPGBattle] handleMiss: Counted miss immediately', { globalIndex, spokenWord });
    }
  }, [batchStartIndex]);

  // Handle word result from RPGWordReader
  // wordIndex is 0-4 within the current batch
  const handleWordResult = useCallback((correct: boolean, spokenWord: string, wordIndex: number, responseTimeMs?: number) => {
    // Calculate the global index in the full words array
    const globalIndex = batchStartIndex + wordIndex;
    const word = words[globalIndex] || "";
    
    // Phoneme tracking: decompose word and accumulate per-phoneme accuracy
    try {
      const pronunciations = getIPAPronunciation(word);
      const phonemes = pronunciations[0] || [];
      for (const phoneme of phonemes) {
        if (!phonemeAccumulatorRef.current[phoneme]) {
          phonemeAccumulatorRef.current[phoneme] = { correct: 0, total: 0 };
        }
        phonemeAccumulatorRef.current[phoneme].total++;
        if (correct) {
          phonemeAccumulatorRef.current[phoneme].correct++;
        }
      }
    } catch (e) {
      console.warn('[RPGBattle] Phoneme tracking error (non-blocking):', e);
    }
    
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
    
    // Only increment wordsRead if NOT already counted by onMiss
    // This prevents double-counting when user clicks "Continue" after a miss
    if (!countedWordIndicesRef.current.has(globalIndex)) {
      countedWordIndicesRef.current.add(globalIndex);
      wordsReadRef.current += 1;
      setWordsRead(prev => prev + 1);
    }
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
      const newStreak = streakRef.current + 1;
      streakRef.current = newStreak;
      setStreak(newStreak);
      correctWordsRef.current += 1;
      setCorrectWords(prev => prev + 1);
      
      // Power word detection - show loot drop overlay
      handlePowerWordCheck(word);
      if (newStreak > longestStreakRef.current) {
        longestStreakRef.current = newStreak;
        setLongestStreak(newStreak);
      }

      // Calculate session accuracy for damage multiplier
      const currentCorrect = correctWordsRef.current;
      const currentWordsRead = wordsReadRef.current;
      const sessionAccuracy = currentWordsRead > 0 ? currentCorrect / currentWordsRead : 1.0;
      
      // Calculate damage using patent-critical formula: word length + speed + streak + accuracy
      const damageResult = calculateDamage(word.length || 5, newStreak, responseTimeMs, sessionAccuracy);
      let baseDamage = Math.floor(damageResult.damage * enemy.wordDamageMultiplier);
      
      // MASTERY BONUS: Check cross-session DB data + current-battle words
      const cleanedWord = word.toLowerCase().replace(/[^a-z]/g, '');
      const dbCount = knownWordsRef.current[cleanedWord] ?? 0;
      const sessionCount = collectedPowerWords.filter(w => w === cleanedWord).length;
      const totalCount = dbCount + sessionCount;
      
      if (totalCount >= 3) {
        // Mastered word — 1.5x damage
        baseDamage = Math.floor(baseDamage * 1.5);
        setWordMasteryBonus({ word: cleanedWord, multiplier: 1.5 });
        setComboAnnouncement(getStoredTheme() === 'agent' ? '🎯 INTEL DECODED! ×1.5' : '⭐ WORD MASTERED! ×1.5');
        setComboPowerLevel('ultra');
        setTimeout(() => { setComboAnnouncement(null); setWordMasteryBonus(null); }, 1200);
      } else if (totalCount >= 1) {
        // Previously seen — 1.2x damage
        baseDamage = Math.floor(baseDamage * 1.2);
        setWordMasteryBonus({ word: cleanedWord, multiplier: 1.2 });
        setTimeout(() => setWordMasteryBonus(null), 800);
      }
      
      // Update speed bonus HUD indicator
      if (responseTimeMs !== undefined) {
        setSpeedBonusFlash({ tier: damageResult.speedTier, timeMs: responseTimeMs });
        setTimeout(() => setSpeedBonusFlash(null), 1200);
      }
      
      // Update accuracy tier HUD
      setAccuracyTier({ multiplier: damageResult.accuracyMultiplier, percent: Math.round(sessionAccuracy * 100) });
      
      // ELARA-SPECIFIC: 5-word charge system for plasma barrage (3x damage)
      let actualDamage = baseDamage;
      let isElaraBarrage = false;
      
      if (selectedCharacter === 'elara' || selectedCharacter === 'cipher') {
        const newChargeCount = elaraChargeRef.current + 1;
        elaraChargeRef.current = newChargeCount;
        setElaraChargeCount(newChargeCount);
        
        if (newChargeCount < 5) {
          // Charging - no damage yet, just count
          actualDamage = 0;
          setDamageAmount(0);
          
          // Show charging indicator
          const isAgentTheme = getStoredTheme() === 'agent';
          setComboAnnouncement(isAgentTheme ? `💻 COMPILING ${newChargeCount}/5` : `⚡ CHARGING ${newChargeCount}/5`);
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
          const isAgentTheme = getStoredTheme() === 'agent';
          setComboAnnouncement(isAgentTheme ? '💻 DATA BURST DEPLOYED! ×3 💻' : '⚡ PLASMA BARRAGE! ×3 ⚡');
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
        setActiveSpell(attackType);
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
          
          // Add floating damage for big hits (Elara barrage or speed crits)
          if (isElaraBarrage || damageResult.isCritical) {
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
      if (selectedCharacter !== 'elara' && selectedCharacter !== 'cipher' && !hasManualSpellRef.current) {
        const types: ('fire' | 'ice' | 'lightning' | 'slash')[] = ['slash', 'fire', 'ice', 'lightning'];
        setAttackType(types[Math.min(Math.floor(newStreak / 3), types.length - 1)]);
      }
    } else {
      setStreak(0);
      streakRef.current = 0;
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
  }, [words, batchStartIndex, enemy, calculateDamage, isPoisoned, poisonDamage, isDebuffed, debuffTurns, attackType, selectedCharacter]);
  
  // Handle coin collection complete
  const handleCoinCollectionComplete = useCallback(() => {
    setGoldEarned(prev => prev + pendingGold);
    setXpEarned(prev => prev + pendingXp);
    setShowCoinDrop(false);
    setPendingGold(0);
    setPendingXp(0);
  }, [pendingGold, pendingXp]);
  
  // Handle retry success - heal player HP by 12.5% of enemy attack
  const handleRetrySuccess = useCallback((wordIndex: number) => {
    const healAmount = Math.floor(enemy.attack * 0.125);
    if (healAmount > 0) {
      setPlayerHp(prev => Math.min(playerCharacter.maxHp, prev + healAmount));
      
      // Show floating heal number (green with heart)
      setFloatingDamages(prev => [...prev, {
        id: Date.now(),
        damage: healAmount,
        x: 70 + Math.random() * 10,
        y: 50 + Math.random() * 10,
        isPlayer: true,
        isCritical: true // Makes it green/positive
      }]);
      
      // Play healing sound
      battleSounds.healingChime();
      
      console.log('[RPGBattle] Retry success - healed', healAmount, 'HP');
    }
  }, [enemy.attack, playerCharacter.maxHp]);
  
  // Handle spell effect complete
  const handleSpellComplete = useCallback(() => {
    setShowSpellEffect(false);
    setActiveSpell(null);
  }, []);

  // Check for phase transitions - handle multi-enemy
  // CRITICAL: Uses triggerVictory/triggerDefeat for terminal states
  useEffect(() => {
    // Enemy death check
    if (enemyHp <= 0 && phase !== 'victory' && phase !== 'defeat' && phase !== 'enemy_transition') {
      // Check if there are more enemies
      if (currentEnemyIndex < enemyQueue.length - 1) {
        // Transition to next enemy
        console.log('[RPGBattle] Enemy HP useEffect: transitioning to next enemy');
        setDefeatedEnemy(enemy);
        setPhaseSafe('enemy_transition', 'enemy HP useEffect');
      } else {
        triggerVictory('Enemy HP reached 0 (useEffect)');
      }
    }
    
    // Player death check
    if (playerHp <= 0 && phase !== 'defeat' && phase !== 'victory') {
      triggerDefeat('Player HP reached 0');
    }
  }, [enemyHp, playerHp, phase, currentEnemyIndex, enemyQueue.length, enemy, triggerVictory, triggerDefeat, setPhaseSafe]);

  // Handle enemy transition complete
  const handleTransitionComplete = useCallback(() => {
    const nextIndex = currentEnemyIndex + 1;
    setCurrentEnemyIndex(nextIndex);
    const nextEnemyType = enemyQueue[nextIndex];
    const theme = getStoredTheme();
    const nextEnemy = theme === 'agent'
      ? (nextEnemyType === 'boss' || nextEnemyType === 'final_boss' ? getAgentBossForWorld(worldNumber) : getAgentEnemy(nextEnemyType))
      : getEnemyForBattle(nextEnemyType);
    setEnemyHp(nextEnemy.maxHp);
    // Reset random mini-game triggers for the new enemy
    setTriggeredMiniGames(new Set());
    setTriggeredThresholds(new Set()); // Reset HP-based thresholds for new enemy
    setLastMiniGameCheck(0);
    setLastAttackCheck(0); // Reset attack check for new enemy
    setDefeatedEnemy(null);
    hasManualSpellRef.current = false;
    setPhase('intro');
    setDialogueIndex(0);
    setCurrentSpeaker('enemy');
  }, [currentEnemyIndex, enemyQueue]);

  // Track battle start time for duration calculation
  const battleStartTime = useRef(Date.now());
  
  // CRITICAL: Update student_reading_stats using shared atomic utility
  
  // Handle battle end - also saves reading session for teacher visibility
  const handleBattleEnd = useCallback(async (victory: boolean) => {
    const finalXpEarned = victory ? 
      Math.floor(100 + correctWords * 5 + longestStreak * 10 + totalDamage * 0.5) :
      Math.floor(correctWords * 2);
    
    // Calculate battle duration and WPM
    const durationSeconds = Math.max(1, (Date.now() - battleStartTime.current) / 1000);
    const wpm = Math.round((wordsRead / durationSeconds) * 60);
    // CRITICAL: Cap accuracy at 100% to fix data corruption bug
    const accuracyPercent = wordsRead > 0 ? Math.min(100, Math.round((correctWords / wordsRead) * 100)) : 0;
    
    // DEBUG: Log final accuracy breakdown
    console.log('[RPGBattle] 📊 FINAL ACCURACY DEBUG:', {
      correctWords,
      wordsRead,
      accuracy: accuracyPercent,
      longestStreak,
      totalDamage,
      formula: `${correctWords}/${wordsRead} = ${wordsRead > 0 ? (correctWords/wordsRead*100).toFixed(1) : 0}%`,
    });
    
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
          phonemeScores: Object.fromEntries(
            Object.entries(phonemeAccumulatorRef.current).map(
              ([phoneme, { correct, total }]) => [phoneme, total > 0 ? Math.round((correct / total) * 100) : 0]
            )
          ),
          includeSpeakingData: true,
        });
        console.log('[RPGBattle] ML training data saved to aura_records');

        // Trigger Q-learning update so the adaptive loop closes in real-time
        const phonemePerformance = Object.entries(phonemeAccumulatorRef.current).flatMap(
          ([phoneme, { correct, total }]) => {
            const results = [];
            for (let i = 0; i < total; i++) {
              results.push({ phoneme, correct: i < correct, word: '' });
            }
            return results;
          }
        );

        if (phonemePerformance.length > 0) {
          const masteredPhonemes = Object.entries(phonemeAccumulatorRef.current)
            .filter(([_, { correct, total }]) => total > 0 && (correct / total) >= 0.85)
            .map(([p]) => p);
          const strugglingPhonemes = Object.entries(phonemeAccumulatorRef.current)
            .filter(([_, { correct, total }]) => total > 0 && (correct / total) < 0.70)
            .map(([p]) => p);

          await triggerQLearningUpdate(
            studentId,
            phonemePerformance,
            masteredPhonemes,
            strugglingPhonemes,
            worldNumber || 1
          );
          console.log('[RPGBattle] Q-learning updated with', phonemePerformance.length, 'phoneme observations');
        }
        
        // CRITICAL: Sync to main student_reading_stats table (atomic RPC)
        await updateSharedReadingStats(studentId, { wordsRead, xpEarned: finalXpEarned });
      } catch (err) {
        console.error('[RPGBattle] Error saving reading data:', err);
      }
    }

    onComplete(victory, {
      wordsRead,
      correctWords,
      longestStreak,
      damageDealt: totalDamage,
      xpEarned: finalXpEarned,
      goldEarned, // NEW: Pass gold to parent for wallet sync
    });
  }, [correctWords, longestStreak, totalDamage, wordsRead, onComplete, studentId, story, battleMode, saveToAuraRecords, triggerQLearningUpdate, goldEarned]);

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
  
  // Calculate accuracy for victory check
  const currentAccuracy = wordsRead > 0 ? (correctWords / wordsRead) : 0;
  
  // VICTORY CONDITIONS:
  // 1. Enemy HP reaches 0 at any point = Victory
  // 2. All words read + accuracy >= 80% = Victory (regardless of enemy HP)
  // 3. All words read + accuracy < 80% = Defeat (try again)
  // CRITICAL: Uses triggerVictory/triggerDefeat to prevent race conditions
  useEffect(() => {
    // Don't do anything if already in terminal state
    if (phaseRef.current === 'victory' || phaseRef.current === 'defeat') return;
    
    // Also skip if transitioning
    if (phase === 'enemy_transition') return;
    
    // Check victory by enemy death - from ANY phase
    if (enemyHp <= 0) {
      if (isFinalEnemy) {
        triggerVictory('Enemy HP = 0 (main useEffect)');
      } else {
        console.log('[RPGBattle] Enemy defeated, transitioning to next enemy');
        setDefeatedEnemy(enemy);
        setPhaseSafe('enemy_transition', 'allWordsRead useEffect');
      }
      return;
    }
    
    // Check victory/defeat by completing all words - 80%+ accuracy = win, <80% = defeat
    if (allWordsRead) {
      console.log('[RPGBattle] All words read! Checking accuracy:', { correctWords, wordsRead, accuracy: currentAccuracy });
      if (currentAccuracy >= 0.8) {
        triggerVictory(`All words read with ${Math.round(currentAccuracy * 100)}% accuracy`);
      } else {
        triggerDefeat(`All words read with only ${Math.round(currentAccuracy * 100)}% accuracy (need 80%)`);
      }
    }
  }, [allWordsRead, currentAccuracy, phase, enemyHp, isFinalEnemy, enemy, correctWords, wordsRead, triggerVictory, triggerDefeat, setPhaseSafe]);

  // If character select is shown for Classic mode, render it instead of battle
  if (showCharacterSelect && battleMode === 'classic') {
    return (
      <RPGCharacterSelect onSelect={handleCharacterSelect} />
    );
  }

  return (
    <motion.div 
      className="fixed inset-x-0 top-0 h-[100dvh] z-50 overflow-hidden"
      animate={screenShake ? { x: [-5, 5, -5, 5, 0] } : {}}
      transition={{ duration: 0.3 }}
    >
      {/* Battle Background */}
      <RPGBattleBackground enemyType={currentEnemyType} worldNumber={worldNumber} />

      {/* Enemy Transition Overlay */}
      <RPGEnemyTransition
        isActive={phase === 'enemy_transition'}
        defeatedEnemy={defeatedEnemy}
        nextEnemy={currentEnemyIndex < enemyQueue.length - 1 ? (() => { const t = getStoredTheme(); const ne = enemyQueue[currentEnemyIndex + 1]; return t === 'agent' ? (ne === 'boss' || ne === 'final_boss' ? getAgentBossForWorld(worldNumber) : getAgentEnemy(ne)) : getEnemyForBattle(ne); })() : null}
        onTransitionComplete={handleTransitionComplete}
        theme={getStoredTheme() || 'classic'}
      />

      {/* Spell Effects Overlay */}
      {activeSpell === 'data_burst' ? (
        <RPGDataBurstEffect
          isActive={showSpellEffect}
          onComplete={handleSpellComplete}
        />
      ) : (
        <RPGSpellEffects
          spellType={activeSpell}
          isActive={showSpellEffect}
          onComplete={handleSpellComplete}
        />
      )}
      
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
                const newHp = Math.max(0, enemyHpRef.current - damage);
                enemyHpRef.current = newHp; // Sync ref FIRST for returnToReading
                setEnemyHp(newHp);
                setTotalDamage(prev => prev + damage);
              }
              // FIX: Track both correctWords AND wordsRead to prevent accuracy inflation
              const wordsCorrect = Math.round((shieldStrength / 100) * barrageWords.length);
              setCorrectWords(prev => prev + wordsCorrect);
              setWordsRead(prev => prev + barrageWords.length);
              setBatchStartIndex(prev => prev + barrageWords.length);
              returnToReading();
            }}
          />
        )}
        {phase === 'rhyme_chain' && (
          <RPGWordCannon
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
              const newHp = Math.max(0, enemyHpRef.current - completed * 12);
              enemyHpRef.current = newHp;
              setCorrectWords(prev => prev + completed);
              setWordsRead(prev => prev + completed + failed);
              setTotalDamage(prev => prev + completed * 12);
              setEnemyHp(newHp);
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
              const newHp = Math.max(0, enemyHpRef.current - caught * 10);
              enemyHpRef.current = newHp;
              setCorrectWords(prev => prev + caught);
              setWordsRead(prev => prev + caught + missed);
              setTotalDamage(prev => prev + caught * 10);
              setEnemyHp(newHp);
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
              const newHp = Math.max(0, enemyHpRef.current - revealed * 15);
              enemyHpRef.current = newHp;
              setCorrectWords(prev => prev + revealed);
              setWordsRead(prev => prev + revealed + failed);
              setTotalDamage(prev => prev + revealed * 15);
              setEnemyHp(newHp);
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
              const newHp = Math.max(0, enemyHpRef.current - freed * 14);
              enemyHpRef.current = newHp;
              setCorrectWords(prev => prev + freed);
              setWordsRead(prev => prev + freed + frozen);
              setTotalDamage(prev => prev + freed * 14);
              setEnemyHp(newHp);
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
              const newHp = Math.max(0, enemyHpRef.current - struck * 12);
              enemyHpRef.current = newHp;
              setCorrectWords(prev => prev + struck);
              setWordsRead(prev => prev + struck + missed);
              setTotalDamage(prev => prev + struck * 12);
              setEnemyHp(newHp);
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
              const newHp = Math.max(0, enemyHpRef.current - saved * 16);
              enemyHpRef.current = newHp;
              setCorrectWords(prev => prev + saved);
              setWordsRead(prev => prev + saved + consumed);
              setTotalDamage(prev => prev + saved * 16);
              setEnemyHp(newHp);
              setBatchStartIndex(prev => prev + barrageWords.length);
              returnToReading();
            }}
            onWordHit={(damage) => setPlayerHp(prev => Math.max(0, prev - damage))}
          />
        )}
        {/* GROG'S SIGNATURE: Ground Ripple - word mountains roll toward heroes */}
        {phase === 'ground_ripple' && (
          <RPGGroundRipple
            words={barrageWords}
            onComplete={handleGroundRippleComplete}
            onWordHit={handleMiniGameDamage}
          />
        )}
        {/* CRYSTAL SPIDER'S SIGNATURE: Web Trap - speak words to free them */}
        {phase === 'web_trap' && (
          <RPGWebTrap
            words={barrageWords}
            onComplete={handleWebTrapComplete}
            onDamage={handleMiniGameDamage}
          />
        )}
        {/* LITERACY FEATURES */}
        {phase === 'vocab_shield' && vocabShieldData && (
          <RPGVocabShield
            vocabWord={vocabShieldData}
            enemyName={enemy.name}
            onComplete={handleVocabShieldComplete}
          />
        )}
        {phase === 'context_clue' && contextClueData && (
          <RPGContextClue
            clue={contextClueData}
            enemyName={enemy.name}
            onComplete={handleContextClueComplete}
          />
        )}
        {phase === 'boss_gate' && (
          <ComprehensionQuiz
            isOpen={true}
            storyTitle={story.title}
            storyText={story.passage_text || ''}
            variant="boss_gate"
            enemyName={enemy.name}
            onComplete={handleBossGateComplete}
            onSkip={() => {
              setBossGateTriggered(false);
              returnToReading();
            }}
          />
        )}
      </AnimatePresence>

      {/* Power Word Loot Drop */}
      <RPGWordPowerUp powerWord={activePowerWord} />

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
          <div className="w-full max-w-5xl flex items-end justify-between gap-2 md:gap-8">
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
              className="text-2xl md:text-4xl font-black text-white/30 shrink-0"
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
        <div className="bg-black/50 backdrop-blur-sm border-t border-white/10 overflow-y-auto max-h-[60vh] md:max-h-none">
          <div className="max-w-5xl mx-auto p-2 md:p-4">
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
                  className="grid grid-cols-1 md:grid-cols-[200px_1fr_200px] gap-2 md:gap-4"
                >
                  {/* Command Menu - compact row on mobile, full panel on desktop */}
                  <div className="order-2 md:order-none">
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

                   {/* Center: Voice Reading - Fixed height to prevent layout shifts */}
                    <div className="relative min-h-[120px] md:min-h-[200px] space-y-4 overflow-hidden order-1 md:order-none">
                    {currentCommand === 'read' && currentWordBatch.length > 0 && (
                      <>
                        {/* Elara charge indicator */}
                        {(selectedCharacter === 'elara' || selectedCharacter === 'cipher') && elaraChargeCount > 0 && elaraChargeCount < 5 && (
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
                          onRetrySuccess={handleRetrySuccess}
                          onMiss={handleMiss}
                          disabled={currentWordResult !== null || !isPlayerTurn}
                          streak={streak}
                          batchSize={5}
                          enableEchoRetry={true}
                          mode={selectedCharacter === 'elara' || selectedCharacter === 'cipher' ? 'fast' : 'normal'}
                        />
                        
                        {/* Speed & Accuracy Bonus HUD — patent-visible mechanics */}
                        <AnimatePresence>
                          {speedBonusFlash && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.8 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.8 }}
                              className={`flex items-center justify-center gap-2 py-1 px-3 rounded-lg text-sm font-bold ${
                                speedBonusFlash.tier === 'fast'
                                  ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50'
                                  : speedBonusFlash.tier === 'normal'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                              }`}
                            >
                              {speedBonusFlash.tier === 'fast' && <span>⚡ SPEED BONUS!</span>}
                              {speedBonusFlash.tier === 'normal' && <span>✓ Good pace</span>}
                              {speedBonusFlash.tier === 'slow' && <span>🐌 Too slow</span>}
                              <span className="text-xs opacity-75">
                                {(speedBonusFlash.timeMs / 1000).toFixed(1)}s
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        
                        {/* Accuracy tier indicator */}
                        {accuracyTier.percent > 0 && wordsRead >= 3 && (
                          <div className="flex items-center justify-center gap-2 text-xs">
                            <span className={`px-2 py-0.5 rounded ${
                              accuracyTier.multiplier >= 1.2
                                ? 'bg-yellow-500/20 text-yellow-300'
                                : accuracyTier.multiplier >= 1.1
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-slate-500/20 text-slate-400'
                            }`}>
                              {accuracyTier.multiplier >= 1.2 ? '🎯 ' : accuracyTier.multiplier >= 1.1 ? '✨ ' : ''}
                              Accuracy: {accuracyTier.percent}%
                              {accuracyTier.multiplier > 1.0 && ` (×${accuracyTier.multiplier.toFixed(1)})`}
                            </span>
                          </div>
                        )}
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

                  </div>

                  {/* Party Stats - compact on mobile, full on desktop */}
                  <div className="order-3 md:order-none">
                    <RPGPartyStats
                      members={[
                        { 
                          name: playerCharacter.name, 
                          currentHp: playerHp, 
                          maxHp: playerCharacter.maxHp, 
                          isDefending: currentCommand === 'defend',
                          currentMp: (selectedCharacter === 'elara' || selectedCharacter === 'cipher') ? wizardMp : undefined,
                          maxMp: (selectedCharacter === 'elara' || selectedCharacter === 'cipher') ? 50 : undefined,
                        },
                      ]}
                      streak={streak}
                      longestStreak={longestStreak}
                      showCombo={currentWordResult === true}
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
              {phase === 'victory' && (() => {
                const isAgentVictory = getStoredTheme() === 'agent';
                return (
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
                    {isAgentVictory
                      ? <span className="text-6xl">🎯</span>
                      : <Trophy className="h-16 w-16 text-yellow-400" />}
                  </motion.div>
                  <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
                    {isAgentVictory ? 'MISSION COMPLETE' : 'VICTORY!'}
                  </h2>
                  <p className="text-slate-300">
                    {isAgentVictory
                      ? <>Target <span className="text-red-400 font-bold">{enemy.name}</span> neutralized.</>
                      : <>You defeated <span className="text-red-400 font-bold">{enemy.name}</span>!</>}
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
                );
              })()}

              {/* Defeat Screen */}
              {phase === 'defeat' && (() => {
                const isAgentDefeat = getStoredTheme() === 'agent';
                return (
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
                    {isAgentDefeat
                      ? <span className="text-6xl block">⚠️</span>
                      : <Skull className="h-16 w-16 text-red-500 mx-auto" />}
                  </motion.div>
                  <h2 className="text-4xl font-black text-red-500">
                    {isAgentDefeat ? 'MISSION FAILED' : 'DEFEAT'}
                  </h2>
                  <p className="text-slate-300">
                    {isAgentDefeat
                      ? <>{enemy.name} compromised the operation...</>
                      : <>{enemy.name} was too powerful...</>}
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={onBack} className="border-slate-600 text-slate-300">
                      {isAgentDefeat ? 'Return to HQ' : 'Return to Map'}
                    </Button>
                    <Button 
                      onClick={() => window.location.reload()}
                      className="bg-gradient-to-r from-red-500 to-rose-600"
                    >
                      {isAgentDefeat ? 'Retry Mission' : 'Try Again'}
                    </Button>
                  </div>
                </motion.div>
                );
              })()}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

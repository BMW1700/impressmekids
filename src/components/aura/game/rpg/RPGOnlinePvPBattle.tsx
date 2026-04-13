import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, Shield, Sword, Wifi } from "lucide-react";
import { RPGBattleBackground } from "./RPGBattleBackground";
import { RPGCharacter } from "./RPGCharacter";
import { RPGParentControls, ParentAbility } from "./RPGParentControls";
import { RPGWordReader } from "./RPGWordReader";
import { RPGWordBarrage } from "./RPGWordBarrage";
import { RPGFireballDefense } from "./RPGFireballDefense";
import { SoundEffects } from "@/lib/pronunciationPlayer";
import { CuratedStory } from "@/data/curatedStories";
import { heroKnight } from "@/lib/rpgBattleData";
import { supabase } from "@/integrations/supabase/client";
import { LongLoadNotice } from "@/components/system/LongLoadNotice";
import { useAuth } from "@/contexts/AuthContext";
import {
  MULTIPLAYER_ROOM_SNAPSHOT_COLUMNS,
  MultiplayerRoomSnapshot,
} from "./multiplayerRoomTypes";

const battleSounds = new SoundEffects();

interface BattleStats {
  wordsRead: number;
  correctWords: number;
  longestStreak: number;
  damageDealt: number;
  xpEarned: number;
  goldEarned?: number;
}

interface RPGOnlinePvPBattleProps {
  story: CuratedStory;
  studentId: string;
  roomId: string;
  isHost: boolean;
  initialRoomSnapshot?: MultiplayerRoomSnapshot | null;
  worldNumber?: number;
  onBack: () => void;
  onComplete: (victory: boolean, stats: BattleStats) => void;
}

// Full synced game state — mirrors local PvP logic
interface OnlinePvPGameState {
  hostHp: number;
  guestHp: number;
  turn: 'host' | 'guest';
  phase: 'kid_turn' | 'parent_turn' | 'parent_reading' | 'mini_game' | 'host_wins' | 'guest_wins';
  wordIndex: number;
  hostCorrect: number;
  guestCorrect: number;
  hostStreak: number;
  guestStreak: number;
  longestStreak: number;
  totalDamage: number;
  wordsRead: number;
  cooldowns: Record<string, number>;
  pendingAbility?: { id: string; name: string; damage: number; requiresReading: boolean; cooldown: number } | null;
  pendingReadWord?: string | null;
  activeMiniGame?: string | null;
  lastEvent?: { type: string; damage?: number; by: string; message?: string; timestamp: number } | null;
  turnCount: number;
}

const INITIAL_STATE: OnlinePvPGameState = {
  hostHp: 100,
  guestHp: 100,
  turn: 'host',
  phase: 'kid_turn',
  wordIndex: 0,
  hostCorrect: 0,
  guestCorrect: 0,
  hostStreak: 0,
  guestStreak: 0,
  longestStreak: 0,
  totalDamage: 0,
  wordsRead: 0,
  cooldowns: {},
  pendingAbility: null,
  pendingReadWord: null,
  activeMiniGame: null,
  lastEvent: null,
  turnCount: 0,
};

/** Check if a game_state payload is a valid initialized PvP state */
const isValidPvPState = (gs: any): gs is OnlinePvPGameState =>
  gs && typeof gs === 'object' && typeof gs.phase === 'string' && typeof gs.hostHp === 'number';

export const RPGOnlinePvPBattle = ({
  story,
  studentId,
  roomId,
  isHost,
  initialRoomSnapshot = null,
  worldNumber = 1,
  onBack,
  onComplete,
}: RPGOnlinePvPBattleProps) => {
  const { session, isLoading: authLoading } = useAuth();
  const [gs, setGs] = useState<OnlinePvPGameState>(INITIAL_STATE);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>('Loading battle...');
  const [endPhase, setEndPhase] = useState<'victory' | 'defeat' | null>(null);
  const [hostName, setHostName] = useState('Student');
  const [guestName, setGuestName] = useState('Parent');
  const [roomStory, setRoomStory] = useState<string>(story.passage_text);
  const [roomWorldNumber, setRoomWorldNumber] = useState(worldNumber);
  const [initError, setInitError] = useState<string | null>(null);
  const gsRef = useRef(gs);
  const readyRef = useRef(ready);
  const completedRef = useRef(false);
  const hydrateAttemptsRef = useRef(0);

  useEffect(() => { gsRef.current = gs; }, [gs]);
  useEffect(() => { readyRef.current = ready; }, [ready]);

  const updateMessage = useCallback((state: OnlinePvPGameState, hName: string, gName: string) => {
    if (state.phase === 'kid_turn') {
      setMessage(state.turn === 'host' ? `🟢 ${hName}'s turn — Read to attack!` : `🟢 ${hName}'s turn`);
    } else if (state.phase === 'parent_turn') {
      setMessage(`🔴 ${gName}'s turn — Choose an attack!`);
    } else if (state.phase === 'parent_reading') {
      setMessage(`📖 ${gName} must read the word!`);
    } else if (state.phase === 'mini_game') {
      setMessage(`🎮 Mini-game active!`);
    }
  }, []);

  const applyRoomSnapshot = useCallback((room: MultiplayerRoomSnapshot | null | undefined, markReady = false) => {
    if (!room) return false;

    const nextHostName = room.host_name || 'Student';
    const nextGuestName = room.guest_name || 'Parent';

    if (room.host_name) setHostName(room.host_name);
    if (room.guest_name) setGuestName(room.guest_name);
    if (room.story_passage) setRoomStory(room.story_passage);
    if (typeof room.world_number === 'number') setRoomWorldNumber(room.world_number);

    const nextState = room.game_state as any;
    if (!isValidPvPState(nextState)) return false;

    hydrateAttemptsRef.current = 0;
    setInitError(null);
    setGs(nextState);
    if (markReady) setReady(true);
    updateMessage(nextState, nextHostName, nextGuestName);
    return true;
  }, [updateMessage]);

  const storyWords = roomStory.split(/\s+/).filter(w => w.length > 0);

  // Derived state
  const isMyTurn = (isHost && gs.turn === 'host') || (!isHost && gs.turn === 'guest');
  const myHp = isHost ? gs.hostHp : gs.guestHp;
  const opponentHp = isHost ? gs.guestHp : gs.hostHp;
  // Host = kid/student (reads words), Guest = parent (uses abilities)
  const myRole = isHost ? 'kid' : 'parent';

  // ─── Push state to DB with silent-failure detection ───
  const pushState = useCallback(async (newState: OnlinePvPGameState): Promise<boolean> => {
    const status = (newState.phase === 'host_wins' || newState.phase === 'guest_wins') ? 'completed' : 'active';
    const { data, error } = await supabase
      .from('multiplayer_rooms')
      .update({ game_state: newState as any, status })
      .eq('id', roomId)
      .select('id');
    if (error) {
      console.error('[PvP] pushState failed:', error);
      return false;
    }
    if (!data || data.length === 0) {
      console.error('[PvP] pushState: 0 rows updated (RLS blocked). Attempting with fresh session...');
      // Re-check auth
      const { data: session } = await supabase.auth.getSession();
      console.error('[PvP] Current auth uid:', session?.session?.user?.id);
      return false;
    }
    return true;
  }, [roomId]);

  useEffect(() => {
    if (initialRoomSnapshot) {
      applyRoomSnapshot(initialRoomSnapshot, true);
    }
  }, [initialRoomSnapshot, applyRoomSnapshot]);

  // ─── Both host and guest hydrate from pre-seeded game_state ───
  useEffect(() => {
    if (authLoading) return;

    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const hydrateRoom = async (): Promise<boolean> => {
      if (!session?.user?.id) {
        return false;
      }

      const { data, error } = await supabase
        .from('multiplayer_rooms')
        .select(MULTIPLAYER_ROOM_SNAPSHOT_COLUMNS)
        .eq('id', roomId)
        .maybeSingle();

      if (error) {
        console.error('[PvP] hydrateRoom read failed:', error);
        hydrateAttemptsRef.current += 1;
        if (hydrateAttemptsRef.current >= 5 && !cancelled && !readyRef.current) {
          setInitError('The host could not sync the room. Go back and create a new room.');
        }
        return false;
      }
      if (!data || cancelled) {
        hydrateAttemptsRef.current += 1;
        if (hydrateAttemptsRef.current >= 8 && !cancelled && !readyRef.current) {
          setInitError('Battle sync failed before the room finished loading. Please go back and recreate the room.');
        }
        return false;
      }

      if (applyRoomSnapshot(data as unknown as MultiplayerRoomSnapshot, true)) {
        return true;
      }

      hydrateAttemptsRef.current += 1;
      if (hydrateAttemptsRef.current >= 8 && !cancelled && !readyRef.current) {
        setInitError('Battle sync failed before the room finished loading. Please go back and recreate the room.');
      }
      return false;
    };

    const init = async () => {
      if (initialRoomSnapshot) {
        applyRoomSnapshot(initialRoomSnapshot, true);
      }

      const loaded = await hydrateRoom();
      if (loaded || readyRef.current || cancelled) return;

      console.warn('[PvP] game_state not valid on first read, polling...');
      pollInterval = setInterval(async () => {
        if (cancelled) return;
        const ok = await hydrateRoom();
        if (ok && pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
      }, 1500);
    };
    init();

    return () => {
      cancelled = true;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [roomId, authLoading, session?.user?.id, initialRoomSnapshot, applyRoomSnapshot]);

  // ─── Realtime subscription ───
  useEffect(() => {
    if (authLoading || !session?.user?.id) return;

    const channel = supabase
      .channel(`pvp-battle-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'multiplayer_rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          const room = payload.new as unknown as MultiplayerRoomSnapshot;
          const incoming = room.game_state as any;
          if (!applyRoomSnapshot(room, true) || !isValidPvPState(incoming)) return;

          // Sound effects based on lastEvent
          if (incoming.lastEvent) {
            const evt = incoming.lastEvent;
            if (evt.type === 'attack') battleSounds.correctWord();
            else if (evt.type === 'ability') battleSounds.fireWhoosh();
          }

          // Show event message
          if (incoming.lastEvent?.message) {
            setMessage(incoming.lastEvent.message);
          } else {
            updateMessage(incoming, room.host_name || 'Student', room.guest_name || 'Parent');
          }

          // Check win/loss
          if (incoming.phase === 'host_wins') {
            setEndPhase(isHost ? 'victory' : 'defeat');
            if (isHost) battleSounds.victoryFanfare();
          } else if (incoming.phase === 'guest_wins') {
            setEndPhase(!isHost ? 'victory' : 'defeat');
            if (!isHost) battleSounds.victoryFanfare();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId, isHost, authLoading, session?.user?.id, applyRoomSnapshot, updateMessage]);

  // ─── Handle end state ───
  useEffect(() => {
    if (!endPhase || completedRef.current) return;
    completedRef.current = true;
    const isWin = endPhase === 'victory';
    const correct = isHost ? gs.hostCorrect : gs.guestCorrect;
    setTimeout(() => {
      onComplete(isWin, {
        wordsRead: gs.wordsRead,
        correctWords: correct,
        longestStreak: gs.longestStreak,
        damageDealt: gs.totalDamage,
        xpEarned: Math.floor(correct * (isWin ? 5 : 2)),
        goldEarned: isWin ? Math.floor(correct * 2) : 0,
      });
    }, 3000);
  }, [endPhase]);

  // ─── Kid reads a word (host only) ───
  const handleKidWordResult = useCallback((correct: boolean, _spokenWord: string, _wordIndex: number) => {
    if (!isHost) return;

    const s = { ...gsRef.current };
    s.wordsRead += 1;

    if (correct) {
      s.hostCorrect += 1;
      s.hostStreak += 1;
      if (s.hostStreak > s.longestStreak) s.longestStreak = s.hostStreak;

      const damage = 8 + Math.min(s.hostStreak, 5) * 2;
      s.totalDamage += damage;
      s.guestHp = Math.max(0, s.guestHp - damage);
      s.lastEvent = { type: 'attack', damage, by: 'host', message: `⚔️ ${hostName} deals ${damage} damage!`, timestamp: Date.now() };
      s.wordIndex += 1;

      if (s.guestHp <= 0) {
        s.phase = 'host_wins';
      } else if (s.hostCorrect % 5 === 0) {
        // Switch to parent turn
        s.turn = 'guest';
        s.phase = 'parent_turn';
        // Reduce cooldowns
        const cd = { ...s.cooldowns };
        Object.keys(cd).forEach(k => { if (cd[k] > 0) cd[k]--; });
        s.cooldowns = cd;
        s.turnCount += 1;
        s.lastEvent = { type: 'turn_switch', by: 'host', message: `🔴 ${guestName}'s Turn!`, timestamp: Date.now() };
      }
    } else {
      s.hostStreak = 0;
    }

    setGs(s);
    pushState(s);
  }, [isHost, pushState, hostName, guestName]);

  // ─── Parent selects ability (guest only) ───
  const handleParentAbility = useCallback((ability: ParentAbility) => {
    if (!isMyTurn || myRole !== 'parent') return;

    const s = { ...gsRef.current };

    if (ability.type === 'minigame' && ability.miniGame) {
      s.activeMiniGame = ability.miniGame;
      s.phase = 'mini_game';
      s.lastEvent = { type: 'ability', by: 'guest', message: `🎮 ${ability.name}!`, timestamp: Date.now() };
      if (ability.cooldown > 0) s.cooldowns = { ...s.cooldowns, [ability.id]: ability.cooldown };
    } else if (ability.requiresReading) {
      // Parent must read a word for bonus damage
      s.pendingAbility = { id: ability.id, name: ability.name, damage: ability.damage, requiresReading: true, cooldown: ability.cooldown };
      s.pendingReadWord = storyWords[Math.floor(Math.random() * storyWords.length)];
      s.phase = 'parent_reading';
      s.lastEvent = { type: 'ability', by: 'guest', message: `📖 Read the word for bonus damage!`, timestamp: Date.now() };
    } else {
      // Direct damage ability
      const damage = ability.damage;
      s.hostHp = Math.max(0, s.hostHp - damage);
      s.lastEvent = { type: 'ability', damage, by: 'guest', message: `💥 ${guestName} uses ${ability.name} for ${damage} damage!`, timestamp: Date.now() };
      if (ability.cooldown > 0) s.cooldowns = { ...s.cooldowns, [ability.id]: ability.cooldown };

      if (s.hostHp <= 0) {
        s.phase = 'guest_wins';
      } else {
        // Switch back to kid
        s.turn = 'host';
        s.phase = 'kid_turn';
      }
    }

    setGs(s);
    pushState(s);
  }, [isMyTurn, myRole, pushState, storyWords, guestName]);

  // ─── Parent reading result (guest only) ───
  const handleParentReadResult = useCallback((correct: boolean) => {
    if (myRole !== 'parent') return;
    const s = { ...gsRef.current };
    const ability = s.pendingAbility;
    if (!ability) return;

    let damage = ability.damage;
    let msg: string;
    if (correct) {
      damage += 5;
      msg = `💥 ${ability.name} + Reading Bonus = ${damage} damage!`;
    } else {
      msg = `💥 ${ability.name} for ${damage} damage (no bonus)`;
    }

    s.hostHp = Math.max(0, s.hostHp - damage);
    if (ability.cooldown > 0) s.cooldowns = { ...s.cooldowns, [ability.id]: ability.cooldown };
    s.pendingAbility = null;
    s.pendingReadWord = null;
    s.lastEvent = { type: 'ability', damage, by: 'guest', message: msg, timestamp: Date.now() };

    if (s.hostHp <= 0) {
      s.phase = 'guest_wins';
    } else {
      s.turn = 'host';
      s.phase = 'kid_turn';
    }

    setGs(s);
    pushState(s);
  }, [myRole, pushState]);

  // ─── Mini-game completion (rendered on both devices, but only guest pushes result) ───
  const handleMiniGameComplete = useCallback((completed: number, failed: number) => {
    if (myRole !== 'parent') return;

    const s = { ...gsRef.current };
    const kidDamage = failed * 5;
    const bonusDamage = completed * 3;
    if (kidDamage > 0) s.hostHp = Math.max(0, s.hostHp - kidDamage);
    if (bonusDamage > 0) s.guestHp = Math.max(0, s.guestHp - bonusDamage);
    s.activeMiniGame = null;
    s.lastEvent = { type: 'mini_game_end', by: 'guest', message: `🎮 Mini-game done! ${completed} caught, ${failed} missed`, timestamp: Date.now() };

    if (s.hostHp <= 0) {
      s.phase = 'guest_wins';
    } else if (s.guestHp <= 0) {
      s.phase = 'host_wins';
    } else {
      s.turn = 'host';
      s.phase = 'kid_turn';
    }

    setGs(s);
    pushState(s);
  }, [myRole, pushState]);

  // Words for the current position
  const currentStoryWords = storyWords.slice(gs.wordIndex);
  const barrageWords = storyWords.slice(gs.wordIndex, gs.wordIndex + 10);

  // ─── RENDER ───
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden"
    >
      <RPGBattleBackground worldNumber={roomWorldNumber} />

      {/* Top bar */}
      <div className="absolute top-3 left-3 z-[80]">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-white">
          <ArrowLeft className="h-4 w-4 mr-1" /> Exit
        </Button>
      </div>
      <div className="absolute top-3 right-3 z-[80] flex items-center gap-1 text-blue-400 text-xs">
        <Wifi className="h-3 w-3" /> ONLINE PvP
      </div>

      {/* HUD */}
      <div className="absolute top-12 left-0 right-0 z-[60] px-4">
        <div className="flex gap-4 max-w-2xl mx-auto">
          {/* Host (Kid) HP */}
          <div className={`flex-1 p-2 rounded-lg border-2 ${gs.turn === 'host' ? 'border-green-400 bg-green-950/30' : 'border-slate-700 bg-slate-900/50'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-green-300">🦸 {hostName} {isHost ? '(You)' : ''}</span>
              <span className="text-xs text-green-400 ml-auto">{gs.hostHp}/100</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-green-500 to-emerald-400" animate={{ width: `${gs.hostHp}%` }} />
            </div>
          </div>
          <span className="text-white font-black text-xl self-center">VS</span>
          {/* Guest (Parent) HP */}
          <div className={`flex-1 p-2 rounded-lg border-2 ${gs.turn === 'guest' ? 'border-red-400 bg-red-950/30' : 'border-slate-700 bg-slate-900/50'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-red-300">👹 {guestName} {!isHost ? '(You)' : ''}</span>
              <span className="text-xs text-red-400 ml-auto">{gs.guestHp}/100</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-red-500 to-red-400" animate={{ width: `${gs.guestHp}%` }} />
            </div>
          </div>
        </div>
        <div className="text-center mt-1">
          <span className="text-slate-500 text-xs">Turn {gs.turnCount + 1}</span>
        </div>
      </div>

      {/* Message Banner */}
      <AnimatePresence>
        {message && ready && !endPhase && (
          <motion.div key={message} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-32 left-1/2 -translate-x-1/2 z-[70] bg-black/80 px-6 py-3 rounded-xl border border-white/20">
            <p className="text-white font-bold">{message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Characters */}
      <div className="absolute bottom-40 left-[20%] z-[50]">
        <RPGCharacter character={heroKnight} currentHp={gs.hostHp} isAttacking={gs.turn === 'host' && gs.phase === 'kid_turn'} />
      </div>
      <div className="absolute bottom-40 right-[20%] z-[50]">
        <RPGCharacter
          character={{ ...heroKnight, id: 'villain', name: guestName, type: 'enemy', color: '#ef4444' } as any}
          currentHp={gs.guestHp} isEnemy isTakingDamage={gs.turn === 'host'}
        />
      </div>

      {/* ──── Kid's Turn: Word Reader (host device only) ──── */}
      {ready && gs.phase === 'kid_turn' && isHost && (
        <div className="absolute bottom-0 left-0 right-0 z-[70] p-4">
          <RPGWordReader
            words={currentStoryWords}
            onResult={handleKidWordResult}
          />
        </div>
      )}

      {/* ──── Parent's Turn: Ability Cards (guest device only) ──── */}
      {ready && gs.phase === 'parent_turn' && !isHost && (
        <RPGParentControls
          onSelectAbility={handleParentAbility}
          cooldowns={gs.cooldowns}
          parentHp={gs.guestHp}
          parentMaxHp={100}
        />
      )}

      {/* ──── Parent Reading Phase (guest device only) ──── */}
      {ready && gs.phase === 'parent_reading' && gs.pendingReadWord && !isHost && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-0 left-0 right-0 z-[90] bg-gradient-to-t from-red-950/95 to-transparent p-6"
        >
          <div className="max-w-md mx-auto text-center">
            <p className="text-red-300 text-sm font-bold mb-2">🔴 PARENT — Read this word aloud:</p>
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="bg-red-900/60 border-2 border-red-500/50 rounded-2xl p-6 mb-4"
            >
              <p className="text-4xl font-black text-white">{gs.pendingReadWord}</p>
            </motion.div>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => handleParentReadResult(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold px-6"
              >
                ✅ Read Correctly
              </Button>
              <Button
                onClick={() => handleParentReadResult(false)}
                variant="outline"
                className="border-red-500 text-red-300 px-6"
              >
                ❌ Missed It
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ──── Parent Reading Phase — Kid sees word too (host device, read-only) ──── */}
      {ready && gs.phase === 'parent_reading' && gs.pendingReadWord && isHost && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[70]">
          <div className="bg-slate-900/80 border border-red-600/50 rounded-xl px-6 py-4 text-center">
            <p className="text-red-300 text-sm mb-2">Parent is reading:</p>
            <p className="text-3xl font-black text-white">{gs.pendingReadWord}</p>
          </div>
        </div>
      )}

      {/* ──── Mini-game: Word Barrage ──── */}
      {ready && gs.phase === 'mini_game' && gs.activeMiniGame === 'word_barrage' && (
        <RPGWordBarrage
          words={barrageWords}
          onComplete={(completed, failed) => handleMiniGameComplete(completed, failed)}
          onWordHit={() => {}}
        />
      )}

      {/* ──── Mini-game: Fireball Defense ──── */}
      {ready && gs.phase === 'mini_game' && gs.activeMiniGame === 'fireball_defense' && (
        <RPGFireballDefense
          words={barrageWords}
          onComplete={(completed, failed) => handleMiniGameComplete(completed, failed)}
        />
      )}

      {/* ──── Waiting for opponent ──── */}
      {ready && !endPhase && !isMyTurn && gs.phase !== 'parent_reading' && gs.phase !== 'mini_game' && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[70]">
          <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}
            className="bg-slate-900/80 border border-slate-600 rounded-xl px-6 py-4 text-center">
            <p className="text-slate-300 font-bold">⏳ Waiting for opponent...</p>
          </motion.div>
        </div>
      )}

      {/* ──── Not ready yet ──── */}
      {!ready && !initError && (
        <div className="absolute inset-0 z-[90] flex flex-col items-center justify-center">
          <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }}
            className="text-white text-xl font-bold">Loading battle...</motion.div>
          <LongLoadNotice
            afterSeconds={12}
            title="Battle taking too long?"
            description="The battle couldn't sync. Try going back and creating a new room."
            onRetry={onBack}
            showSignIn={false}
          />
        </div>
      )}

      {/* ──── Init error ──── */}
      {initError && (
        <div className="absolute inset-0 z-[90] flex items-center justify-center">
          <div className="bg-slate-900 border border-red-600 rounded-xl p-6 max-w-sm mx-4 text-center">
            <p className="text-red-400 font-bold mb-3">{initError}</p>
            <Button onClick={onBack} className="bg-slate-700 text-white">← Go Back</Button>
          </div>
        </div>
      )}

      {/* ──── Victory ──── */}
      {endPhase === 'victory' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[90] flex items-center justify-center bg-black/80">
          <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="text-center">
            <Star className="h-20 w-20 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-4xl font-black text-yellow-400 mb-2">YOU WIN!</h2>
            <p className="text-white text-xl">{isHost ? hostName : guestName} is victorious!</p>
            <p className="text-slate-400 mt-2">
              {isHost ? gs.hostCorrect : gs.guestCorrect} words • {gs.longestStreak} best streak
            </p>
          </motion.div>
        </motion.div>
      )}

      {/* ──── Defeat ──── */}
      {endPhase === 'defeat' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[90] flex items-center justify-center bg-black/80">
          <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-center">
            <Shield className="h-20 w-20 text-red-400 mx-auto mb-4" />
            <h2 className="text-4xl font-black text-red-400 mb-2">YOU LOSE!</h2>
            <p className="text-white text-xl">Better luck next time!</p>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

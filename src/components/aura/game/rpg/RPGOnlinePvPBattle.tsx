import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, Shield, Wifi } from "lucide-react";
import { RPGBattleBackground } from "./RPGBattleBackground";
import { RPGCharacter } from "./RPGCharacter";
import { RPGParentControls, ParentAbility } from "./RPGParentControls";
import { RPGWordReader } from "./RPGWordReader";
import { RPGWordBarrage } from "./RPGWordBarrage";
import { RPGFireballDefense } from "./RPGFireballDefense";
import { RPGParentAttackVFX, abilityIdToAttackKind, ParentAttackKind } from "./RPGParentAttackVFX";
import { SoundEffects } from "@/lib/pronunciationPlayer";
import { CuratedStory } from "@/data/curatedStories";
import { heroKnight, allyWizard } from "@/lib/rpgBattleData";
import { supabase } from "@/integrations/supabase/client";
import { LongLoadNotice } from "@/components/system/LongLoadNotice";
import { useAuth } from "@/contexts/AuthContext";
import {
  MULTIPLAYER_ROOM_SNAPSHOT_COLUMNS,
  MultiplayerRoomSnapshot,
  OnlinePvPGameState,
  INITIAL_PVP_STATE,
  isValidPvPState,
} from "./multiplayerRoomTypes";

const battleSounds = new SoundEffects();
const BATCH_SIZE = 5;
const POLL_MS = 1500;

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

/**
 * Server-authoritative online PvP.
 *
 * - All gameplay actions go through the `submit_pvp_action` RPC.
 * - The database is the only source of truth for game state.
 * - Both clients render the same canonical state and replay animations from `pvp_room_events`.
 * - No local state advancement. No optimistic full-state broadcast.
 */
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

  const [gs, setGs] = useState<OnlinePvPGameState>(INITIAL_PVP_STATE);
  const [ready, setReady] = useState(false);
  const [endPhase, setEndPhase] = useState<'victory' | 'defeat' | null>(null);
  const [hostName, setHostName] = useState('Student');
  const [guestName, setGuestName] = useState('Parent');
  const [roomStory, setRoomStory] = useState<string>(story.passage_text);
  const [roomWorldNumber, setRoomWorldNumber] = useState(worldNumber);
  const [initError, setInitError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [eventFlash, setEventFlash] = useState<string | null>(null);
  const [attackVfx, setAttackVfx] = useState<{ kind: ParentAttackKind; key: number } | null>(null);
  const [heroTakingDamage, setHeroTakingDamage] = useState(false);
  const [villainTakingDamage, setVillainTakingDamage] = useState(false);
  const [floatingDamages, setFloatingDamages] = useState<{ id: number; damage: number; target: 'host' | 'guest' }[]>([]);

  const gsRef = useRef(gs);
  const readyRef = useRef(false);
  const actionPendingRef = useRef(false);
  const completedRef = useRef(false);
  const lastEventRevRef = useRef<number>(-1);
  const lastHpRef = useRef({ hostHp: INITIAL_PVP_STATE.hostHp, guestHp: INITIAL_PVP_STATE.guestHp });

  useEffect(() => { gsRef.current = gs; }, [gs]);
  useEffect(() => { readyRef.current = ready; }, [ready]);

  const storyWords = useMemo(
    () => roomStory.split(/\s+/).filter(w => w.length > 0),
    [roomStory]
  );

  const isMyTurn =
    (isHost && gs.turn === 'host') || (!isHost && gs.turn === 'guest');
  const myRole = isHost ? 'kid' : 'parent';

  const currentBatchWords = useMemo(
    () => storyWords.slice(gs.wordIndex, gs.wordIndex + BATCH_SIZE),
    [storyWords, gs.wordIndex]
  );

  const readerKey = `${gs.wordIndex}-${gs.turnCount}`;

  const bannerText = useMemo(() => {
    if (eventFlash) return eventFlash;
    if (gs.phase === 'kid_turn') {
      return gs.turn === 'host'
        ? `🟢 ${hostName}'s turn — Read to attack!`
        : `🟢 ${hostName}'s turn`;
    }
    if (gs.phase === 'parent_turn') return `🔴 ${guestName}'s turn — Choose an attack!`;
    if (gs.phase === 'parent_reading') return `📖 ${guestName} must read the word!`;
    if (gs.phase === 'mini_game') return `🎮 Mini-game active!`;
    return null;
  }, [gs.phase, gs.turn, hostName, guestName, eventFlash]);

  const replayBattleEvent = useCallback((ev: any) => {
    if (!ev) return;
    const rev = typeof ev.rev === 'number' ? ev.rev : Number(ev.rev ?? -1);
    if (!Number.isFinite(rev) || rev <= lastEventRevRef.current) return;
    lastEventRevRef.current = rev;

    if (ev.message) {
      setEventFlash(ev.message);
      setTimeout(() => setEventFlash(null), 2000);
    }

    const eventType = ev.event_type ?? ev.type;
    if (eventType === 'attack') battleSounds.correctWord();
    else if (eventType === 'ability') battleSounds.fireWhoosh();
    else if (eventType === 'mistake') battleSounds.incorrectWord();

    if (eventType === 'ability' && ev.actor === 'guest' && typeof ev.damage === 'number' && ev.damage > 0) {
      setAttackVfx({ kind: abilityIdToAttackKind(ev.ability_id ?? ev.abilityId), key: rev });
    }
  }, []);

  // ─── Apply canonical state from the database ───
  const applyCanonical = useCallback((
    incoming: any,
    roomMeta?: { host_name?: string | null; guest_name?: string | null; story_passage?: string | null; world_number?: number | null },
    markReady = false,
  ): boolean => {
    if (!isValidPvPState(incoming)) return false;
    const incomingRev = (incoming as any).rev ?? 0;
    const localRev = gsRef.current.rev ?? 0;
    if (incomingRev < localRev) return false; // strictly newer or equal-with-diff
    if (incomingRev === localRev) {
      // Same rev = same canonical state; nothing to do
      if (roomMeta) {
        if (roomMeta.host_name) setHostName(roomMeta.host_name);
        if (roomMeta.guest_name) setGuestName(roomMeta.guest_name);
        if (roomMeta.story_passage) setRoomStory(roomMeta.story_passage);
        if (typeof roomMeta.world_number === 'number') setRoomWorldNumber(roomMeta.world_number);
      }
      if (markReady && !ready) setReady(true);
      return false;
    }
    if (roomMeta) {
      if (roomMeta.host_name) setHostName(roomMeta.host_name);
      if (roomMeta.guest_name) setGuestName(roomMeta.guest_name);
      if (roomMeta.story_passage) setRoomStory(roomMeta.story_passage);
      if (typeof roomMeta.world_number === 'number') setRoomWorldNumber(roomMeta.world_number);
    }
    gsRef.current = incoming;
    setGs(incoming);
    setInitError(null);
    if (markReady && !ready) setReady(true);
    return true;
  }, [ready]);

  // ─── Pull canonical state from DB ───
  const pullRoom = useCallback(async (markReady = false): Promise<boolean> => {
    if (!session?.user?.id) return false;
    const { data, error } = await supabase
      .from('multiplayer_rooms')
      .select(MULTIPLAYER_ROOM_SNAPSHOT_COLUMNS)
      .eq('id', roomId)
      .maybeSingle();
    if (error || !data) {
      if (error) console.error('[PvP] pullRoom failed:', error.message);
      return false;
    }
    return applyCanonical((data as any).game_state, {
      host_name: (data as any).host_name,
      guest_name: (data as any).guest_name,
      story_passage: (data as any).story_passage,
      world_number: (data as any).world_number,
    }, markReady);
  }, [roomId, session?.user?.id, applyCanonical]);

  // ─── Submit an action through the server-authoritative RPC ───
  const submitAction = useCallback(async (action: string, payload: any = {}) => {
    if (actionPending) return;
    setActionPending(true);
    setActionError(null);
    const expectedRev = gsRef.current.rev ?? 0;
    try {
      const { data, error } = await supabase.rpc('submit_pvp_action', {
        p_room_id: roomId,
        p_expected_rev: expectedRev,
        p_action: action,
        p_payload: payload,
      });
      if (error) {
        console.error('[PvP] submit_pvp_action error:', error.message);
        setActionError('Could not reach the battle server. Try again.');
        // Force a resync so we don't stay stuck on stale state
        await pullRoom();
        return;
      }
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        console.warn('[PvP] submit_pvp_action returned no row');
        await pullRoom();
        return;
      }
      if (!row.applied) {
        console.warn(`[PvP] action rejected: ${row.reason}`);
        if (row.reason === 'stale_rev') {
          // peer beat us; pull canonical state
          if (row.game_state) applyCanonical(row.game_state);
          else await pullRoom();
        } else if (row.reason === 'on_cooldown') {
          setActionError('That ability is on cooldown.');
        } else if (row.reason === 'wrong_phase') {
          // the canonical state already moved on; resync
          if (row.game_state) applyCanonical(row.game_state);
          else await pullRoom();
        }
        return;
      }
      if (row.game_state) applyCanonical(row.game_state);
    } catch (e: any) {
      console.error('[PvP] submitAction exception:', e);
      setActionError('Network error. Trying to recover.');
      await pullRoom();
    } finally {
      setActionPending(false);
    }
  }, [roomId, actionPending, applyCanonical, pullRoom]);

  // ─── Initial hydration ───
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let attempts = 0;

    const tryHydrate = async () => {
      const ok = await pullRoom(true);
      if (!ok) {
        attempts++;
        if (attempts >= 8 && !ready && !cancelled) {
          setInitError('Battle sync failed. Go back and create a new room.');
        }
      }
      return ok;
    };

    const init = async () => {
      if (initialRoomSnapshot) {
        const accepted = applyCanonical(initialRoomSnapshot.game_state, {
          host_name: initialRoomSnapshot.host_name,
          guest_name: initialRoomSnapshot.guest_name,
          story_passage: initialRoomSnapshot.story_passage,
          world_number: initialRoomSnapshot.world_number,
        }, true);
        if (accepted) return;
      }
      const ok = await tryHydrate();
      if (ok || cancelled) return;
      pollInterval = setInterval(async () => {
        if (cancelled) return;
        const ok = await tryHydrate();
        if (ok && pollInterval) { clearInterval(pollInterval); pollInterval = null; }
      }, 1500);
    };
    init();

    return () => { cancelled = true; if (pollInterval) clearInterval(pollInterval); };
  }, [roomId, authLoading, session?.user?.id, initialRoomSnapshot, applyCanonical, pullRoom, ready]);

  // ─── Subscribe to canonical room updates (full row delivered via REPLICA IDENTITY FULL) ───
  useEffect(() => {
    if (authLoading || !session?.user?.id) return;
    const channel = supabase
      .channel(`pvp-room-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'multiplayer_rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          const room = payload.new as any;
          const incoming = room?.game_state;
          if (isValidPvPState(incoming)) {
            applyCanonical(incoming, {
              host_name: room.host_name,
              guest_name: room.guest_name,
              story_passage: room.story_passage,
              world_number: room.world_number,
            }, true);
          } else {
            // Truncated payload — pull authoritative copy
            void pullRoom(true);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId, authLoading, session?.user?.id, applyCanonical, pullRoom]);

  // ─── Subscribe to event log for animations + sound on BOTH devices ───
  useEffect(() => {
    if (authLoading || !session?.user?.id) return;

    // Load existing events first (in case we joined mid-battle)
    (async () => {
      const { data } = await supabase
        .from('pvp_room_events')
        .select('rev, event_type, actor, target, damage, ability_id, message')
        .eq('room_id', roomId)
        .order('rev', { ascending: false })
        .limit(1);
      if (data && data[0]) lastEventRevRef.current = data[0].rev;
    })();

    const channel = supabase
      .channel(`pvp-events-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pvp_room_events', filter: `room_id=eq.${roomId}` },
        (payload) => {
          const ev = payload.new as any;
          if (!ev || ev.rev <= lastEventRevRef.current) return;
          lastEventRevRef.current = ev.rev;

          // Banner
          if (ev.message) {
            setEventFlash(ev.message);
            setTimeout(() => setEventFlash(null), 2000);
          }

          // Sound
          if (ev.event_type === 'attack') battleSounds.correctWord();
          else if (ev.event_type === 'ability') battleSounds.fireWhoosh();
          else if (ev.event_type === 'mistake') battleSounds.incorrectWord();

          // Parent ability VFX
          if (ev.event_type === 'ability' && ev.actor === 'guest' && typeof ev.damage === 'number' && ev.damage > 0) {
            setAttackVfx({ kind: abilityIdToAttackKind(ev.ability_id), key: ev.rev });
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId, authLoading, session?.user?.id]);

  // ─── Fallback poll while waiting for the peer ───
  useEffect(() => {
    if (!ready || authLoading || !session?.user?.id) return;
    const waitingForPeer =
      (isHost && (gs.phase === 'parent_turn' || gs.phase === 'parent_reading' || gs.phase === 'mini_game')) ||
      (!isHost && gs.phase === 'kid_turn');
    if (!waitingForPeer) return;
    const interval = setInterval(() => { void pullRoom(); }, POLL_MS);
    return () => clearInterval(interval);
  }, [ready, authLoading, session?.user?.id, isHost, gs.phase, pullRoom]);

  // ─── Visibility/focus rehydrate ───
  useEffect(() => {
    if (!ready || authLoading || !session?.user?.id) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') void pullRoom();
    };
    const onFocus = () => { void pullRoom(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, [ready, authLoading, session?.user?.id, pullRoom]);

  // ─── Detect win and call onComplete ───
  useEffect(() => {
    if (!ready || endPhase || completedRef.current) return;
    if (gs.phase === 'host_wins') {
      setEndPhase(isHost ? 'victory' : 'defeat');
      if (isHost) battleSounds.victoryFanfare();
    } else if (gs.phase === 'guest_wins') {
      setEndPhase(!isHost ? 'victory' : 'defeat');
      if (!isHost) battleSounds.victoryFanfare();
    }
  }, [gs.phase, ready, endPhase, isHost]);

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
  }, [endPhase]); // eslint-disable-line

  // ─── Floating damage + flash on HP change (driven by canonical state) ───
  useEffect(() => {
    if (!ready) {
      lastHpRef.current = { hostHp: gs.hostHp, guestHp: gs.guestHp };
      return;
    }
    const previous = lastHpRef.current;
    const hostDamage = Math.max(0, previous.hostHp - gs.hostHp);
    const guestDamage = Math.max(0, previous.guestHp - gs.guestHp);
    if (hostDamage > 0) {
      setHeroTakingDamage(true);
      const id = Date.now();
      setFloatingDamages(prev => [...prev, { id, damage: hostDamage, target: 'host' }]);
      setTimeout(() => setHeroTakingDamage(false), 650);
      setTimeout(() => setFloatingDamages(prev => prev.filter(item => item.id !== id)), 1200);
    }
    if (guestDamage > 0) {
      setVillainTakingDamage(true);
      const id = Date.now() + 1;
      setFloatingDamages(prev => [...prev, { id, damage: guestDamage, target: 'guest' }]);
      setTimeout(() => setVillainTakingDamage(false), 650);
      setTimeout(() => setFloatingDamages(prev => prev.filter(item => item.id !== id)), 1200);
    }
    lastHpRef.current = { hostHp: gs.hostHp, guestHp: gs.guestHp };
  }, [ready, gs.hostHp, gs.guestHp]);

  // ─── Handlers — submit actions, never compute state locally ───
  const handleKidWordResult = useCallback((correct: boolean) => {
    if (!isHost) return;
    if (gsRef.current.phase !== 'kid_turn' || gsRef.current.turn !== 'host') return;
    void submitAction('student_word_result', {
      correct,
      batchSize: Math.max(1, Math.min(BATCH_SIZE, storyWords.length - gsRef.current.wordIndex)),
    });
  }, [isHost, submitAction, storyWords.length]);

  const handleParentAbility = useCallback((ability: ParentAbility) => {
    if (isHost) return;
    if (gsRef.current.phase !== 'parent_turn') return;
    const readWord = ability.requiresReading
      ? storyWords[Math.floor(Math.random() * storyWords.length)]
      : undefined;
    void submitAction('parent_select_ability', {
      ability: {
        id: ability.id,
        name: ability.name,
        damage: ability.damage,
        requiresReading: ability.requiresReading,
        cooldown: ability.cooldown,
        type: ability.type,
        miniGame: ability.miniGame,
      },
      readWord,
    });
  }, [isHost, submitAction, storyWords]);

  const handleParentReadResult = useCallback((correct: boolean) => {
    if (isHost) return;
    if (gsRef.current.phase !== 'parent_reading') return;
    void submitAction('parent_read_result', { correct });
  }, [isHost, submitAction]);

  const handleMiniGameComplete = useCallback((completed: number, failed: number) => {
    if (isHost) return;
    if (gsRef.current.phase !== 'mini_game') return;
    void submitAction('mini_game_complete', { completed, failed });
  }, [isHost, submitAction]);

  const barrageWords = storyWords.slice(gs.wordIndex, gs.wordIndex + 10);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden"
    >
      <RPGBattleBackground worldNumber={roomWorldNumber} />

      <RPGParentAttackVFX
        kind={attackVfx?.kind ?? null}
        fireKey={attackVfx?.key ?? 0}
        onDone={() => setAttackVfx(null)}
      />

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
          <div className={`flex-1 p-2 rounded-lg border-2 ${gs.turn === 'host' ? 'border-green-400 bg-green-950/30' : 'border-slate-700 bg-slate-900/50'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-green-300">🧙‍♀️ {hostName} {isHost ? '(You)' : ''}</span>
              <span className="text-xs text-green-400 ml-auto">{gs.hostHp}/100</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-green-500 to-emerald-400" animate={{ width: `${gs.hostHp}%` }} />
            </div>
          </div>
          <span className="text-white font-black text-xl self-center">VS</span>
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
          <span className="text-slate-500 text-xs">
            Turn {gs.turnCount + 1} • Batch {Math.floor(gs.wordIndex / BATCH_SIZE) + 1} • rev {gs.rev}
            {actionPending && <span className="ml-2 text-blue-400">syncing…</span>}
          </span>
        </div>
        {actionError && (
          <div className="text-center mt-1">
            <span className="text-red-400 text-xs">{actionError}</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {bannerText && ready && !endPhase && (
          <motion.div key={bannerText} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-32 left-1/2 -translate-x-1/2 z-[70] bg-black/80 px-6 py-3 rounded-xl border border-white/20">
            <p className="text-white font-bold">{bannerText}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-40 left-[20%] z-[50]">
        <RPGCharacter character={allyWizard} currentHp={gs.hostHp} isAttacking={gs.turn === 'host' && gs.phase === 'kid_turn'} isTakingDamage={heroTakingDamage} />
      </div>
      <div className="absolute bottom-40 right-[20%] z-[50]">
        <RPGCharacter
          character={{ ...heroKnight, id: 'villain', name: guestName, type: 'enemy', color: '#ef4444' } as any}
          currentHp={gs.guestHp} isEnemy isTakingDamage={villainTakingDamage}
        />
      </div>

      <AnimatePresence>
        {floatingDamages.map(item => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20, scale: 0.7 }}
            animate={{ opacity: 1, y: -28, scale: 1.1 }}
            exit={{ opacity: 0, y: -48 }}
            className={`absolute z-[78] text-3xl font-black drop-shadow-lg ${item.target === 'host' ? 'left-[24%] top-[54%] text-red-300' : 'right-[24%] top-[54%] text-yellow-300'}`}
          >
            -{item.damage}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Kid's Turn — interactive (host) */}
      {ready && gs.phase === 'kid_turn' && isHost && (
        <div className="absolute bottom-0 left-0 right-0 z-[70] p-4">
          <RPGWordReader
            key={`reader-${readerKey}`}
            words={currentBatchWords}
            onResult={(correct) => handleKidWordResult(correct)}
            mode="fast"
          />
        </div>
      )}

      {/* Kid's Turn — spectator (guest) */}
      {ready && gs.phase === 'kid_turn' && !isHost && (
        <div className="absolute bottom-0 left-0 right-0 z-[70] p-4">
          <div className="max-w-lg mx-auto bg-slate-900/90 border border-green-600/40 rounded-xl p-4">
            <p className="text-green-300 text-xs font-bold text-center mb-3">📖 {hostName} is reading:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {currentBatchWords.map((word, i) => (
                <span
                  key={`${gs.wordIndex}-${i}`}
                  className={`px-3 py-2 rounded-lg text-lg font-bold transition-all ${
                    i < gs.batchProgress
                      ? 'bg-green-800/60 text-green-300 line-through opacity-60'
                      : i === gs.batchProgress
                        ? 'bg-green-600/80 text-white ring-2 ring-green-400 scale-110'
                        : 'bg-slate-700/60 text-slate-300'
                  }`}
                >
                  {word}
                </span>
              ))}
            </div>
            <div className="mt-3 text-center">
              <span className="text-slate-400 text-xs">{Math.min(gs.batchProgress, currentBatchWords.length)}/{Math.max(currentBatchWords.length, 1)} words read</span>
            </div>
          </div>
        </div>
      )}

      {/* Parent's Turn — guest interactive */}
      {ready && gs.phase === 'parent_turn' && !isHost && (
        <RPGParentControls
          onSelectAbility={handleParentAbility}
          cooldowns={gs.cooldowns}
          parentHp={gs.guestHp}
          parentMaxHp={100}
        />
      )}

      {/* Parent's Turn — host waits */}
      {ready && gs.phase === 'parent_turn' && isHost && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[70]">
          <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}
            className="bg-slate-900/80 border border-red-600/50 rounded-xl px-6 py-4 text-center">
            <p className="text-red-300 font-bold">🔴 {guestName} is choosing an attack...</p>
          </motion.div>
        </div>
      )}

      {/* Parent reading — guest interactive */}
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
              <Button onClick={() => handleParentReadResult(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold px-6">
                ✅ Read Correctly
              </Button>
              <Button onClick={() => handleParentReadResult(false)}
                variant="outline" className="border-red-500 text-red-300 px-6">
                ❌ Missed It
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Parent reading — host watches */}
      {ready && gs.phase === 'parent_reading' && gs.pendingReadWord && isHost && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[70]">
          <div className="bg-slate-900/80 border border-red-600/50 rounded-xl px-6 py-4 text-center">
            <p className="text-red-300 text-sm mb-2">Parent is reading:</p>
            <p className="text-3xl font-black text-white">{gs.pendingReadWord}</p>
          </div>
        </div>
      )}

      {/* Mini-games */}
      {ready && gs.phase === 'mini_game' && gs.activeMiniGame === 'word_barrage' && !isHost && (
        <RPGWordBarrage words={barrageWords} onComplete={handleMiniGameComplete} onWordHit={() => {}} />
      )}
      {ready && gs.phase === 'mini_game' && gs.activeMiniGame === 'fireball_defense' && !isHost && (
        <RPGFireballDefense words={barrageWords} onComplete={handleMiniGameComplete} />
      )}
      {ready && gs.phase === 'mini_game' && isHost && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[70]">
          <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}
            className="bg-slate-900/80 border border-yellow-600/50 rounded-xl px-6 py-4 text-center">
            <p className="text-yellow-300 font-bold">🎮 {guestName} is playing a mini-game...</p>
          </motion.div>
        </div>
      )}

      {!ready && !initError && (
        <div className="absolute inset-0 z-[90] flex flex-col items-center justify-center">
          <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }}
            className="text-white text-xl font-bold">Loading battle...</motion.div>
          <LongLoadNotice afterSeconds={12} title="Battle taking too long?"
            description="The battle couldn't sync. Try going back and creating a new room."
            onRetry={onBack} showSignIn={false} />
        </div>
      )}

      {initError && (
        <div className="absolute inset-0 z-[90] flex items-center justify-center">
          <div className="bg-slate-900 border border-red-600 rounded-xl p-6 max-w-sm mx-4 text-center">
            <p className="text-red-400 font-bold mb-3">{initError}</p>
            <Button onClick={onBack} className="bg-slate-700 text-white">← Go Back</Button>
          </div>
        </div>
      )}

      {endPhase === 'victory' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[90] flex items-center justify-center bg-black/80">
          <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="text-center">
            <Star className="h-20 w-20 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-4xl font-black text-yellow-400 mb-2">YOU WIN!</h2>
            <p className="text-white text-xl">{isHost ? hostName : guestName} is victorious!</p>
            <p className="text-slate-400 mt-2">{isHost ? gs.hostCorrect : gs.guestCorrect} words • {gs.longestStreak} best streak</p>
          </motion.div>
        </motion.div>
      )}

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

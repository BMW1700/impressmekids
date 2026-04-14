import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
const POLL_MS = 2000; // continuous reconciliation poll
const ELARA_CHARGE_MAX = 5;
const ELARA_BARRAGE_MULTIPLIER = 3;

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

  // ─── Authoritative state ───
  const [gs, setGs] = useState<OnlinePvPGameState>(INITIAL_PVP_STATE);
  const [ready, setReady] = useState(false);
  const [endPhase, setEndPhase] = useState<'victory' | 'defeat' | null>(null);
  const [hostName, setHostName] = useState('Student');
  const [guestName, setGuestName] = useState('Parent');
  const [roomStory, setRoomStory] = useState<string>(story.passage_text);
  const [roomWorldNumber, setRoomWorldNumber] = useState(worldNumber);
  const [initError, setInitError] = useState<string | null>(null);
  const [eventFlash, setEventFlash] = useState<string | null>(null);

  // ─── Elara charge counter ───
  const [elaraCharge, setElaraCharge] = useState(0);

  const gsRef = useRef(gs);
  const readyRef = useRef(ready);
  const completedRef = useRef(false);
  const hydrateAttemptsRef = useRef(0);
  const writeQueueRef = useRef<Promise<boolean>>(Promise.resolve(true));
  const lastQueuedRevRef = useRef(0);
  const broadcastChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => { gsRef.current = gs; }, [gs]);
  useEffect(() => { readyRef.current = ready; }, [ready]);

  // ─── Story words ───
  const storyWords = useMemo(() => roomStory.split(/\s+/).filter(w => w.length > 0), [roomStory]);

  // ─── Derived state (all from gs, no separate message state) ───
  const isMyTurn = (isHost && gs.turn === 'host') || (!isHost && gs.turn === 'guest');
  const myRole = isHost ? 'kid' : 'parent';

  // Current 5-word batch
  const currentBatchWords = useMemo(
    () => storyWords.slice(gs.wordIndex, gs.wordIndex + BATCH_SIZE),
    [storyWords, gs.wordIndex]
  );

  // Force RPGWordReader to remount when the batch changes OR when turns cycle back.
  // Using turnCount ensures the reader remounts even if wordIndex hasn't changed yet.
  const readerKey = `${gs.wordIndex}-${gs.turnCount}`;

  // Derive the banner text from gs — no separate message state
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

  // ═══════════════════════════════════════════════════════════════
  // SINGLE AUTHORITATIVE STATE-APPLY FUNCTION
  // Every incoming state (broadcast, realtime, poll) flows through here.
  // ═══════════════════════════════════════════════════════════════
  const applyIncomingState = useCallback((
    source: 'broadcast' | 'realtime' | 'poll' | 'snapshot',
    incoming: OnlinePvPGameState,
    roomMeta?: { host_name?: string | null; guest_name?: string | null; story_passage?: string | null; world_number?: number | null },
    markReady = false,
  ): boolean => {
    if (!isValidPvPState(incoming)) {
      console.warn(`[PvP] applyIncoming(${source}): invalid state, rejected`);
      return false;
    }

    const normalized: OnlinePvPGameState = {
      ...incoming,
      batchProgress: typeof incoming.batchProgress === 'number' ? incoming.batchProgress : 0,
      rev: typeof incoming.rev === 'number' ? incoming.rev : 0,
    };

    // ── Universal revision guard ──
    // BOTH devices, ALL sources: reject if incoming rev is strictly lower than local rev.
    const currentRev = gsRef.current.rev ?? 0;
    const incomingRev = normalized.rev ?? 0;

    if (incomingRev < currentRev) {
      console.warn(`[PvP] applyIncoming(${source}): REJECTED rev=${incomingRev} < local=${currentRev} (phase=${normalized.phase}, turn=${normalized.turn})`);
      return false;
    }

    // Equal rev from a remote source — accept (idempotent) to ensure phase/turn alignment
    console.log(`[PvP] applyIncoming(${source}): ACCEPTED rev=${incomingRev} phase=${normalized.phase} turn=${normalized.turn} (local was rev=${currentRev} phase=${gsRef.current.phase})`);

    // Apply room metadata if provided
    if (roomMeta) {
      if (roomMeta.host_name) setHostName(roomMeta.host_name);
      if (roomMeta.guest_name) setGuestName(roomMeta.guest_name);
      if (roomMeta.story_passage) setRoomStory(roomMeta.story_passage);
      if (typeof roomMeta.world_number === 'number') setRoomWorldNumber(roomMeta.world_number);
    }

    hydrateAttemptsRef.current = 0;
    setInitError(null);
    gsRef.current = normalized;
    lastQueuedRevRef.current = Math.max(lastQueuedRevRef.current, normalized.rev ?? 0);
    setGs(normalized);

    if (markReady && !readyRef.current) {
      readyRef.current = true;
      setReady(true);
    }

    // Sound + event flash for remote events
    if (source !== 'snapshot' && normalized.lastEvent) {
      if (normalized.lastEvent.type === 'attack') battleSounds.correctWord();
      else if (normalized.lastEvent.type === 'ability') battleSounds.fireWhoosh();
      if (normalized.lastEvent.message) {
        setEventFlash(normalized.lastEvent.message);
        setTimeout(() => setEventFlash(null), 2000);
      }
    }

    // Detect win
    if (normalized.phase === 'host_wins' && !endPhase) {
      setEndPhase(isHost ? 'victory' : 'defeat');
      if (isHost) battleSounds.victoryFanfare();
    } else if (normalized.phase === 'guest_wins' && !endPhase) {
      setEndPhase(!isHost ? 'victory' : 'defeat');
      if (!isHost) battleSounds.victoryFanfare();
    }

    return true;
  }, [isHost, endPhase]);

  // ─── Legacy wrapper for snapshot hydration ───
  const acceptSnapshot = useCallback((room: MultiplayerRoomSnapshot | null | undefined, markReady = false): boolean => {
    if (!room) return false;
    const incoming = room.game_state as any;
    return applyIncomingState('snapshot', incoming, {
      host_name: room.host_name,
      guest_name: room.guest_name,
      story_passage: room.story_passage,
      world_number: room.world_number,
    }, markReady);
  }, [applyIncomingState]);

  const rehydrateRoom = useCallback(async (markReady = false): Promise<boolean> => {
    if (!session?.user?.id) return false;

    const { data, error } = await supabase
      .from('multiplayer_rooms')
      .select(MULTIPLAYER_ROOM_SNAPSHOT_COLUMNS)
      .eq('id', roomId)
      .maybeSingle();

    if (error || !data) {
      if (error) console.error('[PvP] rehydrateRoom failed:', error.message, error.code, error.details);
      return false;
    }

    const incoming = (data as any).game_state;
    return applyIncomingState('poll', incoming, {
      host_name: (data as any).host_name,
      guest_name: (data as any).guest_name,
      story_passage: (data as any).story_passage,
      world_number: (data as any).world_number,
    }, markReady);
  }, [roomId, session?.user?.id, applyIncomingState]);

  // ─── Broadcast a state snapshot to the peer (no DB) ───
  const broadcastState = useCallback((state: OnlinePvPGameState) => {
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.send({
        type: 'broadcast',
        event: 'state_update',
        payload: { rev: state.rev, phase: state.phase, state },
      });
    }
  }, []);

  // ─── Push state to DB with 5-second timeout (NO broadcast — caller handles that) ───
  const pushState = useCallback(async (newState: OnlinePvPGameState): Promise<boolean> => {
    // Ensure valid session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      console.warn('[PvP] pushState: No session, refreshing...');
      const { error: refreshErr } = await supabase.auth.refreshSession();
      if (refreshErr) {
        console.error('[PvP] pushState: Session refresh failed:', refreshErr.message);
        return false;
      }
    }

    const status = (newState.phase === 'host_wins' || newState.phase === 'guest_wins') ? 'completed' : 'active';

    const attemptWrite = async (isRetry = false): Promise<boolean> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const { data: rows, error } = await supabase
          .from('multiplayer_rooms')
          .update({ game_state: newState as any, status })
          .eq('id', roomId)
          .select('id')
          .abortSignal(controller.signal);
        clearTimeout(timeoutId);

        if (error) {
          console.error('[PvP] pushState UPDATE error:', error.message, error.code);
          return false;
        }

        // Verify write actually happened (RLS can silently match 0 rows)
        if (!rows || rows.length === 0) {
          console.warn('[PvP] pushState wrote 0 rows (RLS block). Refreshing session...');
          if (!isRetry) {
            await supabase.auth.refreshSession();
          }
          return false;
        }

        console.log('[PvP] pushState OK rev=', newState.rev, 'phase=', newState.phase, 'turn=', newState.turn);
        return true;
      } catch (e: any) {
        if (e?.name === 'AbortError') {
          console.warn('[PvP] pushState timed out (5s) rev=', newState.rev);
        } else {
          console.error('[PvP] pushState exception:', e);
        }
        return false;
      }
    };

    // Try once, retry once on failure
    let ok = await attemptWrite(false);
    if (!ok) {
      console.warn('[PvP] pushState retrying rev=', newState.rev);
      ok = await attemptWrite(true);
      // If write still failed, re-broadcast so peer can at least use the realtime data
      if (!ok) {
        console.warn('[PvP] pushState failed after retry, re-broadcasting rev=', newState.rev);
        broadcastState(newState);
      }
    }
    return ok;
  }, [roomId, broadcastState]);

  const enqueueStatePersist = useCallback((newState: OnlinePvPGameState) => {
    writeQueueRef.current = writeQueueRef.current
      .catch(() => false)
      .then(async () => {
        const ok = await pushState(newState);
        if (!ok) {
          console.warn('[PvP] pushState failed for rev=', newState.rev, '— local state preserved');
        }
        return ok;
      });
    return writeQueueRef.current;
  }, [pushState]);

  // ─── commitLocal: broadcast-only (no DB write) — for intermediate word progress ───
  const commitLocal = useCallback((newState: OnlinePvPGameState) => {
    const withRev = { ...newState, rev: Math.max(gsRef.current.rev ?? 0, lastQueuedRevRef.current) + 1 };
    console.log(`[PvP] commitLocal rev=${withRev.rev} phase=${withRev.phase} batch=${withRev.batchProgress}`);
    setGs(withRev);
    gsRef.current = withRev;
    lastQueuedRevRef.current = withRev.rev;
    broadcastState(withRev);

    if (withRev.lastEvent?.message) {
      setEventFlash(withRev.lastEvent.message);
      setTimeout(() => setEventFlash(null), 2000);
    }
  }, [broadcastState]);

  // ─── commitAndPersist: broadcast IMMEDIATELY + queue DB write — for turn switches, phase changes, wins ───
  const commitAndPersist = useCallback((newState: OnlinePvPGameState) => {
    const withRev = { ...newState, rev: Math.max(gsRef.current.rev ?? 0, lastQueuedRevRef.current) + 1 };
    console.log(`[PvP] commitAndPersist rev=${withRev.rev} phase=${withRev.phase} turn=${withRev.turn} hostHp=${withRev.hostHp} guestHp=${withRev.guestHp}`);
    setGs(withRev);
    gsRef.current = withRev;
    lastQueuedRevRef.current = withRev.rev;
    // Broadcast IMMEDIATELY so peer gets the update without waiting for the DB write queue
    broadcastState(withRev);
    void enqueueStatePersist(withRev);

    if (withRev.lastEvent?.message) {
      setEventFlash(withRev.lastEvent.message);
      setTimeout(() => setEventFlash(null), 2000);
    }
  }, [enqueueStatePersist, broadcastState]);

  // ═══════════════════════════════════════════════════════════════
  // BROADCAST CHANNEL — unified through applyIncomingState
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (authLoading || !session?.user?.id) return;

    const channel = supabase.channel(`pvp-broadcast-${roomId}`, {
      config: { broadcast: { self: false } },
    });

    channel.on('broadcast', { event: 'state_update' }, async (msg) => {
      const payload = msg.payload as any;
      if (payload?.state && isValidPvPState(payload.state)) {
        // Use the unified apply function — same guard as poll and realtime
        applyIncomingState('broadcast', payload.state as OnlinePvPGameState, undefined, true);
      } else {
        // Fallback: no inline state, rehydrate from DB
        console.log('[PvP] Broadcast signal received (no inline state), rehydrating from DB...');
        await rehydrateRoom();
      }
    });

    channel.subscribe((status) => {
      console.log(`[PvP] Broadcast channel status: ${status}`);
    });
    broadcastChannelRef.current = channel;

    return () => {
      broadcastChannelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [roomId, authLoading, session?.user?.id, rehydrateRoom, applyIncomingState]);

  // ─── Mount-time RPC health check ───
  useEffect(() => {
    if (authLoading || !session?.user?.id) return;
    const checkRpc = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        console.warn('[PvP] Health check: no session at mount time');
      } else {
        console.log('[PvP] Health check: session valid, uid=', sessionData.session.user.id);
      }
    };
    checkRpc();
  }, [authLoading, session?.user?.id]);

  // ─── Initial hydration from snapshot or DB ───
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

      const hydrateRoom = async (): Promise<boolean> => {
        const ok = await rehydrateRoom(true);
        if (!ok || cancelled) {
        hydrateAttemptsRef.current += 1;
        if (hydrateAttemptsRef.current >= 8 && !cancelled && !readyRef.current) {
          setInitError('Battle sync failed. Go back and create a new room.');
        }
        return false;
      }
        return true;
    };

    const init = async () => {
      // Try snapshot first
      if (initialRoomSnapshot && acceptSnapshot(initialRoomSnapshot, true)) return;
      const ok = await hydrateRoom();
      if (ok || readyRef.current || cancelled) return;
      pollInterval = setInterval(async () => {
        if (cancelled) return;
        const ok = await hydrateRoom();
        if (ok && pollInterval) { clearInterval(pollInterval); pollInterval = null; }
      }, 1500);
    };
    init();

    return () => { cancelled = true; if (pollInterval) clearInterval(pollInterval); };
  }, [roomId, authLoading, session?.user?.id, initialRoomSnapshot, acceptSnapshot, rehydrateRoom]);

  // ─── Continuous reconciliation poll (runs for entire match) ───
  useEffect(() => {
    if (!ready || authLoading || !session?.user?.id) return;
    const interval = setInterval(async () => {
      await rehydrateRoom();
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [ready, roomId, authLoading, session?.user?.id, rehydrateRoom]);

  // ─── Realtime postgres_changes subscription (kept as fallback) ───
  useEffect(() => {
    if (authLoading || !session?.user?.id) return;
    const channel = supabase
      .channel(`pvp-battle-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'multiplayer_rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          const room = payload.new as any;
          const incoming = room.game_state as any;
          if (!isValidPvPState(incoming)) return;
          applyIncomingState('realtime', incoming, {
            host_name: room.host_name,
            guest_name: room.guest_name,
            story_passage: room.story_passage,
            world_number: room.world_number,
          }, true);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId, isHost, authLoading, session?.user?.id, applyIncomingState]);

  // ─── Handle end ───
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

  // Also detect win from gs directly (in case realtime event is missed)
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

  // ─── Kid reads a word — Elara 5-word charge + plasma barrage mechanic ───
  const handleKidWordResult = useCallback((correct: boolean, _spokenWord: string, _wordIndex: number) => {
    if (!isHost) return;
    // Guard: only process if it's actually kid's turn (prevents stale callbacks after turn switch)
    if (gsRef.current.phase !== 'kid_turn' || gsRef.current.turn !== 'host') return;

    const s = { ...gsRef.current };
    const currentTurnSize = Math.max(1, Math.min(BATCH_SIZE, storyWords.length - s.wordIndex));
    s.wordsRead += 1;
    s.batchProgress += 1;

    // Elara charge mechanic: charge up for first 4 words, barrage on 5th
    const newCharge = elaraCharge + 1;

    if (correct) {
      s.hostCorrect += 1;
      s.hostStreak += 1;
      if (s.hostStreak > s.longestStreak) s.longestStreak = s.hostStreak;

      if (newCharge >= ELARA_CHARGE_MAX) {
        // 5th word — PLASMA BARRAGE! Triple damage
        const baseDamage = 8 + Math.min(s.hostStreak, 5) * 2;
        const damage = baseDamage * ELARA_BARRAGE_MULTIPLIER;
        s.totalDamage += damage;
        s.guestHp = Math.max(0, s.guestHp - damage);
        s.lastEvent = { type: 'attack', damage, by: 'host', message: `🔮 PLASMA BARRAGE! ${hostName} deals ${damage} damage!`, timestamp: Date.now() };
        setElaraCharge(0);
        battleSounds.fireWhoosh();
      } else {
        // Charging — minor damage per word
        const damage = 3;
        s.totalDamage += damage;
        s.guestHp = Math.max(0, s.guestHp - damage);
        s.lastEvent = { type: 'attack', damage, by: 'host', message: `⚡ Charge ${newCharge}/${ELARA_CHARGE_MAX} — ${damage} damage`, timestamp: Date.now() };
        setElaraCharge(newCharge);
      }

      if (s.guestHp <= 0) {
        s.phase = 'host_wins';
        commitAndPersist(s);
        return;
      }
    } else {
      s.hostStreak = 0;
      setElaraCharge(0);
    }

    // Check if this 5-word batch is done → turn switch = persist to DB
    if (s.batchProgress >= currentTurnSize) {
      s.turn = 'guest';
      s.phase = 'parent_turn';
      s.wordIndex += currentTurnSize;
      s.batchProgress = 0;
      const cd = { ...s.cooldowns };
      Object.keys(cd).forEach(k => { if (cd[k] > 0) cd[k]--; });
      s.cooldowns = cd;
      s.turnCount += 1;
      s.lastEvent = { type: 'turn_switch', by: 'host', message: `🔴 ${guestName}'s Turn!`, timestamp: Date.now() };
      setElaraCharge(0);
      commitAndPersist(s);
    } else {
      // Intermediate word — broadcast only, no DB write
      commitLocal(s);
    }
  }, [isHost, commitLocal, commitAndPersist, hostName, guestName, storyWords.length, elaraCharge]);

  // ─── Parent selects ability (guest only) ───
  const handleParentAbility = useCallback((ability: ParentAbility) => {
    if (!isMyTurn || myRole !== 'parent') return;
    if (gsRef.current.phase !== 'parent_turn') return;
    const s = { ...gsRef.current };

    if (ability.type === 'minigame' && ability.miniGame) {
      s.activeMiniGame = ability.miniGame;
      s.phase = 'mini_game';
      s.lastEvent = { type: 'ability', by: 'guest', message: `🎮 ${ability.name}!`, timestamp: Date.now() };
      if (ability.cooldown > 0) s.cooldowns = { ...s.cooldowns, [ability.id]: ability.cooldown };
    } else if (ability.requiresReading) {
      s.pendingAbility = { id: ability.id, name: ability.name, damage: ability.damage, requiresReading: true, cooldown: ability.cooldown };
      s.pendingReadWord = storyWords[Math.floor(Math.random() * storyWords.length)];
      s.phase = 'parent_reading';
      s.lastEvent = { type: 'ability', by: 'guest', message: `📖 Read the word for bonus damage!`, timestamp: Date.now() };
    } else {
      const damage = ability.damage;
      s.hostHp = Math.max(0, s.hostHp - damage);
      s.lastEvent = { type: 'ability', damage, by: 'guest', message: `💥 ${guestName} uses ${ability.name} for ${damage} damage!`, timestamp: Date.now() };
      if (ability.cooldown > 0) s.cooldowns = { ...s.cooldowns, [ability.id]: ability.cooldown };
      if (s.hostHp <= 0) {
        s.phase = 'guest_wins';
      } else {
        s.turn = 'host';
        s.phase = 'kid_turn';
        s.batchProgress = 0;
      }
    }
    commitAndPersist(s);
  }, [isMyTurn, myRole, commitAndPersist, storyWords, guestName]);

  // ─── Parent reading result ───
  const handleParentReadResult = useCallback((correct: boolean) => {
    if (myRole !== 'parent') return;
    if (gsRef.current.phase !== 'parent_reading') return;
    const s = { ...gsRef.current };
    const ability = s.pendingAbility;
    if (!ability) return;

    let damage = ability.damage;
    let msg: string;
    if (correct) { damage += 5; msg = `💥 ${ability.name} + Reading Bonus = ${damage} damage!`; }
    else { msg = `💥 ${ability.name} for ${damage} damage (no bonus)`; }

    s.hostHp = Math.max(0, s.hostHp - damage);
    if (ability.cooldown > 0) s.cooldowns = { ...s.cooldowns, [ability.id]: ability.cooldown };
    s.pendingAbility = null;
    s.pendingReadWord = null;
    s.lastEvent = { type: 'ability', damage, by: 'guest', message: msg, timestamp: Date.now() };

    if (s.hostHp <= 0) { s.phase = 'guest_wins'; }
    else { s.turn = 'host'; s.phase = 'kid_turn'; s.batchProgress = 0; }

    commitAndPersist(s);
  }, [myRole, commitAndPersist]);

  // ─── Mini-game completion ───
  const handleMiniGameComplete = useCallback((completed: number, failed: number) => {
    if (myRole !== 'parent') return;
    if (gsRef.current.phase !== 'mini_game') return;
    const s = { ...gsRef.current };
    const kidDamage = failed * 5;
    const bonusDamage = completed * 3;
    if (kidDamage > 0) s.hostHp = Math.max(0, s.hostHp - kidDamage);
    if (bonusDamage > 0) s.guestHp = Math.max(0, s.guestHp - bonusDamage);
    s.activeMiniGame = null;
    s.lastEvent = { type: 'mini_game_end', by: 'guest', message: `🎮 Mini-game done! ${completed} caught, ${failed} missed`, timestamp: Date.now() };

    if (s.hostHp <= 0) { s.phase = 'guest_wins'; }
    else if (s.guestHp <= 0) { s.phase = 'host_wins'; }
    else { s.turn = 'host'; s.phase = 'kid_turn'; s.batchProgress = 0; }

    commitAndPersist(s);
  }, [myRole, commitAndPersist]);

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

      {/* HUD — HP bars synced from gs */}
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
          <span className="text-slate-500 text-xs">Turn {gs.turnCount + 1} • Batch {Math.floor(gs.wordIndex / BATCH_SIZE) + 1}</span>
        </div>
      </div>

      {/* Banner — derived from gs, no independent state */}
      <AnimatePresence>
        {bannerText && ready && !endPhase && (
          <motion.div key={bannerText} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-32 left-1/2 -translate-x-1/2 z-[70] bg-black/80 px-6 py-3 rounded-xl border border-white/20">
            <p className="text-white font-bold">{bannerText}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Characters */}
      <div className="absolute bottom-40 left-[20%] z-[50]">
        <RPGCharacter character={allyWizard} currentHp={gs.hostHp} isAttacking={gs.turn === 'host' && gs.phase === 'kid_turn'} />
      </div>
      <div className="absolute bottom-40 right-[20%] z-[50]">
        <RPGCharacter
          character={{ ...heroKnight, id: 'villain', name: guestName, type: 'enemy', color: '#ef4444' } as any}
          currentHp={gs.guestHp} isEnemy isTakingDamage={gs.turn === 'host'}
        />
      </div>

      {/* ──── Kid's Turn: Word Reader (host device — interactive) with mode='fast' for Elara ──── */}
      {ready && gs.phase === 'kid_turn' && isHost && (
        <div className="absolute bottom-0 left-0 right-0 z-[70] p-4">
          {/* Elara Charge Counter */}
          <div className="flex justify-center gap-2 mb-3">
            {Array.from({ length: ELARA_CHARGE_MAX }).map((_, i) => (
              <motion.div
                key={i}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all ${
                  i < elaraCharge
                    ? 'bg-purple-500 border-purple-300 text-white shadow-lg shadow-purple-500/50'
                    : 'bg-slate-800 border-slate-600 text-slate-500'
                }`}
                animate={i < elaraCharge ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {i < elaraCharge ? '⚡' : (i + 1)}
              </motion.div>
            ))}
          </div>
          {elaraCharge >= ELARA_CHARGE_MAX - 1 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="text-center text-purple-300 text-xs font-bold mb-2"
            >
              🔮 NEXT WORD = PLASMA BARRAGE (3x damage)!
            </motion.p>
          )}
          <RPGWordReader
            key={`reader-${readerKey}`}
            words={currentBatchWords}
            onResult={handleKidWordResult}
            mode="fast"
          />
        </div>
      )}

      {/* ──── Kid's Turn: Spectator view for parent (read-only word display) ──── */}
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

      {/* ──── Parent's Turn: Ability Cards (guest device only) ──── */}
      {ready && gs.phase === 'parent_turn' && !isHost && (
        <RPGParentControls
          onSelectAbility={handleParentAbility}
          cooldowns={gs.cooldowns}
          parentHp={gs.guestHp}
          parentMaxHp={100}
        />
      )}

      {/* ──── Parent's Turn: Student waits (host device) ──── */}
      {ready && gs.phase === 'parent_turn' && isHost && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[70]">
          <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}
            className="bg-slate-900/80 border border-red-600/50 rounded-xl px-6 py-4 text-center">
            <p className="text-red-300 font-bold">🔴 {guestName} is choosing an attack...</p>
          </motion.div>
        </div>
      )}

      {/* ──── Parent Reading Phase (guest device) ──── */}
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

      {/* ──── Parent Reading — Kid sees word (host device, read-only) ──── */}
      {ready && gs.phase === 'parent_reading' && gs.pendingReadWord && isHost && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[70]">
          <div className="bg-slate-900/80 border border-red-600/50 rounded-xl px-6 py-4 text-center">
            <p className="text-red-300 text-sm mb-2">Parent is reading:</p>
            <p className="text-3xl font-black text-white">{gs.pendingReadWord}</p>
          </div>
        </div>
      )}

      {/* ──── Mini-game: Word Barrage (parent device only) ──── */}
      {ready && gs.phase === 'mini_game' && gs.activeMiniGame === 'word_barrage' && !isHost && (
        <RPGWordBarrage words={barrageWords} onComplete={handleMiniGameComplete} onWordHit={() => {}} />
      )}

      {/* ──── Mini-game: Fireball Defense (parent device only) ──── */}
      {ready && gs.phase === 'mini_game' && gs.activeMiniGame === 'fireball_defense' && !isHost && (
        <RPGFireballDefense words={barrageWords} onComplete={handleMiniGameComplete} />
      )}

      {/* ──── Mini-game: Student waits (host device) ──── */}
      {ready && gs.phase === 'mini_game' && isHost && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[70]">
          <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}
            className="bg-slate-900/80 border border-yellow-600/50 rounded-xl px-6 py-4 text-center">
            <p className="text-yellow-300 font-bold">🎮 {guestName} is playing a mini-game...</p>
          </motion.div>
        </div>
      )}

      {/* ──── Not ready ──── */}
      {!ready && !initError && (
        <div className="absolute inset-0 z-[90] flex flex-col items-center justify-center">
          <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }}
            className="text-white text-xl font-bold">Loading battle...</motion.div>
          <LongLoadNotice afterSeconds={12} title="Battle taking too long?"
            description="The battle couldn't sync. Try going back and creating a new room."
            onRetry={onBack} showSignIn={false} />
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
            <p className="text-slate-400 mt-2">{isHost ? gs.hostCorrect : gs.guestCorrect} words • {gs.longestStreak} best streak</p>
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

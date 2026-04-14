import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, Shield, Wifi, Repeat, ArrowRight } from "lucide-react";
import { RPGBattleBackground } from "./RPGBattleBackground";
import { RPGCharacter } from "./RPGCharacter";
import { RPGCoopHUD } from "./RPGCoopHUD";
import { RPGWordReader } from "./RPGWordReader";
import { SoundEffects } from "@/lib/pronunciationPlayer";
import { CuratedStory } from "@/data/curatedStories";
import { heroKnight, allyWizard, getEnemyForBattle } from "@/lib/rpgBattleData";
import { getStoredTheme } from "@/lib/gameTheme";
import { getAgentEnemy } from "@/lib/agentBattleData";
import { supabase } from "@/integrations/supabase/client";
import { LongLoadNotice } from "@/components/system/LongLoadNotice";
import { useAuth } from "@/contexts/AuthContext";

const battleSounds = new SoundEffects();
const POLL_MS = 2000;

interface BattleStats {
  wordsRead: number;
  correctWords: number;
  longestStreak: number;
  damageDealt: number;
  xpEarned: number;
  goldEarned?: number;
}

interface RPGOnlineCoopBattleProps {
  story: CuratedStory;
  studentId: string;
  roomId: string;
  isHost: boolean;
  worldNumber?: number;
  onBack: () => void;
  onComplete: (victory: boolean, stats: BattleStats) => void;
}

interface CoopGameState {
  rev: number;
  hostHp: number;
  guestHp: number;
  enemyHp: number;
  enemyMaxHp: number;
  turn: 'host' | 'guest';
  wordIndex: number;
  batchStartIndex: number;
  turnWordsRead: number;
  hostWords: number;
  guestWords: number;
  totalCorrect: number;
  longestStreak: number;
  currentStreak: number;
  totalDamage: number;
  coopMode: 'continuous' | 'repeat';
  repeatPhase: 1 | 2;
  phase: 'setup' | 'playing' | 'victory' | 'defeat';
  lastEvent?: { type: string; damage?: number; by: string; timestamp: number } | null;
}

const isValidCoopState = (gs: any): gs is CoopGameState =>
  gs && typeof gs === 'object' && typeof gs.phase === 'string' && typeof gs.enemyHp === 'number';

export const RPGOnlineCoopBattle = ({
  story,
  studentId,
  roomId,
  isHost,
  worldNumber = 1,
  onBack,
  onComplete,
}: RPGOnlineCoopBattleProps) => {
  const { session, isLoading: authLoading } = useAuth();
  const theme = getStoredTheme();

  const [gameState, setGameState] = useState<CoopGameState | null>(null);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>('Loading...');
  const [hostName, setHostName] = useState('Player 1');
  const [guestName, setGuestName] = useState('Player 2');
  const [roomStory, setRoomStory] = useState<string>(story.passage_text);
  const [roomWorldNumber, setRoomWorldNumber] = useState(worldNumber);
  const [roomEnemyType, setRoomEnemyType] = useState<string>('guard');
  const [initError, setInitError] = useState<string | null>(null);
  const gsRef = useRef<CoopGameState | null>(null);
  const completedRef = useRef(false);
  const [readerKey, setReaderKey] = useState(0);
  const lastQueuedRevRef = useRef(0);
  const writeQueueRef = useRef<Promise<boolean>>(Promise.resolve(true));
  const broadcastChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => { gsRef.current = gameState; }, [gameState]);

  const enemy = theme === 'agent' ? getAgentEnemy(roomEnemyType as any) : getEnemyForBattle(roomEnemyType as any);

  const storyWords = roomStory.split(/\s+/).filter(w => w.length > 0);

  const isMyTurn = gameState
    ? (isHost && gameState.turn === 'host') || (!isHost && gameState.turn === 'guest')
    : false;

  const makeInitialState = (mode: 'continuous' | 'repeat'): CoopGameState => ({
    rev: 0,
    hostHp: 100, guestHp: 100,
    enemyHp: enemy.maxHp, enemyMaxHp: enemy.maxHp,
    turn: 'host', wordIndex: 0, batchStartIndex: 0,
    turnWordsRead: 0, hostWords: 0, guestWords: 0,
    totalCorrect: 0, longestStreak: 0, currentStreak: 0, totalDamage: 0,
    coopMode: mode, repeatPhase: 1,
    phase: 'setup', lastEvent: null,
  });

  // ─── Accept snapshot — passive side always accepts ───
  const acceptSnapshot = useCallback((gs: CoopGameState, roomData?: any): boolean => {
    if (!isValidCoopState(gs)) return false;

    const normalized: CoopGameState = {
      ...gs,
      rev: typeof gs.rev === 'number' ? gs.rev : 0,
    };

    // Universal revision guard: BOTH sides reject stale state
    const currentRev = gsRef.current?.rev ?? 0;
    const incomingRev = normalized.rev ?? 0;

    if (incomingRev < currentRev) {
      console.warn(`[Coop] Rejecting stale snapshot rev=${incomingRev} < current=${currentRev}`);
      return false;
    }

    if (roomData) {
      if (roomData.host_name) setHostName(roomData.host_name);
      if (roomData.guest_name) setGuestName(roomData.guest_name);
      if (roomData.story_passage) setRoomStory(roomData.story_passage);
      if (roomData.world_number) setRoomWorldNumber(roomData.world_number);
      if (roomData.enemy_type) setRoomEnemyType(roomData.enemy_type);
    }

    gsRef.current = normalized;
    lastQueuedRevRef.current = Math.max(lastQueuedRevRef.current, normalized.rev);
    setGameState(normalized);
    return true;
  }, [isHost]);

  // ─── Broadcast a state snapshot to the peer (no DB) ───
  const broadcastState = useCallback((state: CoopGameState) => {
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.send({
        type: 'broadcast',
        event: 'state_update',
        payload: { rev: state.rev, phase: state.phase, state },
      });
    }
  }, []);

  // ─── Push state to DB with 5-second timeout ───
  const pushState = useCallback(async (newState: CoopGameState): Promise<boolean> => {
    broadcastState(newState);

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      console.warn('[Coop] pushState: No session, refreshing...');
      const { error: refreshErr } = await supabase.auth.refreshSession();
      if (refreshErr) {
        console.error('[Coop] pushState: Session refresh failed:', refreshErr.message);
        return false;
      }
    }

    const status = (newState.phase === 'victory' || newState.phase === 'defeat') ? 'completed' : 'active';

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
          console.error('[Coop] pushState UPDATE error:', error.message, error.code);
          return false;
        }

        // Verify write actually happened (RLS can silently match 0 rows)
        if (!rows || rows.length === 0) {
          console.warn('[Coop] pushState wrote 0 rows (RLS block). Refreshing session...');
          if (!isRetry) {
            await supabase.auth.refreshSession();
          }
          return false;
        }

        console.log('[Coop] pushState OK rev=', newState.rev, 'phase=', newState.phase);
        return true;
      } catch (e: any) {
        if (e?.name === 'AbortError') {
          console.warn('[Coop] pushState timed out (5s) rev=', newState.rev);
        } else {
          console.error('[Coop] pushState exception:', e);
        }
        return false;
      }
    };

    let ok = await attemptWrite(false);
    if (!ok) {
      console.warn('[Coop] pushState retrying rev=', newState.rev);
      ok = await attemptWrite(true);
    }
    return ok;
  }, [roomId, broadcastState]);

  const rehydrateRoom = useCallback(async (): Promise<boolean> => {
    if (!session?.user?.id) return false;
    const { data, error } = await supabase
      .from('multiplayer_rooms')
      .select('game_state, host_name, guest_name, story_passage, world_number, enemy_type')
      .eq('id', roomId)
      .maybeSingle();

    if (error || !data) return false;

    const gs = data.game_state as any;
    if (!isValidCoopState(gs)) return false;

    return acceptSnapshot(gs, data);
  }, [roomId, session?.user?.id, acceptSnapshot]);

  const enqueueStatePersist = useCallback((newState: CoopGameState) => {
    writeQueueRef.current = writeQueueRef.current
      .catch(() => false)
      .then(async () => {
        const ok = await pushState(newState);
        if (!ok) {
          console.warn('[Coop] pushState failed for rev=', newState.rev, '— local state preserved');
        }
        return ok;
      });
    return writeQueueRef.current;
  }, [pushState]);

  // ─── commitLocal: broadcast-only (no DB write) — for intermediate word progress ───
  const commitLocal = useCallback((newState: CoopGameState) => {
    const withRev = { ...newState, rev: Math.max(gsRef.current?.rev ?? 0, lastQueuedRevRef.current) + 1 };
    console.log(`[Coop] commitLocal rev=${withRev.rev} phase=${withRev.phase}`);
    setGameState(withRev);
    gsRef.current = withRev;
    lastQueuedRevRef.current = withRev.rev;
    broadcastState(withRev);
  }, [broadcastState]);

  // ─── commitAndPersist: broadcast IMMEDIATELY + queue DB write — for turn switches, phase changes ───
  const commitAndPersist = useCallback((newState: CoopGameState) => {
    const withRev = { ...newState, rev: Math.max(gsRef.current?.rev ?? 0, lastQueuedRevRef.current) + 1 };
    console.log(`[Coop] commitAndPersist rev=${withRev.rev} phase=${withRev.phase} turn=${withRev.turn} enemyHp=${withRev.enemyHp}`);
    setGameState(withRev);
    gsRef.current = withRev;
    lastQueuedRevRef.current = withRev.rev;
    // Broadcast IMMEDIATELY so peer gets the update without waiting for the DB write queue
    broadcastState(withRev);
    void enqueueStatePersist(withRev);
  }, [enqueueStatePersist, broadcastState]);

  // ─── Broadcast channel ───
  useEffect(() => {
    if (authLoading || !session?.user?.id) return;

    const channel = supabase.channel(`coop-broadcast-${roomId}`, {
      config: { broadcast: { self: false } },
    });

    channel.on('broadcast', { event: 'state_update' }, async (msg) => {
      const payload = msg.payload as any;
      if (payload?.state && isValidCoopState(payload.state)) {
        console.log('[Coop] Broadcast received with inline state rev=', payload.state.rev);
        const incoming = payload.state as CoopGameState;
        const currentRev = gsRef.current?.rev ?? 0;
        const iAmActive = (isHost && incoming.turn === 'host') || (!isHost && incoming.turn === 'guest');
        if (iAmActive && incoming.rev < currentRev) return;
        gsRef.current = incoming;
        lastQueuedRevRef.current = Math.max(lastQueuedRevRef.current, incoming.rev);
        setGameState(incoming);
        if (!ready) setReady(true);
      } else {
        console.log('[Coop] Broadcast signal received, rehydrating from DB...');
        await rehydrateRoom();
      }
    });

    channel.subscribe();
    broadcastChannelRef.current = channel;

    return () => {
      broadcastChannelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [roomId, authLoading, session?.user?.id, rehydrateRoom]);

  // ─── Load room + poll for guest ───
  useEffect(() => {
    if (authLoading) return;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const hydrateRoom = async (): Promise<boolean> => {
      const ok = await rehydrateRoom();
      if (ok) {
        setReady(true);
        return true;
      }
      return false;
    };

    const init = async () => {
      const loaded = await hydrateRoom();
      if (loaded || cancelled) return;

      if (isHost) {
        const initial = makeInitialState('continuous');
        setGameState(initial);
        gsRef.current = initial;
        setReady(true);
      } else {
        pollInterval = setInterval(async () => {
          if (cancelled) return;
          const ok = await hydrateRoom();
          if (ok && pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
        }, 1500);
      }
    };
    init();

    return () => {
      cancelled = true;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [roomId, isHost, authLoading, session?.user?.id]);

  // ─── Continuous reconciliation poll ───
  useEffect(() => {
    if (!ready || authLoading || !session?.user?.id) return;
    const interval = setInterval(async () => {
      await rehydrateRoom();
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [ready, roomId, authLoading, session?.user?.id, rehydrateRoom]);

  // ─── Realtime postgres_changes (fallback) ───
  useEffect(() => {
    if (authLoading || !session?.user?.id) return;
    const channel = supabase
      .channel(`coop-rt-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'multiplayer_rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          const room = payload.new as any;
          const gs = room.game_state as any;
          if (!isValidCoopState(gs)) return;

          acceptSnapshot(gs, room);
          if (!ready) setReady(true);

          if (gs.lastEvent) {
            const evt = gs.lastEvent;
            if (evt.type === 'attack') {
              setMessage(`⚔️ ${evt.damage} damage to ${enemy.name}!`);
              battleSounds.correctWord();
            } else if (evt.type === 'enemy_attack') {
              setMessage(`💥 ${enemy.name} attacks for ${evt.damage}!`);
              battleSounds.fireWhoosh();
            } else if (evt.type === 'turn_switch') {
              const who = evt.by === 'host' ? hostName : guestName;
              setMessage(`🟢 ${who}'s Turn!`);
            }
          }

          if (gs.phase === 'victory') battleSounds.victoryFanfare();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId, enemy.name, ready, authLoading, session?.user?.id, acceptSnapshot, hostName, guestName]);

  // ─── Host selects mode and starts battle ───
  const startBattle = useCallback(async (mode: 'continuous' | 'repeat') => {
    const gs = makeInitialState(mode);
    gs.phase = 'playing';
    gs.rev = 1;
    setGameState(gs);
    gsRef.current = gs;
    lastQueuedRevRef.current = 1;
    const ok = await pushState(gs);
    if (!ok) {
      setInitError('Failed to start battle. Go back and try again.');
      return;
    }
    // Broadcast
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.send({
        type: 'broadcast',
        event: 'state_update',
        payload: { rev: 1 },
      });
    }
    setMessage(`🟢 ${hostName}'s Turn!`);
  }, [pushState, hostName]);

  // ─── Handle word result ───
  const handleWordResult = useCallback((correct: boolean, _spokenWord: string, _wordIndex: number) => {
    if (!isMyTurn || !gsRef.current) return;
    // Guard: only process if it's actually the playing phase and our turn (prevents stale callbacks)
    const currentGs = gsRef.current;
    if (currentGs.phase !== 'playing') return;
    const myTurnNow = (isHost && currentGs.turn === 'host') || (!isHost && currentGs.turn === 'guest');
    if (!myTurnNow) return;
    const gs = { ...gsRef.current };
    const who = isHost ? 'host' : 'guest';

    if (who === 'host') gs.hostWords += 1;
    else gs.guestWords += 1;

    if (correct) {
      gs.totalCorrect += 1;
      gs.currentStreak += 1;
      if (gs.currentStreak > gs.longestStreak) gs.longestStreak = gs.currentStreak;

      const damage = 8 + Math.min(gs.currentStreak, 5) * 2;
      gs.totalDamage += damage;
      gs.enemyHp = Math.max(0, gs.enemyHp - damage);
      gs.lastEvent = { type: 'attack', damage, by: who, timestamp: Date.now() };

      if (gs.enemyHp <= 0) {
        gs.phase = 'victory';
        commitAndPersist(gs);
        return;
      }
    } else {
      gs.currentStreak = 0;
    }

    gs.wordIndex += 1;
    gs.turnWordsRead += 1;

    // After 5 words in this turn segment → turn switch = persist to DB
    if (gs.turnWordsRead >= 5 && gs.phase === 'playing') {
      const enemyDmg = 5 + Math.floor(Math.random() * 8);
      if (who === 'host') gs.hostHp = Math.max(0, gs.hostHp - enemyDmg);
      else gs.guestHp = Math.max(0, gs.guestHp - enemyDmg);
      gs.lastEvent = { type: 'enemy_attack', damage: enemyDmg, by: who, timestamp: Date.now() };

      if (gs.hostHp <= 0 && gs.guestHp <= 0) {
        gs.phase = 'defeat';
        commitAndPersist(gs);
        return;
      }

      if (gs.coopMode === 'continuous') {
        const nextTurn = who === 'host' ? 'guest' : 'host';
        const nextHp = nextTurn === 'host' ? gs.hostHp : gs.guestHp;
        if (nextHp > 0) gs.turn = nextTurn;
        gs.turnWordsRead = 0;
      } else {
        if (gs.repeatPhase === 1) {
          gs.repeatPhase = 2;
          gs.wordIndex = gs.batchStartIndex;
          const nextTurn = who === 'host' ? 'guest' : 'host';
          const nextHp = nextTurn === 'host' ? gs.hostHp : gs.guestHp;
          if (nextHp > 0) gs.turn = nextTurn;
          gs.turnWordsRead = 0;
        } else {
          gs.repeatPhase = 1;
          gs.batchStartIndex = gs.batchStartIndex + 5;
          gs.wordIndex = gs.batchStartIndex;
          const nextTurn = who === 'host' ? 'guest' : 'host';
          const nextHp = nextTurn === 'host' ? gs.hostHp : gs.guestHp;
          if (nextHp > 0) gs.turn = nextTurn;
          gs.turnWordsRead = 0;
        }
      }

      gs.lastEvent = { type: 'turn_switch', by: gs.turn, timestamp: Date.now() };
      setReaderKey(prev => prev + 1);
      commitAndPersist(gs);
    } else {
      // Intermediate word — broadcast only, no DB write
      commitLocal(gs);
    }
  }, [isMyTurn, isHost, commitLocal, commitAndPersist]);

  // ─── Handle end state ───
  useEffect(() => {
    if (!gameState || completedRef.current) return;
    if (gameState.phase !== 'victory' && gameState.phase !== 'defeat') return;
    completedRef.current = true;
    const isWin = gameState.phase === 'victory';
    setTimeout(() => {
      onComplete(isWin, {
        wordsRead: gameState.hostWords + gameState.guestWords,
        correctWords: gameState.totalCorrect,
        longestStreak: gameState.longestStreak,
        damageDealt: gameState.totalDamage,
        xpEarned: Math.floor(gameState.totalCorrect * (isWin ? 5 : 2)),
        goldEarned: isWin ? Math.floor(gameState.totalCorrect * 2) : 0,
      });
    }, 3000);
  }, [gameState?.phase]);

  // ─── Compute words to show ───
  const getWordsForReader = (): string[] => {
    if (!gameState) return [];
    if (gameState.coopMode === 'continuous') {
      return storyWords.slice(gameState.wordIndex);
    }
    return storyWords.slice(gameState.batchStartIndex, gameState.batchStartIndex + 5);
  };

  const activePlayer: 1 | 2 = gameState?.turn === 'host' ? 1 : 2;

  // ─── SETUP SCREEN (host picks mode) ───
  if (ready && gameState && gameState.phase === 'setup' && isHost) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center"
      >
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-3xl font-black text-white mb-2">Co-Op Battle</h2>
          <p className="text-slate-400 mb-6">Choose how you'll take turns reading:</p>

          <div className="space-y-4">
            <button
              onClick={() => startBattle('continuous')}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl p-4 text-left transition-all"
            >
              <div className="flex items-center gap-3">
                <ArrowRight className="h-8 w-8 flex-shrink-0" />
                <div>
                  <p className="font-bold text-lg">Continuous Mode</p>
                  <p className="text-sm text-blue-100 opacity-80">
                    Player 1 reads words 1-5, then Player 2 reads words 6-10, and so on.
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => startBattle('repeat')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white rounded-xl p-4 text-left transition-all"
            >
              <div className="flex items-center gap-3">
                <Repeat className="h-8 w-8 flex-shrink-0" />
                <div>
                  <p className="font-bold text-lg">Repeat Mode</p>
                  <p className="text-sm text-purple-100 opacity-80">
                    Player 1 reads 5 words, then Player 2 repeats the same 5 words before moving on.
                  </p>
                </div>
              </div>
            </button>
          </div>

          <Button variant="ghost" onClick={onBack} className="text-slate-500 mt-6">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </div>
      </motion.div>
    );
  }

  // ─── SETUP SCREEN (guest waits) ───
  if (ready && gameState && gameState.phase === 'setup' && !isHost) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center"
      >
        <div className="text-center">
          <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <p className="text-white text-xl font-bold">⏳ Waiting for host to select mode...</p>
          </motion.div>
          <Button variant="ghost" onClick={onBack} className="text-slate-500 mt-4">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </div>
      </motion.div>
    );
  }

  // ─── LOADING ───
  if (!ready || !gameState) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col items-center justify-center"
      >
        {initError ? (
          <div className="bg-slate-900 border border-red-600 rounded-xl p-6 max-w-sm mx-4 text-center">
            <p className="text-red-400 font-bold mb-3">{initError}</p>
            <Button onClick={onBack} className="bg-slate-700 text-white">← Go Back</Button>
          </div>
        ) : (
          <>
            <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }}
              className="text-white text-xl font-bold">Loading battle...</motion.div>
            <LongLoadNotice
              afterSeconds={12}
              title="Battle taking too long?"
              description="The battle couldn't sync. Try going back and creating a new room."
              onRetry={onBack}
              showSignIn={false}
            />
          </>
        )}
      </motion.div>
    );
  }

  // ─── MAIN BATTLE RENDER ───
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden"
    >
      <RPGBattleBackground worldNumber={roomWorldNumber} />

      <div className="absolute top-3 left-3 z-[80]">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-white">
          <ArrowLeft className="h-4 w-4 mr-1" /> Exit
        </Button>
      </div>

      <div className="absolute top-3 right-3 z-[80] flex items-center gap-2 text-blue-400 text-xs">
        <Wifi className="h-3 w-3" /> ONLINE
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
          gameState.coopMode === 'repeat' ? 'bg-purple-500/30 text-purple-300' : 'bg-blue-500/30 text-blue-300'
        }`}>
          {gameState.coopMode === 'repeat' ? '🔁 REPEAT' : '➡️ CONTINUOUS'}
        </span>
      </div>

      <RPGCoopHUD
        player1Hp={gameState.hostHp} player1MaxHp={100} player1Name={`${hostName}${isHost ? ' (You)' : ''}`}
        player2Hp={gameState.guestHp} player2MaxHp={100} player2Name={`${guestName}${!isHost ? ' (You)' : ''}`}
        activePlayer={activePlayer}
        player1Words={gameState.hostWords} player2Words={gameState.guestWords}
        enemyHp={gameState.enemyHp} enemyMaxHp={gameState.enemyMaxHp} enemyName={enemy.name}
      />

      <AnimatePresence>
        {message && gameState.phase === 'playing' && (
          <motion.div key={message} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-36 left-1/2 -translate-x-1/2 z-[70] bg-black/80 px-6 py-3 rounded-xl border border-white/20">
            <p className="text-white font-bold">{message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Characters */}
      <div className="absolute bottom-40 left-[10%] z-[50]">
        <RPGCharacter character={heroKnight} currentHp={gameState.hostHp} isAttacking={gameState.turn === 'host' && gameState.phase === 'playing'} />
      </div>
      <div className="absolute bottom-40 left-[30%] z-[50]">
        <RPGCharacter character={allyWizard} currentHp={gameState.guestHp} isAttacking={gameState.turn === 'guest' && gameState.phase === 'playing'} />
      </div>
      <div className="absolute bottom-40 right-[15%] z-[50]">
        <RPGCharacter character={enemy} currentHp={gameState.enemyHp} isEnemy />
      </div>

      {/* Active player reads words */}
      {gameState.phase === 'playing' && isMyTurn && (
        <div className="absolute bottom-0 left-0 right-0 z-[70] p-4">
          <div className="text-center mb-2">
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${
              isHost ? 'bg-blue-500/30 text-blue-300' : 'bg-purple-500/30 text-purple-300'
            }`}>
              Your Turn ({5 - gameState.turnWordsRead} words left)
              {gameState.coopMode === 'repeat' && gameState.repeatPhase === 2 && (
                <span className="ml-2 text-yellow-300">🔁 Repeating</span>
              )}
            </span>
          </div>
          <RPGWordReader key={`reader-${readerKey}`} words={getWordsForReader()} onResult={handleWordResult} />
        </div>
      )}

      {/* Waiting for teammate */}
      {gameState.phase === 'playing' && !isMyTurn && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[70]">
          <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}
            className="bg-slate-900/80 border border-slate-600 rounded-xl px-6 py-4 text-center">
            <p className="text-slate-300 font-bold">⏳ Waiting for teammate...</p>
          </motion.div>
        </div>
      )}

      {/* Victory */}
      {gameState.phase === 'victory' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[90] flex items-center justify-center bg-black/80">
          <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="text-center">
            <Star className="h-20 w-20 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-4xl font-black text-yellow-400 mb-2">TEAM VICTORY!</h2>
            <p className="text-white text-xl">{hostName} & {guestName} defeated {enemy.name}!</p>
          </motion.div>
        </motion.div>
      )}

      {/* Defeat */}
      {gameState.phase === 'defeat' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[90] flex items-center justify-center bg-black/80">
          <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-center">
            <Shield className="h-20 w-20 text-red-400 mx-auto mb-4" />
            <h2 className="text-4xl font-black text-red-400 mb-2">TEAM DEFEATED!</h2>
            <p className="text-white text-xl">{enemy.name} was too powerful!</p>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

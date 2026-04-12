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
  worldNumber?: number;
  onBack: () => void;
  onComplete: (victory: boolean, stats: BattleStats) => void;
}

interface GameState {
  hostHp: number;
  guestHp: number;
  turn: 'host' | 'guest';
  lastEvent?: { type: string; damage?: number; by: string; timestamp: number };
  hostCorrect: number;
  guestCorrect: number;
  hostStreak: number;
  guestStreak: number;
  longestStreak: number;
  totalDamage: number;
  wordsRead: number;
  status: 'active' | 'host_wins' | 'guest_wins';
}

export const RPGOnlinePvPBattle = ({
  story,
  studentId,
  roomId,
  isHost,
  worldNumber = 1,
  onBack,
  onComplete,
}: RPGOnlinePvPBattleProps) => {
  const [gameState, setGameState] = useState<GameState>({
    hostHp: 100, guestHp: 100, turn: 'host',
    hostCorrect: 0, guestCorrect: 0,
    hostStreak: 0, guestStreak: 0,
    longestStreak: 0, totalDamage: 0, wordsRead: 0,
    status: 'active',
  });
  const [message, setMessage] = useState<string | null>('Waiting for game...');
  const [phase, setPhase] = useState<'waiting' | 'playing' | 'victory' | 'defeat'>('waiting');
  const [hostName, setHostName] = useState('Player 1');
  const [guestName, setGuestName] = useState('Player 2');
  const gameStateRef = useRef(gameState);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  const storyWords = story.passage_text.split(/\s+/).filter(w => w.length > 0);

  const isMyTurn = (isHost && gameState.turn === 'host') || (!isHost && gameState.turn === 'guest');
  const myHp = isHost ? gameState.hostHp : gameState.guestHp;
  const opponentHp = isHost ? gameState.guestHp : gameState.hostHp;
  const myRole = isHost ? 'kid' : 'parent'; // Host is the kid (reader), guest is parent

  // Subscribe to room changes
  useEffect(() => {
    // Initial load
    supabase
      .from('multiplayer_rooms')
      .select('game_state, host_name, guest_name, status')
      .eq('id', roomId)
      .single()
      .then(({ data }) => {
        if (data) {
          const gs = data.game_state as any as GameState;
          if (gs && gs.hostHp !== undefined) setGameState(gs);
          if (data.host_name) setHostName(data.host_name);
          if (data.guest_name) setGuestName(data.guest_name);
          setPhase('playing');
          setMessage(gs.turn === 'host' ? `🟢 ${data.host_name || 'Player 1'}'s turn!` : `🔴 ${data.guest_name || 'Player 2'}'s turn!`);
        }
      });

    const channel = supabase
      .channel(`pvp-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'multiplayer_rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          const room = payload.new as any;
          const gs = room.game_state as GameState;
          if (!gs) return;
          
          setGameState(gs);
          if (room.host_name) setHostName(room.host_name);
          if (room.guest_name) setGuestName(room.guest_name);

          if (gs.lastEvent) {
            const evt = gs.lastEvent;
            if (evt.type === 'attack') {
              setMessage(`⚔️ ${evt.damage} damage!`);
              battleSounds.correctWord();
            } else if (evt.type === 'ability') {
              setMessage(`💥 Ability used for ${evt.damage} damage!`);
              battleSounds.fireWhoosh();
            }
          }

          // Check win conditions
          if (gs.status === 'host_wins') {
            setPhase(isHost ? 'victory' : 'defeat');
            if (isHost) battleSounds.victoryFanfare();
          } else if (gs.status === 'guest_wins') {
            setPhase(!isHost ? 'victory' : 'defeat');
            if (!isHost) battleSounds.victoryFanfare();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId, isHost]);

  // Push state update to DB
  const pushState = useCallback(async (newState: GameState) => {
    await supabase
      .from('multiplayer_rooms')
      .update({ game_state: newState as any, status: newState.status === 'active' ? 'active' : 'completed' })
      .eq('id', roomId);
  }, [roomId]);

  // Kid reads words (host)
  const handleWordResult = useCallback((correct: boolean) => {
    if (!isMyTurn || myRole !== 'kid') return;
    
    const gs = { ...gameStateRef.current };
    gs.wordsRead += 1;

    if (correct) {
      gs.hostCorrect += 1;
      gs.hostStreak += 1;
      if (gs.hostStreak > gs.longestStreak) gs.longestStreak = gs.hostStreak;

      const damage = 8 + Math.min(gs.hostStreak, 5) * 2;
      gs.totalDamage += damage;
      gs.guestHp = Math.max(0, gs.guestHp - damage);
      gs.lastEvent = { type: 'attack', damage, by: 'host', timestamp: Date.now() };

      if (gs.hostCorrect % 5 === 0) {
        gs.turn = 'guest';
      }

      if (gs.guestHp <= 0) {
        gs.status = 'host_wins';
      }
    } else {
      gs.hostStreak = 0;
    }

    setGameState(gs);
    pushState(gs);
  }, [isMyTurn, myRole, pushState]);

  // Parent uses ability (guest)
  const handleParentAbility = useCallback((ability: ParentAbility) => {
    if (!isMyTurn || myRole !== 'parent') return;

    const gs = { ...gameStateRef.current };
    const damage = ability.damage;
    gs.hostHp = Math.max(0, gs.hostHp - damage);
    gs.lastEvent = { type: 'ability', damage, by: 'guest', timestamp: Date.now() };
    gs.turn = 'host';

    if (gs.hostHp <= 0) {
      gs.status = 'guest_wins';
    }

    setGameState(gs);
    pushState(gs);
  }, [isMyTurn, myRole, pushState]);

  // Handle end state
  useEffect(() => {
    if (phase === 'victory' || phase === 'defeat') {
      const isWin = phase === 'victory';
      setTimeout(() => {
        onComplete(isWin, {
          wordsRead: gameState.wordsRead,
          correctWords: isHost ? gameState.hostCorrect : gameState.guestCorrect,
          longestStreak: gameState.longestStreak,
          damageDealt: gameState.totalDamage,
          xpEarned: Math.floor((isHost ? gameState.hostCorrect : gameState.guestCorrect) * (isWin ? 5 : 2)),
          goldEarned: isWin ? Math.floor((isHost ? gameState.hostCorrect : gameState.guestCorrect) * 2) : 0,
        });
      }, 3000);
    }
  }, [phase]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden"
    >
      <RPGBattleBackground worldNumber={worldNumber} />

      <div className="absolute top-3 left-3 z-[80]">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-white">
          <ArrowLeft className="h-4 w-4 mr-1" /> Exit
        </Button>
      </div>

      <div className="absolute top-3 right-3 z-[80] flex items-center gap-1 text-blue-400 text-xs">
        <Wifi className="h-3 w-3" /> ONLINE
      </div>

      {/* HUD */}
      <div className="absolute top-12 left-0 right-0 z-[60] px-4">
        <div className="flex gap-4 max-w-2xl mx-auto">
          <div className={`flex-1 p-2 rounded-lg border-2 ${gameState.turn === 'host' ? 'border-green-400 bg-green-950/30' : 'border-slate-700 bg-slate-900/50'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-green-300">🦸 {hostName} {isHost ? '(You)' : ''}</span>
              <span className="text-xs text-green-400 ml-auto">{gameState.hostHp}/100</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-green-500 to-emerald-400" animate={{ width: `${gameState.hostHp}%` }} />
            </div>
          </div>
          <span className="text-white font-black text-xl self-center">VS</span>
          <div className={`flex-1 p-2 rounded-lg border-2 ${gameState.turn === 'guest' ? 'border-red-400 bg-red-950/30' : 'border-slate-700 bg-slate-900/50'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-red-300">👹 {guestName} {!isHost ? '(You)' : ''}</span>
              <span className="text-xs text-red-400 ml-auto">{gameState.guestHp}/100</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-red-500 to-red-400" animate={{ width: `${gameState.guestHp}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Message */}
      <AnimatePresence>
        {message && phase === 'playing' && (
          <motion.div key={message} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-32 left-1/2 -translate-x-1/2 z-[70] bg-black/80 px-6 py-3 rounded-xl border border-white/20">
            <p className="text-white font-bold">{message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Characters */}
      <div className="absolute bottom-40 left-[20%] z-[50]">
        <RPGCharacter character={heroKnight} currentHp={gameState.hostHp} isAttacking={gameState.turn === 'host'} />
      </div>
      <div className="absolute bottom-40 right-[20%] z-[50]">
        <RPGCharacter
          character={{ ...heroKnight, id: 'villain', name: guestName, type: 'enemy', color: '#ef4444' } as any}
          currentHp={gameState.guestHp} isEnemy
        />
      </div>

      {/* Controls based on role */}
      {phase === 'playing' && isMyTurn && myRole === 'kid' && (
        <div className="absolute bottom-0 left-0 right-0 z-[70] p-4">
          <RPGWordReader words={storyWords} onResult={handleWordResult} />
        </div>
      )}

      {phase === 'playing' && isMyTurn && myRole === 'parent' && (
        <RPGParentControls
          onSelectAbility={handleParentAbility}
          cooldowns={{}}
          parentHp={gameState.guestHp}
          parentMaxHp={100}
        />
      )}

      {phase === 'playing' && !isMyTurn && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[70]">
          <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}
            className="bg-slate-900/80 border border-slate-600 rounded-xl px-6 py-4 text-center">
            <p className="text-slate-300 font-bold">⏳ Waiting for opponent...</p>
          </motion.div>
        </div>
      )}

      {/* Victory */}
      {phase === 'victory' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[90] flex items-center justify-center bg-black/80">
          <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="text-center">
            <Star className="h-20 w-20 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-4xl font-black text-yellow-400 mb-2">YOU WIN!</h2>
          </motion.div>
        </motion.div>
      )}

      {/* Defeat */}
      {phase === 'defeat' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[90] flex items-center justify-center bg-black/80">
          <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-center">
            <Shield className="h-20 w-20 text-red-400 mx-auto mb-4" />
            <h2 className="text-4xl font-black text-red-400 mb-2">YOU LOSE!</h2>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

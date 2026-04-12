import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, Shield, Wifi } from "lucide-react";
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

const battleSounds = new SoundEffects();

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
  hostHp: number;
  guestHp: number;
  enemyHp: number;
  enemyMaxHp: number;
  turn: 'host' | 'guest';
  turnWordsRead: number;
  hostWords: number;
  guestWords: number;
  totalCorrect: number;
  longestStreak: number;
  currentStreak: number;
  totalDamage: number;
  lastEvent?: { type: string; damage?: number; by: string; timestamp: number };
  status: 'active' | 'victory' | 'defeat';
}

export const RPGOnlineCoopBattle = ({
  story,
  studentId,
  roomId,
  isHost,
  worldNumber = 1,
  onBack,
  onComplete,
}: RPGOnlineCoopBattleProps) => {
  const theme = getStoredTheme();
  const enemy = theme === 'agent' ? getAgentEnemy('guard') : getEnemyForBattle('guard');

  const [gameState, setGameState] = useState<CoopGameState>({
    hostHp: 100, guestHp: 100,
    enemyHp: enemy.maxHp, enemyMaxHp: enemy.maxHp,
    turn: 'host', turnWordsRead: 0,
    hostWords: 0, guestWords: 0,
    totalCorrect: 0, longestStreak: 0, currentStreak: 0, totalDamage: 0,
    status: 'active',
  });
  const [phase, setPhase] = useState<'waiting' | 'playing' | 'victory' | 'defeat'>('waiting');
  const [message, setMessage] = useState<string | null>('Waiting for game...');
  const [hostName, setHostName] = useState('Player 1');
  const [guestName, setGuestName] = useState('Player 2');
  const gameStateRef = useRef(gameState);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  const storyWords = story.passage_text.split(/\s+/).filter(w => w.length > 0);
  const isMyTurn = (isHost && gameState.turn === 'host') || (!isHost && gameState.turn === 'guest');

  useEffect(() => {
    supabase
      .from('multiplayer_rooms')
      .select('game_state, host_name, guest_name')
      .eq('id', roomId)
      .single()
      .then(({ data }) => {
        if (data) {
          const gs = data.game_state as any as CoopGameState;
          if (gs && gs.enemyHp !== undefined) setGameState(gs);
          if (data.host_name) setHostName(data.host_name);
          if (data.guest_name) setGuestName(data.guest_name);
          setPhase('playing');
          setMessage(`🟢 ${data.host_name || 'Player 1'}'s Turn!`);
        }
      });

    const channel = supabase
      .channel(`coop-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'multiplayer_rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          const room = payload.new as any;
          const gs = room.game_state as CoopGameState;
          if (!gs) return;
          
          setGameState(gs);
          if (room.host_name) setHostName(room.host_name);
          if (room.guest_name) setGuestName(room.guest_name);

          if (gs.lastEvent) {
            const evt = gs.lastEvent;
            if (evt.type === 'attack') {
              setMessage(`⚔️ ${evt.damage} damage to ${enemy.name}!`);
              battleSounds.correctWord();
            } else if (evt.type === 'enemy_attack') {
              setMessage(`💥 ${enemy.name} attacks for ${evt.damage}!`);
              battleSounds.fireWhoosh();
            } else if (evt.type === 'turn_switch') {
              setMessage(`🟢 ${evt.by === 'host' ? room.host_name : room.guest_name}'s Turn!`);
            }
          }

          if (gs.status === 'victory') {
            setPhase('victory');
            battleSounds.victoryFanfare();
          } else if (gs.status === 'defeat') {
            setPhase('defeat');
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId, enemy.name]);

  const pushState = useCallback(async (newState: CoopGameState) => {
    await supabase
      .from('multiplayer_rooms')
      .update({ game_state: newState as any, status: newState.status === 'active' ? 'active' : 'completed' })
      .eq('id', roomId);
  }, [roomId]);

  const handleWordResult = useCallback((correct: boolean) => {
    if (!isMyTurn) return;

    const gs = { ...gameStateRef.current };
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
        gs.status = 'victory';
      }
    } else {
      gs.currentStreak = 0;
    }

    gs.turnWordsRead += 1;
    if (gs.turnWordsRead >= 5 && gs.status === 'active') {
      const enemyDmg = 5 + Math.floor(Math.random() * 8);
      if (who === 'host') gs.hostHp = Math.max(0, gs.hostHp - enemyDmg);
      else gs.guestHp = Math.max(0, gs.guestHp - enemyDmg);
      
      gs.lastEvent = { type: 'enemy_attack', damage: enemyDmg, by: who, timestamp: Date.now() };

      if (gs.hostHp <= 0 && gs.guestHp <= 0) {
        gs.status = 'defeat';
      } else {
        const nextTurn = who === 'host' ? 'guest' : 'host';
        const nextHp = nextTurn === 'host' ? gs.hostHp : gs.guestHp;
        if (nextHp > 0) {
          gs.turn = nextTurn;
        }
        gs.turnWordsRead = 0;
      }
    }

    setGameState(gs);
    pushState(gs);
  }, [isMyTurn, isHost, pushState]);

  useEffect(() => {
    if (phase === 'victory' || phase === 'defeat') {
      const isWin = phase === 'victory';
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
    }
  }, [phase]);

  const activePlayer: 1 | 2 = gameState.turn === 'host' ? 1 : 2;

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

      {phase !== 'waiting' && (
        <RPGCoopHUD
          player1Hp={gameState.hostHp} player1MaxHp={100} player1Name={`${hostName}${isHost ? ' (You)' : ''}`}
          player2Hp={gameState.guestHp} player2MaxHp={100} player2Name={`${guestName}${!isHost ? ' (You)' : ''}`}
          activePlayer={activePlayer}
          player1Words={gameState.hostWords} player2Words={gameState.guestWords}
          enemyHp={gameState.enemyHp} enemyMaxHp={gameState.enemyMaxHp} enemyName={enemy.name}
        />
      )}

      <AnimatePresence>
        {message && phase === 'playing' && (
          <motion.div key={message} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-36 left-1/2 -translate-x-1/2 z-[70] bg-black/80 px-6 py-3 rounded-xl border border-white/20">
            <p className="text-white font-bold">{message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-40 left-[10%] z-[50]">
        <RPGCharacter character={heroKnight} currentHp={gameState.hostHp} isAttacking={gameState.turn === 'host' && phase === 'playing'} />
      </div>
      <div className="absolute bottom-40 left-[30%] z-[50]">
        <RPGCharacter character={allyWizard} currentHp={gameState.guestHp} isAttacking={gameState.turn === 'guest' && phase === 'playing'} />
      </div>
      <div className="absolute bottom-40 right-[15%] z-[50]">
        <RPGCharacter character={enemy} currentHp={gameState.enemyHp} isEnemy />
      </div>

      {phase === 'playing' && isMyTurn && (
        <div className="absolute bottom-0 left-0 right-0 z-[70] p-4">
          <div className="text-center mb-2">
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${
              isHost ? 'bg-blue-500/30 text-blue-300' : 'bg-purple-500/30 text-purple-300'
            }`}>
              Your Turn ({5 - gameState.turnWordsRead} words left)
            </span>
          </div>
          <RPGWordReader words={storyWords} onResult={handleWordResult} />
        </div>
      )}

      {phase === 'playing' && !isMyTurn && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[70]">
          <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}
            className="bg-slate-900/80 border border-slate-600 rounded-xl px-6 py-4 text-center">
            <p className="text-slate-300 font-bold">⏳ Waiting for teammate...</p>
          </motion.div>
        </div>
      )}

      {phase === 'victory' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[90] flex items-center justify-center bg-black/80">
          <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="text-center">
            <Star className="h-20 w-20 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-4xl font-black text-yellow-400 mb-2">TEAM VICTORY!</h2>
            <p className="text-white text-xl">{hostName} & {guestName} defeated {enemy.name}!</p>
          </motion.div>
        </motion.div>
      )}

      {phase === 'defeat' && (
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

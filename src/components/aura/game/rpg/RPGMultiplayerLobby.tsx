import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Loader2, Users, Wifi, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  MULTIPLAYER_ROOM_SNAPSHOT_COLUMNS,
  MultiplayerRoomReadyPayload,
  MultiplayerRoomSnapshot,
} from "./multiplayerRoomTypes";

interface RPGMultiplayerLobbyProps {
  battleMode: 'pvp' | 'coop';
  studentId: string;
  storyPassage: string;
  storyTitle: string;
  worldNumber: number;
  gradeMode: string;
  enemyType?: string;
  onRoomReady: (payload: MultiplayerRoomReadyPayload) => void;
  onBack: () => void;
}

const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

export const RPGMultiplayerLobby = ({
  battleMode,
  studentId,
  storyPassage,
  storyTitle,
  worldNumber,
  gradeMode,
  enemyType = 'guard',
  onRoomReady,
  onBack,
}: RPGMultiplayerLobbyProps) => {
  const [view, setView] = useState<'choose' | 'hosting' | 'joining'>('choose');
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);

  const getCurrentUserId = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session?.user?.id ?? null;
  }, []);

  const toRoomSnapshot = useCallback((room: any): MultiplayerRoomSnapshot | null => {
    if (!room?.id) return null;

    return {
      id: room.id,
      room_code: room.room_code ?? null,
      status: room.status ?? null,
      host_id: room.host_id ?? null,
      guest_id: room.guest_id ?? null,
      host_name: room.host_name ?? null,
      guest_name: room.guest_name ?? null,
      story_passage: room.story_passage ?? null,
      story_title: room.story_title ?? null,
      world_number: typeof room.world_number === 'number' ? room.world_number : null,
      enemy_type: room.enemy_type ?? null,
      game_state: room.game_state,
    };
  }, []);

  // Host: create room and wait for guest
  const handleCreateRoom = useCallback(async () => {
    setLoading(true);
    setError(null);

    let userId: string | null = null;

    try {
      userId = await getCurrentUserId();
    } catch (authError) {
      console.error('[Lobby] Failed to read session before room creation:', authError);
    }

    if (!userId) {
      setError('You must be signed in to create a room. Refresh and try again.');
      setLoading(false);
      return;
    }

    const code = generateRoomCode();

    // Seed game_state at creation time so both players can hydrate immediately
    const initialGameState = battleMode === 'pvp'
      ? {
          hostHp: 100, guestHp: 100, turn: 'host', phase: 'kid_turn',
          wordIndex: 0, hostCorrect: 0, guestCorrect: 0,
          hostStreak: 0, guestStreak: 0, longestStreak: 0,
          totalDamage: 0, wordsRead: 0, cooldowns: {},
          pendingAbility: null, pendingReadWord: null,
          activeMiniGame: null, lastEvent: null, turnCount: 0,
        }
      : {
          hostHp: 100, guestHp: 100, enemyHp: 150, enemyMaxHp: 150,
          turn: 'host', wordIndex: 0, batchStartIndex: 0,
          turnWordsRead: 0, hostWords: 0, guestWords: 0,
          totalCorrect: 0, longestStreak: 0, currentStreak: 0,
          totalDamage: 0, coopMode: 'continuous', repeatPhase: 1,
          phase: 'setup', lastEvent: null,
        };

    const { data, error: err } = await supabase
      .from('multiplayer_rooms')
      .insert({
        room_code: code,
        mode: battleMode,
        host_id: userId,
        host_name: 'Player 1',
        story_passage: storyPassage,
        story_title: storyTitle,
        world_number: worldNumber,
        grade_mode: gradeMode,
        enemy_type: enemyType,
        status: 'waiting',
        game_state: initialGameState,
      })
      .select('id')
      .single();

    if (err) {
      console.error('[Lobby] Failed to create room:', err);
      setError(err.message || 'Failed to create room. Try again.');
      setLoading(false);
      return;
    }

    setRoomCode(code);
    setRoomId(data.id);
    setView('hosting');
    setLoading(false);
  }, [battleMode, storyPassage, storyTitle, worldNumber, gradeMode, enemyType, getCurrentUserId]);

  // Listen for guest joining — realtime + polling + immediate check
  const transitionedRef = useRef(false);

  useEffect(() => {
    if (view !== 'hosting' || !roomId) return;
    transitionedRef.current = false;

    const tryTransition = (snapshot?: MultiplayerRoomSnapshot | null) => {
      if (transitionedRef.current) return;
      transitionedRef.current = true;
      console.log('[Lobby] Host transitioning to game for room', roomId);
      onRoomReady({
        roomId,
        isHost: true,
        roomCode: snapshot?.room_code || roomCode,
        snapshot: snapshot ?? null,
      });
    };

    const checkRoom = async () => {
      if (transitionedRef.current) return;
      const { data } = await supabase
        .from('multiplayer_rooms')
        .select(MULTIPLAYER_ROOM_SNAPSHOT_COLUMNS)
        .eq('id', roomId)
        .maybeSingle();

      const snapshot = toRoomSnapshot(data);
      if (snapshot?.guest_id && snapshot.status === 'active') {
        tryTransition(snapshot);
      }
    };

    // Immediate check in case guest already joined
    checkRoom();

    // Realtime subscription
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'multiplayer_rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          const room = toRoomSnapshot(payload.new as any);
          if (room?.guest_id && room.status === 'active') {
            tryTransition(room);
          }
        }
      )
      .subscribe();

    // Polling fallback every 2s
    const poll = setInterval(checkRoom, 2000);

    return () => {
      transitionedRef.current = true;
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [view, roomId, roomCode, onRoomReady, toRoomSnapshot]);

  // Guest: join room by code
  const handleJoinRoom = useCallback(async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      setError('Room code must be 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);
    setView('joining');

    let userId: string | null = null;

    try {
      userId = await getCurrentUserId();
    } catch (authError) {
      console.error('[Lobby] Failed to read session before joining room:', authError);
    }

    if (!userId) {
      setError('You must be signed in to join a room. Refresh and try again.');
      setLoading(false);
      return;
    }

    // Find the room
    const { data: room, error: findErr } = await supabase
      .from('multiplayer_rooms')
      .select('id, host_id, status')
      .eq('room_code', code)
      .eq('status', 'waiting')
      .maybeSingle();

    if (findErr || !room) {
      setError('Room not found or already started.');
      setLoading(false);
      return;
    }

    if (room.host_id === userId) {
      setError("You can't join your own room!");
      setLoading(false);
      return;
    }

    // Join the room
    const { data: joinedRoom, error: joinErr } = await supabase
      .from('multiplayer_rooms')
      .update({ guest_id: userId, guest_name: 'Player 2', status: 'active' })
      .eq('id', room.id)
      .select(MULTIPLAYER_ROOM_SNAPSHOT_COLUMNS)
      .maybeSingle();

    if (joinErr) {
      console.error('[Lobby] Failed to join room:', joinErr);
      setError(joinErr.message || 'Failed to join room.');
      setLoading(false);
      setView('choose');
      return;
    }

    setLoading(false);
    onRoomReady({
      roomId: room.id,
      isHost: false,
      roomCode: code,
      snapshot: toRoomSnapshot(joinedRoom),
    });
  }, [joinCode, onRoomReady, getCurrentUserId, toRoomSnapshot]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Wifi className="h-5 w-5 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Online {battleMode === 'pvp' ? 'PvP' : 'Co-op'}</h2>
        </div>

        {/* Choose: Create or Join */}
        {view === 'choose' && (
          <div className="space-y-4">
            <Button
              onClick={handleCreateRoom}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white font-bold py-6 text-lg"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
              {battleMode === 'pvp' ? '🎮 Students Click Here to Create a Match' : '🏠 Create Room'}
            </Button>
            <div className="text-center text-slate-500 text-sm">— or —</div>
            <div className="space-y-2">
              <p className="text-slate-300 text-sm text-center font-medium">
                {battleMode === 'pvp' ? "🧑‍🦳 Parents Enter a Code Here to Join Your Student's Match" : 'Enter a room code to join'}
              </p>
              <input
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter room code"
                maxLength={6}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white text-center text-2xl font-mono tracking-widest placeholder:text-slate-600 placeholder:text-base placeholder:tracking-normal"
              />
              <Button
                onClick={handleJoinRoom}
                disabled={loading || joinCode.length < 6}
                className="w-full bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold py-4"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                🤝 Join Room
              </Button>
            </div>
          </div>
        )}

        {/* Hosting: Waiting for guest */}
        {view === 'hosting' && (
          <div className="text-center space-y-6">
            <div>
              <p className="text-slate-400 mb-3">Share this code with your partner:</p>
              <div className="bg-slate-800 border-2 border-blue-500/50 rounded-xl p-4 mb-2">
                <p className="text-4xl font-mono font-black text-blue-300 tracking-[0.3em]">{roomCode}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleCopyCode} className="text-slate-300 border-slate-600">
                {copied ? <Check className="h-4 w-4 mr-1 text-green-400" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? 'Copied!' : 'Copy Code'}
              </Button>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
              <p className="text-slate-300">Waiting for player 2 to join...</p>
            </div>
            <p className="text-slate-500 text-xs">Room expires in 30 minutes</p>
          </div>
        )}

        {/* Joining view (shown briefly) */}
        {view === 'joining' && (
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400 mx-auto mb-3" />
            <p className="text-white font-bold">Joining room...</p>
          </div>
        )}

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm text-center mt-4 bg-red-950/30 border border-red-800/50 rounded-lg px-3 py-2"
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
};

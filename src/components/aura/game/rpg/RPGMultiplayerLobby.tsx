import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Loader2, Users, Wifi, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface RPGMultiplayerLobbyProps {
  battleMode: 'pvp' | 'coop';
  studentId: string;
  storyPassage: string;
  storyTitle: string;
  worldNumber: number;
  gradeMode: string;
  onRoomReady: (roomId: string, isHost: boolean, roomCode: string) => void;
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

  // Host: create room and wait for guest
  const handleCreateRoom = useCallback(async () => {
    setLoading(true);
    setError(null);
    const code = generateRoomCode();

    const { data, error: err } = await supabase
      .from('multiplayer_rooms')
      .insert({
        room_code: code,
        mode: battleMode,
        host_id: studentId,
        host_name: 'Player 1',
        story_passage: storyPassage,
        story_title: storyTitle,
        world_number: worldNumber,
        grade_mode: gradeMode,
        status: 'waiting',
        game_state: { hostHp: 100, guestHp: 100, enemyHp: 150, turn: 'host', events: [] },
      })
      .select('id')
      .single();

    if (err) {
      setError('Failed to create room. Try again.');
      setLoading(false);
      return;
    }

    setRoomCode(code);
    setRoomId(data.id);
    setView('hosting');
    setLoading(false);
  }, [battleMode, studentId, storyPassage, storyTitle, worldNumber, gradeMode]);

  // Listen for guest joining
  useEffect(() => {
    if (view !== 'hosting' || !roomId) return;

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'multiplayer_rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          const room = payload.new as any;
          if (room.guest_id && room.status === 'active') {
            onRoomReady(roomId, true, roomCode);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [view, roomId, roomCode, onRoomReady]);

  // Guest: join room by code
  const handleJoinRoom = useCallback(async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      setError('Room code must be 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);

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

    if (room.host_id === studentId) {
      setError("You can't join your own room!");
      setLoading(false);
      return;
    }

    // Join the room
    const { error: joinErr } = await supabase
      .from('multiplayer_rooms')
      .update({ guest_id: studentId, guest_name: 'Player 2', status: 'active' })
      .eq('id', room.id);

    if (joinErr) {
      setError('Failed to join room.');
      setLoading(false);
      return;
    }

    setLoading(false);
    onRoomReady(room.id, false, code);
  }, [joinCode, studentId, onRoomReady]);

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

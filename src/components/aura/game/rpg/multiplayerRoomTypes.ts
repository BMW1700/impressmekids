export interface MultiplayerRoomSnapshot {
  id: string;
  room_code?: string | null;
  status?: string | null;
  host_id?: string | null;
  guest_id?: string | null;
  host_name?: string | null;
  guest_name?: string | null;
  story_passage?: string | null;
  story_title?: string | null;
  world_number?: number | null;
  enemy_type?: string | null;
  game_state?: unknown;
}

export interface MultiplayerRoomReadyPayload {
  roomId: string;
  isHost: boolean;
  roomCode: string;
  snapshot?: MultiplayerRoomSnapshot | null;
}

export const MULTIPLAYER_ROOM_SNAPSHOT_COLUMNS = [
  'id',
  'room_code',
  'status',
  'host_id',
  'guest_id',
  'host_name',
  'guest_name',
  'story_passage',
  'story_title',
  'world_number',
  'enemy_type',
  'game_state',
].join(', ');

/** PvP game state stored in game_state column */
export interface OnlinePvPGameState {
  rev: number; // monotonic revision counter
  hostHp: number;
  guestHp: number;
  turn: 'host' | 'guest';
  phase: 'kid_turn' | 'parent_turn' | 'parent_reading' | 'mini_game' | 'host_wins' | 'guest_wins';
  wordIndex: number; // start of current 5-word batch in story
  batchProgress: number; // how many of the 5 words in this batch have been processed (0-4 then flip)
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
  lastEvent?: { type: string; damage?: number; by: string; message?: string; abilityId?: string; timestamp: number } | null;
  turnCount: number;
}

export const INITIAL_PVP_STATE: OnlinePvPGameState = {
  rev: 0,
  hostHp: 100,
  guestHp: 100,
  turn: 'host',
  phase: 'kid_turn',
  wordIndex: 0,
  batchProgress: 0,
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
export const isValidPvPState = (gs: any): gs is OnlinePvPGameState =>
  gs && typeof gs === 'object' && typeof gs.phase === 'string' && typeof gs.hostHp === 'number';

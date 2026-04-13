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
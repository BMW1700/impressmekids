export interface Tournament {
  id: string;
  classroom_id: string;
  name: string;
  status: string;
  created_at: string;
  started_at?: string;
  ended_at?: string;
}

export interface Match {
  id: string;
  tournament_id: string;
  round: number;
  status: string;
  score_a: number;
  score_b: number;
  player_a: string;
  player_b: string;
  winner_tournament_player_id?: string;
}

export interface MatchEvent {
  id: string;
  match_id: string;
  seq: number;
  question_id: string;
  shown_at: string;
  buzz_owner_tournament_player_id?: string;
  buzz_at?: string;
  answer_deadline?: string;
  answered_by_tournament_player_id?: string;
  answer_text?: string;
  correct?: boolean;
  resolved_at?: string;
}

export interface MatchState {
  match_id: string;
  round_starts_at?: string;
  round_ends_at?: string;
  current_seq: number;
  accepting_buzz: boolean;
}

// NOTE: This hook has been intentionally gutted to avoid realtime-induced glitches.
// It now returns empty collections and performs no subscriptions or polling.
export const useTournamentRealtime = (tournamentId?: string) => {
  return {
    tournaments: [] as Tournament[],
    matches: [] as Match[],
    matchEvents: {} as Record<string, MatchEvent[]>,
    matchStates: {} as Record<string, MatchState>,
  };
};

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Tournament {
  id: string;
  classroom_id: string;
  name: string;
  status: string;
  created_at: string;
  started_at?: string;
  ended_at?: string;
}

interface Match {
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

interface MatchEvent {
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

interface MatchState {
  match_id: string;
  round_starts_at?: string;
  round_ends_at?: string;
  current_seq: number;
  accepting_buzz: boolean;
}

export const useTournamentRealtime = (tournamentId?: string) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchEvents, setMatchEvents] = useState<Record<string, MatchEvent[]>>({});
  const [matchStates, setMatchStates] = useState<Record<string, MatchState>>({});

  useEffect(() => {
    if (!tournamentId) return;

    const channels: RealtimeChannel[] = [];

    // Initial fetch of existing data
    const fetchInitialData = async () => {
      // Fetch tournament
      const { data: tournamentData } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();
      
      if (tournamentData) {
        setTournaments([tournamentData]);
      }

      // Fetch existing matches
      const { data: matchData } = await supabase
        .from('matches')
        .select('*')
        .eq('tournament_id', tournamentId);
      
      if (matchData && matchData.length > 0) {
        setMatches(matchData);
        
        // Fetch match states
        const matchIds = matchData.map(m => m.id);
        const { data: stateData } = await supabase
          .from('match_state')
          .select('*')
          .in('match_id', matchIds);
        
        if (stateData) {
          const stateMap: Record<string, MatchState> = {};
          stateData.forEach(s => {
            stateMap[s.match_id] = s;
          });
          setMatchStates(stateMap);
        }

        // Fetch match events  
        const { data: eventsData } = await supabase
          .from('match_events')
          .select('*')
          .in('match_id', matchIds)
          .order('seq');
        
        if (eventsData) {
          const eventsMap: Record<string, MatchEvent[]> = {};
          eventsData.forEach(e => {
            if (!eventsMap[e.match_id]) eventsMap[e.match_id] = [];
            eventsMap[e.match_id].push(e);
          });
          setMatchEvents(eventsMap);
        }
      }
    };

    fetchInitialData();

    // Realtime subscriptions should handle updates, but keep slow polling as fallback
    const pollInterval = setInterval(() => {
      fetchInitialData();
    }, 10000); // Slow polling - 10 seconds as fallback only

    // Subscribe to tournament changes
    const tournamentChannel = supabase
      .channel(`tournament:${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournaments',
          filter: `id=eq.${tournamentId}`,
        },
        (payload) => {
          console.log('Tournament update:', payload);
          if (payload.eventType === 'UPDATE') {
            setTournaments((prev) => {
              const updated = prev.map((t) =>
                t.id === payload.new.id ? (payload.new as Tournament) : t
              );
              return updated.length ? updated : [...prev, payload.new as Tournament];
            });
          }
        }
      )
      .subscribe();

    channels.push(tournamentChannel);

    // Subscribe to match changes
    const matchChannel = supabase
      .channel(`matches:${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        (payload) => {
          console.log('Match update:', payload);
          if (payload.eventType === 'INSERT') {
            setMatches((prev) => [...prev, payload.new as Match]);
          } else if (payload.eventType === 'UPDATE') {
            setMatches((prev) =>
              prev.map((m) => (m.id === payload.new.id ? (payload.new as Match) : m))
            );
          }
        }
      )
      .subscribe();

    channels.push(matchChannel);

    // Subscribe to match events
    const eventChannel = supabase
      .channel(`match_events:${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_events',
        },
        (payload) => {
          console.log('Match event update:', payload);
          const event = payload.new as MatchEvent;
          if (event) {
            setMatchEvents((prev) => ({
              ...prev,
              [event.match_id]: [
                ...(prev[event.match_id] || []).filter((e) => e.id !== event.id),
                event,
              ].sort((a, b) => a.seq - b.seq),
            }));
          }
        }
      )
      .subscribe();

    channels.push(eventChannel);

    // Subscribe to match state changes
    const stateChannel = supabase
      .channel(`match_state:${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_state',
        },
        (payload) => {
          console.log('Match state update:', payload);
          const state = payload.new as MatchState;
          if (state) {
            setMatchStates((prev) => ({
              ...prev,
              [state.match_id]: state,
            }));
          }
        }
      )
      .subscribe();

    channels.push(stateChannel);

    return () => {
      clearInterval(pollInterval);
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [tournamentId]);

  return {
    tournaments,
    matches,
    matchEvents,
    matchStates,
  };
};

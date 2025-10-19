export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      answers: {
        Row: {
          answer_text: string
          correct: boolean
          created_at: string
          grading_method: string
          id: string
          match_event_id: string
          points_awarded: number
          tournament_player_id: string
        }
        Insert: {
          answer_text: string
          correct: boolean
          created_at?: string
          grading_method: string
          id?: string
          match_event_id: string
          points_awarded?: number
          tournament_player_id: string
        }
        Update: {
          answer_text?: string
          correct?: boolean
          created_at?: string
          grading_method?: string
          id?: string
          match_event_id?: string
          points_awarded?: number
          tournament_player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_match_event_id_fkey"
            columns: ["match_event_id"]
            isOneToOne: false
            referencedRelation: "match_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_tournament_player_id_fkey"
            columns: ["tournament_player_id"]
            isOneToOne: false
            referencedRelation: "tournament_players"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_answers: {
        Row: {
          answer_data: Json
          answer_type: Database["public"]["Enums"]["question_type"]
          aura_record_id: string | null
          created_at: string
          id: string
          is_correct: boolean | null
          points_earned: number | null
          question_id: string
          status: Database["public"]["Enums"]["answer_status"]
          submission_id: string
          updated_at: string
        }
        Insert: {
          answer_data?: Json
          answer_type: Database["public"]["Enums"]["question_type"]
          aura_record_id?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          points_earned?: number | null
          question_id: string
          status?: Database["public"]["Enums"]["answer_status"]
          submission_id: string
          updated_at?: string
        }
        Update: {
          answer_data?: Json
          answer_type?: Database["public"]["Enums"]["question_type"]
          aura_record_id?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          points_earned?: number | null
          question_id?: string
          status?: Database["public"]["Enums"]["answer_status"]
          submission_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_answers_aura_record_id_fkey"
            columns: ["aura_record_id"]
            isOneToOne: false
            referencedRelation: "aura_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "assignment_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_answers_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "assignment_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_questions: {
        Row: {
          assignment_id: string
          created_at: string
          id: string
          points: number
          question_data: Json
          question_type: Database["public"]["Enums"]["question_type"]
          sequence: number
          updated_at: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          id?: string
          points?: number
          question_data?: Json
          question_type: Database["public"]["Enums"]["question_type"]
          sequence: number
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          id?: string
          points?: number
          question_data?: Json
          question_type?: Database["public"]["Enums"]["question_type"]
          sequence?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_questions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          attempt_number: number
          created_at: string
          grade: number | null
          graded_at: string | null
          id: string
          started_at: string | null
          status: string
          student_id: string
          submitted_at: string | null
          teacher_feedback: string | null
          time_taken_seconds: number | null
          timer_expired: boolean | null
          updated_at: string
        }
        Insert: {
          assignment_id: string
          attempt_number?: number
          created_at?: string
          grade?: number | null
          graded_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          student_id: string
          submitted_at?: string | null
          teacher_feedback?: string | null
          time_taken_seconds?: number | null
          timer_expired?: boolean | null
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          attempt_number?: number
          created_at?: string
          grade?: number | null
          graded_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          student_id?: string
          submitted_at?: string | null
          teacher_feedback?: string | null
          time_taken_seconds?: number | null
          timer_expired?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          assignment_type: string
          classroom_id: string
          created_at: string
          description: string | null
          due_date: string | null
          enable_realtime_coaching: boolean | null
          id: string
          max_attempts: number
          passage_metadata: Json | null
          passage_text: string
          question_count: number | null
          status: string
          teacher_id: string
          timer_minutes: number | null
          title: string
          updated_at: string
        }
        Insert: {
          assignment_type?: string
          classroom_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          enable_realtime_coaching?: boolean | null
          id?: string
          max_attempts?: number
          passage_metadata?: Json | null
          passage_text: string
          question_count?: number | null
          status?: string
          teacher_id: string
          timer_minutes?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          assignment_type?: string
          classroom_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          enable_realtime_coaching?: boolean | null
          id?: string
          max_attempts?: number
          passage_metadata?: Json | null
          passage_text?: string
          question_count?: number | null
          status?: string
          teacher_id?: string
          timer_minutes?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      aura_processing_failures: {
        Row: {
          created_at: string
          error_json: Json
          id: string
          profile_id: string | null
          request_id: string
        }
        Insert: {
          created_at?: string
          error_json: Json
          id?: string
          profile_id?: string | null
          request_id: string
        }
        Update: {
          created_at?: string
          error_json?: Json
          id?: string
          profile_id?: string | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aura_processing_failures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      aura_records: {
        Row: {
          annotation_quality_score: number | null
          asr_confidence: number
          audio_url: string
          avg_silence_ms: number
          bloom_taxonomy_distribution: Json | null
          clarity: number
          coaching_effectiveness: number | null
          comprehension_score: number | null
          confidence: number
          context_text: string | null
          created_at: string
          diarization_confidence: number | null
          difficulty_score: number | null
          duration_s: number
          evidence: Json | null
          feedback: Json
          grade: number | null
          highlight_count: number | null
          highlight_patterns: Json | null
          id: string
          language: string
          literacy_transfer_matrix: Json | null
          pace: number
          pause_count: number
          performance_metrics: Json | null
          profile_id: string
          pronunciation_flags: Json | null
          prosody_comprehension_correlation: Json | null
          question_id: string | null
          reading_assignment_id: string | null
          reading_type: string | null
          realtime_feedback: Json | null
          request_id: string
          semantic_clusters: Json | null
          speaker_segments: Json | null
          suggested_exercises: Json | null
          transcript: string
          words: number
          wpm: number
        }
        Insert: {
          annotation_quality_score?: number | null
          asr_confidence: number
          audio_url: string
          avg_silence_ms: number
          bloom_taxonomy_distribution?: Json | null
          clarity: number
          coaching_effectiveness?: number | null
          comprehension_score?: number | null
          confidence: number
          context_text?: string | null
          created_at?: string
          diarization_confidence?: number | null
          difficulty_score?: number | null
          duration_s: number
          evidence?: Json | null
          feedback?: Json
          grade?: number | null
          highlight_count?: number | null
          highlight_patterns?: Json | null
          id?: string
          language: string
          literacy_transfer_matrix?: Json | null
          pace: number
          pause_count: number
          performance_metrics?: Json | null
          profile_id: string
          pronunciation_flags?: Json | null
          prosody_comprehension_correlation?: Json | null
          question_id?: string | null
          reading_assignment_id?: string | null
          reading_type?: string | null
          realtime_feedback?: Json | null
          request_id: string
          semantic_clusters?: Json | null
          speaker_segments?: Json | null
          suggested_exercises?: Json | null
          transcript: string
          words: number
          wpm: number
        }
        Update: {
          annotation_quality_score?: number | null
          asr_confidence?: number
          audio_url?: string
          avg_silence_ms?: number
          bloom_taxonomy_distribution?: Json | null
          clarity?: number
          coaching_effectiveness?: number | null
          comprehension_score?: number | null
          confidence?: number
          context_text?: string | null
          created_at?: string
          diarization_confidence?: number | null
          difficulty_score?: number | null
          duration_s?: number
          evidence?: Json | null
          feedback?: Json
          grade?: number | null
          highlight_count?: number | null
          highlight_patterns?: Json | null
          id?: string
          language?: string
          literacy_transfer_matrix?: Json | null
          pace?: number
          pause_count?: number
          performance_metrics?: Json | null
          profile_id?: string
          pronunciation_flags?: Json | null
          prosody_comprehension_correlation?: Json | null
          question_id?: string | null
          reading_assignment_id?: string | null
          reading_type?: string | null
          realtime_feedback?: Json | null
          request_id?: string
          semantic_clusters?: Json | null
          speaker_segments?: Json | null
          suggested_exercises?: Json | null
          transcript?: string
          words?: number
          wpm?: number
        }
        Relationships: [
          {
            foreignKeyName: "aura_records_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aura_records_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aura_records_reading_assignment_id_fkey"
            columns: ["reading_assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_announcements: {
        Row: {
          announcement_type: string
          classroom_id: string
          content: string
          created_at: string
          id: string
          teacher_id: string
          title: string
        }
        Insert: {
          announcement_type?: string
          classroom_id: string
          content: string
          created_at?: string
          id?: string
          teacher_id: string
          title: string
        }
        Update: {
          announcement_type?: string
          classroom_id?: string
          content?: string
          created_at?: string
          id?: string
          teacher_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_announcements_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_students: {
        Row: {
          classroom_id: string
          id: string
          joined_at: string
          student_id: string
        }
        Insert: {
          classroom_id: string
          id?: string
          joined_at?: string
          student_id: string
        }
        Update: {
          classroom_id?: string
          id?: string
          joined_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_students_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classrooms: {
        Row: {
          created_at: string
          id: string
          join_code: string
          name: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          join_code: string
          name: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          id?: string
          join_code?: string
          name?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classrooms_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_anchors: {
        Row: {
          anchor_meta: Json | null
          canonical_phonemes: Json
          created_at: string
          difficulty: string
          grade: number
          id: string
          word: string
        }
        Insert: {
          anchor_meta?: Json | null
          canonical_phonemes: Json
          created_at?: string
          difficulty: string
          grade: number
          id?: string
          word: string
        }
        Update: {
          anchor_meta?: Json | null
          canonical_phonemes?: Json
          created_at?: string
          difficulty?: string
          grade?: number
          id?: string
          word?: string
        }
        Relationships: []
      }
      district_admins: {
        Row: {
          created_at: string
          district_name: string
          email: string
          full_name: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          district_name: string
          email: string
          full_name: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          district_name?: string
          email?: string
          full_name?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      districts: {
        Row: {
          created_at: string
          email_domains: string[]
          id: string
          logo_url: string | null
          name: string
          primary_contact_email: string | null
          slug: string
          subscription_tier: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email_domains?: string[]
          id?: string
          logo_url?: string | null
          name: string
          primary_contact_email?: string | null
          slug: string
          subscription_tier?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email_domains?: string[]
          id?: string
          logo_url?: string | null
          name?: string
          primary_contact_email?: string | null
          slug?: string
          subscription_tier?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      flashcard_sets: {
        Row: {
          classroom_id: string
          created_at: string
          created_by: string
          description: string | null
          flashcards: Json
          id: string
          question_group_id: string
          title: string
          updated_at: string
        }
        Insert: {
          classroom_id: string
          created_at?: string
          created_by: string
          description?: string | null
          flashcards?: Json
          id?: string
          question_group_id: string
          title: string
          updated_at?: string
        }
        Update: {
          classroom_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          flashcards?: Json
          id?: string
          question_group_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_sets_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcard_sets_question_group_id_fkey"
            columns: ["question_group_id"]
            isOneToOne: false
            referencedRelation: "question_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      game_answers: {
        Row: {
          answer_text: string
          created_at: string
          game_round_id: string
          id: string
          player_id: string
          response_time_ms: number | null
          was_correct: boolean
        }
        Insert: {
          answer_text: string
          created_at?: string
          game_round_id: string
          id?: string
          player_id: string
          response_time_ms?: number | null
          was_correct: boolean
        }
        Update: {
          answer_text?: string
          created_at?: string
          game_round_id?: string
          id?: string
          player_id?: string
          response_time_ms?: number | null
          was_correct?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "game_answers_game_round_id_fkey"
            columns: ["game_round_id"]
            isOneToOne: false
            referencedRelation: "game_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_answers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_players: {
        Row: {
          game_id: string
          id: string
          is_winner: boolean | null
          player_id: string
          score: number | null
        }
        Insert: {
          game_id: string
          id?: string
          is_winner?: boolean | null
          player_id: string
          score?: number | null
        }
        Update: {
          game_id?: string
          id?: string
          is_winner?: boolean | null
          player_id?: string
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_rounds: {
        Row: {
          created_at: string
          game_id: string
          id: string
          question_id: string
          round_number: number
          winner_player_id: string | null
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          question_id: string
          round_number: number
          winner_player_id?: string | null
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          question_id?: string
          round_number?: number
          winner_player_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_rounds_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_rounds_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_rounds_winner_player_id_fkey"
            columns: ["winner_player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          classroom_id: string
          created_at: string
          ended_at: string | null
          id: string
          started_at: string | null
          status: string
          type: string
        }
        Insert: {
          classroom_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          type: string
        }
        Update: {
          classroom_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "games_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      match_events: {
        Row: {
          answer_deadline: string | null
          answer_text: string | null
          answered_by_tournament_player_id: string | null
          buzz_at: string | null
          buzz_owner_tournament_player_id: string | null
          correct: boolean | null
          created_at: string
          id: string
          match_id: string
          question_id: string
          resolved_at: string | null
          seq: number
        }
        Insert: {
          answer_deadline?: string | null
          answer_text?: string | null
          answered_by_tournament_player_id?: string | null
          buzz_at?: string | null
          buzz_owner_tournament_player_id?: string | null
          correct?: boolean | null
          created_at?: string
          id?: string
          match_id: string
          question_id: string
          resolved_at?: string | null
          seq: number
        }
        Update: {
          answer_deadline?: string | null
          answer_text?: string | null
          answered_by_tournament_player_id?: string | null
          buzz_at?: string | null
          buzz_owner_tournament_player_id?: string | null
          correct?: boolean | null
          created_at?: string
          id?: string
          match_id?: string
          question_id?: string
          resolved_at?: string | null
          seq?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_events_answered_by_tournament_player_id_fkey"
            columns: ["answered_by_tournament_player_id"]
            isOneToOne: false
            referencedRelation: "tournament_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_buzz_owner_tournament_player_id_fkey"
            columns: ["buzz_owner_tournament_player_id"]
            isOneToOne: false
            referencedRelation: "tournament_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      match_state: {
        Row: {
          accepting_buzz: boolean
          current_seq: number
          match_id: string
          round_ends_at: string | null
          round_starts_at: string | null
          updated_at: string
        }
        Insert: {
          accepting_buzz?: boolean
          current_seq?: number
          match_id: string
          round_ends_at?: string | null
          round_starts_at?: string | null
          updated_at?: string
        }
        Update: {
          accepting_buzz?: boolean
          current_seq?: number
          match_id?: string
          round_ends_at?: string | null
          round_starts_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_state_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          player_a: string
          player_b: string
          round: number
          score_a: number
          score_b: number
          started_at: string | null
          status: Database["public"]["Enums"]["match_status"]
          tournament_id: string
          winner_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          player_a: string
          player_b: string
          round: number
          score_a?: number
          score_b?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          tournament_id: string
          winner_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          player_a?: string
          player_b?: string
          round?: number
          score_a?: number
          score_b?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          tournament_id?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_player_a_fkey"
            columns: ["player_a"]
            isOneToOne: false
            referencedRelation: "tournament_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_player_b_fkey"
            columns: ["player_b"]
            isOneToOne: false
            referencedRelation: "tournament_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "tournament_players"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_access_requests: {
        Row: {
          classroom_id: string
          created_at: string
          id: string
          message: string | null
          parent_id: string
          parent_notified: boolean
          resolved_at: string | null
          status: string
          student_id: string
          teacher_id: string
        }
        Insert: {
          classroom_id: string
          created_at?: string
          id?: string
          message?: string | null
          parent_id: string
          parent_notified?: boolean
          resolved_at?: string | null
          status?: string
          student_id: string
          teacher_id: string
        }
        Update: {
          classroom_id?: string
          created_at?: string
          id?: string
          message?: string | null
          parent_id?: string
          parent_notified?: boolean
          resolved_at?: string | null
          status?: string
          student_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_access_requests_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_access_requests_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parent_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_accounts: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      parent_consents: {
        Row: {
          assignment_data_consent: boolean
          aura_recording_consent: boolean
          consent_date: string
          created_at: string
          id: string
          parent_id: string
          student_id: string
          third_party_sharing_consent: boolean
          updated_at: string
        }
        Insert: {
          assignment_data_consent?: boolean
          aura_recording_consent?: boolean
          consent_date?: string
          created_at?: string
          id?: string
          parent_id: string
          student_id: string
          third_party_sharing_consent?: boolean
          updated_at?: string
        }
        Update: {
          assignment_data_consent?: boolean
          aura_recording_consent?: boolean
          consent_date?: string
          created_at?: string
          id?: string
          parent_id?: string
          student_id?: string
          third_party_sharing_consent?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      parent_student_links: {
        Row: {
          approved: boolean
          approved_at: string | null
          approved_by: string | null
          id: string
          parent_id: string
          requested_at: string
          student_id: string
        }
        Insert: {
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          id?: string
          parent_id: string
          requested_at?: string
          student_id: string
        }
        Update: {
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          id?: string
          parent_id?: string
          requested_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_student_links_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parent_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_exercises: {
        Row: {
          adaptive_metadata: Json | null
          completed: boolean | null
          completed_at: string | null
          content: string
          created_at: string | null
          difficulty_level: number | null
          effectiveness_score: number | null
          exercise_type: string
          id: string
          phoneme_targets: string[]
          student_id: string
          success_rate: number | null
          transfer_predictions: Json | null
        }
        Insert: {
          adaptive_metadata?: Json | null
          completed?: boolean | null
          completed_at?: string | null
          content: string
          created_at?: string | null
          difficulty_level?: number | null
          effectiveness_score?: number | null
          exercise_type: string
          id?: string
          phoneme_targets: string[]
          student_id: string
          success_rate?: number | null
          transfer_predictions?: Json | null
        }
        Update: {
          adaptive_metadata?: Json | null
          completed?: boolean | null
          completed_at?: string | null
          content?: string
          created_at?: string | null
          difficulty_level?: number | null
          effectiveness_score?: number | null
          exercise_type?: string
          id?: string
          phoneme_targets?: string[]
          student_id?: string
          success_rate?: number | null
          transfer_predictions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_exercises_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          district_id: string | null
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          signup_domain: string | null
        }
        Insert: {
          created_at?: string
          district_id?: string | null
          email: string
          full_name: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          signup_domain?: string | null
        }
        Update: {
          created_at?: string
          district_id?: string | null
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          signup_domain?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_district"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      question_groups: {
        Row: {
          classroom_id: string
          created_at: string
          created_by: string
          description: string | null
          grade: number
          id: string
          subject: string
          title: string
          updated_at: string
        }
        Insert: {
          classroom_id: string
          created_at?: string
          created_by: string
          description?: string | null
          grade: number
          id?: string
          subject: string
          title: string
          updated_at?: string
        }
        Update: {
          classroom_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          grade?: number
          id?: string
          subject?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_groups_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          answer_text: string
          approved: boolean | null
          audio_url: string | null
          classroom_id: string | null
          created_at: string
          created_by: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"] | null
          distractor_rationale: string | null
          explanation: string | null
          grade: number
          group_id: string | null
          id: string
          image_url: string | null
          metadata: Json | null
          options: Json | null
          question_text: string
          source: string | null
          subject: string
        }
        Insert: {
          answer_text: string
          approved?: boolean | null
          audio_url?: string | null
          classroom_id?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          distractor_rationale?: string | null
          explanation?: string | null
          grade: number
          group_id?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          options?: Json | null
          question_text: string
          source?: string | null
          subject: string
        }
        Update: {
          answer_text?: string
          approved?: boolean | null
          audio_url?: string | null
          classroom_id?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          distractor_rationale?: string | null
          explanation?: string | null
          grade?: number
          group_id?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          options?: Json | null
          question_text?: string
          source?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "question_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      realtime_practice_sessions: {
        Row: {
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          exercise_id: string | null
          feedback_events: Json | null
          id: string
          realtime_metrics: Json | null
          started_at: string
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          exercise_id?: string | null
          feedback_events?: Json | null
          id?: string
          realtime_metrics?: Json | null
          started_at?: string
          status?: string
          student_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          exercise_id?: string | null
          feedback_events?: Json | null
          id?: string
          realtime_metrics?: Json | null
          started_at?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "realtime_practice_sessions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "practice_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realtime_practice_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          grade: number | null
          id: string
          stats: Json | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          grade?: number | null
          id?: string
          stats?: Json | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          grade?: number | null
          id?: string
          stats?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_skill_vectors: {
        Row: {
          annotation_sophistication_trend: number | null
          cross_modal_risk_score: number | null
          current_difficulty_level: number | null
          difficulty_history: Json | null
          fluency_metrics: Json | null
          highlight_strategy_profile: Json | null
          last_difficulty_update: string | null
          last_updated: string
          performance_trend: number | null
          phoneme_scores: Json | null
          predicted_comprehension_score: number | null
          prosody_metrics: Json | null
          reading_metrics: Json | null
          student_id: string
          transfer_learning_insights: Json | null
          vector: Json
          weekly_improvement: number | null
        }
        Insert: {
          annotation_sophistication_trend?: number | null
          cross_modal_risk_score?: number | null
          current_difficulty_level?: number | null
          difficulty_history?: Json | null
          fluency_metrics?: Json | null
          highlight_strategy_profile?: Json | null
          last_difficulty_update?: string | null
          last_updated?: string
          performance_trend?: number | null
          phoneme_scores?: Json | null
          predicted_comprehension_score?: number | null
          prosody_metrics?: Json | null
          reading_metrics?: Json | null
          student_id: string
          transfer_learning_insights?: Json | null
          vector?: Json
          weekly_improvement?: number | null
        }
        Update: {
          annotation_sophistication_trend?: number | null
          cross_modal_risk_score?: number | null
          current_difficulty_level?: number | null
          difficulty_history?: Json | null
          fluency_metrics?: Json | null
          highlight_strategy_profile?: Json | null
          last_difficulty_update?: string | null
          last_updated?: string
          performance_trend?: number | null
          phoneme_scores?: Json | null
          predicted_comprehension_score?: number | null
          prosody_metrics?: Json | null
          reading_metrics?: Json | null
          student_id?: string
          transfer_learning_insights?: Json | null
          vector?: Json
          weekly_improvement?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_skill_vectors_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_action_log: {
        Row: {
          action_data: Json
          action_type: string
          created_at: string
          id: string
          student_id: string
          teacher_id: string
        }
        Insert: {
          action_data: Json
          action_type: string
          created_at?: string
          id?: string
          student_id: string
          teacher_id: string
        }
        Update: {
          action_data?: Json
          action_type?: string
          created_at?: string
          id?: string
          student_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_action_log_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_action_log_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_student_notes: {
        Row: {
          audio_url: string | null
          classroom_id: string
          content: string
          created_at: string
          id: string
          note_type: string
          read_by_student: boolean | null
          student_id: string
          teacher_id: string
        }
        Insert: {
          audio_url?: string | null
          classroom_id: string
          content: string
          created_at?: string
          id?: string
          note_type: string
          read_by_student?: boolean | null
          student_id: string
          teacher_id: string
        }
        Update: {
          audio_url?: string | null
          classroom_id?: string
          content?: string
          created_at?: string
          id?: string
          note_type?: string
          read_by_student?: boolean | null
          student_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_student_notes_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_student_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_student_notes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_summaries: {
        Row: {
          assignments_analyzed: number
          aura_records_analyzed: number
          classroom_id: string
          generated_at: string
          id: string
          students_count: number
          summary_data: Json
          teacher_id: string
        }
        Insert: {
          assignments_analyzed: number
          aura_records_analyzed: number
          classroom_id: string
          generated_at?: string
          id?: string
          students_count: number
          summary_data: Json
          teacher_id: string
        }
        Update: {
          assignments_analyzed?: number
          aura_records_analyzed?: number
          classroom_id?: string
          generated_at?: string
          id?: string
          students_count?: number
          summary_data?: Json
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_summaries_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_summaries_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      text_highlights: {
        Row: {
          annotation: string | null
          color: string
          created_at: string
          end_offset: number
          highlighted_text: string
          id: string
          start_offset: number
          student_id: string
          submission_id: string
          updated_at: string
        }
        Insert: {
          annotation?: string | null
          color?: string
          created_at?: string
          end_offset: number
          highlighted_text: string
          id?: string
          start_offset: number
          student_id: string
          submission_id: string
          updated_at?: string
        }
        Update: {
          annotation?: string | null
          color?: string
          created_at?: string
          end_offset?: number
          highlighted_text?: string
          id?: string
          start_offset?: number
          student_id?: string
          submission_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "text_highlights_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "text_highlights_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "assignment_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_players: {
        Row: {
          created_at: string
          eliminated_at: string | null
          id: string
          profile_id: string
          seed: number
          status: Database["public"]["Enums"]["elimination_status"]
          tournament_id: string
        }
        Insert: {
          created_at?: string
          eliminated_at?: string | null
          id?: string
          profile_id: string
          seed: number
          status?: Database["public"]["Enums"]["elimination_status"]
          tournament_id: string
        }
        Update: {
          created_at?: string
          eliminated_at?: string | null
          id?: string
          profile_id?: string
          seed?: number
          status?: Database["public"]["Enums"]["elimination_status"]
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_players_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_questions: {
        Row: {
          created_at: string | null
          id: string
          question_id: string
          sequence: number
          tournament_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          question_id: string
          sequence: number
          tournament_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          question_id?: string
          sequence?: number
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_questions_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          classroom_id: string
          completed_at: string | null
          created_at: string
          created_by: string
          game_type: string
          id: string
          name: string
          started_at: string | null
          status: Database["public"]["Enums"]["tournament_status"]
        }
        Insert: {
          classroom_id: string
          completed_at?: string | null
          created_at?: string
          created_by: string
          game_type?: string
          id?: string
          name: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["tournament_status"]
        }
        Update: {
          classroom_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          game_type?: string
          id?: string
          name?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["tournament_status"]
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      attempt_buzz: {
        Args: {
          p_match_id: string
          p_seq: number
          p_tournament_player_id: string
        }
        Returns: Json
      }
      compute_levenshtein: {
        Args: { a: string; b: string }
        Returns: number
      }
      generate_join_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_classroom_detail: {
        Args: { _classroom_id: string; _user_id: string }
        Returns: {
          created_at: string
          id: string
          join_code: string
          name: string
          teacher_email: string
          teacher_id: string
          teacher_name: string
        }[]
      }
      get_classroom_students: {
        Args: { _classroom_id: string; _user_id: string }
        Returns: {
          avatar_url: string
          email: string
          full_name: string
          grade: number
          joined_at: string
          student_id: string
        }[]
      }
      get_parent_account: {
        Args: { _user_id: string }
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          user_id: string
        }[]
      }
      get_parent_student_links: {
        Args: { _user_id: string }
        Returns: {
          approved: boolean
          link_id: string
          requested_at: string
          student_email: string
          student_grade: number
          student_id: string
          student_name: string
        }[]
      }
      get_student_classrooms: {
        Args: { _user_id: string }
        Returns: {
          created_at: string
          id: string
          join_code: string
          name: string
          student_count: number
          teacher_name: string
        }[]
      }
      get_teacher_classrooms: {
        Args: { _user_id: string }
        Returns: {
          created_at: string
          id: string
          join_code: string
          name: string
          student_count: number
        }[]
      }
      get_user_profile: {
        Args: { _user_id: string }
        Returns: {
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_classroom_student: {
        Args: { _classroom_id: string; _user_id: string }
        Returns: boolean
      }
      is_classroom_teacher: {
        Args: { _classroom_id: string; _user_id: string }
        Returns: boolean
      }
      is_parent_of_student: {
        Args: { _student_id: string; _user_id: string }
        Returns: boolean
      }
      is_submission_teacher: {
        Args: { _submission_id: string; _user_id: string }
        Returns: boolean
      }
      is_tournament_classroom_member: {
        Args: { _tournament_id: string; _user_id: string }
        Returns: boolean
      }
      is_tournament_player: {
        Args: { _tournament_id: string; _user_id: string }
        Returns: boolean
      }
      is_tournament_teacher: {
        Args: { _tournament_id: string; _user_id: string }
        Returns: boolean
      }
      join_classroom_by_code: {
        Args: { p_join_code: string }
        Returns: Json
      }
      submit_answer_tx: {
        Args: {
          p_answer_text: string
          p_match_id: string
          p_seq: number
          p_tournament_player_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      answer_status: "not_attempted" | "in_progress" | "completed"
      app_role: "admin" | "teacher" | "student"
      difficulty_level: "easy" | "medium" | "hard"
      elimination_status: "active" | "eliminated"
      match_status: "waiting" | "in_progress" | "completed"
      question_type: "question_answer" | "reading_comprehension" | "speaking"
      tournament_status: "waiting" | "in_progress" | "completed"
      user_role: "teacher" | "student" | "admin" | "district_admin" | "parent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      answer_status: ["not_attempted", "in_progress", "completed"],
      app_role: ["admin", "teacher", "student"],
      difficulty_level: ["easy", "medium", "hard"],
      elimination_status: ["active", "eliminated"],
      match_status: ["waiting", "in_progress", "completed"],
      question_type: ["question_answer", "reading_comprehension", "speaking"],
      tournament_status: ["waiting", "in_progress", "completed"],
      user_role: ["teacher", "student", "admin", "district_admin", "parent"],
    },
  },
} as const

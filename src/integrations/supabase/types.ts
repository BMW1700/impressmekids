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
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
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
          question_type: Database["public"]["Enums"]["question_type"] | null
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
          question_type?: Database["public"]["Enums"]["question_type"] | null
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
          question_type?: Database["public"]["Enums"]["question_type"] | null
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
      app_role: "admin" | "teacher" | "student"
      difficulty_level: "easy" | "medium" | "hard"
      elimination_status: "active" | "eliminated"
      match_status: "waiting" | "in_progress" | "completed"
      question_type:
        | "multiple_choice"
        | "true_false"
        | "short_answer"
        | "fill_blank"
        | "matching"
      tournament_status: "waiting" | "in_progress" | "completed"
      user_role: "teacher" | "student" | "admin"
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
      app_role: ["admin", "teacher", "student"],
      difficulty_level: ["easy", "medium", "hard"],
      elimination_status: ["active", "eliminated"],
      match_status: ["waiting", "in_progress", "completed"],
      question_type: [
        "multiple_choice",
        "true_false",
        "short_answer",
        "fill_blank",
        "matching",
      ],
      tournament_status: ["waiting", "in_progress", "completed"],
      user_role: ["teacher", "student", "admin"],
    },
  },
} as const

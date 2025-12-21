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
      account_verification_requests: {
        Row: {
          created_at: string
          denial_reason: string | null
          district_id: string
          district_name: string
          email: string
          full_name: string
          id: string
          profile_id: string
          requested_role: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          denial_reason?: string | null
          district_id: string
          district_name: string
          email: string
          full_name: string
          id?: string
          profile_id: string
          requested_role: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          denial_reason?: string | null
          district_id?: string
          district_name?: string
          email?: string
          full_name?: string
          id?: string
          profile_id?: string
          requested_role?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_verification_requests_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["district_code"]
          },
          {
            foreignKeyName: "account_verification_requests_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts_public"
            referencedColumns: ["district_code"]
          },
          {
            foreignKeyName: "account_verification_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_verification_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      assignment_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string | null
          student_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string | null
          student_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "assignment_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_groups: {
        Row: {
          assignment_id: string
          created_at: string | null
          group_name: string
          id: string
          updated_at: string | null
        }
        Insert: {
          assignment_id: string
          created_at?: string | null
          group_name: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          assignment_id?: string
          created_at?: string | null
          group_name?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_groups_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
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
      assignment_rubrics: {
        Row: {
          assignment_id: string
          created_at: string | null
          id: string
          rubric_id: string
        }
        Insert: {
          assignment_id: string
          created_at?: string | null
          id?: string
          rubric_id: string
        }
        Update: {
          assignment_id?: string
          created_at?: string | null
          id?: string
          rubric_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_rubrics_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: true
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_rubrics_rubric_id_fkey"
            columns: ["rubric_id"]
            isOneToOne: false
            referencedRelation: "rubrics"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_standards: {
        Row: {
          assignment_id: string
          created_at: string
          id: string
          standard_id: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          id?: string
          standard_id: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          id?: string
          standard_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_standards_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_standards_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "learning_standards"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          anti_cheating_metadata: Json | null
          assignment_id: string
          attempt_number: number
          created_at: string
          focus_violations: number | null
          grade: number | null
          graded_at: string | null
          group_id: string | null
          id: string
          started_at: string | null
          status: string
          student_id: string
          submitted_at: string | null
          submitted_by: string | null
          teacher_feedback: string | null
          time_taken_seconds: number | null
          timer_expired: boolean | null
          updated_at: string
        }
        Insert: {
          anti_cheating_metadata?: Json | null
          assignment_id: string
          attempt_number?: number
          created_at?: string
          focus_violations?: number | null
          grade?: number | null
          graded_at?: string | null
          group_id?: string | null
          id?: string
          started_at?: string | null
          status?: string
          student_id: string
          submitted_at?: string | null
          submitted_by?: string | null
          teacher_feedback?: string | null
          time_taken_seconds?: number | null
          timer_expired?: boolean | null
          updated_at?: string
        }
        Update: {
          anti_cheating_metadata?: Json | null
          assignment_id?: string
          attempt_number?: number
          created_at?: string
          focus_violations?: number | null
          grade?: number | null
          graded_at?: string | null
          group_id?: string | null
          id?: string
          started_at?: string | null
          status?: string
          student_id?: string
          submitted_at?: string | null
          submitted_by?: string | null
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
            foreignKeyName: "assignment_submissions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "assignment_groups"
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
          category: string
          classroom_id: string
          created_at: string
          description: string | null
          due_date: string | null
          enable_realtime_coaching: boolean | null
          focus_detection: boolean | null
          id: string
          is_group_assignment: boolean | null
          is_posted: boolean | null
          isolation_mode: boolean | null
          max_attempts: number
          passage_metadata: Json | null
          passage_text: string
          question_count: number | null
          shuffle_answers: boolean | null
          shuffle_questions: boolean | null
          status: string
          teacher_id: string
          time_per_question_seconds: number | null
          timer_minutes: number | null
          title: string
          updated_at: string
        }
        Insert: {
          assignment_type?: string
          category?: string
          classroom_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          enable_realtime_coaching?: boolean | null
          focus_detection?: boolean | null
          id?: string
          is_group_assignment?: boolean | null
          is_posted?: boolean | null
          isolation_mode?: boolean | null
          max_attempts?: number
          passage_metadata?: Json | null
          passage_text: string
          question_count?: number | null
          shuffle_answers?: boolean | null
          shuffle_questions?: boolean | null
          status?: string
          teacher_id: string
          time_per_question_seconds?: number | null
          timer_minutes?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          assignment_type?: string
          category?: string
          classroom_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          enable_realtime_coaching?: boolean | null
          focus_detection?: boolean | null
          id?: string
          is_group_assignment?: boolean | null
          is_posted?: boolean | null
          isolation_mode?: boolean | null
          max_attempts?: number
          passage_metadata?: Json | null
          passage_text?: string
          question_count?: number | null
          shuffle_answers?: boolean | null
          shuffle_questions?: boolean | null
          status?: string
          teacher_id?: string
          time_per_question_seconds?: number | null
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
      attendance_records: {
        Row: {
          classroom_id: string
          created_at: string | null
          date: string
          id: string
          recorded_by: string
          status: string
          student_id: string
          updated_at: string | null
        }
        Insert: {
          classroom_id: string
          created_at?: string | null
          date: string
          id?: string
          recorded_by: string
          status: string
          student_id: string
          updated_at?: string | null
        }
        Update: {
          classroom_id?: string
          created_at?: string | null
          date?: string
          id?: string
          recorded_by?: string
          status?: string
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      aura_access_log: {
        Row: {
          access_context: string | null
          access_type: string
          accessed_by: string
          accessed_student: string
          created_at: string
          id: string
          ip_address: unknown
          record_id: string | null
          user_agent: string | null
        }
        Insert: {
          access_context?: string | null
          access_type: string
          accessed_by: string
          accessed_student: string
          created_at?: string
          id?: string
          ip_address?: unknown
          record_id?: string | null
          user_agent?: string | null
        }
        Update: {
          access_context?: string | null
          access_type?: string
          accessed_by?: string
          accessed_student?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          record_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
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
      authority_alert_sources: {
        Row: {
          api_key_hash: string | null
          created_at: string | null
          id: string
          is_verified: boolean | null
          last_verified_at: string | null
          school_id: string | null
          source_name: string
          source_type: string
          webhook_url: string | null
        }
        Insert: {
          api_key_hash?: string | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          last_verified_at?: string | null
          school_id?: string | null
          source_name: string
          source_type: string
          webhook_url?: string | null
        }
        Update: {
          api_key_hash?: string | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          last_verified_at?: string | null
          school_id?: string | null
          source_name?: string
          source_type?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "authority_alert_sources_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["district_code"]
          },
          {
            foreignKeyName: "authority_alert_sources_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "districts_public"
            referencedColumns: ["district_code"]
          },
        ]
      }
      backup_audit_log: {
        Row: {
          action_details: Json | null
          action_type: string
          backup_id: string | null
          created_at: string
          error_message: string | null
          id: string
          performed_by: string | null
          status: string
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          backup_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          performed_by?: string | null
          status: string
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          backup_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          performed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "backup_audit_log_backup_id_fkey"
            columns: ["backup_id"]
            isOneToOne: false
            referencedRelation: "cold_storage_backups"
            referencedColumns: ["id"]
          },
        ]
      }
      behavior_categories: {
        Row: {
          category_type: string
          classroom_id: string
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          point_value: number
          updated_at: string
        }
        Insert: {
          category_type: string
          classroom_id: string
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          point_value: number
          updated_at?: string
        }
        Update: {
          category_type?: string
          classroom_id?: string
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          point_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "behavior_categories_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      behavior_records: {
        Row: {
          category_id: string
          classroom_id: string
          created_at: string
          id: string
          notes: string | null
          points: number
          student_id: string
          teacher_id: string
        }
        Insert: {
          category_id: string
          classroom_id: string
          created_at?: string
          id?: string
          notes?: string | null
          points: number
          student_id: string
          teacher_id: string
        }
        Update: {
          category_id?: string
          classroom_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          points?: number
          student_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "behavior_records_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "behavior_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavior_records_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavior_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavior_records_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      benchmark_assessment_periods: {
        Row: {
          classroom_id: string
          created_at: string
          created_by: string
          end_date: string
          id: string
          is_active: boolean | null
          period_name: string
          school_year: string
          screening_passage_id: string | null
          start_date: string
        }
        Insert: {
          classroom_id: string
          created_at?: string
          created_by: string
          end_date: string
          id?: string
          is_active?: boolean | null
          period_name: string
          school_year: string
          screening_passage_id?: string | null
          start_date: string
        }
        Update: {
          classroom_id?: string
          created_at?: string
          created_by?: string
          end_date?: string
          id?: string
          is_active?: boolean | null
          period_name?: string
          school_year?: string
          screening_passage_id?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "benchmark_assessment_periods_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benchmark_assessment_periods_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          {
            foreignKeyName: "classroom_announcements_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_features: {
        Row: {
          classroom_id: string
          created_at: string | null
          display_order: number | null
          enabled_at: string | null
          feature_id: string
          id: string
          is_enabled: boolean
        }
        Insert: {
          classroom_id: string
          created_at?: string | null
          display_order?: number | null
          enabled_at?: string | null
          feature_id: string
          id?: string
          is_enabled?: boolean
        }
        Update: {
          classroom_id?: string
          created_at?: string | null
          display_order?: number | null
          enabled_at?: string | null
          feature_id?: string
          id?: string
          is_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "classroom_features_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_join_requests: {
        Row: {
          classroom_id: string
          id: string
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          student_id: string
        }
        Insert: {
          classroom_id: string
          id?: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id: string
        }
        Update: {
          classroom_id?: string
          id?: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_join_requests_classroom_id_fkey"
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
      classroom_syllabus: {
        Row: {
          classroom_id: string
          created_at: string
          file_name: string
          file_size: number
          file_url: string
          grade_weights: Json
          id: string
          is_posted: boolean
          mime_type: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          classroom_id: string
          created_at?: string
          file_name: string
          file_size: number
          file_url: string
          grade_weights?: Json
          id?: string
          is_posted?: boolean
          mime_type: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          classroom_id?: string
          created_at?: string
          file_name?: string
          file_size?: number
          file_url?: string
          grade_weights?: Json
          id?: string
          is_posted?: boolean
          mime_type?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_syllabus_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: true
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_syllabus_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_tab_orders: {
        Row: {
          classroom_id: string
          created_at: string
          id: string
          tab_order: string[]
          teacher_id: string
          updated_at: string
        }
        Insert: {
          classroom_id: string
          created_at?: string
          id?: string
          tab_order: string[]
          teacher_id: string
          updated_at?: string
        }
        Update: {
          classroom_id?: string
          created_at?: string
          id?: string
          tab_order?: string[]
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_tab_orders_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_tab_orders_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classrooms: {
        Row: {
          created_at: string
          end_time: string | null
          grade: number | null
          id: string
          join_code: string
          location: string | null
          meeting_days: string[] | null
          name: string
          schedule_end_date: string | null
          schedule_start_date: string | null
          start_time: string | null
          subject: string | null
          teacher_id: string
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          grade?: number | null
          id?: string
          join_code: string
          location?: string | null
          meeting_days?: string[] | null
          name: string
          schedule_end_date?: string | null
          schedule_start_date?: string | null
          start_time?: string | null
          subject?: string | null
          teacher_id: string
        }
        Update: {
          created_at?: string
          end_time?: string | null
          grade?: number | null
          id?: string
          join_code?: string
          location?: string | null
          meeting_days?: string[] | null
          name?: string
          schedule_end_date?: string | null
          schedule_start_date?: string | null
          start_time?: string | null
          subject?: string | null
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
      club_members: {
        Row: {
          club_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          club_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          club_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_posts: {
        Row: {
          club_id: string
          content: string | null
          created_at: string
          created_by: string
          event_date: string | null
          event_time: string | null
          id: string
          post_type: string
          title: string
        }
        Insert: {
          club_id: string
          content?: string | null
          created_at?: string
          created_by: string
          event_date?: string | null
          event_time?: string | null
          id?: string
          post_type: string
          title: string
        }
        Update: {
          club_id?: string
          content?: string | null
          created_at?: string
          created_by?: string
          event_date?: string | null
          event_time?: string | null
          id?: string
          post_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_posts_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_posts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clubs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cold_storage_backups: {
        Row: {
          backup_name: string
          backup_size_bytes: number
          backup_timestamp: string
          backup_type: string
          created_at: string
          created_by: string | null
          encryption_method: string
          id: string
          metadata: Json | null
          record_count: number
          status: string
          storage_location: string
          storage_provider: string
          tables_included: string[]
        }
        Insert: {
          backup_name: string
          backup_size_bytes: number
          backup_timestamp?: string
          backup_type?: string
          created_at?: string
          created_by?: string | null
          encryption_method?: string
          id?: string
          metadata?: Json | null
          record_count: number
          status?: string
          storage_location: string
          storage_provider?: string
          tables_included: string[]
        }
        Update: {
          backup_name?: string
          backup_size_bytes?: number
          backup_timestamp?: string
          backup_type?: string
          created_at?: string
          created_by?: string | null
          encryption_method?: string
          id?: string
          metadata?: Json | null
          record_count?: number
          status?: string
          storage_location?: string
          storage_provider?: string
          tables_included?: string[]
        }
        Relationships: []
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
      data_restoration_requests: {
        Row: {
          backup_id: string
          backup_name: string
          backup_timestamp: string
          contact_email: string
          contact_phone: string | null
          created_at: string
          id: string
          metadata: Json | null
          reason: string
          requested_at: string
          requested_by: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          school_name: string | null
          status: string
          tables_requested: string[] | null
          updated_at: string
          urgency: string
        }
        Insert: {
          backup_id: string
          backup_name: string
          backup_timestamp: string
          contact_email: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          reason: string
          requested_at?: string
          requested_by: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_name?: string | null
          status?: string
          tables_requested?: string[] | null
          updated_at?: string
          urgency: string
        }
        Update: {
          backup_id?: string
          backup_name?: string
          backup_timestamp?: string
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string
          requested_at?: string
          requested_by?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_name?: string | null
          status?: string
          tables_requested?: string[] | null
          updated_at?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_restoration_requests_backup_id_fkey"
            columns: ["backup_id"]
            isOneToOne: false
            referencedRelation: "cold_storage_backups"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          topic_id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          topic_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          topic_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discussion_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_posts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "discussion_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_posts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "discussion_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_topics: {
        Row: {
          classroom_id: string
          created_at: string | null
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          is_locked: boolean | null
          is_pinned: boolean | null
          is_posted: boolean
          title: string
          updated_at: string | null
        }
        Insert: {
          classroom_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          is_posted?: boolean
          title: string
          updated_at?: string | null
        }
        Update: {
          classroom_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          is_posted?: boolean
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discussion_topics_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_topics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      district_managers: {
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
      districts: {
        Row: {
          created_at: string
          district_code: string
          email_domains: string[]
          id: string
          is_visible: boolean
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          primary_contact_email: string | null
          slug: string
          subscription_tier: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          district_code: string
          email_domains?: string[]
          id?: string
          is_visible?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          primary_contact_email?: string | null
          slug: string
          subscription_tier?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          district_code?: string
          email_domains?: string[]
          id?: string
          is_visible?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          primary_contact_email?: string | null
          slug?: string
          subscription_tier?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      drill_attendance: {
        Row: {
          classroom_id: string
          drill_session_id: string
          escalation_acknowledged_at: string | null
          escalation_acknowledged_by: string | null
          escalation_level: number | null
          escalation_started_at: string | null
          id: string
          location_notes: string | null
          marked_at: string | null
          marked_by: string | null
          parent_notified: boolean | null
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          student_checked_in: boolean | null
          student_checkin_at: string | null
          student_id: string
        }
        Insert: {
          classroom_id: string
          drill_session_id: string
          escalation_acknowledged_at?: string | null
          escalation_acknowledged_by?: string | null
          escalation_level?: number | null
          escalation_started_at?: string | null
          id?: string
          location_notes?: string | null
          marked_at?: string | null
          marked_by?: string | null
          parent_notified?: boolean | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          student_checked_in?: boolean | null
          student_checkin_at?: string | null
          student_id: string
        }
        Update: {
          classroom_id?: string
          drill_session_id?: string
          escalation_acknowledged_at?: string | null
          escalation_acknowledged_by?: string | null
          escalation_level?: number | null
          escalation_started_at?: string | null
          id?: string
          location_notes?: string | null
          marked_at?: string | null
          marked_by?: string | null
          parent_notified?: boolean | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          student_checked_in?: boolean | null
          student_checkin_at?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drill_attendance_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drill_attendance_drill_session_id_fkey"
            columns: ["drill_session_id"]
            isOneToOne: false
            referencedRelation: "drill_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drill_attendance_escalation_acknowledged_by_fkey"
            columns: ["escalation_acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drill_attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drill_attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      drill_sessions: {
        Row: {
          all_clear_at: string | null
          all_clear_by: string | null
          announced_at: string | null
          classroom_id: string | null
          created_by: string
          drill_type: string
          ended_at: string | null
          id: string
          is_real_emergency: boolean | null
          notes: string | null
          scheduled_for: string | null
          school_drill_id: string | null
          school_id: string | null
          started_at: string | null
          status: string
        }
        Insert: {
          all_clear_at?: string | null
          all_clear_by?: string | null
          announced_at?: string | null
          classroom_id?: string | null
          created_by: string
          drill_type: string
          ended_at?: string | null
          id?: string
          is_real_emergency?: boolean | null
          notes?: string | null
          scheduled_for?: string | null
          school_drill_id?: string | null
          school_id?: string | null
          started_at?: string | null
          status?: string
        }
        Update: {
          all_clear_at?: string | null
          all_clear_by?: string | null
          announced_at?: string | null
          classroom_id?: string | null
          created_by?: string
          drill_type?: string
          ended_at?: string | null
          id?: string
          is_real_emergency?: boolean | null
          notes?: string | null
          scheduled_for?: string | null
          school_drill_id?: string | null
          school_id?: string | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "drill_sessions_all_clear_by_fkey"
            columns: ["all_clear_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drill_sessions_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drill_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drill_sessions_school_drill_id_fkey"
            columns: ["school_drill_id"]
            isOneToOne: false
            referencedRelation: "drill_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drill_sessions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["district_code"]
          },
          {
            foreignKeyName: "drill_sessions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "districts_public"
            referencedColumns: ["district_code"]
          },
        ]
      }
      drill_visitor_attendance: {
        Row: {
          created_at: string
          drill_session_id: string
          id: string
          location_notes: string | null
          marked_at: string | null
          marked_by: string | null
          status: string
          visitor_id: string
        }
        Insert: {
          created_at?: string
          drill_session_id: string
          id?: string
          location_notes?: string | null
          marked_at?: string | null
          marked_by?: string | null
          status?: string
          visitor_id: string
        }
        Update: {
          created_at?: string
          drill_session_id?: string
          id?: string
          location_notes?: string | null
          marked_at?: string | null
          marked_by?: string | null
          status?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drill_visitor_attendance_drill_session_id_fkey"
            columns: ["drill_session_id"]
            isOneToOne: false
            referencedRelation: "drill_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drill_visitor_attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drill_visitor_attendance_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_contacts: {
        Row: {
          created_at: string
          custom_relationship: string | null
          id: string
          name: string
          phone_number: string
          relationship: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_relationship?: string | null
          id?: string
          name: string
          phone_number: string
          relationship: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_relationship?: string | null
          id?: string
          name?: string
          phone_number?: string
          relationship?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      escalation_notifications: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          drill_attendance_id: string | null
          drill_session_id: string | null
          escalation_level: number
          id: string
          message: string
          notification_channel: string
          response_notes: string | null
          sent_at: string
          student_id: string | null
          target_role: string
          target_user_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          drill_attendance_id?: string | null
          drill_session_id?: string | null
          escalation_level: number
          id?: string
          message: string
          notification_channel: string
          response_notes?: string | null
          sent_at?: string
          student_id?: string | null
          target_role: string
          target_user_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          drill_attendance_id?: string | null
          drill_session_id?: string | null
          escalation_level?: number
          id?: string
          message?: string
          notification_channel?: string
          response_notes?: string | null
          sent_at?: string
          student_id?: string | null
          target_role?: string
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escalation_notifications_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalation_notifications_drill_attendance_id_fkey"
            columns: ["drill_attendance_id"]
            isOneToOne: false
            referencedRelation: "drill_attendance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalation_notifications_drill_session_id_fkey"
            columns: ["drill_session_id"]
            isOneToOne: false
            referencedRelation: "drill_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalation_notifications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalation_notifications_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      escalation_rules: {
        Row: {
          created_at: string
          escalation_level: number
          id: string
          is_active: boolean
          message_template: string
          notification_channels: string[]
          role_target: string
          school_id: string | null
          sla_seconds: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          escalation_level: number
          id?: string
          is_active?: boolean
          message_template: string
          notification_channels?: string[]
          role_target: string
          school_id?: string | null
          sla_seconds: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          escalation_level?: number
          id?: string
          is_active?: boolean
          message_template?: string
          notification_channels?: string[]
          role_target?: string
          school_id?: string | null
          sla_seconds?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escalation_rules_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["district_code"]
          },
          {
            foreignKeyName: "escalation_rules_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "districts_public"
            referencedColumns: ["district_code"]
          },
        ]
      }
      events: {
        Row: {
          attachments: Json | null
          category: Database["public"]["Enums"]["event_category"]
          classroom_id: string | null
          created_at: string | null
          description: string | null
          end_time: string
          event_date: string
          id: string
          is_posted: boolean | null
          is_repeating: boolean | null
          location: string | null
          repeat_days: string[] | null
          repeat_end_date: string | null
          start_time: string
          teacher_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          category?: Database["public"]["Enums"]["event_category"]
          classroom_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time: string
          event_date: string
          id?: string
          is_posted?: boolean | null
          is_repeating?: boolean | null
          location?: string | null
          repeat_days?: string[] | null
          repeat_end_date?: string | null
          start_time: string
          teacher_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          category?: Database["public"]["Enums"]["event_category"]
          classroom_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          event_date?: string
          id?: string
          is_posted?: boolean | null
          is_repeating?: boolean | null
          location?: string | null
          repeat_days?: string[] | null
          repeat_end_date?: string | null
          start_time?: string
          teacher_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
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
          is_posted: boolean
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
          is_posted?: boolean
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
          is_posted?: boolean
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
      group_chat_messages: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          message: string
          student_id: string
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          message: string
          student_id: string
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          message?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_chat_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "assignment_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_standards: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string
          grade: number
          id: string
          subject: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          description: string
          grade: number
          id?: string
          subject: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string
          grade?: number
          id?: string
          subject?: string
        }
        Relationships: []
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
          shown_at: string | null
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
          shown_at?: string | null
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
          shown_at?: string | null
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
      meeting_bookings: {
        Row: {
          booking_date: string
          created_at: string
          end_time: string
          id: string
          meeting_reason: string | null
          office_hours_id: string
          parent_event_id: string | null
          parent_id: string
          start_time: string
          status: string
          student_id: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          booking_date: string
          created_at?: string
          end_time: string
          id?: string
          meeting_reason?: string | null
          office_hours_id: string
          parent_event_id?: string | null
          parent_id: string
          start_time: string
          status?: string
          student_id: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          booking_date?: string
          created_at?: string
          end_time?: string
          id?: string
          meeting_reason?: string | null
          office_hours_id?: string
          parent_event_id?: string | null
          parent_id?: string
          start_time?: string
          status?: string
          student_id?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_bookings_office_hours_id_fkey"
            columns: ["office_hours_id"]
            isOneToOne: false
            referencedRelation: "teacher_office_hours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_bookings_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "parent_student_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_bookings_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parent_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_bookings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_bookings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_for_parent: boolean
          template_type: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_for_parent: boolean
          template_type: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_for_parent?: boolean
          template_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_access_requests: {
        Row: {
          admin_id: string | null
          approval_type: string | null
          classroom_id: string | null
          created_at: string
          id: string
          message: string | null
          parent_id: string
          parent_notified: boolean
          resolved_at: string | null
          status: string
          student_id: string
          teacher_id: string | null
        }
        Insert: {
          admin_id?: string | null
          approval_type?: string | null
          classroom_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          parent_id: string
          parent_notified?: boolean
          resolved_at?: string | null
          status?: string
          student_id: string
          teacher_id?: string | null
        }
        Update: {
          admin_id?: string | null
          approval_type?: string | null
          classroom_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          parent_id?: string
          parent_notified?: boolean
          resolved_at?: string | null
          status?: string
          student_id?: string
          teacher_id?: string | null
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
      parent_drill_responses: {
        Row: {
          created_at: string
          drill_session_id: string
          id: string
          notes: string | null
          parent_id: string
          response_type: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          drill_session_id: string
          id?: string
          notes?: string | null
          parent_id: string
          response_type: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          drill_session_id?: string
          id?: string
          notes?: string | null
          parent_id?: string
          response_type?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_drill_responses_drill_session_id_fkey"
            columns: ["drill_session_id"]
            isOneToOne: false
            referencedRelation: "drill_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_drill_responses_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_drill_responses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_notification_preferences: {
        Row: {
          created_at: string | null
          email_enabled: boolean | null
          id: string
          in_app_enabled: boolean | null
          notification_days_before: number | null
          notify_assignments: boolean | null
          notify_events: boolean | null
          notify_tests: boolean | null
          parent_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          notification_days_before?: number | null
          notify_assignments?: boolean | null
          notify_events?: boolean | null
          notify_tests?: boolean | null
          parent_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          notification_days_before?: number | null
          notify_assignments?: boolean | null
          notify_events?: boolean | null
          notify_tests?: boolean | null
          parent_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parent_notification_preferences_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: true
            referencedRelation: "parent_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_notifications: {
        Row: {
          child_id: string
          classroom_name: string | null
          created_at: string | null
          event_date: string
          id: string
          item_description: string | null
          item_id: string
          item_title: string
          item_type: string
          parent_id: string
          read: boolean | null
        }
        Insert: {
          child_id: string
          classroom_name?: string | null
          created_at?: string | null
          event_date: string
          id?: string
          item_description?: string | null
          item_id: string
          item_title: string
          item_type: string
          parent_id: string
          read?: boolean | null
        }
        Update: {
          child_id?: string
          classroom_name?: string | null
          created_at?: string | null
          event_date?: string
          id?: string
          item_description?: string | null
          item_id?: string
          item_title?: string
          item_type?: string
          parent_id?: string
          read?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "parent_notifications_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parent_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_personal_events: {
        Row: {
          created_at: string | null
          description: string | null
          end_time: string | null
          event_date: string
          id: string
          location: string | null
          parent_id: string
          start_time: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          event_date: string
          id?: string
          location?: string | null
          parent_id: string
          start_time?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          event_date?: string
          id?: string
          location?: string | null
          parent_id?: string
          start_time?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parent_personal_events_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parent_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_student_events: {
        Row: {
          created_at: string | null
          description: string | null
          end_time: string | null
          event_date: string
          id: string
          is_parent_only: boolean
          location: string | null
          parent_id: string
          start_time: string | null
          student_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          event_date: string
          id?: string
          is_parent_only?: boolean
          location?: string | null
          parent_id: string
          start_time?: string | null
          student_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          event_date?: string
          id?: string
          is_parent_only?: boolean
          location?: string | null
          parent_id?: string
          start_time?: string | null
          student_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parent_student_events_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parent_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_student_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_student_links: {
        Row: {
          approved: boolean
          approved_at: string | null
          approved_by: string | null
          id: string
          notify_on_recess_return: boolean | null
          parent_id: string
          requested_at: string
          student_id: string
        }
        Insert: {
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          id?: string
          notify_on_recess_return?: boolean | null
          parent_id: string
          requested_at?: string
          student_id: string
        }
        Update: {
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          id?: string
          notify_on_recess_return?: boolean | null
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
      parent_teacher_messages: {
        Row: {
          created_at: string | null
          id: string
          is_from_parent: boolean
          is_read: boolean | null
          message_text: string
          message_type: string
          parent_id: string
          student_id: string
          subject: string
          teacher_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_from_parent: boolean
          is_read?: boolean | null
          message_text: string
          message_type: string
          parent_id: string
          student_id: string
          subject: string
          teacher_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_from_parent?: boolean
          is_read?: boolean | null
          message_text?: string
          message_type?: string
          parent_id?: string
          student_id?: string
          subject?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_teacher_messages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_teacher_messages_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_teacher_requests: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          rejection_reason: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          rejection_reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          rejection_reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
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
          district_name: string | null
          email: string
          full_name: string
          id: string
          is_verified: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          school_id: string | null
          signup_domain: string | null
          student_id: string | null
        }
        Insert: {
          created_at?: string
          district_id?: string | null
          district_name?: string | null
          email: string
          full_name: string
          id: string
          is_verified?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          school_id?: string | null
          signup_domain?: string | null
          student_id?: string | null
        }
        Update: {
          created_at?: string
          district_id?: string | null
          district_name?: string | null
          email?: string
          full_name?: string
          id?: string
          is_verified?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          school_id?: string | null
          signup_domain?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["district_code"]
          },
          {
            foreignKeyName: "profiles_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts_public"
            referencedColumns: ["district_code"]
          },
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          grade: number | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          grade?: number | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          grade?: number | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
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
          question_type: string | null
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
          question_type?: string | null
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
          question_type?: string | null
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
      reading_achievements: {
        Row: {
          achievement_type: string
          created_at: string
          earned_at: string
          id: string
          metadata: Json | null
          student_id: string
        }
        Insert: {
          achievement_type: string
          created_at?: string
          earned_at?: string
          id?: string
          metadata?: Json | null
          student_id: string
        }
        Update: {
          achievement_type?: string
          created_at?: string
          earned_at?: string
          id?: string
          metadata?: Json | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_achievements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_library: {
        Row: {
          category: string
          cover_gradient: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty_level: number | null
          grade_level: number
          helped_no_count: number | null
          helped_yes_count: number | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          is_system: boolean | null
          passage_text: string
          reading_time_minutes: number | null
          target_phonemes: string[] | null
          thumbs_down_count: number | null
          thumbs_up_count: number | null
          title: string
          total_reads: number | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          category: string
          cover_gradient?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: number | null
          grade_level: number
          helped_no_count?: number | null
          helped_yes_count?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          is_system?: boolean | null
          passage_text: string
          reading_time_minutes?: number | null
          target_phonemes?: string[] | null
          thumbs_down_count?: number | null
          thumbs_up_count?: number | null
          title: string
          total_reads?: number | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          category?: string
          cover_gradient?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: number | null
          grade_level?: number
          helped_no_count?: number | null
          helped_yes_count?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          is_system?: boolean | null
          passage_text?: string
          reading_time_minutes?: number | null
          target_phonemes?: string[] | null
          thumbs_down_count?: number | null
          thumbs_up_count?: number | null
          title?: string
          total_reads?: number | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      reading_missions: {
        Row: {
          completed_at: string | null
          created_at: string
          current_value: number
          description: string
          expires_at: string | null
          id: string
          mission_type: string
          status: string
          student_id: string
          target_value: number
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_value?: number
          description: string
          expires_at?: string | null
          id?: string
          mission_type: string
          status?: string
          student_id: string
          target_value: number
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_value?: number
          description?: string
          expires_at?: string | null
          id?: string
          mission_type?: string
          status?: string
          student_id?: string
          target_value?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_missions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_sessions: {
        Row: {
          accuracy_percent: number
          assignment_id: string | null
          audio_url: string | null
          cognitive_load_avg: number | null
          created_at: string | null
          duration_seconds: number
          fluency_level: string | null
          fluency_score: number | null
          id: string
          miscue_analysis: Json | null
          passage_text: string
          phoneme_accuracy: Json | null
          prosody_metrics: Json | null
          recommended_difficulty: number | null
          student_id: string
          wcpm: number | null
          words_read: number
          wpm: number
        }
        Insert: {
          accuracy_percent: number
          assignment_id?: string | null
          audio_url?: string | null
          cognitive_load_avg?: number | null
          created_at?: string | null
          duration_seconds: number
          fluency_level?: string | null
          fluency_score?: number | null
          id?: string
          miscue_analysis?: Json | null
          passage_text: string
          phoneme_accuracy?: Json | null
          prosody_metrics?: Json | null
          recommended_difficulty?: number | null
          student_id: string
          wcpm?: number | null
          words_read: number
          wpm: number
        }
        Update: {
          accuracy_percent?: number
          assignment_id?: string | null
          audio_url?: string | null
          cognitive_load_avg?: number | null
          created_at?: string | null
          duration_seconds?: number
          fluency_level?: string | null
          fluency_score?: number | null
          id?: string
          miscue_analysis?: Json | null
          passage_text?: string
          phoneme_accuracy?: Json | null
          prosody_metrics?: Json | null
          recommended_difficulty?: number | null
          student_id?: string
          wcpm?: number | null
          words_read?: number
          wpm?: number
        }
        Relationships: [
          {
            foreignKeyName: "reading_sessions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_reading_date: string | null
          longest_streak: number
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_reading_date?: string | null
          longest_streak?: number
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_reading_date?: string | null
          longest_streak?: number
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_streaks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "profiles"
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
      reunification_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          ended_at: string | null
          id: string
          location: string | null
          school_id: string | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          ended_at?: string | null
          id?: string
          location?: string | null
          school_id?: string | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          ended_at?: string | null
          id?: string
          location?: string | null
          school_id?: string | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reunification_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunification_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["district_code"]
          },
          {
            foreignKeyName: "reunification_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "districts_public"
            referencedColumns: ["district_code"]
          },
        ]
      }
      risk_alert_notifications: {
        Row: {
          email_status: string
          id: string
          notification_type: string
          parent_id: string | null
          risk_score: number
          sent_at: string
          student_id: string
          teacher_id: string
        }
        Insert: {
          email_status?: string
          id?: string
          notification_type: string
          parent_id?: string | null
          risk_score: number
          sent_at?: string
          student_id: string
          teacher_id: string
        }
        Update: {
          email_status?: string
          id?: string
          notification_type?: string
          parent_id?: string | null
          risk_score?: number
          sent_at?: string
          student_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_alert_notifications_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parent_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      rubric_criteria: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          max_points: number
          name: string
          rubric_id: string
          sequence: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          max_points?: number
          name: string
          rubric_id: string
          sequence?: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          max_points?: number
          name?: string
          rubric_id?: string
          sequence?: number
        }
        Relationships: [
          {
            foreignKeyName: "rubric_criteria_rubric_id_fkey"
            columns: ["rubric_id"]
            isOneToOne: false
            referencedRelation: "rubrics"
            referencedColumns: ["id"]
          },
        ]
      }
      rubric_levels: {
        Row: {
          created_at: string | null
          criteria_id: string
          description: string | null
          id: string
          name: string
          points: number
          sequence: number
        }
        Insert: {
          created_at?: string | null
          criteria_id: string
          description?: string | null
          id?: string
          name: string
          points: number
          sequence?: number
        }
        Update: {
          created_at?: string | null
          criteria_id?: string
          description?: string | null
          id?: string
          name?: string
          points?: number
          sequence?: number
        }
        Relationships: [
          {
            foreignKeyName: "rubric_levels_criteria_id_fkey"
            columns: ["criteria_id"]
            isOneToOne: false
            referencedRelation: "rubric_criteria"
            referencedColumns: ["id"]
          },
        ]
      }
      rubric_scores: {
        Row: {
          created_at: string | null
          criteria_id: string
          feedback: string | null
          id: string
          level_id: string | null
          points_awarded: number
          submission_id: string
        }
        Insert: {
          created_at?: string | null
          criteria_id: string
          feedback?: string | null
          id?: string
          level_id?: string | null
          points_awarded?: number
          submission_id: string
        }
        Update: {
          created_at?: string | null
          criteria_id?: string
          feedback?: string | null
          id?: string
          level_id?: string | null
          points_awarded?: number
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rubric_scores_criteria_id_fkey"
            columns: ["criteria_id"]
            isOneToOne: false
            referencedRelation: "rubric_criteria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rubric_scores_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "rubric_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rubric_scores_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "assignment_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      rubrics: {
        Row: {
          classroom_id: string
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          classroom_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          classroom_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rubrics_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rubrics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_alert_acknowledgments: {
        Row: {
          acknowledged_at: string | null
          alert_id: string
          id: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          alert_id: string
          id?: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          alert_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_alert_acknowledgments_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "safety_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_alert_acknowledgments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_alerts: {
        Row: {
          acknowledged_count: number | null
          affects_attendance: boolean | null
          alert_type: string
          authority_source: string | null
          authority_verified: boolean | null
          created_at: string | null
          created_by: string
          district_id: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          message: string
          notify_parents: boolean | null
          notify_students: boolean | null
          notify_teachers: boolean | null
          school_id: string | null
          severity: string
          title: string
        }
        Insert: {
          acknowledged_count?: number | null
          affects_attendance?: boolean | null
          alert_type: string
          authority_source?: string | null
          authority_verified?: boolean | null
          created_at?: string | null
          created_by: string
          district_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          notify_parents?: boolean | null
          notify_students?: boolean | null
          notify_teachers?: boolean | null
          school_id?: string | null
          severity: string
          title: string
        }
        Update: {
          acknowledged_count?: number | null
          affects_attendance?: boolean | null
          alert_type?: string
          authority_source?: string | null
          authority_verified?: boolean | null
          created_at?: string | null
          created_by?: string
          district_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          notify_parents?: boolean | null
          notify_students?: boolean | null
          notify_teachers?: boolean | null
          school_id?: string | null
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_alerts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_alerts_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["district_code"]
          },
          {
            foreignKeyName: "safety_alerts_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts_public"
            referencedColumns: ["district_code"]
          },
          {
            foreignKeyName: "safety_alerts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["district_code"]
          },
          {
            foreignKeyName: "safety_alerts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "districts_public"
            referencedColumns: ["district_code"]
          },
        ]
      }
      safety_audit_log: {
        Row: {
          alert_id: string | null
          created_at: string
          drill_session_id: string | null
          event_data: Json
          event_type: string
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          alert_id?: string | null
          created_at?: string
          drill_session_id?: string | null
          event_data?: Json
          event_type: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          alert_id?: string | null
          created_at?: string
          drill_session_id?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safety_audit_log_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "safety_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_audit_log_drill_session_id_fkey"
            columns: ["drill_session_id"]
            isOneToOne: false
            referencedRelation: "drill_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_verification_log: {
        Row: {
          actor_id: string | null
          actor_role: string | null
          classroom_id: string | null
          created_at: string
          drill_session_id: string | null
          event_data: Json | null
          event_hash: string | null
          event_type: string
          id: string
          ip_address: unknown
          previous_hash: string | null
          student_id: string | null
          user_agent: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_role?: string | null
          classroom_id?: string | null
          created_at?: string
          drill_session_id?: string | null
          event_data?: Json | null
          event_hash?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          previous_hash?: string | null
          student_id?: string | null
          user_agent?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_role?: string | null
          classroom_id?: string | null
          created_at?: string
          drill_session_id?: string | null
          event_data?: Json | null
          event_hash?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          previous_hash?: string | null
          student_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safety_verification_log_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_verification_log_drill_session_id_fkey"
            columns: ["drill_session_id"]
            isOneToOne: false
            referencedRelation: "drill_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_verification_log_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      school_events: {
        Row: {
          blocks_classes: boolean | null
          created_at: string | null
          created_by: string
          description: string | null
          end_time: string | null
          event_date: string
          event_type: Database["public"]["Enums"]["school_event_type"]
          id: string
          start_time: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          blocks_classes?: boolean | null
          created_at?: string | null
          created_by: string
          description?: string | null
          end_time?: string | null
          event_date: string
          event_type: Database["public"]["Enums"]["school_event_type"]
          id?: string
          start_time?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          blocks_classes?: boolean | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_type?: Database["public"]["Enums"]["school_event_type"]
          id?: string
          start_time?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      school_settings: {
        Row: {
          created_at: string
          id: string
          school_end_time: string
          school_start_time: string
          school_year_end: string
          school_year_start: string
          timezone: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          school_end_time?: string
          school_start_time?: string
          school_year_end?: string
          school_year_start?: string
          timezone?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          school_end_time?: string
          school_start_time?: string
          school_year_end?: string
          school_year_start?: string
          timezone?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      schools: {
        Row: {
          created_at: string
          created_by: string | null
          district_id: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          district_id: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          district_id?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schools_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["district_code"]
          },
          {
            foreignKeyName: "schools_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts_public"
            referencedColumns: ["district_code"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          action_type: string
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_role: Database["public"]["Enums"]["app_role"] | null
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: Database["public"]["Enums"]["app_role"] | null
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: Database["public"]["Enums"]["app_role"] | null
        }
        Relationships: []
      }
      sms_notification_logs: {
        Row: {
          created_at: string
          delivered_at: string | null
          drill_session_id: string | null
          error_message: string | null
          id: string
          message_content: string
          message_type: string
          phone_number: string
          recipient_id: string
          recipient_type: string
          sent_at: string | null
          status: string
          twilio_sid: string | null
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          drill_session_id?: string | null
          error_message?: string | null
          id?: string
          message_content: string
          message_type: string
          phone_number: string
          recipient_id: string
          recipient_type: string
          sent_at?: string | null
          status?: string
          twilio_sid?: string | null
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          drill_session_id?: string | null
          error_message?: string | null
          id?: string
          message_content?: string
          message_type?: string
          phone_number?: string
          recipient_id?: string
          recipient_type?: string
          sent_at?: string | null
          status?: string
          twilio_sid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_notification_logs_drill_session_id_fkey"
            columns: ["drill_session_id"]
            isOneToOne: false
            referencedRelation: "drill_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      story_votes: {
        Row: {
          created_at: string | null
          helped_learn: boolean | null
          id: string
          story_id: string
          student_id: string
          thumbs_up: boolean | null
        }
        Insert: {
          created_at?: string | null
          helped_learn?: boolean | null
          id?: string
          story_id: string
          student_id: string
          thumbs_up?: boolean | null
        }
        Update: {
          created_at?: string | null
          helped_learn?: boolean | null
          id?: string
          story_id?: string
          student_id?: string
          thumbs_up?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "story_votes_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "reading_library"
            referencedColumns: ["id"]
          },
        ]
      }
      student_behavior_stats: {
        Row: {
          best_streak: number
          classroom_id: string
          created_at: string
          current_streak: number
          id: string
          last_positive_date: string | null
          student_id: string
          total_points: number
          updated_at: string
          week_start_date: string
          weekly_points: number
        }
        Insert: {
          best_streak?: number
          classroom_id: string
          created_at?: string
          current_streak?: number
          id?: string
          last_positive_date?: string | null
          student_id: string
          total_points?: number
          updated_at?: string
          week_start_date?: string
          weekly_points?: number
        }
        Update: {
          best_streak?: number
          classroom_id?: string
          created_at?: string
          current_streak?: number
          id?: string
          last_positive_date?: string | null
          student_id?: string
          total_points?: number
          updated_at?: string
          week_start_date?: string
          weekly_points?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_behavior_stats_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_behavior_stats_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_benchmark_results: {
        Row: {
          accuracy_percentage: number | null
          assessment_date: string
          audio_url: string | null
          benchmark_status: string
          classroom_id: string
          created_at: string
          duration_seconds: number | null
          fluency_level: string | null
          grade_level: number
          id: string
          miscue_count: number | null
          notes: string | null
          passage_difficulty: string | null
          passage_title: string | null
          period_id: string | null
          prosody_score: number | null
          self_corrections: number | null
          student_id: string
          wcpm: number
          words_read: number | null
        }
        Insert: {
          accuracy_percentage?: number | null
          assessment_date?: string
          audio_url?: string | null
          benchmark_status: string
          classroom_id: string
          created_at?: string
          duration_seconds?: number | null
          fluency_level?: string | null
          grade_level: number
          id?: string
          miscue_count?: number | null
          notes?: string | null
          passage_difficulty?: string | null
          passage_title?: string | null
          period_id?: string | null
          prosody_score?: number | null
          self_corrections?: number | null
          student_id: string
          wcpm: number
          words_read?: number | null
        }
        Update: {
          accuracy_percentage?: number | null
          assessment_date?: string
          audio_url?: string | null
          benchmark_status?: string
          classroom_id?: string
          created_at?: string
          duration_seconds?: number | null
          fluency_level?: string | null
          grade_level?: number
          id?: string
          miscue_count?: number | null
          notes?: string | null
          passage_difficulty?: string | null
          passage_title?: string | null
          period_id?: string | null
          prosody_score?: number | null
          self_corrections?: number | null
          student_id?: string
          wcpm?: number
          words_read?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_benchmark_results_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_benchmark_results_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "benchmark_assessment_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_benchmark_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_error_patterns: {
        Row: {
          created_at: string | null
          error_type: string
          frequency: number | null
          id: string
          last_seen: string | null
          mastered: boolean | null
          student_id: string
          word_examples: string[]
        }
        Insert: {
          created_at?: string | null
          error_type: string
          frequency?: number | null
          id?: string
          last_seen?: string | null
          mastered?: boolean | null
          student_id: string
          word_examples: string[]
        }
        Update: {
          created_at?: string | null
          error_type?: string
          frequency?: number | null
          id?: string
          last_seen?: string | null
          mastered?: boolean | null
          student_id?: string
          word_examples?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "student_error_patterns_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_interventions: {
        Row: {
          classroom_id: string
          created_at: string
          id: string
          intervention_type: string
          notes: string | null
          resolved_at: string | null
          risk_score_after: number | null
          risk_score_before: number
          status: string
          student_id: string
          teacher_id: string
        }
        Insert: {
          classroom_id: string
          created_at?: string
          id?: string
          intervention_type: string
          notes?: string | null
          resolved_at?: string | null
          risk_score_after?: number | null
          risk_score_before: number
          status?: string
          student_id: string
          teacher_id: string
        }
        Update: {
          classroom_id?: string
          created_at?: string
          id?: string
          intervention_type?: string
          notes?: string | null
          resolved_at?: string | null
          risk_score_after?: number | null
          risk_score_before?: number
          status?: string
          student_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_interventions_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      student_pickups: {
        Row: {
          created_at: string | null
          id: string
          location: string | null
          notes: string | null
          picked_up_by: string | null
          pickup_time: string | null
          qr_verified: boolean | null
          relationship: string
          released_by_teacher_id: string | null
          reunification_event_id: string | null
          student_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          picked_up_by?: string | null
          pickup_time?: string | null
          qr_verified?: boolean | null
          relationship: string
          released_by_teacher_id?: string | null
          reunification_event_id?: string | null
          student_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          picked_up_by?: string | null
          pickup_time?: string | null
          qr_verified?: boolean | null
          relationship?: string
          released_by_teacher_id?: string | null
          reunification_event_id?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_pickups_picked_up_by_fkey"
            columns: ["picked_up_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_pickups_released_by_teacher_id_fkey"
            columns: ["released_by_teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_pickups_reunification_event_id_fkey"
            columns: ["reunification_event_id"]
            isOneToOne: false
            referencedRelation: "reunification_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_pickups_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          created_at: string
          id: string
          stats: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          stats?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
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
      student_reading_progress: {
        Row: {
          best_accuracy: number | null
          best_wpm: number | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          story_id: string
          student_id: string
          times_read: number | null
        }
        Insert: {
          best_accuracy?: number | null
          best_wpm?: number | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          story_id: string
          student_id: string
          times_read?: number | null
        }
        Update: {
          best_accuracy?: number | null
          best_wpm?: number | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          story_id?: string
          student_id?: string
          times_read?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_reading_progress_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "reading_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_reading_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_reading_stats: {
        Row: {
          badges_earned: string[] | null
          created_at: string | null
          current_streak_days: number | null
          id: string
          last_activity_date: string | null
          level: number | null
          longest_streak_days: number | null
          student_id: string
          total_sessions: number | null
          total_words_read: number | null
          updated_at: string | null
          xp_points: number | null
        }
        Insert: {
          badges_earned?: string[] | null
          created_at?: string | null
          current_streak_days?: number | null
          id?: string
          last_activity_date?: string | null
          level?: number | null
          longest_streak_days?: number | null
          student_id: string
          total_sessions?: number | null
          total_words_read?: number | null
          updated_at?: string | null
          xp_points?: number | null
        }
        Update: {
          badges_earned?: string[] | null
          created_at?: string | null
          current_streak_days?: number | null
          id?: string
          last_activity_date?: string | null
          level?: number | null
          longest_streak_days?: number | null
          student_id?: string
          total_sessions?: number | null
          total_words_read?: number | null
          updated_at?: string | null
          xp_points?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_reading_stats_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_risk_history: {
        Row: {
          classroom_id: string
          created_at: string
          factors: Json
          id: string
          risk_level: string
          risk_score: number
          student_id: string
        }
        Insert: {
          classroom_id: string
          created_at?: string
          factors?: Json
          id?: string
          risk_level: string
          risk_score: number
          student_id: string
        }
        Update: {
          classroom_id?: string
          created_at?: string
          factors?: Json
          id?: string
          risk_level?: string
          risk_score?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_risk_history_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      student_signup_consents: {
        Row: {
          consent_date: string | null
          consent_given: boolean
          consent_token: string
          created_at: string
          district_id: string | null
          expires_at: string
          full_name: string | null
          id: string
          ip_address: string | null
          parent_email: string
          parent_name: string
          password_temp: string | null
          student_email: string
          student_role: string | null
        }
        Insert: {
          consent_date?: string | null
          consent_given?: boolean
          consent_token: string
          created_at?: string
          district_id?: string | null
          expires_at?: string
          full_name?: string | null
          id?: string
          ip_address?: string | null
          parent_email: string
          parent_name: string
          password_temp?: string | null
          student_email: string
          student_role?: string | null
        }
        Update: {
          consent_date?: string | null
          consent_given?: boolean
          consent_token?: string
          created_at?: string
          district_id?: string | null
          expires_at?: string
          full_name?: string | null
          id?: string
          ip_address?: string | null
          parent_email?: string
          parent_name?: string
          password_temp?: string | null
          student_email?: string
          student_role?: string | null
        }
        Relationships: []
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
      student_standard_scores: {
        Row: {
          assignments_completed: number
          classroom_id: string
          created_at: string
          id: string
          last_updated: string
          mastery_percentage: number
          standard_id: string
          student_id: string
        }
        Insert: {
          assignments_completed?: number
          classroom_id: string
          created_at?: string
          id?: string
          last_updated?: string
          mastery_percentage?: number
          standard_id: string
          student_id: string
        }
        Update: {
          assignments_completed?: number
          classroom_id?: string
          created_at?: string
          id?: string
          last_updated?: string
          mastery_percentage?: number
          standard_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_standard_scores_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_standard_scores_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "learning_standards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_standard_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      substitute_access_links: {
        Row: {
          access_code: string
          access_end: string
          access_start: string
          classroom_id: string
          created_at: string
          id: string
          is_active: boolean | null
          permissions: Json | null
          substitute_email: string | null
          substitute_name: string | null
          teacher_id: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          access_code: string
          access_end: string
          access_start: string
          classroom_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          substitute_email?: string | null
          substitute_name?: string | null
          teacher_id: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          access_code?: string
          access_end?: string
          access_start?: string
          classroom_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          substitute_email?: string | null
          substitute_name?: string | null
          teacher_id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "substitute_access_links_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "substitute_access_links_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "substitute_access_links_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
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
      teacher_game_scores: {
        Row: {
          game_type: string
          id: string
          played_at: string
          score: number
          teacher_id: string
        }
        Insert: {
          game_type: string
          id?: string
          played_at?: string
          score?: number
          teacher_id: string
        }
        Update: {
          game_type?: string
          id?: string
          played_at?: string
          score?: number
          teacher_id?: string
        }
        Relationships: []
      }
      teacher_journal_entries: {
        Row: {
          classroom_id: string | null
          created_at: string
          energy_level: number | null
          entry_date: string
          gratitude: string | null
          id: string
          mood: string
          note: string | null
          teacher_id: string
          updated_at: string
          win_of_the_day: string | null
        }
        Insert: {
          classroom_id?: string | null
          created_at?: string
          energy_level?: number | null
          entry_date?: string
          gratitude?: string | null
          id?: string
          mood: string
          note?: string | null
          teacher_id: string
          updated_at?: string
          win_of_the_day?: string | null
        }
        Update: {
          classroom_id?: string | null
          created_at?: string
          energy_level?: number | null
          entry_date?: string
          gratitude?: string | null
          id?: string
          mood?: string
          note?: string | null
          teacher_id?: string
          updated_at?: string
          win_of_the_day?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_journal_entries_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_office_hours: {
        Row: {
          created_at: string
          days_of_week: string[]
          end_date: string | null
          end_time: string
          id: string
          is_recurring: boolean
          location: string | null
          meeting_duration_minutes: number
          notes: string | null
          specific_date: string | null
          start_date: string | null
          start_time: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          days_of_week: string[]
          end_date?: string | null
          end_time: string
          id?: string
          is_recurring?: boolean
          location?: string | null
          meeting_duration_minutes?: number
          notes?: string | null
          specific_date?: string | null
          start_date?: string | null
          start_time: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          days_of_week?: string[]
          end_date?: string | null
          end_time?: string
          id?: string
          is_recurring?: boolean
          location?: string | null
          meeting_duration_minutes?: number
          notes?: string | null
          specific_date?: string | null
          start_date?: string | null
          start_time?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_office_hours_teacher_id_fkey"
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
          visible_to_student: boolean | null
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
          visible_to_student?: boolean | null
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
          visible_to_student?: boolean | null
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
      visitors: {
        Row: {
          badge_number: string | null
          checked_in_at: string
          checked_out_at: string | null
          company_organization: string | null
          created_at: string
          email: string | null
          expected_checkout: string | null
          first_name: string
          host_id: string | null
          host_name: string | null
          id: string
          is_on_campus: boolean | null
          last_name: string
          phone_number: string | null
          photo_url: string | null
          purpose: string
          school_id: string | null
          updated_at: string
        }
        Insert: {
          badge_number?: string | null
          checked_in_at?: string
          checked_out_at?: string | null
          company_organization?: string | null
          created_at?: string
          email?: string | null
          expected_checkout?: string | null
          first_name: string
          host_id?: string | null
          host_name?: string | null
          id?: string
          is_on_campus?: boolean | null
          last_name: string
          phone_number?: string | null
          photo_url?: string | null
          purpose: string
          school_id?: string | null
          updated_at?: string
        }
        Update: {
          badge_number?: string | null
          checked_in_at?: string
          checked_out_at?: string | null
          company_organization?: string | null
          created_at?: string
          email?: string | null
          expected_checkout?: string | null
          first_name?: string
          host_id?: string | null
          host_name?: string | null
          id?: string
          is_on_campus?: boolean | null
          last_name?: string
          phone_number?: string | null
          photo_url?: string | null
          purpose?: string
          school_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitors_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitors_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["district_code"]
          },
          {
            foreignKeyName: "visitors_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "districts_public"
            referencedColumns: ["district_code"]
          },
        ]
      }
      word_readings: {
        Row: {
          created_at: string | null
          end_time_ms: number
          hesitation_detected: boolean | null
          id: string
          mispronunciation_type: string | null
          phonemes_detected: Json | null
          phonemes_expected: Json | null
          session_id: string
          start_time_ms: number
          was_correct: boolean
          word_index: number
          word_text: string
        }
        Insert: {
          created_at?: string | null
          end_time_ms: number
          hesitation_detected?: boolean | null
          id?: string
          mispronunciation_type?: string | null
          phonemes_detected?: Json | null
          phonemes_expected?: Json | null
          session_id: string
          start_time_ms: number
          was_correct: boolean
          word_index: number
          word_text: string
        }
        Update: {
          created_at?: string | null
          end_time_ms?: number
          hesitation_detected?: boolean | null
          id?: string
          mispronunciation_type?: string | null
          phonemes_detected?: Json | null
          phonemes_expected?: Json | null
          session_id?: string
          start_time_ms?: number
          was_correct?: boolean
          word_index?: number
          word_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "word_readings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "reading_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      districts_public: {
        Row: {
          district_code: string | null
          is_visible: boolean | null
          name: string | null
          slug: string | null
        }
        Insert: {
          district_code?: string | null
          is_visible?: boolean | null
          name?: string | null
          slug?: string | null
        }
        Update: {
          district_code?: string | null
          is_visible?: boolean | null
          name?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      security_summary: {
        Row: {
          category: string | null
          last_activity: string | null
          total_records: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_student_join_request: {
        Args: { p_request_id: string }
        Returns: Json
      }
      attempt_buzz: {
        Args: {
          p_match_id: string
          p_seq: number
          p_tournament_player_id: string
        }
        Returns: Json
      }
      can_parent_view_classroom: {
        Args: { _classroom_id: string; _user_id: string }
        Returns: boolean
      }
      can_parent_view_student_profile: {
        Args: { _student_id: string; _user_id: string }
        Returns: boolean
      }
      can_read_tournament_questions: {
        Args: { _tournament_id: string; _user_id: string }
        Returns: boolean
      }
      check_consent_exists: {
        Args: { p_student_email: string }
        Returns: {
          consent_given: boolean
          id: string
        }[]
      }
      check_email_exists_secure: { Args: { p_email: string }; Returns: boolean }
      cleanup_expired_safety_alerts: { Args: never; Returns: undefined }
      compute_levenshtein: { Args: { a: string; b: string }; Returns: number }
      deny_student_join_request: {
        Args: { p_request_id: string }
        Returns: Json
      }
      find_student_by_email_secure: {
        Args: { p_email: string }
        Returns: string
      }
      generate_district_code: { Args: never; Returns: string }
      generate_join_code: { Args: never; Returns: string }
      generate_unique_district_code: { Args: never; Returns: string }
      get_all_admins: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          school_id: string
          school_name: string
        }[]
      }
      get_all_students: {
        Args: never
        Returns: {
          classroom_count: number
          email: string
          full_name: string
          id: string
          parent_count: number
          school_id: string
          school_name: string
          student_id: string
        }[]
      }
      get_all_teachers: {
        Args: never
        Returns: {
          classroom_count: number
          email: string
          full_name: string
          id: string
          school_id: string
          school_name: string
        }[]
      }
      get_assignments_for_substitute: {
        Args: { p_classroom_id: string; p_link_id: string }
        Returns: {
          assignment_type: string
          category: string
          created_at: string
          description: string
          due_date: string
          id: string
          is_posted: boolean
          question_count: number
          status: string
          timer_minutes: number
          title: string
        }[]
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
      get_classroom_for_substitute: {
        Args: { p_classroom_id: string; p_link_id: string }
        Returns: {
          access_end: string
          created_at: string
          end_time: string
          grade: number
          id: string
          join_code: string
          location: string
          meeting_days: string[]
          name: string
          permissions: Json
          schedule_end_date: string
          schedule_start_date: string
          start_time: string
          subject: string
          substitute_name: string
          teacher_id: string
        }[]
      }
      get_classroom_leaderboard: {
        Args: { _classroom_id: string }
        Returns: Database["public"]["CompositeTypes"]["classroom_leaderboard_entry"][]
        SetofOptions: {
          from: "*"
          to: "classroom_leaderboard_entry"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_classroom_student_display_info: {
        Args: { _classroom_id: string; _requesting_user_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          grade: number
          joined_at: string
          student_id: string
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
      get_classroom_students_admin: {
        Args: { p_classroom_id: string }
        Returns: {
          email: string
          full_name: string
          joined_at: string
          student_id: string
        }[]
      }
      get_consent_by_token: {
        Args: { p_token: string }
        Returns: {
          consent_given: boolean
          district_id: string
          expires_at: string
          full_name: string
          id: string
          parent_name: string
          password_temp: string
          student_email: string
          student_role: string
        }[]
      }
      get_directory_admins: {
        Args: never
        Returns: {
          email: string
          full_name: string
          id: string
        }[]
      }
      get_directory_teachers: {
        Args: never
        Returns: {
          email: string
          full_name: string
          id: string
        }[]
      }
      get_missing_students_with_escalation: {
        Args: { p_drill_session_id: string }
        Returns: {
          attendance_id: string
          classroom_id: string
          classroom_name: string
          escalation_level: number
          escalation_started_at: string
          parent_phone: string
          status: string
          student_id: string
          student_name: string
          teacher_id: string
          teacher_name: string
          time_missing_seconds: number
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
      get_parent_child_info: {
        Args: { _parent_user_id: string; _student_id: string }
        Returns: {
          avatar_url: string
          email: string
          full_name: string
          grade: number
          student_id: string
        }[]
      }
      get_parent_children: {
        Args: { _parent_user_id: string }
        Returns: {
          approved: boolean
          approved_at: string
          avatar_url: string
          email: string
          full_name: string
          grade: number
          link_id: string
          student_id: string
        }[]
      }
      get_parent_id: { Args: { _user_id: string }; Returns: string }
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
      get_pending_join_requests: {
        Args: { _classroom_id: string }
        Returns: {
          classroom_id: string
          id: string
          requested_at: string
          status: string
          student_email: string
          student_id: string
          student_name: string
        }[]
      }
      get_signed_audio_url: {
        Args: {
          p_audio_path: string
          p_expires_in?: number
          p_student_id: string
        }
        Returns: string
      }
      get_student_assignment_stats: {
        Args: { _student_id: string }
        Returns: {
          completed_assignments: number
          total_assignments: number
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
      get_student_classrooms_admin: {
        Args: { p_student_id: string }
        Returns: {
          classroom_id: string
          classroom_name: string
          join_code: string
          joined_at: string
          teacher_name: string
        }[]
      }
      get_student_group_ids: {
        Args: { _student_id: string }
        Returns: {
          group_id: string
        }[]
      }
      get_student_parents_admin: {
        Args: { p_student_id: string }
        Returns: {
          approved: boolean
          approved_at: string
          parent_email: string
          parent_id: string
          parent_name: string
        }[]
      }
      get_students_for_substitute: {
        Args: { p_classroom_id: string; p_link_id: string }
        Returns: {
          email: string
          full_name: string
          joined_at: string
          student_id: string
        }[]
      }
      get_teacher_classrooms: {
        Args: { p_teacher_id: string }
        Returns: {
          created_at: string
          id: string
          join_code: string
          name: string
          student_count: number
        }[]
      }
      get_tournament_players: {
        Args: { _tournament_id: string }
        Returns: {
          avatar_url: string
          created_at: string
          display_name: string
          eliminated_at: string
          id: string
          profile_id: string
          seed: number
          status: string
        }[]
      }
      get_user_district_id: { Args: { _user_id: string }; Returns: string }
      get_user_profile: {
        Args: { _user_id: string }
        Returns: {
          email: string
          full_name: string
          id: string
          role: string
          student_id: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_aura_consent: {
        Args: { _student_id: string; _teacher_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_substitute_access: {
        Args: { _classroom_id: string; _user_id: string }
        Returns: boolean
      }
      is_classmate: {
        Args: { _viewed_id: string; _viewer_id: string }
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
      is_district_manager: { Args: { _user_id: string }; Returns: boolean }
      is_parent: { Args: { _user_id: string }; Returns: boolean }
      is_parent_of_student: {
        Args: { _student_id: string; _user_id: string }
        Returns: boolean
      }
      is_submission_teacher: {
        Args: { _submission_id: string; _user_id: string }
        Returns: boolean
      }
      is_teacher_of_student: {
        Args: { _student_id: string; _teacher_id: string }
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
      join_classroom_by_code: { Args: { p_join_code: string }; Returns: Json }
      log_aura_access: {
        Args: {
          p_access_context?: string
          p_access_type: string
          p_record_id: string
          p_student_id: string
        }
        Returns: undefined
      }
      mask_email: {
        Args: { email: string; viewer_id: string }
        Returns: string
      }
      seed_default_behavior_categories: {
        Args: { p_classroom_id: string }
        Returns: undefined
      }
      submit_answer_tx:
        | {
            Args: {
              p_answer_text: string
              p_match_event_id: string
              p_match_id: string
              p_tournament_player_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_answer_text: string
              p_match_id: string
              p_seq: number
              p_tournament_player_id: string
            }
            Returns: Json
          }
      update_user_district:
        | {
            Args: { p_district_id: string; p_user_id: string }
            Returns: undefined
          }
        | {
            Args: { p_district_id: string; p_user_id: string }
            Returns: undefined
          }
      validate_substitute_access: {
        Args: { p_access_code: string; p_email: string }
        Returns: Json
      }
    }
    Enums: {
      answer_status: "not_attempted" | "in_progress" | "completed"
      app_role: "admin" | "teacher" | "student" | "district_manager" | "parent"
      difficulty_level: "easy" | "medium" | "hard"
      elimination_status: "active" | "eliminated"
      event_category:
        | "quiz"
        | "test"
        | "field_trip"
        | "guest_speaker"
        | "homework_due"
        | "project_presentation"
        | "parent_teacher_conference"
        | "other"
      match_status: "waiting" | "in_progress" | "completed"
      question_type: "question_answer" | "reading_comprehension" | "speaking"
      school_event_type:
        | "holiday"
        | "school_break"
        | "assembly"
        | "testing_day"
        | "early_dismissal"
        | "picture_day"
        | "other"
      tournament_status: "waiting" | "in_progress" | "completed"
      user_role: "teacher" | "student" | "admin" | "district_admin" | "parent"
    }
    CompositeTypes: {
      classroom_leaderboard_entry: {
        student_id: string | null
        student_name: string | null
        avatar_url: string | null
        grade: number | null
        games_won: number | null
        games_played: number | null
        assignments_completed: number | null
        aura_avg_score: number | null
        total_score: number | null
      }
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
      app_role: ["admin", "teacher", "student", "district_manager", "parent"],
      difficulty_level: ["easy", "medium", "hard"],
      elimination_status: ["active", "eliminated"],
      event_category: [
        "quiz",
        "test",
        "field_trip",
        "guest_speaker",
        "homework_due",
        "project_presentation",
        "parent_teacher_conference",
        "other",
      ],
      match_status: ["waiting", "in_progress", "completed"],
      question_type: ["question_answer", "reading_comprehension", "speaking"],
      school_event_type: [
        "holiday",
        "school_break",
        "assembly",
        "testing_day",
        "early_dismissal",
        "picture_day",
        "other",
      ],
      tournament_status: ["waiting", "in_progress", "completed"],
      user_role: ["teacher", "student", "admin", "district_admin", "parent"],
    },
  },
} as const

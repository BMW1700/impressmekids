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
          assignment_id: string
          attempt_number: number
          created_at: string
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
          assignment_id: string
          attempt_number?: number
          created_at?: string
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
          assignment_id?: string
          attempt_number?: number
          created_at?: string
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
          id: string
          is_group_assignment: boolean | null
          is_posted: boolean | null
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
          category?: string
          classroom_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          enable_realtime_coaching?: boolean | null
          id?: string
          is_group_assignment?: boolean | null
          is_posted?: boolean | null
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
          category?: string
          classroom_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          enable_realtime_coaching?: boolean | null
          id?: string
          is_group_assignment?: boolean | null
          is_posted?: boolean | null
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
          logo_url: string | null
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
          logo_url?: string | null
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
          logo_url?: string | null
          name?: string
          primary_contact_email?: string | null
          slug?: string
          subscription_tier?: string | null
          updated_at?: string
        }
        Relationships: []
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
          signup_domain: string | null
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
          signup_domain?: string | null
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
          signup_domain?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["district_code"]
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
          created_at: string | null
          duration_seconds: number
          fluency_score: number | null
          id: string
          passage_text: string
          student_id: string
          words_read: number
          wpm: number
        }
        Insert: {
          accuracy_percent: number
          assignment_id?: string | null
          created_at?: string | null
          duration_seconds: number
          fluency_score?: number | null
          id?: string
          passage_text: string
          student_id: string
          words_read: number
          wpm: number
        }
        Update: {
          accuracy_percent?: number
          assignment_id?: string | null
          created_at?: string | null
          duration_seconds?: number
          fluency_score?: number | null
          id?: string
          passage_text?: string
          student_id?: string
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
      check_email_exists_secure: { Args: { p_email: string }; Returns: boolean }
      compute_levenshtein: { Args: { a: string; b: string }; Returns: number }
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
        }[]
      }
      get_all_students: {
        Args: never
        Returns: {
          classroom_count: number
          created_at: string
          email: string
          full_name: string
          id: string
          parent_count: number
        }[]
      }
      get_all_teachers: {
        Args: never
        Returns: {
          classroom_count: number
          created_at: string
          email: string
          full_name: string
          id: string
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
          id: string
          profile_id: string
          seed: number
          status: string
        }[]
      }
      get_user_profile: {
        Args: { _user_id: string }
        Returns: {
          email: string
          full_name: string
          id: string
          role: string
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
      submit_answer_tx:
        | {
            Args: {
              p_answer_text: string
              p_match_id: string
              p_seq: number
              p_tournament_player_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_answer_text: string
              p_match_event_id: string
              p_match_id: string
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
    }
    Enums: {
      answer_status: "not_attempted" | "in_progress" | "completed"
      app_role: "admin" | "teacher" | "student" | "district_manager"
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
      app_role: ["admin", "teacher", "student", "district_manager"],
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

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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string
          dedup_key: string | null
          id: string
          language: string
          module: string
          payload: Json | null
          points: number
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dedup_key?: string | null
          id?: string
          language?: string
          module: string
          payload?: Json | null
          points?: number
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          dedup_key?: string | null
          id?: string
          language?: string
          module?: string
          payload?: Json | null
          points?: number
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      availability_slots: {
        Row: {
          created_at: string
          duration_minutes: number
          id: string
          language: string
          start_time: string
          status: string
          teacher_id: string | null
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          id?: string
          language?: string
          start_time: string
          status?: string
          teacher_id?: string | null
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: string
          language?: string
          start_time?: string
          status?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_words: {
        Row: {
          collection_id: string
          id: string
          word_id: string
        }
        Insert: {
          collection_id: string
          id?: string
          word_id: string
        }
        Update: {
          collection_id?: string
          id?: string
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_words_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "word_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_words_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "vocabulary_words"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      error_events: {
        Row: {
          attempt_no: number | null
          category: string
          context: string | null
          created_at: string
          example_correct: string
          example_wrong: string
          id: string
          language: string
          module: string
          severity: number
          source_type: string
          topic: string
          user_id: string
        }
        Insert: {
          attempt_no?: number | null
          category: string
          context?: string | null
          created_at?: string
          example_correct: string
          example_wrong: string
          id?: string
          language?: string
          module: string
          severity?: number
          source_type: string
          topic: string
          user_id: string
        }
        Update: {
          attempt_no?: number | null
          category?: string
          context?: string | null
          created_at?: string
          example_correct?: string
          example_wrong?: string
          id?: string
          language?: string
          module?: string
          severity?: number
          source_type?: string
          topic?: string
          user_id?: string
        }
        Relationships: []
      }
      grammar_sessions: {
        Row: {
          correct_answers: Json
          created_at: string
          id: string
          language: string
          questions: Json
          score: number
          session_type: string
          topic: string
          total: number
          user_answers: Json
          user_id: string
        }
        Insert: {
          correct_answers?: Json
          created_at?: string
          id?: string
          language?: string
          questions?: Json
          score?: number
          session_type?: string
          topic: string
          total?: number
          user_answers?: Json
          user_id: string
        }
        Update: {
          correct_answers?: Json
          created_at?: string
          id?: string
          language?: string
          questions?: Json
          score?: number
          session_type?: string
          topic?: string
          total?: number
          user_answers?: Json
          user_id?: string
        }
        Relationships: []
      }
      grammar_submissions: {
        Row: {
          corrected_text: string | null
          created_at: string
          explanations: string | null
          id: string
          language: string
          topic: string
          user_id: string
          user_text: string
        }
        Insert: {
          corrected_text?: string | null
          created_at?: string
          explanations?: string | null
          id?: string
          language?: string
          topic: string
          user_id: string
          user_text: string
        }
        Update: {
          corrected_text?: string | null
          created_at?: string
          explanations?: string | null
          id?: string
          language?: string
          topic?: string
          user_id?: string
          user_text?: string
        }
        Relationships: []
      }
      lesson_types: {
        Row: {
          capacity: number
          created_at: string
          currency: string
          description: string
          duration_minutes: number
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["lesson_kind"]
          language: string
          price_cents: number
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          currency?: string
          description?: string
          duration_minutes?: number
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["lesson_kind"]
          language?: string
          price_cents?: number
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          currency?: string
          description?: string
          duration_minutes?: number
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["lesson_kind"]
          language?: string
          price_cents?: number
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_types_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          end_time: string
          id: string
          language: string
          lesson_type_id: string | null
          share_analytics: boolean
          slot_id: string
          start_time: string
          status: string
          student_note: string | null
          teacher_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          language?: string
          lesson_type_id?: string | null
          share_analytics?: boolean
          slot_id: string
          start_time: string
          status?: string
          student_note?: string | null
          teacher_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          language?: string
          lesson_type_id?: string | null
          share_analytics?: boolean
          slot_id?: string
          start_time?: string
          status?: string
          student_note?: string | null
          teacher_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_lesson_type_id_fkey"
            columns: ["lesson_type_id"]
            isOneToOne: false
            referencedRelation: "lesson_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "availability_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          confidence_level: number | null
          created_at: string | null
          display_name: string | null
          focus_area: string | null
          id: string
          learning_goal: string | null
          level: string | null
          lives_in_norway: boolean | null
          onboarding_completed: boolean
          preferred_language: string | null
          preferred_tone: string | null
          subscription_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          confidence_level?: number | null
          created_at?: string | null
          display_name?: string | null
          focus_area?: string | null
          id?: string
          learning_goal?: string | null
          level?: string | null
          lives_in_norway?: boolean | null
          onboarding_completed?: boolean
          preferred_language?: string | null
          preferred_tone?: string | null
          subscription_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          confidence_level?: number | null
          created_at?: string | null
          display_name?: string | null
          focus_area?: string | null
          id?: string
          learning_goal?: string | null
          level?: string | null
          lives_in_norway?: boolean | null
          onboarding_completed?: boolean
          preferred_language?: string | null
          preferred_tone?: string | null
          subscription_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reading_sessions: {
        Row: {
          completed: boolean
          created_at: string
          exercises: Json
          feedback: Json
          id: string
          language: string
          length: string
          level: string
          score: number
          text: string
          title: string
          topic: string
          total: number
          updated_at: string
          user_answers: Json
          user_id: string
          vocabulary: Json
        }
        Insert: {
          completed?: boolean
          created_at?: string
          exercises?: Json
          feedback?: Json
          id?: string
          language?: string
          length: string
          level: string
          score?: number
          text?: string
          title?: string
          topic: string
          total?: number
          updated_at?: string
          user_answers?: Json
          user_id: string
          vocabulary?: Json
        }
        Update: {
          completed?: boolean
          created_at?: string
          exercises?: Json
          feedback?: Json
          id?: string
          language?: string
          length?: string
          level?: string
          score?: number
          text?: string
          title?: string
          topic?: string
          total?: number
          updated_at?: string
          user_answers?: Json
          user_id?: string
          vocabulary?: Json
        }
        Relationships: []
      }
      saved_explanations: {
        Row: {
          created_at: string
          explanation_data: Json
          id: string
          language: string
          query: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          explanation_data?: Json
          id?: string
          language?: string
          query: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          explanation_data?: Json
          id?: string
          language?: string
          query?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      student_teacher_consents: {
        Row: {
          consent_granted: boolean
          created_at: string
          granted_at: string | null
          id: string
          revoked_at: string | null
          student_id: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          consent_granted?: boolean
          created_at?: string
          granted_at?: string | null
          id?: string
          revoked_at?: string | null
          student_id: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          consent_granted?: boolean
          created_at?: string
          granted_at?: string | null
          id?: string
          revoked_at?: string | null
          student_id?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_teacher_consents_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      talk_sessions: {
        Row: {
          created_at: string
          formality: string
          id: string
          language: string
          message_count: number
          messages: Json
          points: number
          recap: Json | null
          role: string
          situation: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          formality?: string
          id?: string
          language?: string
          message_count?: number
          messages?: Json
          points?: number
          recap?: Json | null
          role?: string
          situation?: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          formality?: string
          id?: string
          language?: string
          message_count?: number
          messages?: Json
          points?: number
          recap?: Json | null
          role?: string
          situation?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      teacher_applications: {
        Row: {
          admin_notes: string | null
          bio: string
          created_at: string
          cv_path: string | null
          email: string
          experience: string | null
          full_name: string
          id: string
          languages: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          bio: string
          created_at?: string
          cv_path?: string | null
          email: string
          experience?: string | null
          full_name: string
          id?: string
          languages: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          bio?: string
          created_at?: string
          cv_path?: string | null
          email?: string
          experience?: string | null
          full_name?: string
          id?: string
          languages?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      teacher_profile: {
        Row: {
          bio: string
          duration_minutes: number
          email: string | null
          focus: string[]
          id: string
          meet_link: string | null
          name: string
          photo_url: string | null
          rating: number
          students_count: number
          updated_at: string
        }
        Insert: {
          bio?: string
          duration_minutes?: number
          email?: string | null
          focus?: string[]
          id?: string
          meet_link?: string | null
          name?: string
          photo_url?: string | null
          rating?: number
          students_count?: number
          updated_at?: string
        }
        Update: {
          bio?: string
          duration_minutes?: number
          email?: string | null
          focus?: string[]
          id?: string
          meet_link?: string | null
          name?: string
          photo_url?: string | null
          rating?: number
          students_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      teachers: {
        Row: {
          bio: string
          created_at: string
          email: string | null
          focus: string[]
          id: string
          is_active: boolean
          is_verified: boolean
          language: string
          meet_link: string | null
          name: string
          photo_url: string | null
          rating: number
          spoken_languages: string[]
          students_count: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bio?: string
          created_at?: string
          email?: string | null
          focus?: string[]
          id?: string
          is_active?: boolean
          is_verified?: boolean
          language?: string
          meet_link?: string | null
          name: string
          photo_url?: string | null
          rating?: number
          spoken_languages?: string[]
          students_count?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bio?: string
          created_at?: string
          email?: string | null
          focus?: string[]
          id?: string
          is_active?: boolean
          is_verified?: boolean
          language?: string
          meet_link?: string | null
          name?: string
          photo_url?: string | null
          rating?: number
          spoken_languages?: string[]
          students_count?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_xp: {
        Row: {
          created_at: string
          id: string
          last_daily_bonus_date: string | null
          level: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_daily_bonus_date?: string | null
          level?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_daily_bonus_date?: string | null
          level?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vocab_items: {
        Row: {
          antonym: string | null
          created_at: string
          examples: Json | null
          id: string
          language: string
          status: string
          synonym: string | null
          theme: string
          user_id: string
          user_sentence: string | null
          word: string
        }
        Insert: {
          antonym?: string | null
          created_at?: string
          examples?: Json | null
          id?: string
          language?: string
          status?: string
          synonym?: string | null
          theme: string
          user_id: string
          user_sentence?: string | null
          word: string
        }
        Update: {
          antonym?: string | null
          created_at?: string
          examples?: Json | null
          id?: string
          language?: string
          status?: string
          synonym?: string | null
          theme?: string
          user_id?: string
          user_sentence?: string | null
          word?: string
        }
        Relationships: []
      }
      vocabulary_words: {
        Row: {
          antonym: string | null
          created_at: string
          example_sentence: string | null
          grammar_forms: Json | null
          id: string
          language: string
          synonym: string | null
          topic: string
          translation: string
          user_id: string
          word: string
          word_type: string | null
        }
        Insert: {
          antonym?: string | null
          created_at?: string
          example_sentence?: string | null
          grammar_forms?: Json | null
          id?: string
          language?: string
          synonym?: string | null
          topic?: string
          translation?: string
          user_id: string
          word: string
          word_type?: string | null
        }
        Update: {
          antonym?: string | null
          created_at?: string
          example_sentence?: string | null
          grammar_forms?: Json | null
          id?: string
          language?: string
          synonym?: string | null
          topic?: string
          translation?: string
          user_id?: string
          word?: string
          word_type?: string | null
        }
        Relationships: []
      }
      word_collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          language: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          language?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          language?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      writing_exercises: {
        Row: {
          analysis: Json
          corrected_text: string | null
          created_at: string
          exercise_type: string
          id: string
          image_path: string | null
          language: string
          level: string | null
          original_text: string
          updated_at: string
          user_id: string
          vocabulary: Json
        }
        Insert: {
          analysis?: Json
          corrected_text?: string | null
          created_at?: string
          exercise_type: string
          id?: string
          image_path?: string | null
          language?: string
          level?: string | null
          original_text?: string
          updated_at?: string
          user_id: string
          vocabulary?: Json
        }
        Update: {
          analysis?: Json
          corrected_text?: string | null
          created_at?: string
          exercise_type?: string
          id?: string
          image_path?: string | null
          language?: string
          level?: string | null
          original_text?: string
          updated_at?: string
          user_id?: string
          vocabulary?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_teacher_application: {
        Args: { _application_id: string; _notes?: string }
        Returns: Json
      }
      award_xp: {
        Args: {
          _check_daily_bonus?: boolean
          _points: number
          _user_id: string
        }
        Returns: Json
      }
      book_lesson: {
        Args: {
          p_end: string
          p_note?: string
          p_slot_id: string
          p_start: string
        }
        Returns: string
      }
      book_lesson_v2: {
        Args: {
          p_end: string
          p_lesson_type_id: string
          p_note?: string
          p_share_analytics?: boolean
          p_slot_id: string
          p_start: string
          p_teacher_id: string
        }
        Returns: string
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_active_teachers: {
        Args: never
        Returns: {
          bio: string
          focus: string[]
          id: string
          is_verified: boolean
          name: string
          photo_url: string
          rating: number
          spoken_languages: string[]
          students_count: number
        }[]
      }
      get_teacher_email: { Args: never; Returns: string }
      get_teacher_meet_link: { Args: never; Returns: string }
      get_teacher_profile_public: {
        Args: never
        Returns: {
          bio: string
          duration_minutes: number
          focus: string[]
          id: string
          name: string
          photo_url: string
          rating: number
          students_count: number
          updated_at: string
        }[]
      }
      get_teacher_public_by_id: {
        Args: { p_teacher_id: string }
        Returns: {
          bio: string
          focus: string[]
          id: string
          is_active: boolean
          is_verified: boolean
          name: string
          photo_url: string
          rating: number
          spoken_languages: string[]
          students_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_strict_admin: { Args: { _user_id: string }; Returns: boolean }
      is_teacher_of_student: { Args: { _student_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      reject_teacher_application: {
        Args: { _application_id: string; _notes?: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "admin_teacher" | "student"
      lesson_kind: "individual" | "group" | "course"
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
      app_role: ["admin", "moderator", "user", "admin_teacher", "student"],
      lesson_kind: ["individual", "group", "course"],
    },
  },
} as const

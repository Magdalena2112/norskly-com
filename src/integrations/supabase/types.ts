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
          start_time: string
          status: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          id?: string
          start_time: string
          status?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: string
          start_time?: string
          status?: string
        }
        Relationships: []
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
          topic: string
          user_id: string
          user_text: string
        }
        Insert: {
          corrected_text?: string | null
          created_at?: string
          explanations?: string | null
          id?: string
          topic: string
          user_id: string
          user_text: string
        }
        Update: {
          corrected_text?: string | null
          created_at?: string
          explanations?: string | null
          id?: string
          topic?: string
          user_id?: string
          user_text?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          created_at: string
          end_time: string
          id: string
          slot_id: string
          start_time: string
          status: string
          student_note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          slot_id: string
          start_time: string
          status?: string
          student_note?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          slot_id?: string
          start_time?: string
          status?: string
          student_note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "availability_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          confidence_level: number | null
          created_at: string | null
          display_name: string | null
          focus_area: string | null
          id: string
          learning_goal: string | null
          level: string | null
          lives_in_norway: boolean | null
          onboarding_completed: boolean
          preferred_tone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confidence_level?: number | null
          created_at?: string | null
          display_name?: string | null
          focus_area?: string | null
          id?: string
          learning_goal?: string | null
          level?: string | null
          lives_in_norway?: boolean | null
          onboarding_completed?: boolean
          preferred_tone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confidence_level?: number | null
          created_at?: string | null
          display_name?: string | null
          focus_area?: string | null
          id?: string
          learning_goal?: string | null
          level?: string | null
          lives_in_norway?: boolean | null
          onboarding_completed?: boolean
          preferred_tone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      saved_explanations: {
        Row: {
          created_at: string
          explanation_data: Json
          id: string
          query: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          explanation_data?: Json
          id?: string
          query: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          explanation_data?: Json
          id?: string
          query?: string
          title?: string
          user_id?: string
        }
        Relationships: []
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
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      teacher_profile_public: {
        Row: {
          bio: string | null
          duration_minutes: number | null
          focus: string[] | null
          id: string | null
          name: string | null
          photo_url: string | null
          rating: number | null
          students_count: number | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          duration_minutes?: number | null
          focus?: string[] | null
          id?: string | null
          name?: string | null
          photo_url?: string | null
          rating?: number | null
          students_count?: number | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          duration_minutes?: number | null
          focus?: string[] | null
          id?: string | null
          name?: string | null
          photo_url?: string | null
          rating?: number | null
          students_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      award_xp: {
        Args: {
          _check_daily_bonus?: boolean
          _points: number
          _user_id: string
        }
        Returns: Json
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_strict_admin: { Args: { _user_id: string }; Returns: boolean }
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
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "admin_teacher" | "student"
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
    },
  },
} as const

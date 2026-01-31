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
      admin_activity_logs: {
        Row: {
          action: string
          admin_email: string | null
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_email?: string | null
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          admin_email?: string | null
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      banned_words: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          reason: string | null
          word: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string | null
          word: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string | null
          word?: string
        }
        Relationships: []
      }
      blocked_ips: {
        Row: {
          blocked_by: string | null
          created_at: string
          expires_at: string | null
          id: string
          ip_address: string
          reason: string | null
        }
        Insert: {
          blocked_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address: string
          reason?: string | null
        }
        Update: {
          blocked_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address?: string
          reason?: string | null
        }
        Relationships: []
      }
      forum_2fa_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          forum_user_id: string
          id: string
          type: string
          used_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          forum_user_id: string
          id?: string
          type?: string
          used_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          forum_user_id?: string
          id?: string
          type?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_2fa_codes_forum_user_id_fkey"
            columns: ["forum_user_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_2fa_settings: {
        Row: {
          backup_codes: string[] | null
          backup_codes_used: boolean[] | null
          created_at: string
          forum_user_id: string
          id: string
          is_enabled: boolean
          method: string
          totp_secret: string | null
          updated_at: string
        }
        Insert: {
          backup_codes?: string[] | null
          backup_codes_used?: boolean[] | null
          created_at?: string
          forum_user_id: string
          id?: string
          is_enabled?: boolean
          method?: string
          totp_secret?: string | null
          updated_at?: string
        }
        Update: {
          backup_codes?: string[] | null
          backup_codes_used?: boolean[] | null
          created_at?: string
          forum_user_id?: string
          id?: string
          is_enabled?: boolean
          method?: string
          totp_secret?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_2fa_settings_forum_user_id_fkey"
            columns: ["forum_user_id"]
            isOneToOne: true
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_2fa_trusted_devices: {
        Row: {
          created_at: string
          device_info: string | null
          device_token: string
          expires_at: string
          forum_user_id: string
          id: string
          ip_address: string | null
          last_used_at: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          device_info?: string | null
          device_token: string
          expires_at: string
          forum_user_id: string
          id?: string
          ip_address?: string | null
          last_used_at?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          device_info?: string | null
          device_token?: string
          expires_at?: string
          forum_user_id?: string
          id?: string
          ip_address?: string | null
          last_used_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_2fa_trusted_devices_forum_user_id_fkey"
            columns: ["forum_user_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_account_deletion_requests: {
        Row: {
          forum_user_id: string
          id: string
          processed_at: string | null
          requested_at: string
          status: string
          user_id: string
        }
        Insert: {
          forum_user_id: string
          id?: string
          processed_at?: string | null
          requested_at?: string
          status?: string
          user_id: string
        }
        Update: {
          forum_user_id?: string
          id?: string
          processed_at?: string | null
          requested_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_account_deletion_requests_forum_user_id_fkey"
            columns: ["forum_user_id"]
            isOneToOne: true
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_avatar_requests: {
        Row: {
          created_at: string
          denial_reason: string | null
          forum_user_id: string
          id: string
          image_url: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          denial_reason?: string | null
          forum_user_id: string
          id?: string
          image_url: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          denial_reason?: string | null
          forum_user_id?: string
          id?: string
          image_url?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_avatar_requests_forum_user_id_fkey"
            columns: ["forum_user_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_blocked_users_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_blocked_users_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_admin_only: boolean | null
          name: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_admin_only?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_admin_only?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      forum_conversations: {
        Row: {
          created_at: string
          encryption_key_p1: string | null
          encryption_key_p2: string | null
          id: string
          key_iv: string | null
          last_message_at: string | null
          last_message_preview: string | null
          participant_1: string
          participant_2: string
        }
        Insert: {
          created_at?: string
          encryption_key_p1?: string | null
          encryption_key_p2?: string | null
          id?: string
          key_iv?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          participant_1: string
          participant_2: string
        }
        Update: {
          created_at?: string
          encryption_key_p1?: string | null
          encryption_key_p2?: string | null
          id?: string
          key_iv?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          participant_1?: string
          participant_2?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_conversations_participant_1_fkey"
            columns: ["participant_1"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_conversations_participant_2_fkey"
            columns: ["participant_2"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_cover_requests: {
        Row: {
          created_at: string
          denial_reason: string | null
          forum_user_id: string
          id: string
          image_url: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          denial_reason?: string | null
          forum_user_id: string
          id?: string
          image_url: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          denial_reason?: string | null
          forum_user_id?: string
          id?: string
          image_url?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_cover_requests_forum_user_id_fkey"
            columns: ["forum_user_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_direct_messages: {
        Row: {
          created_at: string
          encrypted_content: string
          id: string
          is_read: boolean | null
          iv: string
          recipient_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          encrypted_content: string
          id?: string
          is_read?: boolean | null
          iv: string
          recipient_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          encrypted_content?: string
          id?: string
          is_read?: boolean | null
          iv?: string
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_direct_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_moderation_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          moderator_id: string
          reason: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          moderator_id: string
          reason?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          moderator_id?: string
          reason?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      forum_pinned_threads: {
        Row: {
          forum_user_id: string
          id: string
          pinned_at: string
          thread_id: string
        }
        Insert: {
          forum_user_id: string
          id?: string
          pinned_at?: string
          thread_id: string
        }
        Update: {
          forum_user_id?: string
          id?: string
          pinned_at?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_pinned_threads_forum_user_id_fkey"
            columns: ["forum_user_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_pinned_threads_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          edited_at: string | null
          id: string
          is_deleted: boolean | null
          is_edited: boolean | null
          quoted_post_id: string | null
          thread_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          quoted_post_id?: string | null
          thread_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          quoted_post_id?: string | null
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_quoted_post_id_fkey"
            columns: ["quoted_post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_threads: {
        Row: {
          author_id: string
          category_id: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          id: string
          is_deleted: boolean | null
          is_locked: boolean | null
          is_pinned: boolean | null
          last_post_at: string | null
          last_post_by: string | null
          reply_count: number | null
          title: string
          view_count: number | null
        }
        Insert: {
          author_id: string
          category_id: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          id?: string
          is_deleted?: boolean | null
          is_locked?: boolean | null
          is_pinned?: boolean | null
          last_post_at?: string | null
          last_post_by?: string | null
          reply_count?: number | null
          title: string
          view_count?: number | null
        }
        Update: {
          author_id?: string
          category_id?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          id?: string
          is_deleted?: boolean | null
          is_locked?: boolean | null
          is_pinned?: boolean | null
          last_post_at?: string | null
          last_post_by?: string | null
          reply_count?: number | null
          title?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_threads_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_threads_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "forum_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_threads_last_post_by_fkey"
            columns: ["last_post_by"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_user_sessions: {
        Row: {
          created_at: string
          device_info: string | null
          forum_user_id: string
          id: string
          ip_address: string | null
          is_current: boolean | null
          last_activity_at: string
          session_token: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          device_info?: string | null
          forum_user_id: string
          id?: string
          ip_address?: string | null
          is_current?: boolean | null
          last_activity_at?: string
          session_token: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          device_info?: string | null
          forum_user_id?: string
          id?: string
          ip_address?: string | null
          is_current?: boolean | null
          last_activity_at?: string
          session_token?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_user_sessions_forum_user_id_fkey"
            columns: ["forum_user_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_users: {
        Row: {
          allow_dms: boolean | null
          avatar_url: string | null
          cover_url: string | null
          created_at: string | null
          dm_encryption_pin_hash: string | null
          hide_threads: boolean | null
          id: string
          is_self_disabled: boolean | null
          is_suspended: boolean | null
          is_verified: boolean | null
          last_post_at: string | null
          membership_tier: string | null
          post_count: number | null
          self_disabled_at: string | null
          self_disabled_reason: string | null
          self_disabled_until: string | null
          signature: string | null
          social_discord: string | null
          social_x: string | null
          suspension_ends_at: string | null
          suspension_reason: string | null
          user_id: string
          username: string
        }
        Insert: {
          allow_dms?: boolean | null
          avatar_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          dm_encryption_pin_hash?: string | null
          hide_threads?: boolean | null
          id?: string
          is_self_disabled?: boolean | null
          is_suspended?: boolean | null
          is_verified?: boolean | null
          last_post_at?: string | null
          membership_tier?: string | null
          post_count?: number | null
          self_disabled_at?: string | null
          self_disabled_reason?: string | null
          self_disabled_until?: string | null
          signature?: string | null
          social_discord?: string | null
          social_x?: string | null
          suspension_ends_at?: string | null
          suspension_reason?: string | null
          user_id: string
          username: string
        }
        Update: {
          allow_dms?: boolean | null
          avatar_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          dm_encryption_pin_hash?: string | null
          hide_threads?: boolean | null
          id?: string
          is_self_disabled?: boolean | null
          is_suspended?: boolean | null
          is_verified?: boolean | null
          last_post_at?: string | null
          membership_tier?: string | null
          post_count?: number | null
          self_disabled_at?: string | null
          self_disabled_reason?: string | null
          self_disabled_until?: string | null
          signature?: string | null
          social_discord?: string | null
          social_x?: string | null
          suspension_ends_at?: string | null
          suspension_reason?: string | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      forum_verification_requests: {
        Row: {
          created_at: string
          denial_reason: string | null
          forum_user_id: string
          id: string
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          denial_reason?: string | null
          forum_user_id: string
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          denial_reason?: string | null
          forum_user_id?: string
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_verification_requests_forum_user_id_fkey"
            columns: ["forum_user_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean
          subscribed_at: string
          unsubscribe_token: string
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean
          subscribed_at?: string
          unsubscribe_token?: string
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean
          subscribed_at?: string
          unsubscribe_token?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      reserved_usernames: {
        Row: {
          created_at: string
          denial_reason: string | null
          email: string | null
          id: string
          ip_address: string | null
          reservation_code: string
          status: string
          username: string
        }
        Insert: {
          created_at?: string
          denial_reason?: string | null
          email?: string | null
          id?: string
          ip_address?: string | null
          reservation_code: string
          status?: string
          username: string
        }
        Update: {
          created_at?: string
          denial_reason?: string | null
          email?: string | null
          id?: string
          ip_address?: string | null
          reservation_code?: string
          status?: string
          username?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
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
      bootstrap_first_admin: { Args: { _user_id: string }; Returns: undefined }
      get_reservation_count: { Args: never; Returns: number }
      has_pending_verification_request: {
        Args: { _forum_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const

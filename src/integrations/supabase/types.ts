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
      admin_account_permissions: {
        Row: {
          admin_account_id: string
          granted_at: string | null
          granted_by: string | null
          id: string
          permission: string
        }
        Insert: {
          admin_account_id: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission: string
        }
        Update: {
          admin_account_id?: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_account_permissions_admin_account_id_fkey"
            columns: ["admin_account_id"]
            isOneToOne: false
            referencedRelation: "admin_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_account_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "admin_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_accounts: {
        Row: {
          created_at: string
          created_by: string | null
          display_name: string | null
          email: string
          forum_user_id: string | null
          id: string
          is_active: boolean | null
          is_first_admin: boolean | null
          last_login_at: string | null
          password_hash: string
          staff_role: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          email: string
          forum_user_id?: string | null
          id?: string
          is_active?: boolean | null
          is_first_admin?: boolean | null
          last_login_at?: string | null
          password_hash: string
          staff_role?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          email?: string
          forum_user_id?: string | null
          id?: string
          is_active?: boolean | null
          is_first_admin?: boolean | null
          last_login_at?: string | null
          password_hash?: string
          staff_role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_accounts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_accounts_forum_user_id_fkey"
            columns: ["forum_user_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
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
      admin_permissions: {
        Row: {
          created_at: string
          id: string
          permission: string
          role: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission: string
          role: string
        }
        Update: {
          created_at?: string
          id?: string
          permission?: string
          role?: string
        }
        Relationships: []
      }
      admin_sessions: {
        Row: {
          admin_account_id: string
          created_at: string
          expires_at: string
          id: string
          ip_address: string | null
          session_token: string
          user_agent: string | null
        }
        Insert: {
          admin_account_id: string
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: string | null
          session_token: string
          user_agent?: string | null
        }
        Update: {
          admin_account_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          session_token?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_sessions_admin_account_id_fkey"
            columns: ["admin_account_id"]
            isOneToOne: false
            referencedRelation: "admin_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
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
      blog_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
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
      forum_achievements: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
        }
        Relationships: []
      }
      forum_ad_clicks: {
        Row: {
          ad_id: string
          clicker_forum_user_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          ad_id: string
          clicker_forum_user_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          ad_id?: string
          clicker_forum_user_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_ad_clicks_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "forum_ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_ad_clicks_clicker_forum_user_id_fkey"
            columns: ["clicker_forum_user_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_ads: {
        Row: {
          ad_type: string
          click_count: number | null
          coins_earned: number | null
          created_at: string
          denial_reason: string | null
          description: string | null
          destination_url: string
          expires_at: string | null
          forum_user_id: string
          id: string
          image_url: string
          last_ad_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          title: string
        }
        Insert: {
          ad_type?: string
          click_count?: number | null
          coins_earned?: number | null
          created_at?: string
          denial_reason?: string | null
          description?: string | null
          destination_url: string
          expires_at?: string | null
          forum_user_id: string
          id?: string
          image_url: string
          last_ad_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title: string
        }
        Update: {
          ad_type?: string
          click_count?: number | null
          coins_earned?: number | null
          created_at?: string
          denial_reason?: string | null
          description?: string | null
          destination_url?: string
          expires_at?: string | null
          forum_user_id?: string
          id?: string
          image_url?: string
          last_ad_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_ads_forum_user_id_fkey"
            columns: ["forum_user_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_affiliate_requests: {
        Row: {
          admin_approved: boolean
          admin_approved_at: string | null
          admin_approved_by: string | null
          affiliate_user_id: string
          created_at: string
          email_sent_at: string | null
          email_token: string | null
          gold_user_id: string
          id: string
          status: string
          user_accepted: boolean
          user_accepted_at: string | null
        }
        Insert: {
          admin_approved?: boolean
          admin_approved_at?: string | null
          admin_approved_by?: string | null
          affiliate_user_id: string
          created_at?: string
          email_sent_at?: string | null
          email_token?: string | null
          gold_user_id: string
          id?: string
          status?: string
          user_accepted?: boolean
          user_accepted_at?: string | null
        }
        Update: {
          admin_approved?: boolean
          admin_approved_at?: string | null
          admin_approved_by?: string | null
          affiliate_user_id?: string
          created_at?: string
          email_sent_at?: string | null
          email_token?: string | null
          gold_user_id?: string
          id?: string
          status?: string
          user_accepted?: boolean
          user_accepted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_affiliate_requests_admin_approved_by_fkey"
            columns: ["admin_approved_by"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_affiliate_requests_affiliate_user_id_fkey"
            columns: ["affiliate_user_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_affiliate_requests_gold_user_id_fkey"
            columns: ["gold_user_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_affiliates: {
        Row: {
          affiliate_user_id: string
          created_at: string
          gold_user_id: string
          id: string
        }
        Insert: {
          affiliate_user_id: string
          created_at?: string
          gold_user_id: string
          id?: string
        }
        Update: {
          affiliate_user_id?: string
          created_at?: string
          gold_user_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_affiliates_affiliate_user_id_fkey"
            columns: ["affiliate_user_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_affiliates_gold_user_id_fkey"
            columns: ["gold_user_id"]
            isOneToOne: false
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
      forum_coin_compensations: {
        Row: {
          amount: number
          claimed_at: string
          compensation_id: string
          forum_user_id: string
          id: string
        }
        Insert: {
          amount: number
          claimed_at?: string
          compensation_id: string
          forum_user_id: string
          id?: string
        }
        Update: {
          amount?: number
          claimed_at?: string
          compensation_id?: string
          forum_user_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_coin_compensations_forum_user_id_fkey"
            columns: ["forum_user_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_coin_grants: {
        Row: {
          admin_id: string
          amount: number
          created_at: string
          id: string
          reason: string
          recipient_id: string
        }
        Insert: {
          admin_id: string
          amount: number
          created_at?: string
          id?: string
          reason: string
          recipient_id: string
        }
        Update: {
          admin_id?: string
          amount?: number
          created_at?: string
          id?: string
          reason?: string
          recipient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_coin_grants_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_coin_grants_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
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
      forum_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_friend_requests: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          responded_at: string | null
          sender_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          responded_at?: string | null
          sender_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          responded_at?: string | null
          sender_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_friend_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_friend_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_friendships: {
        Row: {
          created_at: string
          id: string
          user_1_id: string
          user_2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_1_id: string
          user_2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_1_id?: string
          user_2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_friendships_user_1_id_fkey"
            columns: ["user_1_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_friendships_user_2_id_fkey"
            columns: ["user_2_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_game_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          game_id: string
          id: string
          is_deleted: boolean | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          game_id: string
          id?: string
          is_deleted?: boolean | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          game_id?: string
          id?: string
          is_deleted?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_game_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_game_comments_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_game_comments_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "forum_games"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_game_favorites: {
        Row: {
          created_at: string
          forum_user_id: string
          game_id: string
          id: string
        }
        Insert: {
          created_at?: string
          forum_user_id: string
          game_id: string
          id?: string
        }
        Update: {
          created_at?: string
          forum_user_id?: string
          game_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_game_favorites_forum_user_id_fkey"
            columns: ["forum_user_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_game_favorites_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "forum_games"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_game_servers: {
        Row: {
          created_at: string
          game_id: string
          id: string
          is_active: boolean
          max_players: number
          name: string
          player_count: number
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          is_active?: boolean
          max_players?: number
          name?: string
          player_count?: number
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          is_active?: boolean
          max_players?: number
          name?: string
          player_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "forum_game_servers_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "forum_games"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_games: {
        Row: {
          category: string
          created_at: string
          creator_id: string
          description: string | null
          favorite_count: number | null
          id: string
          is_private: boolean | null
          is_under_review: boolean | null
          max_players: number | null
          play_count: number | null
          thumbnail_denial_reason: string | null
          thumbnail_status: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          creator_id: string
          description?: string | null
          favorite_count?: number | null
          id?: string
          is_private?: boolean | null
          is_under_review?: boolean | null
          max_players?: number | null
          play_count?: number | null
          thumbnail_denial_reason?: string | null
          thumbnail_status?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          creator_id?: string
          description?: string | null
          favorite_count?: number | null
          id?: string
          is_private?: boolean | null
          is_under_review?: boolean | null
          max_players?: number | null
          play_count?: number | null
          thumbnail_denial_reason?: string | null
          thumbnail_status?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_games_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_gold_checkmarks: {
        Row: {
          forum_user_id: string
          granted_at: string
          granted_by: string | null
          hide_affiliates: boolean
          id: string
        }
        Insert: {
          forum_user_id: string
          granted_at?: string
          granted_by?: string | null
          hide_affiliates?: boolean
          id?: string
        }
        Update: {
          forum_user_id?: string
          granted_at?: string
          granted_by?: string | null
          hide_affiliates?: boolean
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_gold_checkmarks_forum_user_id_fkey"
            columns: ["forum_user_id"]
            isOneToOne: true
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_gold_checkmarks_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_group_affiliates: {
        Row: {
          affiliate_group_id: string
          created_at: string | null
          group_id: string
          id: string
          requested_by: string | null
          responded_at: string | null
          status: string | null
        }
        Insert: {
          affiliate_group_id: string
          created_at?: string | null
          group_id: string
          id?: string
          requested_by?: string | null
          responded_at?: string | null
          status?: string | null
        }
        Update: {
          affiliate_group_id?: string
          created_at?: string | null
          group_id?: string
          id?: string
          requested_by?: string | null
          responded_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_group_affiliates_affiliate_group_id_fkey"
            columns: ["affiliate_group_id"]
            isOneToOne: false
            referencedRelation: "forum_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_group_affiliates_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "forum_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_group_affiliates_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_group_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          details: Json | null
          group_id: string
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          details?: Json | null
          group_id: string
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          details?: Json | null
          group_id?: string
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_group_audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_group_audit_logs_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "forum_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_group_bans: {
        Row: {
          banned_by: string | null
          created_at: string | null
          forum_user_id: string
          group_id: string
          id: string
          reason: string | null
        }
        Insert: {
          banned_by?: string | null
          created_at?: string | null
          forum_user_id: string
          group_id: string
          id?: string
          reason?: string | null
        }
        Update: {
          banned_by?: string | null
          created_at?: string | null
          forum_user_id?: string
          group_id?: string
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_group_bans_banned_by_fkey"
            columns: ["banned_by"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_group_bans_forum_user_id_fkey"
            columns: ["forum_user_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_group_bans_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "forum_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_group_blocked_words: {
        Row: {
          added_by: string | null
          created_at: string | null
          group_id: string
          id: string
          word: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string | null
          group_id: string
          id?: string
          word: string
        }
        Update: {
          added_by?: string | null
          created_at?: string | null
          group_id?: string
          id?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_group_blocked_words_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_group_blocked_words_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "forum_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_group_events: {
        Row: {
          created_at: string | null
          created_by: string
          denial_reason: string | null
          description: string | null
          event_date: string | null
          group_id: string
          id: string
          image_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          denial_reason?: string | null
          description?: string | null
          event_date?: string | null
          group_id: string
          id?: string
          image_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          denial_reason?: string | null
          description?: string | null
          event_date?: string | null
          group_id?: string
          id?: string
          image_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_group_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_group_events_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "forum_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_group_join_requests: {
        Row: {
          created_at: string | null
          forum_user_id: string
          group_id: string
          id: string
          responded_at: string | null
          responded_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          forum_user_id: string
          group_id: string
          id?: string
          responded_at?: string | null
          responded_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          forum_user_id?: string
          group_id?: string
          id?: string
          responded_at?: string | null
          responded_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_group_join_requests_forum_user_id_fkey"
            columns: ["forum_user_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_group_join_requests_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "forum_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_group_media_requests: {
        Row: {
          created_at: string | null
          denial_reason: string | null
          group_id: string
          id: string
          image_url: string
          media_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          denial_reason?: string | null
          group_id: string
          id?: string
          image_url: string
          media_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          denial_reason?: string | null
          group_id?: string
          id?: string
          image_url?: string
          media_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_group_media_requests_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "forum_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_group_members: {
        Row: {
          forum_user_id: string
          group_id: string
          id: string
          joined_at: string | null
          role_id: string | null
        }
        Insert: {
          forum_user_id: string
          group_id: string
          id?: string
          joined_at?: string | null
          role_id?: string | null
        }
        Update: {
          forum_user_id?: string
          group_id?: string
          id?: string
          joined_at?: string | null
          role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_group_members_forum_user_id_fkey"
            columns: ["forum_user_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "forum_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_group_members_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "forum_group_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_group_roles: {
        Row: {
          color: string | null
          created_at: string | null
          group_id: string
          id: string
          is_default: boolean | null
          name: string
          permissions: Json | null
          rank: number
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          group_id: string
          id?: string
          is_default?: boolean | null
          name: string
          permissions?: Json | null
          rank?: number
        }
        Update: {
          color?: string | null
          created_at?: string | null
          group_id?: string
          id?: string
          is_default?: boolean | null
          name?: string
          permissions?: Json | null
          rank?: number
        }
        Relationships: [
          {
            foreignKeyName: "forum_group_roles_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "forum_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_group_wall_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          group_id: string
          id: string
          is_deleted: boolean | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          group_id: string
          id?: string
          is_deleted?: boolean | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          group_id?: string
          id?: string
          is_deleted?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_group_wall_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_group_wall_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "forum_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_groups: {
        Row: {
          coins_vault: number | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          is_private: boolean | null
          is_verified: boolean | null
          last_name_change: string | null
          member_count: number | null
          name: string
          owner_id: string
          require_approval: boolean | null
          slug: string
          updated_at: string | null
          vault_is_private: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          coins_vault?: number | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_private?: boolean | null
          is_verified?: boolean | null
          last_name_change?: string | null
          member_count?: number | null
          name: string
          owner_id: string
          require_approval?: boolean | null
          slug: string
          updated_at?: string | null
          vault_is_private?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          coins_vault?: number | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_private?: boolean | null
          is_verified?: boolean | null
          last_name_change?: string | null
          member_count?: number | null
          name?: string
          owner_id?: string
          require_approval?: boolean | null
          slug?: string
          updated_at?: string | null
          vault_is_private?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_groups_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_membership_redemptions: {
        Row: {
          coins_spent: number
          created_at: string
          forum_user_id: string
          id: string
          tier: string
        }
        Insert: {
          coins_spent: number
          created_at?: string
          forum_user_id: string
          id?: string
          tier: string
        }
        Update: {
          coins_spent?: number
          created_at?: string
          forum_user_id?: string
          id?: string
          tier?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_membership_redemptions_forum_user_id_fkey"
            columns: ["forum_user_id"]
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
      forum_notifications: {
        Row: {
          actor_id: string | null
          content: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          recipient_id: string
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
        }
        Insert: {
          actor_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          recipient_id: string
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type: string
        }
        Update: {
          actor_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          recipient_id?: string
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
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
      forum_profile_views: {
        Row: {
          created_at: string
          id: string
          viewed_user_id: string
          viewer_ip: string | null
          viewer_user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          viewed_user_id: string
          viewer_ip?: string | null
          viewer_user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          viewed_user_id?: string
          viewer_ip?: string | null
          viewer_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_profile_views_viewed_user_id_fkey"
            columns: ["viewed_user_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_profile_views_viewer_user_id_fkey"
            columns: ["viewer_user_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_referrals: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string | null
          referred_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          referred_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          referred_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_reports: {
        Row: {
          action_taken: string | null
          created_at: string
          details: string | null
          id: string
          reason: string
          reported_id: string
          reported_type: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reported_id: string
          reported_type: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reported_id?: string
          reported_type?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_status_likes: {
        Row: {
          created_at: string
          id: string
          liked_user_id: string
          liker_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          liked_user_id: string
          liker_id: string
        }
        Update: {
          created_at?: string
          id?: string
          liked_user_id?: string
          liker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_status_likes_liked_user_id_fkey"
            columns: ["liked_user_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_status_likes_liker_id_fkey"
            columns: ["liker_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_support_ticket_replies: {
        Row: {
          author_id: string
          created_at: string
          id: string
          is_staff_reply: boolean
          message: string
          ticket_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          is_staff_reply?: boolean
          message: string
          ticket_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          is_staff_reply?: boolean
          message?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_support_ticket_replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_support_ticket_replies_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "forum_support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_support_tickets: {
        Row: {
          assigned_to: string | null
          claimed_at: string | null
          claimed_by: string | null
          closed_at: string | null
          closed_by: string | null
          created_at: string
          creator_id: string
          id: string
          priority: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          creator_id: string
          id?: string
          priority?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          creator_id?: string
          id?: string
          priority?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_support_tickets_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_support_tickets_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_support_tickets_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
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
      forum_ticket_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_staff_reply: boolean | null
          sender_id: string
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_staff_reply?: boolean | null
          sender_id: string
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_staff_reply?: boolean | null
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_ticket_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "forum_support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_user_achievements: {
        Row: {
          achievement_id: string
          awarded_at: string
          awarded_by: string | null
          forum_user_id: string
          id: string
        }
        Insert: {
          achievement_id: string
          awarded_at?: string
          awarded_by?: string | null
          forum_user_id: string
          id?: string
        }
        Update: {
          achievement_id?: string
          awarded_at?: string
          awarded_by?: string | null
          forum_user_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "forum_achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_user_achievements_awarded_by_fkey"
            columns: ["awarded_by"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_user_achievements_forum_user_id_fkey"
            columns: ["forum_user_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_user_inventory: {
        Row: {
          acquired_at: string
          forum_user_id: string
          id: string
          item_id: string
          item_image_url: string | null
          item_name: string
          item_type: string
        }
        Insert: {
          acquired_at?: string
          forum_user_id: string
          id?: string
          item_id: string
          item_image_url?: string | null
          item_name: string
          item_type: string
        }
        Update: {
          acquired_at?: string
          forum_user_id?: string
          id?: string
          item_id?: string
          item_image_url?: string | null
          item_name?: string
          item_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_user_inventory_forum_user_id_fkey"
            columns: ["forum_user_id"]
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
          allow_friend_requests: boolean | null
          avatar_effect: string | null
          avatar_url: string | null
          bio: string | null
          cash: number | null
          coins: number | null
          cover_url: string | null
          created_at: string | null
          date_of_birth: string | null
          display_name: string | null
          dm_encryption_pin_hash: string | null
          dm_pin: string | null
          dob_updated_at: string | null
          follower_count: number | null
          following_count: number | null
          has_pending_warning: boolean | null
          has_valentines_theme: boolean | null
          hide_online_status: boolean | null
          hide_threads: boolean | null
          id: string
          inventory_privacy: string | null
          is_locked: boolean | null
          is_self_disabled: boolean | null
          is_suspended: boolean | null
          is_verified: boolean | null
          last_coin_claim: string | null
          last_daily_login_xp: string | null
          last_friend_request_at: string | null
          last_post_at: string | null
          last_seen_at: string | null
          last_username_change_at: string | null
          level: number | null
          locked_at: string | null
          locked_by: string | null
          locked_reason: string | null
          membership_tier: string | null
          post_count: number | null
          referral_code: string | null
          referral_count: number | null
          referred_by: string | null
          selected_theme: string | null
          self_disabled_at: string | null
          self_disabled_reason: string | null
          self_disabled_until: string | null
          serial_id: number
          settings_pin: string | null
          settings_pin_hash: string | null
          signature: string | null
          social_discord: string | null
          social_x: string | null
          status_text: string | null
          status_updated_at: string | null
          suspension_ends_at: string | null
          suspension_reason: string | null
          suspension_review_date: string | null
          thread_count: number | null
          user_id: string
          username: string
          valentines_theme_claimed_at: string | null
          wall_is_private: boolean | null
          warning_accepted_at: string | null
          warning_content: string | null
          warning_moderator_note: string | null
          xp: number | null
        }
        Insert: {
          allow_dms?: boolean | null
          allow_friend_requests?: boolean | null
          avatar_effect?: string | null
          avatar_url?: string | null
          bio?: string | null
          cash?: number | null
          coins?: number | null
          cover_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          display_name?: string | null
          dm_encryption_pin_hash?: string | null
          dm_pin?: string | null
          dob_updated_at?: string | null
          follower_count?: number | null
          following_count?: number | null
          has_pending_warning?: boolean | null
          has_valentines_theme?: boolean | null
          hide_online_status?: boolean | null
          hide_threads?: boolean | null
          id?: string
          inventory_privacy?: string | null
          is_locked?: boolean | null
          is_self_disabled?: boolean | null
          is_suspended?: boolean | null
          is_verified?: boolean | null
          last_coin_claim?: string | null
          last_daily_login_xp?: string | null
          last_friend_request_at?: string | null
          last_post_at?: string | null
          last_seen_at?: string | null
          last_username_change_at?: string | null
          level?: number | null
          locked_at?: string | null
          locked_by?: string | null
          locked_reason?: string | null
          membership_tier?: string | null
          post_count?: number | null
          referral_code?: string | null
          referral_count?: number | null
          referred_by?: string | null
          selected_theme?: string | null
          self_disabled_at?: string | null
          self_disabled_reason?: string | null
          self_disabled_until?: string | null
          serial_id?: number
          settings_pin?: string | null
          settings_pin_hash?: string | null
          signature?: string | null
          social_discord?: string | null
          social_x?: string | null
          status_text?: string | null
          status_updated_at?: string | null
          suspension_ends_at?: string | null
          suspension_reason?: string | null
          suspension_review_date?: string | null
          thread_count?: number | null
          user_id: string
          username: string
          valentines_theme_claimed_at?: string | null
          wall_is_private?: boolean | null
          warning_accepted_at?: string | null
          warning_content?: string | null
          warning_moderator_note?: string | null
          xp?: number | null
        }
        Update: {
          allow_dms?: boolean | null
          allow_friend_requests?: boolean | null
          avatar_effect?: string | null
          avatar_url?: string | null
          bio?: string | null
          cash?: number | null
          coins?: number | null
          cover_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          display_name?: string | null
          dm_encryption_pin_hash?: string | null
          dm_pin?: string | null
          dob_updated_at?: string | null
          follower_count?: number | null
          following_count?: number | null
          has_pending_warning?: boolean | null
          has_valentines_theme?: boolean | null
          hide_online_status?: boolean | null
          hide_threads?: boolean | null
          id?: string
          inventory_privacy?: string | null
          is_locked?: boolean | null
          is_self_disabled?: boolean | null
          is_suspended?: boolean | null
          is_verified?: boolean | null
          last_coin_claim?: string | null
          last_daily_login_xp?: string | null
          last_friend_request_at?: string | null
          last_post_at?: string | null
          last_seen_at?: string | null
          last_username_change_at?: string | null
          level?: number | null
          locked_at?: string | null
          locked_by?: string | null
          locked_reason?: string | null
          membership_tier?: string | null
          post_count?: number | null
          referral_code?: string | null
          referral_count?: number | null
          referred_by?: string | null
          selected_theme?: string | null
          self_disabled_at?: string | null
          self_disabled_reason?: string | null
          self_disabled_until?: string | null
          serial_id?: number
          settings_pin?: string | null
          settings_pin_hash?: string | null
          signature?: string | null
          social_discord?: string | null
          social_x?: string | null
          status_text?: string | null
          status_updated_at?: string | null
          suspension_ends_at?: string | null
          suspension_reason?: string | null
          suspension_review_date?: string | null
          thread_count?: number | null
          user_id?: string
          username?: string
          valentines_theme_claimed_at?: string | null
          wall_is_private?: boolean | null
          warning_accepted_at?: string | null
          warning_content?: string | null
          warning_moderator_note?: string | null
          xp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_users_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_verification_requests: {
        Row: {
          created_at: string
          denial_reason: string | null
          forum_user_id: string
          id: string
          reason: string | null
          request_type: string
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
          request_type?: string
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
          request_type?: string
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
      forum_wall_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_deleted: boolean | null
          profile_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          profile_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_wall_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_wall_posts_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_wall_posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
      godfrey_currency_grants: {
        Row: {
          created_at: string
          granted_by_forum_user_id: string
          id: string
          target_forum_user_id: string
        }
        Insert: {
          created_at?: string
          granted_by_forum_user_id: string
          id?: string
          target_forum_user_id: string
        }
        Update: {
          created_at?: string
          granted_by_forum_user_id?: string
          id?: string
          target_forum_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "godfrey_currency_grants_granted_by_forum_user_id_fkey"
            columns: ["granted_by_forum_user_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "godfrey_currency_grants_target_forum_user_id_fkey"
            columns: ["target_forum_user_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
      godfrey_panel_pins: {
        Row: {
          created_at: string
          forum_user_id: string
          pin_hash: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          forum_user_id: string
          pin_hash: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          forum_user_id?: string
          pin_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "godfrey_panel_pins_forum_user_id_fkey"
            columns: ["forum_user_id"]
            isOneToOne: true
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          additional_info: string | null
          age: number
          created_at: string | null
          discord_username: string
          forum_user_id: string
          id: string
          job_id: string
          reason: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["application_status"]
        }
        Insert: {
          additional_info?: string | null
          age: number
          created_at?: string | null
          discord_username: string
          forum_user_id: string
          id?: string
          job_id: string
          reason: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"]
        }
        Update: {
          additional_info?: string | null
          age?: number
          created_at?: string | null
          discord_username?: string
          forum_user_id?: string
          id?: string
          job_id?: string
          reason?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"]
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_forum_user_id_fkey"
            columns: ["forum_user_id"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "forum_users"
            referencedColumns: ["id"]
          },
        ]
      }
      job_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          category_id: string | null
          created_at: string | null
          created_by: string | null
          description: string
          id: string
          requirements: string | null
          status: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at: string | null
          work_type: Database["public"]["Enums"]["job_work_type"]
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          id?: string
          requirements?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at?: string | null
          work_type?: Database["public"]["Enums"]["job_work_type"]
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          id?: string
          requirements?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          updated_at?: string | null
          work_type?: Database["public"]["Enums"]["job_work_type"]
        }
        Relationships: [
          {
            foreignKeyName: "jobs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "job_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
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
      purged_usernames: {
        Row: {
          id: string
          original_reservation_id: string | null
          purged_at: string
          purged_by: string
          reason: string | null
          reverted_at: string | null
          reverted_by: string | null
          username: string
        }
        Insert: {
          id?: string
          original_reservation_id?: string | null
          purged_at?: string
          purged_by: string
          reason?: string | null
          reverted_at?: string | null
          reverted_by?: string | null
          username: string
        }
        Update: {
          id?: string
          original_reservation_id?: string | null
          purged_at?: string
          purged_by?: string
          reason?: string | null
          reverted_at?: string | null
          reverted_by?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "purged_usernames_original_reservation_id_fkey"
            columns: ["original_reservation_id"]
            isOneToOne: false
            referencedRelation: "reserved_usernames"
            referencedColumns: ["id"]
          },
        ]
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
      site_updates: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          admin_pin_hash: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          admin_pin_hash?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          admin_pin_hash?: string | null
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
      accept_friend_request: {
        Args: { request_id: string }
        Returns: undefined
      }
      add_coins_to_group_vault: {
        Args: { p_amount: number; p_group_id: string }
        Returns: boolean
      }
      bootstrap_first_admin: { Args: { _user_id: string }; Returns: undefined }
      calculate_level: { Args: { xp_value: number }; Returns: number }
      can_submit_ad: { Args: never; Returns: boolean }
      check_content_rate_limit: {
        Args: { p_content_type: string; p_forum_user_id: string }
        Returns: boolean
      }
      check_friend_request_rate_limit: {
        Args: { sender_forum_user_id: string }
        Returns: boolean
      }
      claim_coin_compensation: {
        Args: { p_amount: number; p_compensation_id: string }
        Returns: number
      }
      claim_daily_coins: { Args: never; Returns: number }
      claim_daily_login_xp: { Args: never; Returns: number }
      claim_random_reward: { Args: never; Returns: Json }
      cleanup_expired_admin_sessions: { Args: never; Returns: undefined }
      click_ad: {
        Args: { ad_id: string; clicker_agent: string; clicker_ip: string }
        Returns: Json
      }
      get_affiliate_info: {
        Args: { _forum_user_id: string }
        Returns: {
          gold_avatar_url: string
          gold_user_id: string
          gold_username: string
          is_affiliate: boolean
        }[]
      }
      get_maintenance_status: { Args: never; Returns: Json }
      get_reservation_count: { Args: never; Returns: number }
      get_staff_list: {
        Args: never
        Returns: {
          avatar_effect: string
          avatar_url: string
          display_name: string
          id: string
          is_verified: boolean
          level: number
          membership_tier: string
          role: string
          serial_id: number
          username: string
          xp: number
        }[]
      }
      get_staff_role: { Args: { _user_id: string }; Returns: string }
      has_gold_checkmark: { Args: { _forum_user_id: string }; Returns: boolean }
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
      is_admin_account: { Args: { _user_id: string }; Returns: boolean }
      is_moderator_account: { Args: { _user_id: string }; Returns: boolean }
      is_user_affiliate: { Args: { _forum_user_id: string }; Returns: boolean }
      process_referral: {
        Args: {
          p_ip_address?: string
          p_referral_code: string
          p_referred_user_id: string
        }
        Returns: Json
      }
      redeem_membership: { Args: { tier_name: string }; Returns: undefined }
      save_maintenance_settings: {
        Args: { p_enabled: boolean; p_message: string; p_password: string }
        Returns: boolean
      }
      submit_ad_with_cost: {
        Args: {
          p_ad_type?: string
          p_description: string
          p_destination_url: string
          p_forum_user_id: string
          p_image_url: string
          p_title: string
        }
        Returns: Json
      }
      update_forum_user_safe: {
        Args: {
          p_allow_dms?: boolean
          p_avatar_effect?: string
          p_bio?: string
          p_hide_threads?: boolean
          p_signature?: string
          p_status_text?: string
          p_user_id: string
        }
        Returns: boolean
      }
      verify_admin_session: {
        Args: { p_session_token: string }
        Returns: string
      }
      verify_maintenance_password: {
        Args: { p_password: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      application_status: "pending" | "accepted" | "declined"
      job_status: "open" | "closed" | "filled"
      job_work_type: "remote" | "hybrid" | "on_site"
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
      application_status: ["pending", "accepted", "declined"],
      job_status: ["open", "closed", "filled"],
      job_work_type: ["remote", "hybrid", "on_site"],
    },
  },
} as const

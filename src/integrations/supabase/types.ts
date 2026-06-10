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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          created_at: string
          created_by: string
          description: string
          id: string
          image_url: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          id?: string
          image_url?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          image_url?: string | null
          title?: string
        }
        Relationships: []
      }
      bracket_matches: {
        Row: {
          created_at: string
          id: string
          match_number: number
          round: number
          status: string
          team1_name: string | null
          team2_name: string | null
          tournament_id: string
          winner_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          match_number: number
          round: number
          status?: string
          team1_name?: string | null
          team2_name?: string | null
          tournament_id: string
          winner_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          match_number?: number
          round?: number
          status?: string
          team1_name?: string | null
          team2_name?: string | null
          tournament_id?: string
          winner_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bracket_matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_join_requests: {
        Row: {
          clan_name: string
          created_at: string | null
          id: string
          nickname: string
          player_id: string
          status: string
          user_id: string
        }
        Insert: {
          clan_name: string
          created_at?: string | null
          id?: string
          nickname: string
          player_id: string
          status?: string
          user_id: string
        }
        Update: {
          clan_name?: string
          created_at?: string | null
          id?: string
          nickname?: string
          player_id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      clan_leader_requests: {
        Row: {
          clan_name: string
          created_at: string
          description: string | null
          email: string
          id: string
          nickname: string
          player_id: string
          reviewed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          clan_name: string
          created_at?: string
          description?: string | null
          email: string
          id?: string
          nickname: string
          player_id: string
          reviewed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          clan_name?: string
          created_at?: string
          description?: string | null
          email?: string
          id?: string
          nickname?: string
          player_id?: string
          reviewed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      clan_members: {
        Row: {
          clan_id: string
          id: string
          joined_at: string
          nickname: string
          status: string
          user_id: string
        }
        Insert: {
          clan_id: string
          id?: string
          joined_at?: string
          nickname: string
          status?: string
          user_id: string
        }
        Update: {
          clan_id?: string
          id?: string
          joined_at?: string
          nickname?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_members_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      clans: {
        Row: {
          created_at: string
          id: string
          leader_nickname: string
          leader_user_id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          leader_nickname: string
          leader_user_id: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          leader_nickname?: string
          leader_user_id?: string
          name?: string
        }
        Relationships: []
      }
      creator_requests: {
        Row: {
          channel_link: string
          created_at: string
          email: string
          id: string
          nickname: string
          platform: string
          reviewed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          channel_link: string
          created_at?: string
          email: string
          id?: string
          nickname: string
          platform: string
          reviewed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          channel_link?: string
          created_at?: string
          email?: string
          id?: string
          nickname?: string
          platform?: string
          reviewed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      moderation_logs: {
        Row: {
          action: string
          admin_nickname: string
          admin_user_id: string
          created_at: string
          detail: string | null
          id: string
          reason: string
          target_nickname: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_nickname: string
          admin_user_id: string
          created_at?: string
          detail?: string | null
          id?: string
          reason: string
          target_nickname: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_nickname?: string
          admin_user_id?: string
          created_at?: string
          detail?: string | null
          id?: string
          reason?: string
          target_nickname?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          clan: string
          country: string
          created_at: string
          email: string
          id: string
          is_clan_leader: boolean | null
          nickname: string
          platform: string
          player_id: string
          status: string
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          clan: string
          country: string
          created_at?: string
          email: string
          id?: string
          is_clan_leader?: boolean | null
          nickname: string
          platform: string
          player_id: string
          status?: string
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          clan?: string
          country?: string
          created_at?: string
          email?: string
          id?: string
          is_clan_leader?: boolean | null
          nickname?: string
          platform?: string
          player_id?: string
          status?: string
          updated_at?: string
          user_id?: string
          verified?: boolean
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
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string
          description: string
          id: string
          reported_player: string
          reporter_nickname: string
          reporter_user_id: string
          resolved_at: string | null
          screenshot_url: string | null
          status: string
        }
        Insert: {
          admin_notes?: string | null
          category: string
          created_at?: string
          description: string
          id?: string
          reported_player: string
          reporter_nickname: string
          reporter_user_id: string
          resolved_at?: string | null
          screenshot_url?: string | null
          status?: string
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          reported_player?: string
          reporter_nickname?: string
          reporter_user_id?: string
          resolved_at?: string | null
          screenshot_url?: string | null
          status?: string
        }
        Relationships: []
      }
      scrim_participants: {
        Row: {
          id: string
          joined_at: string
          nickname: string
          platform: string
          player_id: string
          scrim_id: string
          team: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          nickname: string
          platform: string
          player_id: string
          scrim_id: string
          team: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          nickname?: string
          platform?: string
          player_id?: string
          scrim_id?: string
          team?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrim_participants_scrim_id_fkey"
            columns: ["scrim_id"]
            isOneToOne: false
            referencedRelation: "scrims"
            referencedColumns: ["id"]
          },
        ]
      }
      scrims: {
        Row: {
          created_at: string
          created_by: string
          creator_nickname: string
          date: string
          id: string
          max_players: number
          mode: string
          status: string
          stream_link: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          creator_nickname: string
          date: string
          id?: string
          max_players?: number
          mode: string
          status?: string
          stream_link?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          creator_nickname?: string
          date?: string
          id?: string
          max_players?: number
          mode?: string
          status?: string
          stream_link?: string | null
          title?: string
        }
        Relationships: []
      }
      site_config: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      tournament_champions: {
        Row: {
          created_at: string
          date: string
          id: string
          image_url: string | null
          mode: string
          prize: string | null
          sponsor_tag: string | null
          team_name: string
          tournament_id: string
          tournament_name: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          image_url?: string | null
          mode: string
          prize?: string | null
          sponsor_tag?: string | null
          team_name: string
          tournament_id: string
          tournament_name: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          image_url?: string | null
          mode?: string
          prize?: string | null
          sponsor_tag?: string | null
          team_name?: string
          tournament_id?: string
          tournament_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_champions_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_registrations: {
        Row: {
          clan: string
          created_at: string
          id: string
          nickname: string
          platform: string
          player_id: string
          tournament_id: string
          tournament_team_name: string
          user_id: string
        }
        Insert: {
          clan: string
          created_at?: string
          id?: string
          nickname: string
          platform: string
          player_id: string
          tournament_id: string
          tournament_team_name: string
          user_id: string
        }
        Update: {
          clan?: string
          created_at?: string
          id?: string
          nickname?: string
          platform?: string
          player_id?: string
          tournament_id?: string
          tournament_team_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_results: {
        Row: {
          created_at: string
          id: string
          kill_points: number
          kills: number
          multiplier_bonus: number
          position: number
          position_points: number
          team_name: string
          total_points: number
          tournament_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kill_points?: number
          kills?: number
          multiplier_bonus?: number
          position?: number
          position_points?: number
          team_name: string
          total_points?: number
          tournament_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kill_points?: number
          kills?: number
          multiplier_bonus?: number
          position?: number
          position_points?: number
          team_name?: string
          total_points?: number
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_results_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_scoring_config: {
        Row: {
          created_at: string
          id: string
          kill_multiplier_by_position: Json
          kill_value: number
          position_values: Json
          tournament_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kill_multiplier_by_position?: Json
          kill_value?: number
          position_values?: Json
          tournament_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kill_multiplier_by_position?: Json
          kill_value?: number
          position_values?: Json
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_scoring_config_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: true
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_waiting_list: {
        Row: {
          clan: string
          created_at: string
          id: string
          nickname: string
          platform: string
          player_id: string
          position: number
          tournament_id: string
          tournament_team_name: string
          user_id: string
        }
        Insert: {
          clan?: string
          created_at?: string
          id?: string
          nickname: string
          platform: string
          player_id: string
          position?: number
          tournament_id: string
          tournament_team_name?: string
          user_id: string
        }
        Update: {
          clan?: string
          created_at?: string
          id?: string
          nickname?: string
          platform?: string
          player_id?: string
          position?: number
          tournament_id?: string
          tournament_team_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_waiting_list_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string
          date: string
          format: string
          id: string
          image_url: string | null
          max_players: number
          mode: string
          name: string
          region: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          format?: string
          id?: string
          image_url?: string | null
          max_players?: number
          mode: string
          name: string
          region?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          format?: string
          id?: string
          image_url?: string | null
          max_players?: number
          mode?: string
          name?: string
          region?: string | null
          status?: string
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
      verification_requests: {
        Row: {
          additional_doc_url: string | null
          created_at: string
          email: string
          id: string
          id_screenshot_url: string | null
          nickname: string
          player_id: string
          profile_screenshot_url: string | null
          reviewed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          additional_doc_url?: string | null
          created_at?: string
          email: string
          id?: string
          id_screenshot_url?: string | null
          nickname: string
          player_id: string
          profile_screenshot_url?: string | null
          reviewed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          additional_doc_url?: string | null
          created_at?: string
          email?: string
          id?: string
          id_screenshot_url?: string | null
          nickname?: string
          player_id?: string
          profile_screenshot_url?: string | null
          reviewed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_toggle_role: {
        Args: {
          _add: boolean
          _role: Database["public"]["Enums"]["app_role"]
          _target_user_id: string
        }
        Returns: undefined
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
      app_role: "player" | "content_creator" | "admin" | "clan_leader"
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
      app_role: ["player", "content_creator", "admin", "clan_leader"],
    },
  },
} as const

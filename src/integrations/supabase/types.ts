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
      activities: {
        Row: {
          created_at: string | null
          destination_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          destination_id: string
          id: string
          name: string
        }
        Update: {
          created_at?: string | null
          destination_id?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      cars: {
        Row: {
          created_at: string | null
          destination_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          destination_id: string
          id: string
          name: string
        }
        Update: {
          created_at?: string | null
          destination_id?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          status: string
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_requests: {
        Row: {
          created_at: string | null
          id: string
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      destinations: {
        Row: {
          created_at: string | null
          description: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id: string
          latitude?: number | null
          longitude?: number | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
        }
        Relationships: []
      }
      hotels: {
        Row: {
          created_at: string | null
          destination_id: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          website: string | null
        }
        Insert: {
          created_at?: string | null
          destination_id: string
          id: string
          latitude?: number | null
          longitude?: number | null
          name: string
          website?: string | null
        }
        Update: {
          created_at?: string | null
          destination_id?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          website?: string | null
        }
        Relationships: []
      }
      itineraries: {
        Row: {
          activity_booked: boolean | null
          activity_cost: number | null
          activity_id: string | null
          all_confirmed: boolean | null
          breakfast_time: string | null
          car_cost: number | null
          car_id: string | null
          created_at: string | null
          date: string
          day_type: string
          destination_id: string
          dinner_time: string | null
          hotel_booked: boolean | null
          hotel_cost: number | null
          hotel_id: string | null
          id: string
          is_booked: boolean | null
          lunch_time: string | null
          notes: string | null
          origin_id: string | null
          other_cost: number | null
          transport_cost: number | null
          updated_at: string | null
          user_id: string
          wake_time: string | null
        }
        Insert: {
          activity_booked?: boolean | null
          activity_cost?: number | null
          activity_id?: string | null
          all_confirmed?: boolean | null
          breakfast_time?: string | null
          car_cost?: number | null
          car_id?: string | null
          created_at?: string | null
          date: string
          day_type?: string
          destination_id: string
          dinner_time?: string | null
          hotel_booked?: boolean | null
          hotel_cost?: number | null
          hotel_id?: string | null
          id?: string
          is_booked?: boolean | null
          lunch_time?: string | null
          notes?: string | null
          origin_id?: string | null
          other_cost?: number | null
          transport_cost?: number | null
          updated_at?: string | null
          user_id: string
          wake_time?: string | null
        }
        Update: {
          activity_booked?: boolean | null
          activity_cost?: number | null
          activity_id?: string | null
          all_confirmed?: boolean | null
          breakfast_time?: string | null
          car_cost?: number | null
          car_id?: string | null
          created_at?: string | null
          date?: string
          day_type?: string
          destination_id?: string
          dinner_time?: string | null
          hotel_booked?: boolean | null
          hotel_cost?: number | null
          hotel_id?: string | null
          id?: string
          is_booked?: boolean | null
          lunch_time?: string | null
          notes?: string | null
          origin_id?: string | null
          other_cost?: number | null
          transport_cost?: number | null
          updated_at?: string | null
          user_id?: string
          wake_time?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read: boolean | null
          sender_id: string
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read?: boolean | null
          sender_id: string
          sender_type?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read?: boolean | null
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string
          created_at: string | null
          destination_id: string
          display_name: string | null
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string | null
          destination_id: string
          display_name?: string | null
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string | null
          destination_id?: string
          display_name?: string | null
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      saved_tour_packages: {
        Row: {
          conversation_history: Json
          created_at: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          conversation_history: Json
          created_at?: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          conversation_history?: Json
          created_at?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      sos_alerts: {
        Row: {
          created_at: string
          description: string | null
          has_voice_recording: boolean | null
          id: string
          latitude: number | null
          longitude: number | null
          phone_number: string | null
          resolved_at: string | null
          status: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          has_voice_recording?: boolean | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          phone_number?: string | null
          resolved_at?: string | null
          status?: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          has_voice_recording?: boolean | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          phone_number?: string | null
          resolved_at?: string | null
          status?: string
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          created_at: string
          expires_at: string | null
          id: string
          payment_method: string
          payment_reference: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_method?: string
          payment_reference?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_method?: string
          payment_reference?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      tour_companies: {
        Row: {
          created_at: string
          description: string
          email: string | null
          id: string
          image_url: string | null
          name: string
          phone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string
          email?: string | null
          id?: string
          image_url?: string | null
          name: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          email?: string | null
          id?: string
          image_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      tour_company_images: {
        Row: {
          caption: string | null
          company_id: string
          created_at: string
          id: string
          image_url: string
          sort_order: number | null
        }
        Insert: {
          caption?: string | null
          company_id: string
          created_at?: string
          id?: string
          image_url: string
          sort_order?: number | null
        }
        Update: {
          caption?: string | null
          company_id?: string
          created_at?: string
          id?: string
          image_url?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_company_images_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "tour_companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

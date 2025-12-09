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
      expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          date: string
          description: string
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          source: Database["public"]["Enums"]["data_source"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          date?: string
          description: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          source?: Database["public"]["Enums"]["data_source"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          date?: string
          description?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          source?: Database["public"]["Enums"]["data_source"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      incomes: {
        Row: {
          amount: number
          created_at: string
          date: string
          description: string
          id: string
          source: Database["public"]["Enums"]["data_source"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string
          description: string
          id?: string
          source?: Database["public"]["Enums"]["data_source"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          description?: string
          id?: string
          source?: Database["public"]["Enums"]["data_source"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ai_tone: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_tone?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_tone?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_messages_log: {
        Row: {
          created_at: string
          id: string
          parsed_data: Json | null
          parsed_type: Database["public"]["Enums"]["parsed_type"] | null
          phone_number: string | null
          raw_message: string
          response_sent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          parsed_data?: Json | null
          parsed_type?: Database["public"]["Enums"]["parsed_type"] | null
          phone_number?: string | null
          raw_message: string
          response_sent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          parsed_data?: Json | null
          parsed_type?: Database["public"]["Enums"]["parsed_type"] | null
          phone_number?: string | null
          raw_message?: string
          response_sent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      whatsapp_settings: {
        Row: {
          created_at: string
          evolution_api_key: string | null
          evolution_api_url: string | null
          id: string
          instance_name: string | null
          is_connected: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          evolution_api_key?: string | null
          evolution_api_url?: string | null
          id?: string
          instance_name?: string | null
          is_connected?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          evolution_api_key?: string | null
          evolution_api_url?: string | null
          id?: string
          instance_name?: string | null
          is_connected?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      data_source: "whatsapp" | "manual"
      expense_category:
        | "Cartão Crédito"
        | "Gasto Variável"
        | "Fixo"
        | "Alimentação"
        | "Transporte"
        | "Lazer"
        | "Saúde"
        | "Educação"
        | "Moradia"
        | "Outros"
      parsed_type: "ganho" | "gasto" | "pergunta"
      payment_method:
        | "crédito"
        | "débito"
        | "pix"
        | "dinheiro"
        | "transferência"
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
      data_source: ["whatsapp", "manual"],
      expense_category: [
        "Cartão Crédito",
        "Gasto Variável",
        "Fixo",
        "Alimentação",
        "Transporte",
        "Lazer",
        "Saúde",
        "Educação",
        "Moradia",
        "Outros",
      ],
      parsed_type: ["ganho", "gasto", "pergunta"],
      payment_method: ["crédito", "débito", "pix", "dinheiro", "transferência"],
    },
  },
} as const

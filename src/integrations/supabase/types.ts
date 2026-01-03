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
      client_sessions: {
        Row: {
          client_name: string
          companions: Json | null
          created_at: string
          device_fingerprint: string
          discount: number | null
          id: string
          is_active: boolean
          is_paid: boolean
          paid_at: string | null
          table_id: string
        }
        Insert: {
          client_name: string
          companions?: Json | null
          created_at?: string
          device_fingerprint: string
          discount?: number | null
          id?: string
          is_active?: boolean
          is_paid?: boolean
          paid_at?: string | null
          table_id: string
        }
        Update: {
          client_name?: string
          companions?: Json | null
          created_at?: string
          device_fingerprint?: string
          discount?: number | null
          id?: string
          is_active?: boolean
          is_paid?: boolean
          paid_at?: string | null
          table_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_sessions_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          bottle_ml: number | null
          bottles_in_stock: number
          cost_price: number | null
          created_at: string
          current_bottle_ml: number
          description: string | null
          dose_ml: number | null
          id: string
          is_bottle: boolean
          name: string
          product_code: string[] | null
          stock_quantity: number | null
          updated_at: string
        }
        Insert: {
          bottle_ml?: number | null
          bottles_in_stock?: number
          cost_price?: number | null
          created_at?: string
          current_bottle_ml?: number
          description?: string | null
          dose_ml?: number | null
          id?: string
          is_bottle?: boolean
          name: string
          product_code?: string[] | null
          stock_quantity?: number | null
          updated_at?: string
        }
        Update: {
          bottle_ml?: number | null
          bottles_in_stock?: number
          cost_price?: number | null
          created_at?: string
          current_bottle_ml?: number
          description?: string | null
          dose_ml?: number | null
          id?: string
          is_bottle?: boolean
          name?: string
          product_code?: string[] | null
          stock_quantity?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      item_recipes: {
        Row: {
          created_at: string
          id: string
          ingredient_inventory_item_id: string | null
          ingredient_item_id: string | null
          parent_item_id: string | null
          parent_product_id: string | null
          quantity_ml: number | null
          quantity_units: number
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_inventory_item_id?: string | null
          ingredient_item_id?: string | null
          parent_item_id?: string | null
          parent_product_id?: string | null
          quantity_ml?: number | null
          quantity_units?: number
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_inventory_item_id?: string | null
          ingredient_item_id?: string | null
          parent_item_id?: string | null
          parent_product_id?: string | null
          quantity_ml?: number | null
          quantity_units?: number
        }
        Relationships: [
          {
            foreignKeyName: "item_recipes_ingredient_inventory_item_id_fkey"
            columns: ["ingredient_inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_recipes_parent_product_id_fkey"
            columns: ["parent_product_id"]
            isOneToOne: false
            referencedRelation: "menu_products"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          bottle_ml: number | null
          bottles_in_stock: number | null
          category: string
          cost_price: number | null
          created_at: string
          current_bottle_ml: number | null
          default_recipe_suggestion: Json | null
          description: string | null
          dose_ml: number | null
          goes_to_kitchen: boolean
          id: string
          is_available: boolean
          is_bottle: boolean | null
          is_customizable: boolean
          is_sellable: boolean
          name: string
          price: number
          product_code: string[] | null
          stock_quantity: number | null
        }
        Insert: {
          bottle_ml?: number | null
          bottles_in_stock?: number | null
          category: string
          cost_price?: number | null
          created_at?: string
          current_bottle_ml?: number | null
          default_recipe_suggestion?: Json | null
          description?: string | null
          dose_ml?: number | null
          goes_to_kitchen?: boolean
          id?: string
          is_available?: boolean
          is_bottle?: boolean | null
          is_customizable?: boolean
          is_sellable?: boolean
          name: string
          price: number
          product_code?: string[] | null
          stock_quantity?: number | null
        }
        Update: {
          bottle_ml?: number | null
          bottles_in_stock?: number | null
          category?: string
          cost_price?: number | null
          created_at?: string
          current_bottle_ml?: number | null
          default_recipe_suggestion?: Json | null
          description?: string | null
          dose_ml?: number | null
          goes_to_kitchen?: boolean
          id?: string
          is_available?: boolean
          is_bottle?: boolean | null
          is_customizable?: boolean
          is_sellable?: boolean
          name?: string
          price?: number
          product_code?: string[] | null
          stock_quantity?: number | null
        }
        Relationships: []
      }
      menu_products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          goes_to_kitchen: boolean
          id: string
          inventory_item_id: string | null
          is_available: boolean
          is_customizable: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          goes_to_kitchen?: boolean
          id?: string
          inventory_item_id?: string | null
          is_available?: boolean
          is_customizable?: boolean
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          goes_to_kitchen?: boolean
          id?: string
          inventory_item_id?: string | null
          is_available?: boolean
          is_customizable?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_products_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          category: string
          created_at: string
          custom_ingredients: Json | null
          id: string
          item_name: string
          item_price: number
          menu_item_id: string | null
          order_id: string
          quantity: number
        }
        Insert: {
          category: string
          created_at?: string
          custom_ingredients?: Json | null
          id?: string
          item_name: string
          item_price: number
          menu_item_id?: string | null
          order_id: string
          quantity?: number
        }
        Update: {
          category?: string
          created_at?: string
          custom_ingredients?: Json | null
          id?: string
          item_name?: string
          item_price?: number
          menu_item_id?: string | null
          order_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          client_session_id: string
          created_at: string
          delivery_type: string
          id: string
          is_paid: boolean
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          status: Database["public"]["Enums"]["order_status"]
          table_id: string
          updated_at: string
        }
        Insert: {
          client_session_id: string
          created_at?: string
          delivery_type?: string
          id?: string
          is_paid?: boolean
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          table_id: string
          updated_at?: string
        }
        Update: {
          client_session_id?: string
          created_at?: string
          delivery_type?: string
          id?: string
          is_paid?: boolean
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          table_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_session_id_fkey"
            columns: ["client_session_id"]
            isOneToOne: false
            referencedRelation: "client_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      partial_payments: {
        Row: {
          amount: number
          client_session_id: string
          created_at: string
          id: string
          notes: string | null
          payment_method: string | null
        }
        Insert: {
          amount: number
          client_session_id: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
        }
        Update: {
          amount?: number
          client_session_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
        }
        Relationships: []
      }
      reservations: {
        Row: {
          client_email: string
          client_name: string
          client_whatsapp: string | null
          created_at: string
          id: string
          num_people: number
          reservation_date: string
          reservation_type: string
          status: string
        }
        Insert: {
          client_email: string
          client_name: string
          client_whatsapp?: string | null
          created_at?: string
          id?: string
          num_people: number
          reservation_date: string
          reservation_type: string
          status?: string
        }
        Update: {
          client_email?: string
          client_name?: string
          client_whatsapp?: string | null
          created_at?: string
          id?: string
          num_people?: number
          reservation_date?: string
          reservation_type?: string
          status?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      tables: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          number: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          number: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          number?: number
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
      decrement_stock: {
        Args: { p_menu_item_id: string; p_quantity: number }
        Returns: undefined
      }
      get_client_name_for_today: {
        Args: { p_fingerprint: string }
        Returns: string
      }
      get_order_items_by_order: {
        Args: { p_order_id: string }
        Returns: {
          category: string
          id: string
          item_name: string
          item_price: number
          menu_item_id: string
          order_id: string
          quantity: number
        }[]
      }
      get_orders_by_session: {
        Args: { p_session_id: string }
        Returns: {
          client_session_id: string
          created_at: string
          delivery_type: string
          id: string
          notes: string
          status: Database["public"]["Enums"]["order_status"]
          table_id: string
          updated_at: string
        }[]
      }
      get_reservation_counts: {
        Args: { p_date: string }
        Returns: {
          count: number
          reservation_type: string
        }[]
      }
      get_session_by_fingerprint: {
        Args: { p_fingerprint: string; p_table_id: string }
        Returns: {
          client_name: string
          created_at: string
          device_fingerprint: string
          id: string
          is_active: boolean
          table_id: string
        }[]
      }
      get_stale_products: {
        Args: { days_threshold?: number }
        Returns: {
          category: string
          days_since_sale: number
          id: string
          last_sale_at: string
          name: string
        }[]
      }
      get_tables_with_activity: {
        Args: never
        Returns: {
          client_name: string
          id: string
          is_active: boolean
          last_order_at: string
          minutes_since_order: number
          name: string
          number: number
          session_id: string
        }[]
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
      app_role: "admin" | "staff"
      order_status: "pending" | "preparing" | "ready" | "delivered"
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
      app_role: ["admin", "staff"],
      order_status: ["pending", "preparing", "ready", "delivered"],
    },
  },
} as const

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1';
  };
  public: {
    Tables: {
      calendar_entries: {
        Row: {
          created_at: string;
          created_by: string;
          household_id: string;
          id: string;
          meal_slot: string;
          notes: string | null;
          planned_date: string;
          recipe_id: string | null;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          household_id: string;
          id?: string;
          meal_slot: string;
          notes?: string | null;
          planned_date: string;
          recipe_id?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          household_id?: string;
          id?: string;
          meal_slot?: string;
          notes?: string | null;
          planned_date?: string;
          recipe_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'calendar_entries_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'calendar_entries_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'recipes';
            referencedColumns: ['id'];
          },
        ];
      };
      cooking_events: {
        Row: {
          cooked_at: string;
          cooked_by: string;
          household_id: string;
          id: string;
          notes: string | null;
          rating: number | null;
          recipe_id: string;
          recipe_version_id: string;
          servings_made: number | null;
        };
        Insert: {
          cooked_at?: string;
          cooked_by: string;
          household_id: string;
          id?: string;
          notes?: string | null;
          rating?: number | null;
          recipe_id: string;
          recipe_version_id: string;
          servings_made?: number | null;
        };
        Update: {
          cooked_at?: string;
          cooked_by?: string;
          household_id?: string;
          id?: string;
          notes?: string | null;
          rating?: number | null;
          recipe_id?: string;
          recipe_version_id?: string;
          servings_made?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'cooking_events_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cooking_events_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'recipes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cooking_events_recipe_version_id_fkey';
            columns: ['recipe_version_id'];
            isOneToOne: false;
            referencedRelation: 'recipe_versions';
            referencedColumns: ['id'];
          },
        ];
      };
      household_invitations: {
        Row: {
          accepted_at: string | null;
          created_at: string;
          household_id: string;
          id: string | null;
          invited_at: string;
          invitee_email: string;
          inviter_profile_id: string;
          role: string;
          status: string;
          token: string;
          updated_at: string;
        };
        Insert: {
          accepted_at?: string | null;
          created_at?: string;
          household_id: string;
          id?: string | null;
          invited_at?: string;
          invitee_email: string;
          inviter_profile_id: string;
          role?: string;
          status?: string;
          token: string;
          updated_at?: string;
        };
        Update: {
          accepted_at?: string | null;
          created_at?: string;
          household_id?: string;
          id?: string | null;
          invited_at?: string;
          invitee_email?: string;
          inviter_profile_id?: string;
          role?: string;
          status?: string;
          token?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'household_invitations_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'household_invitations_inviter_profile_id_fkey';
            columns: ['inviter_profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      household_members: {
        Row: {
          household_id: string;
          joined_at: string;
          role: string;
          user_id: string;
        };
        Insert: {
          household_id: string;
          joined_at?: string;
          role: string;
          user_id: string;
        };
        Update: {
          household_id?: string;
          joined_at?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'household_members_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'household_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      households: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          auth_user_id: string | null;
          avatar_url: string | null;
          created_at: string;
          display_name: string;
          id: string;
          member_type: string;
          updated_at: string;
        };
        Insert: {
          auth_user_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          display_name: string;
          id?: string;
          member_type?: string;
          updated_at?: string;
        };
        Update: {
          auth_user_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          member_type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recipe_forks: {
        Row: {
          child_recipe_id: string;
          forked_at: string;
          forked_by: string;
          parent_recipe_id: string;
        };
        Insert: {
          child_recipe_id: string;
          forked_at?: string;
          forked_by: string;
          parent_recipe_id: string;
        };
        Update: {
          child_recipe_id?: string;
          forked_at?: string;
          forked_by?: string;
          parent_recipe_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'recipe_forks_child_recipe_id_fkey';
            columns: ['child_recipe_id'];
            isOneToOne: false;
            referencedRelation: 'recipes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recipe_forks_parent_recipe_id_fkey';
            columns: ['parent_recipe_id'];
            isOneToOne: false;
            referencedRelation: 'recipes';
            referencedColumns: ['id'];
          },
        ];
      };
      recipe_versions: {
        Row: {
          cook_time_minutes: number | null;
          created_at: string;
          created_by: string;
          id: string;
          ingredients_json: Json;
          notes: string | null;
          prep_time_minutes: number | null;
          recipe_id: string;
          servings: number | null;
          steps_json: Json;
          version_number: number;
        };
        Insert: {
          cook_time_minutes?: number | null;
          created_at?: string;
          created_by: string;
          id?: string;
          ingredients_json?: Json;
          notes?: string | null;
          prep_time_minutes?: number | null;
          recipe_id: string;
          servings?: number | null;
          steps_json?: Json;
          version_number: number;
        };
        Update: {
          cook_time_minutes?: number | null;
          created_at?: string;
          created_by?: string;
          id?: string;
          ingredients_json?: Json;
          notes?: string | null;
          prep_time_minutes?: number | null;
          recipe_id?: string;
          servings?: number | null;
          steps_json?: Json;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'recipe_versions_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'recipes';
            referencedColumns: ['id'];
          },
        ];
      };
      recipes: {
        Row: {
          created_at: string;
          created_by: string;
          current_version_id: string | null;
          description: string | null;
          household_id: string;
          id: string;
          last_cooked_at: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          current_version_id?: string | null;
          description?: string | null;
          household_id: string;
          id?: string;
          last_cooked_at?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          current_version_id?: string | null;
          description?: string | null;
          household_id?: string;
          id?: string;
          last_cooked_at?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_recipes_current_version';
            columns: ['current_version_id'];
            isOneToOne: false;
            referencedRelation: 'recipe_versions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recipes_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_household_on_signup: {
        Args: { p_display_name: string; p_user_id: string };
        Returns: undefined;
      };
      create_recipe_with_version: {
        Args: {
          p_cook_time_minutes: number;
          p_description: string;
          p_household_id: string;
          p_ingredients_json: Json;
          p_notes: string;
          p_prep_time_minutes: number;
          p_servings: number;
          p_steps_json: Json;
          p_title: string;
          p_user_id: string;
        };
        Returns: string;
      };
      fork_recipe: {
        Args: {
          p_new_title: string;
          p_parent_recipe_id: string;
          p_user_id: string;
        };
        Returns: string;
      };
      get_household_recipe_stats: {
        Args: { p_household_id: string };
        Returns: {
          avg_rating: number;
          recipes_cooked_last_7_days: number;
          total_cooking_events: number;
          total_recipes: number;
        }[];
      };
      get_recipe_version_history: {
        Args: { p_recipe_id: string };
        Returns: {
          created_at: string;
          created_by: string;
          is_current: boolean;
          version_id: string;
          version_number: number;
        }[];
      };
      get_user_household_id: { Args: never; Returns: string };
      get_user_household_role: { Args: never; Returns: string };
      get_user_profile_id: { Args: never; Returns: string };
      is_household_admin: { Args: never; Returns: boolean };
      is_household_admin_of: {
        Args: { household_id: string };
        Returns: boolean;
      };
      update_recipe_create_version: {
        Args: {
          p_cook_time_minutes: number;
          p_description: string;
          p_ingredients_json: Json;
          p_notes: string;
          p_prep_time_minutes: number;
          p_recipe_id: string;
          p_servings: number;
          p_steps_json: Json;
          p_title: string;
          p_user_id: string;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;

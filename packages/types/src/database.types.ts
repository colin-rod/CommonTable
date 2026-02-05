export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1';
  };
  public: {
    Tables: {
      ai_tag_suggestions: {
        Row: {
          accepted_at: string | null;
          confidence_score: number;
          created_at: string;
          id: string;
          model_version: string;
          recipe_version_id: string;
          tag_id: string;
          user_accepted: boolean | null;
        };
        Insert: {
          accepted_at?: string | null;
          confidence_score: number;
          created_at?: string;
          id?: string;
          model_version: string;
          recipe_version_id: string;
          tag_id: string;
          user_accepted?: boolean | null;
        };
        Update: {
          accepted_at?: string | null;
          confidence_score?: number;
          created_at?: string;
          id?: string;
          model_version?: string;
          recipe_version_id?: string;
          tag_id?: string;
          user_accepted?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_tag_suggestions_recipe_version_id_fkey';
            columns: ['recipe_version_id'];
            isOneToOne: false;
            referencedRelation: 'recipe_versions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_tag_suggestions_tag_id_fkey';
            columns: ['tag_id'];
            isOneToOne: false;
            referencedRelation: 'tags';
            referencedColumns: ['id'];
          },
        ];
      };
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
          status: string;
          updated_at: string;
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
          status?: string;
          updated_at?: string;
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
          status?: string;
          updated_at?: string;
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
      calendar_entry_comments: {
        Row: {
          calendar_entry_id: string;
          comment_text: string;
          created_at: string;
          created_by: string;
          household_id: string;
          id: string;
        };
        Insert: {
          calendar_entry_id: string;
          comment_text: string;
          created_at?: string;
          created_by: string;
          household_id: string;
          id?: string;
        };
        Update: {
          calendar_entry_id?: string;
          comment_text?: string;
          created_at?: string;
          created_by?: string;
          household_id?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'calendar_entry_comments_calendar_entry_id_fkey';
            columns: ['calendar_entry_id'];
            isOneToOne: false;
            referencedRelation: 'calendar_entries';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'calendar_entry_comments_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'calendar_entry_comments_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
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
      meal_requests: {
        Row: {
          created_at: string;
          household_id: string;
          id: string;
          notes: string | null;
          priority: number;
          recipe_id: string | null;
          requested_by: string;
          requested_date: string;
          requested_meal_slot: string;
          status: Database['public']['Enums']['meal_request_status'];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          household_id: string;
          id?: string;
          notes?: string | null;
          priority?: number;
          recipe_id?: string | null;
          requested_by: string;
          requested_date: string;
          requested_meal_slot: string;
          status?: Database['public']['Enums']['meal_request_status'];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          household_id?: string;
          id?: string;
          notes?: string | null;
          priority?: number;
          recipe_id?: string | null;
          requested_by?: string;
          requested_date?: string;
          requested_meal_slot?: string;
          status?: Database['public']['Enums']['meal_request_status'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'meal_requests_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'meal_requests_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'recipes';
            referencedColumns: ['id'];
          },
        ];
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
      recipe_images: {
        Row: {
          alt_text: string | null;
          created_at: string;
          created_by: string;
          display_order: number;
          file_size_bytes: number | null;
          height: number | null;
          id: string;
          is_primary: boolean;
          is_public: boolean;
          recipe_id: string;
          storage_path: string;
          width: number | null;
        };
        Insert: {
          alt_text?: string | null;
          created_at?: string;
          created_by: string;
          display_order?: number;
          file_size_bytes?: number | null;
          height?: number | null;
          id?: string;
          is_primary?: boolean;
          is_public?: boolean;
          recipe_id: string;
          storage_path: string;
          width?: number | null;
        };
        Update: {
          alt_text?: string | null;
          created_at?: string;
          created_by?: string;
          display_order?: number;
          file_size_bytes?: number | null;
          height?: number | null;
          id?: string;
          is_primary?: boolean;
          is_public?: boolean;
          recipe_id?: string;
          storage_path?: string;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'recipe_images_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'recipes';
            referencedColumns: ['id'];
          },
        ];
      };
      recipe_queue: {
        Row: {
          added_by: string;
          created_at: string;
          household_id: string;
          id: string;
          notes: string | null;
          position: number;
          recipe_id: string;
          status: Database['public']['Enums']['queue_status'];
          updated_at: string;
        };
        Insert: {
          added_by: string;
          created_at?: string;
          household_id: string;
          id?: string;
          notes?: string | null;
          position?: number;
          recipe_id: string;
          status?: Database['public']['Enums']['queue_status'];
          updated_at?: string;
        };
        Update: {
          added_by?: string;
          created_at?: string;
          household_id?: string;
          id?: string;
          notes?: string | null;
          position?: number;
          recipe_id?: string;
          status?: Database['public']['Enums']['queue_status'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'recipe_queue_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recipe_queue_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'recipes';
            referencedColumns: ['id'];
          },
        ];
      };
      recipe_shortlists: {
        Row: {
          added_at: string;
          added_by_user_id: string;
          household_id: string;
          id: string;
          recipe_id: string;
        };
        Insert: {
          added_at?: string;
          added_by_user_id: string;
          household_id: string;
          id?: string;
          recipe_id: string;
        };
        Update: {
          added_at?: string;
          added_by_user_id?: string;
          household_id?: string;
          id?: string;
          recipe_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'recipe_shortlists_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recipe_shortlists_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'recipes';
            referencedColumns: ['id'];
          },
        ];
      };
      recipe_version_tags: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          recipe_version_id: string;
          tag_id: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          id?: string;
          recipe_version_id: string;
          tag_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
          recipe_version_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'recipe_version_tags_recipe_version_id_fkey';
            columns: ['recipe_version_id'];
            isOneToOne: false;
            referencedRelation: 'recipe_versions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recipe_version_tags_tag_id_fkey';
            columns: ['tag_id'];
            isOneToOne: false;
            referencedRelation: 'tags';
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
          cooking_method: Database['public']['Enums']['cooking_method'] | null;
          created_at: string;
          created_by: string;
          cuisine: Database['public']['Enums']['cuisine_type'] | null;
          current_version_id: string | null;
          description: string | null;
          dietary_categories: Database['public']['Enums']['dietary_category'][] | null;
          dish_category: Database['public']['Enums']['dish_category'] | null;
          household_id: string;
          id: string;
          is_favorite: boolean;
          key_ingredients: string[] | null;
          last_cooked_at: string | null;
          meal_type: Database['public']['Enums']['meal_type'] | null;
          priority: number | null;
          rolling_score: number | null;
          search_vector: unknown;
          source_url: string | null;
          status: Database['public']['Enums']['recipe_status'];
          title: string;
          updated_at: string;
        };
        Insert: {
          cooking_method?: Database['public']['Enums']['cooking_method'] | null;
          created_at?: string;
          created_by: string;
          cuisine?: Database['public']['Enums']['cuisine_type'] | null;
          current_version_id?: string | null;
          description?: string | null;
          dietary_categories?: Database['public']['Enums']['dietary_category'][] | null;
          dish_category?: Database['public']['Enums']['dish_category'] | null;
          household_id: string;
          id?: string;
          is_favorite?: boolean;
          key_ingredients?: string[] | null;
          last_cooked_at?: string | null;
          meal_type?: Database['public']['Enums']['meal_type'] | null;
          priority?: number | null;
          rolling_score?: number | null;
          search_vector?: unknown;
          source_url?: string | null;
          status?: Database['public']['Enums']['recipe_status'];
          title: string;
          updated_at?: string;
        };
        Update: {
          cooking_method?: Database['public']['Enums']['cooking_method'] | null;
          created_at?: string;
          created_by?: string;
          cuisine?: Database['public']['Enums']['cuisine_type'] | null;
          current_version_id?: string | null;
          description?: string | null;
          dietary_categories?: Database['public']['Enums']['dietary_category'][] | null;
          dish_category?: Database['public']['Enums']['dish_category'] | null;
          household_id?: string;
          id?: string;
          is_favorite?: boolean;
          key_ingredients?: string[] | null;
          last_cooked_at?: string | null;
          meal_type?: Database['public']['Enums']['meal_type'] | null;
          priority?: number | null;
          rolling_score?: number | null;
          search_vector?: unknown;
          source_url?: string | null;
          status?: Database['public']['Enums']['recipe_status'];
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
      tags: {
        Row: {
          created_at: string;
          created_by: string;
          household_id: string;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          household_id: string;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          household_id?: string;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tags_household_id_fkey';
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
      apply_tag_suggestions: {
        Args: { p_suggestions: Json };
        Returns: undefined;
      };
      calculate_rolling_score: {
        Args: { p_recipe_id: string };
        Returns: number;
      };
      call_suggest_tags_batch: { Args: { p_recipes: Json }; Returns: Json };
      create_household_on_signup: {
        Args: { p_display_name: string; p_user_id: string };
        Returns: string;
      };
      create_recipe_with_version: {
        Args: {
          p_cook_time_minutes: number;
          p_cooking_method?: Database['public']['Enums']['cooking_method'];
          p_cuisine?: Database['public']['Enums']['cuisine_type'];
          p_description: string;
          p_dietary_categories?: Database['public']['Enums']['dietary_category'][];
          p_dish_category?: Database['public']['Enums']['dish_category'];
          p_household_id: string;
          p_ingredients_json: Json;
          p_key_ingredients?: string[];
          p_meal_type?: Database['public']['Enums']['meal_type'];
          p_notes: string;
          p_prep_time_minutes: number;
          p_priority?: number;
          p_servings: number;
          p_source_url?: string;
          p_status?: Database['public']['Enums']['recipe_status'];
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
      get_household_id_from_storage_path: {
        Args: { path: string };
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
      get_household_tags: {
        Args: { p_household_id: string };
        Returns: {
          tag_name: string;
          usage_count: number;
        }[];
      };
      get_or_create_tag: {
        Args: {
          p_created_by: string;
          p_household_id: string;
          p_tag_name: string;
        };
        Returns: string;
      };
      get_recipe_id_from_storage_path: {
        Args: { path: string };
        Returns: string;
      };
      get_recipe_version_history: {
        Args: { p_recipe_id: string };
        Returns: {
          created_at: string;
          created_by: string;
          created_by_name: string;
          is_current: boolean;
          version_id: string;
          version_number: number;
        }[];
      };
      get_untagged_recipes: {
        Args: { batch_size?: number };
        Returns: {
          household_id: string;
          ingredients_json: Json;
          recipe_id: string;
          steps_json: Json;
          title: string;
          version_id: string;
        }[];
      };
      get_user_household_id: { Args: never; Returns: string };
      get_user_household_role: { Args: never; Returns: string };
      get_user_id_from_imports_path: { Args: { path: string }; Returns: string };
      get_user_profile_id: { Args: never; Returns: string };
      is_household_admin: { Args: never; Returns: boolean };
      is_household_admin_of: {
        Args: { household_id: string };
        Returns: boolean;
      };
      is_imports_path: { Args: { path: string }; Returns: boolean };
      migrate_recipe_tags_to_normalized: { Args: never; Returns: undefined };
      process_batch_tag_suggestions: { Args: never; Returns: undefined };
      recipe_belongs_to_household: {
        Args: { household_id: string; recipe_id: string };
        Returns: boolean;
      };
      search_recipes: {
        Args: { p_household_id: string; p_query: string };
        Returns: {
          created_at: string;
          created_by: string;
          current_version_id: string;
          description: string;
          household_id: string;
          id: string;
          last_cooked_at: string;
          rank: number;
          rolling_score: number;
          title: string;
          updated_at: string;
        }[];
      };
      update_recipe_create_version: {
        Args: {
          p_cook_time_minutes: number;
          p_cuisine?: Database['public']['Enums']['cuisine_type'];
          p_description: string;
          p_ingredients_json: Json;
          p_key_ingredients?: string[];
          p_meal_type?: Database['public']['Enums']['meal_type'];
          p_notes: string;
          p_prep_time_minutes: number;
          p_priority?: number;
          p_recipe_id: string;
          p_servings: number;
          p_steps_json: Json;
          p_title: string;
          p_user_id: string;
        };
        Returns: string;
      };
      user_belongs_to_household: {
        Args: { household_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      cooking_method:
        | 'quick'
        | 'slow_cook'
        | 'instant_pot'
        | 'bake'
        | 'grill'
        | 'stovetop'
        | 'air_fryer'
        | 'no_cook';
      cuisine_type:
        | 'african'
        | 'american'
        | 'asian'
        | 'brazilian'
        | 'breakfast'
        | 'chinese'
        | 'dessert'
        | 'french'
        | 'german'
        | 'greek'
        | 'hungarian'
        | 'indian'
        | 'italian'
        | 'japanese'
        | 'korean'
        | 'mediterranean'
        | 'mexican'
        | 'middle_eastern'
        | 'pastry'
        | 'persian'
        | 'peruvian'
        | 'salad'
        | 'sauce'
        | 'seafood'
        | 'spanish'
        | 'staple'
        | 'thai'
        | 'vegetable'
        | 'vietnamese';
      dietary_category:
        | 'vegetarian'
        | 'vegan'
        | 'gluten_free'
        | 'dairy_free'
        | 'keto'
        | 'paleo'
        | 'low_carb'
        | 'low_fat'
        | 'high_protein'
        | 'pescatarian';
      dish_category: 'main' | 'side' | 'appetizer' | 'soup' | 'salad' | 'bread' | 'condiment';
      meal_request_status: 'open' | 'planned' | 'dismissed';
      meal_type: 'main_dish' | 'side_dish' | 'breakfast' | 'dessert' | 'snack' | 'beverage';
      queue_status: 'queued' | 'cooking' | 'cooked';
      recipe_status: 'suggested' | 'to_buy' | 'to_cook' | 'cooked';
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
    Enums: {
      cooking_method: [
        'quick',
        'slow_cook',
        'instant_pot',
        'bake',
        'grill',
        'stovetop',
        'air_fryer',
        'no_cook',
      ],
      cuisine_type: [
        'african',
        'american',
        'asian',
        'brazilian',
        'breakfast',
        'chinese',
        'dessert',
        'french',
        'german',
        'greek',
        'hungarian',
        'indian',
        'italian',
        'japanese',
        'korean',
        'mediterranean',
        'mexican',
        'middle_eastern',
        'pastry',
        'persian',
        'peruvian',
        'salad',
        'sauce',
        'seafood',
        'spanish',
        'staple',
        'thai',
        'vegetable',
        'vietnamese',
      ],
      dietary_category: [
        'vegetarian',
        'vegan',
        'gluten_free',
        'dairy_free',
        'keto',
        'paleo',
        'low_carb',
        'low_fat',
        'high_protein',
        'pescatarian',
      ],
      dish_category: ['main', 'side', 'appetizer', 'soup', 'salad', 'bread', 'condiment'],
      meal_request_status: ['open', 'planned', 'dismissed'],
      meal_type: ['main_dish', 'side_dish', 'breakfast', 'dessert', 'snack', 'beverage'],
      queue_status: ['queued', 'cooking', 'cooked'],
      recipe_status: ['suggested', 'to_buy', 'to_cook', 'cooked'],
    },
  },
} as const;

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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_feed: {
        Row: {
          action: string
          created_at: string
          household_id: string
          id: string
          module: string
          payload: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          household_id: string
          id?: string
          module: string
          payload?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          household_id?: string
          id?: string
          module?: string
          payload?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_feed_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      app_shortcuts: {
        Row: {
          created_at: string
          household_id: string
          icon: string | null
          id: string
          label: string
          module: string | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          household_id: string
          icon?: string | null
          id?: string
          label: string
          module?: string | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          household_id?: string
          icon?: string | null
          id?: string
          label?: string
          module?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_shortcuts_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          class_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          external_id: string | null
          grade: number | null
          grade_scale: string | null
          household_id: string
          id: string
          notes: string | null
          provider: string
          status: string
          title: string
          user_id: string
          weight_pct: number | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          external_id?: string | null
          grade?: number | null
          grade_scale?: string | null
          household_id: string
          id?: string
          notes?: string | null
          provider?: string
          status?: string
          title: string
          user_id: string
          weight_pct?: number | null
        }
        Update: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          external_id?: string | null
          grade?: number | null
          grade_scale?: string | null
          household_id?: string
          id?: string
          notes?: string | null
          provider?: string
          status?: string
          title?: string
          user_id?: string
          weight_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "school_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_statements: {
        Row: {
          account_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          statement_month: string
          uploaded_by: string
        }
        Insert: {
          account_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          statement_month: string
          uploaded_by: string
        }
        Update: {
          account_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          statement_month?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_statements_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "budget_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_accounts: {
        Row: {
          balance: number
          created_at: string
          created_by: string
          currency: string
          household_id: string
          id: string
          is_shared: boolean
          last_synced_at: string | null
          name: string
          plaid_account_id: string | null
          plaid_item_id: string | null
          type: string
        }
        Insert: {
          balance?: number
          created_at?: string
          created_by: string
          currency?: string
          household_id: string
          id?: string
          is_shared?: boolean
          last_synced_at?: string | null
          name: string
          plaid_account_id?: string | null
          plaid_item_id?: string | null
          type: string
        }
        Update: {
          balance?: number
          created_at?: string
          created_by?: string
          currency?: string
          household_id?: string
          id?: string
          is_shared?: boolean
          last_synced_at?: string | null
          name?: string
          plaid_account_id?: string | null
          plaid_item_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_accounts_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_categories: {
        Row: {
          color: string | null
          created_at: string
          household_id: string
          icon: string | null
          id: string
          is_income: boolean
          monthly_limit: number | null
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          household_id: string
          icon?: string | null
          id?: string
          is_income?: boolean
          monthly_limit?: number | null
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          household_id?: string
          icon?: string | null
          id?: string
          is_income?: boolean
          monthly_limit?: number | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_categories_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      certs_goals: {
        Row: {
          created_at: string
          exam_date: string | null
          household_id: string
          id: string
          name: string
          notes: string | null
          progress_pct: number
          status: string
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exam_date?: string | null
          household_id: string
          id?: string
          name: string
          notes?: string | null
          progress_pct?: number
          status?: string
          target_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exam_date?: string | null
          household_id?: string
          id?: string
          name?: string
          notes?: string | null
          progress_pct?: number
          status?: string
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certs_goals_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      ctf_progress: {
        Row: {
          attempted_at: string
          category: string | null
          challenge_name: string | null
          event_name: string
          household_id: string
          id: string
          notes: string | null
          points: number | null
          solved: boolean
          user_id: string
          writeup_url: string | null
        }
        Insert: {
          attempted_at?: string
          category?: string | null
          challenge_name?: string | null
          event_name: string
          household_id: string
          id?: string
          notes?: string | null
          points?: number | null
          solved?: boolean
          user_id: string
          writeup_url?: string | null
        }
        Update: {
          attempted_at?: string
          category?: string | null
          challenge_name?: string | null
          event_name?: string
          household_id?: string
          id?: string
          notes?: string | null
          points?: number | null
          solved?: boolean
          user_id?: string
          writeup_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ctf_progress_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      devotional_plans: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          household_id: string
          id: string
          start_date: string | null
          title: string
          total_days: number
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          household_id: string
          id?: string
          start_date?: string | null
          title: string
          total_days: number
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          household_id?: string
          id?: string
          start_date?: string | null
          title?: string
          total_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "devotional_plans_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      devotional_progress: {
        Row: {
          completed_at: string | null
          day_number: number
          id: string
          notes: string | null
          plan_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          day_number: number
          id?: string
          notes?: string | null
          plan_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          day_number?: number
          id?: string
          notes?: string | null
          plan_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "devotional_progress_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "devotional_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          created_by: string | null
          equipment: string | null
          household_id: string | null
          id: string
          is_custom: boolean
          muscle_group: string | null
          name: string
          notes: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          equipment?: string | null
          household_id?: string | null
          id?: string
          is_custom?: boolean
          muscle_group?: string | null
          name: string
          notes?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          equipment?: string | null
          household_id?: string | null
          id?: string
          is_custom?: boolean
          muscle_group?: string | null
          name?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      food_entries: {
        Row: {
          brand: string | null
          calories: number
          carbs_g: number | null
          created_at: string
          entry_date: string
          fat_g: number | null
          fiber_g: number | null
          food_name: string
          household_id: string
          id: string
          meal_type: string
          protein_g: number | null
          serving_size: number | null
          serving_unit: string | null
          sodium_mg: number | null
          user_id: string
        }
        Insert: {
          brand?: string | null
          calories: number
          carbs_g?: number | null
          created_at?: string
          entry_date?: string
          fat_g?: number | null
          fiber_g?: number | null
          food_name: string
          household_id: string
          id?: string
          meal_type: string
          protein_g?: number | null
          serving_size?: number | null
          serving_unit?: string | null
          sodium_mg?: number | null
          user_id: string
        }
        Update: {
          brand?: string | null
          calories?: number
          carbs_g?: number | null
          created_at?: string
          entry_date?: string
          fat_g?: number | null
          fiber_g?: number | null
          food_name?: string
          household_id?: string
          id?: string
          meal_type?: string
          protein_g?: number | null
          serving_size?: number | null
          serving_unit?: string | null
          sodium_mg?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_entries_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      health_metrics: {
        Row: {
          active_minutes: number | null
          calories_burned: number | null
          created_at: string
          heart_rate_avg: number | null
          household_id: string
          id: string
          metric_date: string
          sleep_hours: number | null
          source: string
          steps: number | null
          user_id: string
        }
        Insert: {
          active_minutes?: number | null
          calories_burned?: number | null
          created_at?: string
          heart_rate_avg?: number | null
          household_id: string
          id?: string
          metric_date: string
          sleep_hours?: number | null
          source: string
          steps?: number | null
          user_id: string
        }
        Update: {
          active_minutes?: number | null
          calories_burned?: number | null
          created_at?: string
          heart_rate_avg?: number | null
          household_id?: string
          id?: string
          metric_date?: string
          sleep_hours?: number | null
          source?: string
          steps?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_metrics_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_members: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          household_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string | null
          household_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          display_name?: string | null
          household_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          id: string
          invite_code: string
          invite_expires_at: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code: string
          invite_expires_at?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string
          invite_expires_at?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      integration_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string | null
          id: string
          metadata: Json | null
          provider: string
          refresh_token: string | null
          scope: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          provider: string
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          provider?: string
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      item_history: {
        Row: {
          action: string
          created_at: string
          household_id: string | null
          id: string
          item_id: string | null
          reason: string | null
          snapshot: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          household_id?: string | null
          id?: string
          item_id?: string | null
          reason?: string | null
          snapshot?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          household_id?: string | null
          id?: string
          item_id?: string | null
          reason?: string | null
          snapshot?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_history_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_history_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "pantry_items"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          applied_at: string | null
          company: string
          created_at: string
          household_id: string
          id: string
          lead_id: string | null
          next_action: string | null
          next_action_date: string | null
          notes: string | null
          role_title: string
          status: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          company: string
          created_at?: string
          household_id: string
          id?: string
          lead_id?: string | null
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          role_title: string
          status?: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          applied_at?: string | null
          company?: string
          created_at?: string
          household_id?: string
          id?: string
          lead_id?: string | null
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          role_title?: string
          status?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "job_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      job_leads: {
        Row: {
          company: string
          created_at: string
          household_id: string
          id: string
          match_score: number | null
          notes: string | null
          role_title: string
          source: string | null
          tags: string[] | null
          url: string | null
          user_id: string
        }
        Insert: {
          company: string
          created_at?: string
          household_id: string
          id?: string
          match_score?: number | null
          notes?: string | null
          role_title: string
          source?: string | null
          tags?: string[] | null
          url?: string | null
          user_id: string
        }
        Update: {
          company?: string
          created_at?: string
          household_id?: string
          id?: string
          match_score?: number | null
          notes?: string | null
          role_title?: string
          source?: string | null
          tags?: string[] | null
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_leads_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          body: string
          created_at: string
          entry_date: string
          household_id: string
          id: string
          is_private: boolean
          mood: string | null
          tags: string[] | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          entry_date?: string
          household_id: string
          id?: string
          is_private?: boolean
          mood?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          entry_date?: string
          household_id?: string
          id?: string
          is_private?: boolean
          mood?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          created_at: string
          household_id: string
          id: string
          ingredients: string[] | null
          instructions: string | null
          meal_type: string
          notes: string | null
          planned_date: string
          recipe_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          ingredients?: string[] | null
          instructions?: string | null
          meal_type: string
          notes?: string | null
          planned_date: string
          recipe_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          ingredients?: string[] | null
          instructions?: string | null
          meal_type?: string
          notes?: string | null
          planned_date?: string
          recipe_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_goals: {
        Row: {
          calories_goal: number | null
          carbs_g: number | null
          fat_g: number | null
          fiber_g: number | null
          household_id: string
          id: string
          protein_g: number | null
          updated_at: string
          user_id: string
          water_ml: number | null
        }
        Insert: {
          calories_goal?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          fiber_g?: number | null
          household_id: string
          id?: string
          protein_g?: number | null
          updated_at?: string
          user_id: string
          water_ml?: number | null
        }
        Update: {
          calories_goal?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          fiber_g?: number | null
          household_id?: string
          id?: string
          protein_g?: number | null
          updated_at?: string
          user_id?: string
          water_ml?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_goals_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      pantry_items: {
        Row: {
          barcode: string | null
          category: string | null
          created_at: string
          expiration_date: string | null
          household_id: string | null
          id: string
          name: string
          price: number | null
          quantity: number | null
          store: string | null
          unit: string | null
          user_id: string
        }
        Insert: {
          barcode?: string | null
          category?: string | null
          created_at?: string
          expiration_date?: string | null
          household_id?: string | null
          id?: string
          name: string
          price?: number | null
          quantity?: number | null
          store?: string | null
          unit?: string | null
          user_id: string
        }
        Update: {
          barcode?: string | null
          category?: string | null
          created_at?: string
          expiration_date?: string | null
          household_id?: string | null
          id?: string
          name?: string
          price?: number | null
          quantity?: number | null
          store?: string | null
          unit?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pantry_items_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_requests: {
        Row: {
          answered_at: string | null
          body: string | null
          created_at: string
          household_id: string
          id: string
          is_answered: boolean
          is_private: boolean
          title: string
          user_id: string
        }
        Insert: {
          answered_at?: string | null
          body?: string | null
          created_at?: string
          household_id: string
          id?: string
          is_answered?: boolean
          is_private?: boolean
          title: string
          user_id: string
        }
        Update: {
          answered_at?: string | null
          body?: string | null
          created_at?: string
          household_id?: string
          id?: string
          is_answered?: boolean
          is_private?: boolean
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayer_requests_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_recipes: {
        Row: {
          created_at: string
          household_id: string
          id: string
          ingredients: string[] | null
          instructions: string | null
          notes: string | null
          recipe_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          ingredients?: string[] | null
          instructions?: string | null
          notes?: string | null
          recipe_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          ingredients?: string[] | null
          instructions?: string | null
          notes?: string | null
          recipe_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_recipes_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      school_classes: {
        Row: {
          color: string | null
          created_at: string
          household_id: string
          id: string
          instructor: string | null
          name: string
          semester: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          household_id: string
          id?: string
          instructor?: string | null
          name: string
          semester?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          household_id?: string
          id?: string
          instructor?: string | null
          name?: string
          semester?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_classes_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      scripture_notes: {
        Row: {
          body: string | null
          created_at: string
          household_id: string
          id: string
          is_private: boolean
          reference: string
          tags: string[] | null
          translation: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          household_id: string
          id?: string
          is_private?: boolean
          reference: string
          tags?: string[] | null
          translation?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          household_id?: string
          id?: string
          is_private?: boolean
          reference?: string
          tags?: string[] | null
          translation?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scripture_notes_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      session_exercises: {
        Row: {
          distance_m: number | null
          duration_s: number | null
          exercise_id: string
          id: string
          notes: string | null
          reps: number | null
          session_id: string
          set_number: number
          weight_kg: number | null
        }
        Insert: {
          distance_m?: number | null
          duration_s?: number | null
          exercise_id: string
          id?: string
          notes?: string | null
          reps?: number | null
          session_id: string
          set_number: number
          weight_kg?: number | null
        }
        Update: {
          distance_m?: number | null
          duration_s?: number | null
          exercise_id?: string
          id?: string
          notes?: string | null
          reps?: number | null
          session_id?: string
          set_number?: number
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "session_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_suggestions: {
        Row: {
          added_by: string | null
          category: string | null
          created_at: string
          household_id: string | null
          id: string
          is_checked: boolean
          name: string
        }
        Insert: {
          added_by?: string | null
          category?: string | null
          created_at?: string
          household_id?: string | null
          id?: string
          is_checked?: boolean
          name: string
        }
        Update: {
          added_by?: string | null
          category?: string | null
          created_at?: string
          household_id?: string | null
          id?: string
          is_checked?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_suggestions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      skills_tracked: {
        Row: {
          category: string | null
          household_id: string
          id: string
          name: string
          notes: string | null
          proficiency: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          household_id: string
          id?: string
          name: string
          notes?: string | null
          proficiency?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          household_id?: string
          id?: string
          name?: string
          notes?: string | null
          proficiency?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_tracked_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          created_at: string
          duration_minutes: number | null
          ended_at: string | null
          household_id: string
          id: string
          notes: string | null
          resource: string | null
          started_at: string
          topic: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          household_id: string
          id?: string
          notes?: string | null
          resource?: string | null
          started_at?: string
          topic: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          household_id?: string
          id?: string
          notes?: string | null
          resource?: string | null
          started_at?: string
          topic?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          category: string | null
          category_id: string | null
          created_at: string
          description: string
          emotion: string | null
          household_id: string
          id: string
          is_recurring: boolean
          is_transfer: boolean
          merchant: string | null
          notes: string | null
          recurrence_rule: string | null
          transaction_date: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          category?: string | null
          category_id?: string | null
          created_at?: string
          description: string
          emotion?: string | null
          household_id: string
          id?: string
          is_recurring?: boolean
          is_transfer?: boolean
          merchant?: string | null
          notes?: string | null
          recurrence_rule?: string | null
          transaction_date?: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          category?: string | null
          category_id?: string | null
          created_at?: string
          description?: string
          emotion?: string | null
          household_id?: string
          id?: string
          is_recurring?: boolean
          is_transfer?: boolean
          merchant?: string | null
          notes?: string | null
          recurrence_rule?: string | null
          transaction_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "budget_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "budget_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      webauthn_challenges: {
        Row: {
          challenge: string
          created_at: string | null
          expires_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          challenge: string
          created_at?: string | null
          expires_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          challenge?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      webauthn_credentials: {
        Row: {
          backed_up: boolean | null
          counter: number
          created_at: string | null
          credential_id: string
          device_name: string | null
          id: string
          last_used_at: string | null
          public_key: string
          transports: string | null
          user_id: string
        }
        Insert: {
          backed_up?: boolean | null
          counter?: number
          created_at?: string | null
          credential_id: string
          device_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          transports?: string | null
          user_id: string
        }
        Update: {
          backed_up?: boolean | null
          counter?: number
          created_at?: string | null
          credential_id?: string
          device_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          transports?: string | null
          user_id?: string
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          duration_minutes: number | null
          ended_at: string | null
          household_id: string
          id: string
          notes: string | null
          started_at: string
          title: string | null
          user_id: string
        }
        Insert: {
          duration_minutes?: number | null
          ended_at?: string | null
          household_id: string
          id?: string
          notes?: string | null
          started_at?: string
          title?: string | null
          user_id: string
        }
        Update: {
          duration_minutes?: number | null
          ended_at?: string | null
          household_id?: string
          id?: string
          notes?: string | null
          started_at?: string
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_activity: { Args: never; Returns: undefined }
      create_household: {
        Args: {
          p_display_name?: string
          p_invite_code: string
          p_invite_expires_at: string
          p_name: string
        }
        Returns: {
          created_at: string
          id: string
          invite_code: string
          invite_expires_at: string
          name: string
          owner_id: string
        }
        SetofOptions: {
          from: "*"
          to: "households"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      debug_auth_uid: { Args: never; Returns: Json }
      join_household: { Args: { p_invite_code: string }; Returns: string }
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

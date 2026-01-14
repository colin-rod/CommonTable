// Supabase-generated types will go here
// For now, placeholder types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {};
    Views: {};
    Functions: {};
    Enums: {};
  };
}

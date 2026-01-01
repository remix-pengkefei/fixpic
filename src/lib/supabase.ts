import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Auth features will be disabled.')
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      processing_history: {
        Row: {
          id: string
          user_id: string
          tool_type: string
          original_filename: string
          original_size: number
          result_size: number | null
          status: string
          created_at: string
          metadata: Record<string, unknown> | null
        }
        Insert: {
          id?: string
          user_id: string
          tool_type: string
          original_filename: string
          original_size: number
          result_size?: number | null
          status?: string
          created_at?: string
          metadata?: Record<string, unknown> | null
        }
        Update: {
          status?: string
          result_size?: number | null
          metadata?: Record<string, unknown> | null
        }
      }
    }
  }
}

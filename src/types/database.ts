// src/types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

// ── DATA UNDANGAN ─────────────────────────────────────────
export interface InvitationData {
  groomName: string
  brideName: string
  groomFather?: string
  groomMother?: string
  brideFather?: string
  brideMother?: string
  akadDate: string           // format: YYYY-MM-DD
  akadTime: string           // format: HH:MM
  resepsiDate: string
  resepsiTime: string
  venue: string
  address: string
  mapsUrl?: string
  photoUrl?: string          // URL dari Supabase Storage
  photos?: string[]          // Galeri foto pengantin
  musicUrl?: string
  quranVerse?: string        // mis: "QS. Ar-Rum: 21"
  openingText?: string
  colorScheme?: string       // hex color untuk tema
}

export type ThemeId = 'floral' | 'modern' | 'klasik'
export type AttendanceStatus = 'hadir' | 'tidak_hadir' | 'belum_konfirmasi'
export type OrderStatus = 'pending' | 'paid' | 'expired' | 'cancelled'
export type UserPlan = 'free' | 'pro'

// ── DATABASE TYPES (dari Supabase) ────────────────────────
// Relationships: [] diperlukan agar Supabase v2 typed client bisa resolve generic-nya
export interface Database {
  public: {
    Tables: {
      invitations: {
        Row: {
          id: string
          user_id: string
          slug: string
          theme_id: ThemeId
          is_active: boolean
          expires_at: string | null
          created_at: string
          updated_at: string
          data: InvitationData
        }
        Insert: {
          user_id: string
          slug: string
          theme_id: ThemeId
          is_active: boolean
          expires_at?: string | null
          data: InvitationData
        }
        Update: {
          slug?: string
          theme_id?: ThemeId
          is_active?: boolean
          expires_at?: string | null
          data?: InvitationData
          updated_at?: string
        }
        Relationships: []
      }
      guests: {
        Row: {
          id: string
          invitation_id: string
          name: string
          phone: string | null
          attendance: AttendanceStatus
          message: string | null
          created_at: string
        }
        Insert: {
          invitation_id: string
          name: string
          phone?: string | null
          attendance: AttendanceStatus
          message?: string | null
        }
        Update: {
          invitation_id?: string
          name?: string
          phone?: string | null
          attendance?: AttendanceStatus
          message?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          user_id: string
          invitation_id: string | null
          amount: number
          status: OrderStatus
          midtrans_id: string | null
          snap_token: string | null
          expires_at: string | null
          paid_at: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          invitation_id?: string | null
          amount: number
          status: OrderStatus
          midtrans_id?: string | null
          snap_token?: string | null
          expires_at?: string | null
          paid_at?: string | null
        }
        Update: {
          status?: OrderStatus
          midtrans_id?: string | null
          snap_token?: string | null
          expires_at?: string | null
          paid_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          plan: UserPlan
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          plan?: UserPlan
        }
        Update: {
          full_name?: string | null
          plan?: UserPlan
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      attendance_status: AttendanceStatus
      order_status: OrderStatus
      user_plan: UserPlan
    }
    CompositeTypes: Record<string, never>
  }
}

// ── SHORTHAND TYPES ───────────────────────────────────────
export type Invitation = Database['public']['Tables']['invitations']['Row']
export type Guest      = Database['public']['Tables']['guests']['Row']
export type Order      = Database['public']['Tables']['orders']['Row']
export type Profile    = Database['public']['Tables']['profiles']['Row']

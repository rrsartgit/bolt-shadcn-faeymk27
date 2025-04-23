export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      stations: {
        Row: {
          id: string
          name: string
          address: string
          phone: string
          latitude: number
          longitude: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          phone: string
          latitude: number
          longitude: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          phone?: string
          latitude?: number
          longitude?: number
          created_at?: string
        }
      }
      bikes: {
        Row: {
          id: string
          station_id: string
          status: 'available' | 'reserved' | 'in_use' | 'maintenance'
          created_at: string
        }
        Insert: {
          id?: string
          station_id: string
          status?: 'available' | 'reserved' | 'in_use' | 'maintenance'
          created_at?: string
        }
        Update: {
          id?: string
          station_id?: string
          status?: 'available' | 'reserved' | 'in_use' | 'maintenance'
          created_at?: string
        }
      }
      reservations: {
        Row: {
          id: string
          user_id: string
          bike_id: string
          start_time: string
          end_time: string
          status: 'pending' | 'active' | 'completed' | 'cancelled'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bike_id: string
          start_time: string
          end_time: string
          status?: 'pending' | 'active' | 'completed' | 'cancelled'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bike_id?: string
          start_time?: string
          end_time?: string
          status?: 'pending' | 'active' | 'completed' | 'cancelled'
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          reservation_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          reservation_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          reservation_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          reservation_id: string
          amount: number
          currency: string
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          stripe_payment_intent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reservation_id: string
          amount: number
          currency?: string
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          stripe_payment_intent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          reservation_id?: string
          amount?: number
          currency?: string
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          stripe_payment_intent_id?: string | null
          created_at?: string
        }
      }
    }
  }
}
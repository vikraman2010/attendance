import { createClient } from '@supabase/supabase-js'
import { SUPABASE_CONFIG } from '../config/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_CONFIG.url
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_CONFIG.anonKey

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Student {
  id: string
  name: string
  roll_no: string
  course: string
  created_at: string
  updated_at: string
}

export interface Attendance {
  id: string
  student_id: string
  date: string
  status: 'present' | 'absent' | 'late'
  face_verified: boolean
  webauthn_verified: boolean
  geofence_verified: boolean
  created_at: string
}

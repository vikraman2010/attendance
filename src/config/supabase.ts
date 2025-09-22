// Supabase Configuration
// For demo purposes, using mock configuration
export const SUPABASE_CONFIG = {
  url: 'https://jtuhxexvoskpwhdrmcmm.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0dWh4ZXh2b3NrcHdoZHJtY21tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1ODAyODcsImV4cCI6MjA3MzE1NjI4N30.nZGMTng_Is0rYbkoDmgzsImegGalHWhB8IDDoJy_-Fk'
}

// Instructions for setup:
// 1. Go to https://supabase.com and create a new project
// 2. Copy your project URL and anon key from the project settings
// 3. Replace the values above with your actual credentials
// 4. Create the following tables in your Supabase database:

/*
-- Students table
CREATE TABLE students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  roll_no TEXT UNIQUE NOT NULL,
  course TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance table
CREATE TABLE attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('present', 'absent', 'late')) DEFAULT 'present',
  face_verified BOOLEAN DEFAULT FALSE,
  webauthn_verified BOOLEAN DEFAULT FALSE,
  geofence_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- Insert sample student data
INSERT INTO students (name, roll_no, course) VALUES 
('Vikram', 'CS21B001', 'Computer Science');
*/


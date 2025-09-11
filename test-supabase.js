// Simple test script to verify Supabase connection
// Run with: node test-supabase.js

import { createClient } from '@supabase/supabase-js';

// You can replace these with your actual values for testing
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      console.log('\n📋 Setup Checklist:');
      console.log('1. ✅ Supabase project created');
      console.log('2. ❌ Database tables created');
      console.log('3. ❌ API credentials configured');
      console.log('4. ❌ RLS policies set up');
      return;
    }
    
    console.log('✅ Connection successful!');
    console.log('📊 Sample data:', data);
    
    // Test attendance table
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .limit(1);
    
    if (attendanceError) {
      console.log('⚠️  Attendance table not accessible:', attendanceError.message);
    } else {
      console.log('✅ Attendance table accessible');
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

testConnection();


import { useState, useEffect } from 'react';
import { supabase, Student, Attendance } from '@/lib/supabase';

export const useStudent = (rollNo: string) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('roll_no', rollNo)
          .single();

        if (error) {
          console.error('Error fetching student:', error);
          setError('Student not found');
          // Fallback to default data if Supabase is not configured
          setStudent({
            id: '1',
            name: 'Vikram',
            roll_no: rollNo,
            course: 'Computer Science',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        } else {
          setStudent(data);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to fetch student data');
        // Fallback to default data
        setStudent({
          id: '1',
          name: 'Vikram',
          roll_no: rollNo,
          course: 'Computer Science',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [rollNo]);

  return { student, loading, error };
};

export const useAttendanceHistory = (studentId: string) => {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!studentId) return;

      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('attendance')
          .select('*')
          .eq('student_id', studentId)
          .order('date', { ascending: false });

        if (error) {
          console.error('Error fetching attendance:', error);
          setError('Failed to fetch attendance history');
          // Mock data for demonstration
          setAttendance([
            {
              id: '1',
              student_id: studentId,
              date: new Date().toISOString().split('T')[0],
              status: 'present',
              face_verified: true,
              webauthn_verified: true,
              geofence_verified: true,
              created_at: new Date().toISOString()
            }
          ]);
        } else {
          setAttendance(data || []);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to fetch attendance history');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [studentId]);

  return { attendance, loading, error };
};


import React, { useState, useEffect } from 'react';
import { User, Calendar, CheckCircle, Clock, MapPin, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeofenceStatus } from './GeofenceStatus';
import { WebAuthnButton } from './WebAuthnButton';
import { AttendanceHistory } from './AttendanceHistory';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services/auth';
import { useNavigate } from 'react-router-dom';

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [webauthnVerified, setWebauthnVerified] = useState(false);
  const [geofenceVerified, setGeofenceVerified] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [biometricExpiry, setBiometricExpiry] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Get current user from auth service
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    console.log('StudentDashboard: useEffect triggered');
    
    try {
      // Check for user and update state
      const currentUser = authService.getCurrentUser();
      console.log('StudentDashboard: Current user:', currentUser);
      
      if (!currentUser) {
        console.log('StudentDashboard: No user found, redirecting to login');
        navigate('/login', { replace: true });
        return;
      }
      
      setUser(currentUser);
      setError(null);
      
      // Simulate loading delay
      const timer = setTimeout(() => {
        console.log('StudentDashboard: Loading complete');
        setLoading(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    } catch (err) {
      console.error('StudentDashboard: Error in useEffect:', err);
      setError('Failed to load user data');
      setLoading(false);
    }
  }, [navigate]);

  const handleWebauthnVerified = () => {
    setWebauthnVerified(true);
    // Set 5-minute expiry for biometric authentication
    const expiryTime = Date.now() + (5 * 60 * 1000); // 5 minutes from now
    setBiometricExpiry(expiryTime);
    
    // Auto-expire after 5 minutes
    setTimeout(() => {
      setWebauthnVerified(false);
      setBiometricExpiry(null);
      toast({
        title: "Biometric Session Expired",
        description: "Please authenticate again to mark attendance.",
        variant: "destructive"
      });
    }, 5 * 60 * 1000);
  };

  const handleGeofenceVerified = (isWithin: boolean) => {
    setGeofenceVerified(isWithin);
  };

  const handleMarkAttendance = async () => {
    if (!user) return;

    try {
      // Mock attendance marking - in a real app, this would save to database
      const attendanceRecord = {
        user_id: user.id,
        employee_id: user.employeeId,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        status: 'present',
        webauthn_verified: webauthnVerified,
        geofence_verified: geofenceVerified,
        location: 'Coal Mine Site A' // Mock location
      };

      // Store in localStorage for demo purposes
      const existingRecords = JSON.parse(localStorage.getItem('attendance_records') || '[]');
      existingRecords.push(attendanceRecord);
      localStorage.setItem('attendance_records', JSON.stringify(existingRecords));

      setAttendanceMarked(true);
      toast({
        title: "Attendance Marked Successfully",
        description: `Present status recorded for ${new Date().toLocaleDateString()}`,
      });
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: "Error",
        description: "Failed to mark attendance. Please try again.",
        variant: "destructive"
      });
    }
  };

  const canMarkAttendance = webauthnVerified && geofenceVerified;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading student data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-white rounded"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">User not found</p>
          <button 
            onClick={() => navigate('/login', { replace: true })} 
            className="px-4 py-2 bg-primary text-white rounded"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  console.log('StudentDashboard: Rendering dashboard for user:', user);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Card className="p-6 attendance-card">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-1">{user.name}</h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span>Employee ID: {user.employeeId}</span>
                  <span>•</span>
                  <span>Role: {user.role}</span>
                </div>
              </div>
              <div className="text-right space-y-2">
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-lg font-semibold">{new Date().toLocaleDateString()}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await authService.signOut();
                    navigate('/login', { replace: true });
                  }}
                >
                  Logout
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="attendance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="attendance">Mark Attendance</TabsTrigger>
            <TabsTrigger value="history">Attendance History</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-6">
            {/* Status Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GeofenceStatus onStatusChange={setGeofenceVerified} />
              
              <WebAuthnButton
                userId={user.employeeId}
                userName={user.name}
                onAuthenticated={handleWebauthnVerified}
                disabled={attendanceMarked}
              />
            </div>

            {/* Attendance Button */}
            <Card className="p-6 attendance-card">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-6 mb-4">
                  <div className={`flex items-center gap-2 ${geofenceVerified ? 'text-success' : 'text-muted-foreground'}`}>
                    <MapPin className="w-5 h-5" />
                    <span>Location Verified</span>
                  </div>
                  <div className={`flex items-center gap-2 ${webauthnVerified ? 'text-success' : 'text-muted-foreground'}`}>
                    <Shield className="w-5 h-5" />
                    <span>Biometric Authenticated</span>
                    {biometricExpiry && webauthnVerified && (
                      <span className="text-xs text-muted-foreground ml-2">
                        (Expires in {Math.ceil((biometricExpiry - Date.now()) / 60000)}min)
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleMarkAttendance}
                  disabled={!canMarkAttendance || attendanceMarked}
                  variant={attendanceMarked ? "success" : "hero"}
                  size="xl"
                  className="w-full max-w-md"
                >
                  {attendanceMarked ? (
                    <><CheckCircle className="w-5 h-5" /> Attendance Marked</>
                  ) : (
                    <><Clock className="w-5 h-5" /> Mark Attendance</>
                  )}
                </Button>

                {!canMarkAttendance && !attendanceMarked && (
                  <p className="text-sm text-muted-foreground">
                    Complete location verification and biometric authentication to mark attendance
                  </p>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <AttendanceHistory studentId={user?.id || ''} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
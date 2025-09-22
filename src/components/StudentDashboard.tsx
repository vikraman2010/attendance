import React, { useState, useEffect } from 'react';
import { User, Calendar, CheckCircle, Clock, MapPin, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Header } from './Header';
import { Navigation } from './Navigation';
import { Breadcrumb } from './Breadcrumb';
import { LoadingSpinner } from './LoadingSpinner';
import { AttendanceHistory } from './AttendanceHistory';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services/auth';
import { useNavigate } from 'react-router-dom';

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isInGeofence, setIsInGeofence] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<'checking' | 'present' | 'absent'>('checking');
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Get current user from auth service
  const [user, setUser] = useState<any>(null);
  
  // Geofence center coordinates (updated to user's actual location)
  const GEOFENCE_CENTER = { lat: 10.4157, lng: 77.8992 }; // User's current location
  const GEOFENCE_RADIUS = 100; // 100 meters

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  // Auto mark attendance when in geofence
  const autoMarkAttendance = async (location: {lat: number, lng: number}) => {
    if (!user) return;

    try {
      const attendanceRecord = {
        user_id: user.id,
        student_id: user.employeeId,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        status: 'present',
        location: location,
        auto_marked: true
      };

      // Store in localStorage for demo purposes
      const existingRecords = JSON.parse(localStorage.getItem('attendance_records') || '[]');
      
      // Check if already marked today
      const today = new Date().toISOString().split('T')[0];
      const alreadyMarked = existingRecords.some((record: any) => 
        record.student_id === user.employeeId && record.date === today
      );

      if (!alreadyMarked) {
        existingRecords.push(attendanceRecord);
        localStorage.setItem('attendance_records', JSON.stringify(existingRecords));
        
        setAttendanceStatus('present');
        toast({
          title: "Attendance Auto-Marked",
          description: `Welcome ${user.name}! Your attendance has been automatically recorded.`,
        });
      }
    } catch (error) {
      console.error('Auto attendance marking failed:', error);
    }
  };

  // Initialize user and start location tracking
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
          navigate('/login', { replace: true });
          return;
        }
        
        setUser(currentUser);
        setError(null);
        
        // Start location tracking with better error handling
        if (navigator.geolocation) {
          let watchId: number;
          
          // First, try to get current position to check permissions
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log('Initial position obtained:', position);
              // If successful, start watching position
              watchId = navigator.geolocation.watchPosition(
                (position) => {
                  const { latitude, longitude, accuracy } = position.coords;
                  const location = { lat: latitude, lng: longitude };
                  setCurrentLocation(location);
                  
                  console.log(`Location updated: ${latitude}, ${longitude} (accuracy: ${accuracy}m)`);
                  
                  // Check if within geofence
                  const distance = calculateDistance(
                    latitude, longitude,
                    GEOFENCE_CENTER.lat, GEOFENCE_CENTER.lng
                  );
                  
                  const withinGeofence = distance <= GEOFENCE_RADIUS;
                  setIsInGeofence(withinGeofence);
                  
                  if (withinGeofence && attendanceStatus !== 'present') {
                    autoMarkAttendance(location);
                  } else if (!withinGeofence && attendanceStatus === 'checking') {
                    setAttendanceStatus('absent');
                  }
                  
                  setLocationError(null);
                },
                (error) => {
                  console.error('Watch position error:', error);
                  let errorMessage = 'Location access failed. ';
                  
                  switch (error.code) {
                    case error.PERMISSION_DENIED:
                      errorMessage += 'Please allow location access in your browser settings.';
                      break;
                    case error.POSITION_UNAVAILABLE:
                      errorMessage += 'Location information is unavailable.';
                      break;
                    case error.TIMEOUT:
                      errorMessage += 'Location request timed out. Retrying...';
                      break;
                    default:
                      errorMessage += 'Unknown error occurred.';
                      break;
                  }
                  
                  setLocationError(errorMessage);
                  setAttendanceStatus('absent');
                },
                {
                  enableHighAccuracy: true,
                  timeout: 15000,
                  maximumAge: 60000
                }
              );
              
              setLoading(false);
            },
            (error) => {
              console.error('Initial location error:', error);
              let errorMessage = 'Cannot access location. ';
              
              switch (error.code) {
                case error.PERMISSION_DENIED:
                  errorMessage += 'Location access denied. Please click the location icon in your browser address bar and allow location access.';
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMessage += 'Location services unavailable.';
                  break;
                case error.TIMEOUT:
                  errorMessage += 'Location request timed out.';
                  break;
                default:
                  errorMessage += 'Unknown location error.';
                  break;
              }
              
              setLocationError(errorMessage);
              setAttendanceStatus('absent');
              setLoading(false);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000
            }
          );
          
          // Return cleanup function
          return () => {
            if (watchId) {
              navigator.geolocation.clearWatch(watchId);
            }
          };
        } else {
          setLocationError('Geolocation is not supported by this browser.');
          setAttendanceStatus('absent');
          setLoading(false);
        }
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Failed to initialize application');
        setLoading(false);
      }
    };

    initializeApp();
  }, [navigate, attendanceStatus]);

  // Get attendance status for display
  const getAttendanceStatusInfo = () => {
    switch (attendanceStatus) {
      case 'present':
        return {
          status: 'Present',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          icon: CheckCircle
        };
      case 'absent':
        return {
          status: 'Not in Campus',
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          icon: AlertTriangle
        };
      default:
        return {
          status: 'Checking Location...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          icon: Clock
        };
    }
  };

  if (loading) {
    return (
      <LoadingSpinner 
        message="Loading student data..." 
        variant="fullscreen" 
        size="lg" 
      />
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Professional Header */}
      <Header 
        title="STUDENT ATTENDANCE DASHBOARD"
        subtitle="Student Attendance Portal"
        studentId={user.employeeId}
        showNotifications={true}
      />
      
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Navigation className="sticky top-6" />
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Breadcrumb */}
            <Breadcrumb />
            
            {/* User Info Card */}
            <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-1 text-gray-900">{user.name}</h2>
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <span className="font-medium">Student ID: {user.employeeId}</span>
                      <span>•</span>
                      <span className="font-medium">Department: Computer Science</span>
                      <span>•</span>
                      <span className="font-medium">Year: 3rd Year</span>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-sm text-muted-foreground">Session Active</p>
                    <p className="text-lg font-semibold text-green-600">Online</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await authService.signOut();
                        navigate('/login', { replace: true });
                      }}
                      className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                    >
                      Logout
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

        <Tabs defaultValue="attendance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="attendance">Mark Attendance</TabsTrigger>
            <TabsTrigger value="history">Attendance History</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-6">
            {/* Automatic Attendance Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Location Status Card */}
              <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isInGeofence ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <MapPin className={`w-6 h-6 ${
                        isInGeofence ? 'text-green-600' : 'text-red-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {isInGeofence ? 'Inside Campus' : 'Outside Campus'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {currentLocation ? 
                          `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}` : 
                          'Getting location...'
                        }
                      </p>
                    </div>
                    <Badge variant={isInGeofence ? 'default' : 'destructive'}>
                      {isInGeofence ? 'In Range' : 'Out of Range'}
                    </Badge>
                  </div>
                  
                  {currentLocation && (
                    <div className="text-sm text-muted-foreground">
                      <p>Distance from campus: {currentLocation ? 
                        Math.round(calculateDistance(
                          currentLocation.lat, currentLocation.lng,
                          GEOFENCE_CENTER.lat, GEOFENCE_CENTER.lng
                        )) : '---'
                      }m</p>
                      <p>Geofence radius: {GEOFENCE_RADIUS}m</p>
                    </div>
                  )}
                  
                  {locationError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm">{locationError}</span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Attendance Status Card */}
              <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
                <div className="p-6">
                  {(() => {
                    const statusInfo = getAttendanceStatusInfo();
                    const StatusIcon = statusInfo.icon;
                    return (
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${statusInfo.bgColor}`}>
                          <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{statusInfo.status}</h3>
                          <p className="text-sm text-muted-foreground">
                            {attendanceStatus === 'present' ? 'Automatically marked' : 
                             attendanceStatus === 'absent' ? 'Move closer to campus' : 
                             'Detecting your location...'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {navigator.onLine ? 
                            <Wifi className="w-4 h-4 text-green-600" /> : 
                            <WifiOff className="w-4 h-4 text-red-600" />
                          }
                          <span className="text-xs text-muted-foreground">
                            {navigator.onLine ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Attendance is automatically marked when you enter campus</p>
                    <p>• No manual check-in required</p>
                    <p>• Location tracking runs in background</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Today's Summary */}
            <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
              <div className="p-6">
                <h3 className="font-semibold text-lg mb-4">Today's Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {new Date().toLocaleDateString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Date</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {attendanceStatus === 'present' ? 'Present' : 'Pending'}
                    </div>
                    <div className="text-sm text-muted-foreground">Status</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {attendanceStatus === 'present' ? new Date().toLocaleTimeString() : '--:--'}
                    </div>
                    <div className="text-sm text-muted-foreground">Check-in Time</div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <AttendanceHistory studentId={user?.id || ''} />
          </TabsContent>
        </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};
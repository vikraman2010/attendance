import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Calendar,
  Users,
  TrendingUp,
  Navigation,
  Wifi,
  WifiOff,
  Fingerprint
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { attendanceService } from '@/utils/attendanceService';
import { periodManager } from '@/utils/periodManager';
import { ClassPeriod, PeriodStatus } from '@/types/periods';
import { BiometricPrompt } from '@/components/BiometricPrompt';
import { BiometricStatus } from '@/components/BiometricStatus';

interface AttendanceDashboardProps {
  studentId: string;
}

export const AttendanceDashboard: React.FC<AttendanceDashboardProps> = ({ studentId }) => {
  const [periodStatus, setPeriodStatus] = useState<PeriodStatus | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  const { toast } = useToast();
  const { 
    latitude, 
    longitude, 
    loading: geoLoading, 
    error: geoError,
    isInsideGeofence,
    distanceFromGeofence,
    hasActiveLocation
  } = useGeolocation();
  
  // Biometric authentication hook
  const biometric = useBiometricAuth({ 
    autoStart: true, 
    showToasts: true,
    requireReauth: true
  });

  // Update period status every minute
  useEffect(() => {
    const updateStatus = () => {
      const status = periodManager.getPeriodStatus();
      setPeriodStatus(status);
      
      const attendance = attendanceService.getTodayAttendanceSummary(studentId);
      setTodayAttendance(attendance);
      
      setLastUpdate(new Date());
    };

    updateStatus();
    const interval = setInterval(updateStatus, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [studentId]);

  const handleMarkAttendance = async () => {
    if (!periodStatus?.currentPeriod) {
      toast({
        title: "No Active Period",
        description: "There is no active period to mark attendance for.",
        variant: "destructive"
      });
      return;
    }

    // Check if biometric authentication is required and available
    if (biometric.isSupported && biometric.isRegistered && !biometric.isRecentlyAuthenticated(5)) {
      const authSuccess = await biometric.authenticate();
      if (!authSuccess) {
        toast({
          title: "Authentication Required",
          description: "Please complete biometric authentication to mark attendance.",
          variant: "destructive"
        });
        return;
      }
    }

    setIsMarkingAttendance(true);
    
    try {
      const result = await attendanceService.markAttendance(studentId);
      
      if (result.success) {
        toast({
          title: "Attendance Marked",
          description: result.message,
        });
        
        // Refresh attendance data
        const attendance = attendanceService.getTodayAttendanceSummary(studentId);
        setTodayAttendance(attendance);
      } else {
        toast({
          title: "Attendance Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark attendance. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsMarkingAttendance(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-500';
      case 'late': return 'bg-yellow-500';
      case 'absent': return 'bg-red-500';
      case 'current': return 'bg-blue-500';
      case 'upcoming': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="h-4 w-4" />;
      case 'late': return <AlertCircle className="h-4 w-4" />;
      case 'absent': return <XCircle className="h-4 w-4" />;
      case 'current': return <Clock className="h-4 w-4" />;
      case 'upcoming': return <Calendar className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (!periodStatus || !todayAttendance) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentPeriodAttendance = todayAttendance.periods.find(
    (p: any) => p.period.period === periodStatus.currentPeriod?.period
  );

  const attendanceStats = attendanceService.getAttendanceStats(studentId);

  return (
    <div className="space-y-6">
      {/* Biometric Authentication Prompt */}
      <BiometricPrompt
        isOpen={biometric.isPromptVisible}
        isAuthenticating={biometric.isAuthenticating}
        triggerEvent={biometric.currentTriggerEvent}
        onAuthenticate={biometric.authenticate}
        onDismiss={biometric.dismissPrompt}
      />
      {/* Current Status Card */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Current Status
              </CardTitle>
              <CardDescription>
                Last updated: {lastUpdate.toLocaleTimeString()}
              </CardDescription>
            </div>
            <Badge variant={periodStatus.isInActivePeriod ? "default" : "secondary"}>
              {periodStatus.isInActivePeriod ? "Active Period" : "Break Time"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {periodStatus.currentPeriod ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{periodStatus.currentPeriod.label}</h3>
                <span className="text-sm text-muted-foreground">
                  {periodStatus.currentPeriod.start_time} - {periodStatus.currentPeriod.end_time}
                </span>
              </div>
              
              {periodStatus.isInActivePeriod && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Period Progress</span>
                    <span>{formatTime(periodStatus.timeRemaining)} remaining</span>
                  </div>
                  <Progress 
                    value={periodManager.getPeriodProgress(periodStatus.currentPeriod)} 
                    className="h-2"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No active period</p>
              {periodStatus.nextPeriod && (
                <p className="text-sm">
                  Next: {periodStatus.nextPeriod.label} in {formatTime(periodStatus.timeUntilNext)}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Biometric Status Card */}
      <BiometricStatus showControls={true} />

      {/* Location Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasActiveLocation ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">
                {hasActiveLocation ? "Location tracking active" : "No location registered"}
              </span>
            </div>
            {geoLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            )}
          </div>

          {latitude && longitude && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>GPS Coordinates:</span>
                <span className="font-mono">{latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
              </div>
              
              {hasActiveLocation && (
                <div className="flex items-center justify-between text-sm">
                  <span>Geofence Status:</span>
                  <Badge variant={isInsideGeofence ? "default" : "destructive"}>
                    {isInsideGeofence ? "Inside" : `${distanceFromGeofence}m away`}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {geoError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">
                Location Error: {geoError.message}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance Action Card */}
      {periodStatus.isInActivePeriod && currentPeriodAttendance && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Mark Attendance
            </CardTitle>
            <CardDescription>
              {periodStatus.currentPeriod?.label} - {periodStatus.currentPeriod?.start_time} to {periodStatus.currentPeriod?.end_time}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentPeriodAttendance.record ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(currentPeriodAttendance.status)}
                  <span className="font-medium">
                    Attendance already marked as {currentPeriodAttendance.status}
                  </span>
                </div>
                {currentPeriodAttendance.record.checkInTime && (
                  <p className="text-sm text-muted-foreground">
                    Checked in at: {currentPeriodAttendance.record.checkInTime}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {currentPeriodAttendance.canMarkAttendance ? (
                  <div className="space-y-3">
                    {/* Biometric Status Indicator */}
                    {biometric.isSupported && biometric.isRegistered && (
                      <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-center gap-2">
                          <Fingerprint className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-800">
                            {biometric.isRecentlyAuthenticated(5) ? 'Biometric Verified' : 'Biometric Required'}
                          </span>
                        </div>
                        {biometric.lastAuthTime && (
                          <span className="text-xs text-green-600">
                            {biometric.lastAuthTime.toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <Button 
                      onClick={handleMarkAttendance}
                      disabled={isMarkingAttendance || !isInsideGeofence}
                      className="w-full"
                      size="lg"
                    >
                      {isMarkingAttendance ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Marking Attendance...
                        </>
                      ) : (
                        <>
                          <Navigation className="h-4 w-4 mr-2" />
                          Mark Attendance
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                    <p className="text-sm text-muted-foreground">
                      Attendance window is closed for this period
                    </p>
                  </div>
                )}

                {!isInsideGeofence && hasActiveLocation && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-700">
                      You must be within the geofenced area to mark attendance.
                      {distanceFromGeofence && ` You are ${distanceFromGeofence}m away.`}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Schedule
          </CardTitle>
          <CardDescription>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {todayAttendance.periods.map((periodData: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(periodData.status)}`}></div>
                  <div>
                    <p className="font-medium">{periodData.period.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {periodData.period.start_time} - {periodData.period.end_time}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(periodData.status)}
                  <Badge variant={periodData.status === 'present' ? "default" : 
                                 periodData.status === 'late' ? "secondary" :
                                 periodData.status === 'absent' ? "destructive" : "outline"}>
                    {periodData.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Attendance Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Attendance Statistics
          </CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{attendanceStats.presentCount}</p>
              <p className="text-sm text-muted-foreground">Present</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{attendanceStats.lateCount}</p>
              <p className="text-sm text-muted-foreground">Late</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{attendanceStats.absentCount}</p>
              <p className="text-sm text-muted-foreground">Absent</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{attendanceStats.attendanceRate.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Rate</p>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Streak:</span>
            <Badge variant="outline">
              {attendanceStats.currentStreak} days
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

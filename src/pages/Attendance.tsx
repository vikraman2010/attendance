import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Download, 
  Clock, 
  MapPin, 
  BarChart3,
  Settings,
  User
} from 'lucide-react';
import { Header } from '@/components/Header';
import { AttendanceDashboard } from '@/components/AttendanceDashboard';
import { AttendanceHistory } from '@/components/AttendanceHistory';
import { BiometricTestPanel } from '@/components/BiometricTestPanel';
import { attendanceService } from '@/utils/attendanceService';
import { useToast } from '@/hooks/use-toast';

const Attendance = () => {
  const [studentId, setStudentId] = useState('student_001'); // Default student ID
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const { toast } = useToast();

  const handleExportCSV = () => {
    try {
      const csvData = attendanceService.exportAttendanceCSV(
        studentId,
        exportStartDate || undefined,
        exportEndDate || undefined
      );
      
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-${studentId}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "Attendance data has been exported to CSV file.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export attendance data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getTodayStats = () => {
    const todayAttendance = attendanceService.getTodayAttendanceSummary(studentId);
    const presentCount = todayAttendance.periods.filter(p => p.status === 'present' || p.status === 'late').length;
    const totalPeriods = todayAttendance.periods.length;
    
    return {
      present: presentCount,
      total: totalPeriods,
      rate: totalPeriods > 0 ? (presentCount / totalPeriods) * 100 : 0
    };
  };

  const todayStats = getTodayStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Professional Header */}
      <Header 
        title="STUDENT ATTENDANCE DASHBOARD"
        subtitle="Advanced Location-Based Attendance System"
        studentId={studentId}
        showNotifications={true}
      />
      
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Quick Stats Banner */}
        <div className="mb-6">
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{todayStats.present}</div>
                    <div className="text-xs text-muted-foreground">Present Today</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{todayStats.total}</div>
                    <div className="text-xs text-muted-foreground">Total Periods</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{todayStats.rate.toFixed(0)}%</div>
                    <div className="text-xs text-muted-foreground">Attendance Rate</div>
                  </div>
                </div>
                <Badge 
                  variant={todayStats.rate >= 80 ? "default" : "destructive"} 
                  className="px-4 py-2 text-sm font-medium"
                >
                  {todayStats.rate >= 90 ? "Excellent" : 
                   todayStats.rate >= 80 ? "Good" : 
                   todayStats.rate >= 70 ? "Average" : "Needs Improvement"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <AttendanceDashboard studentId={studentId} />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <AttendanceHistory studentId={studentId} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Weekly Attendance Chart */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Weekly Attendance Trend
                </CardTitle>
                <CardDescription>
                  Attendance patterns over the last 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Chart visualization coming soon</p>
                    <p className="text-sm">Integration with charting library needed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Stats</CardTitle>
                <CardDescription>Current month performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  const stats = attendanceService.getAttendanceStats(studentId, 30);
                  return (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Attendance Rate</span>
                          <span className="font-medium">{stats.attendanceRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Present Days</span>
                          <span className="font-medium text-green-600">{stats.presentCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Late Days</span>
                          <span className="font-medium text-yellow-600">{stats.lateCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Absent Days</span>
                          <span className="font-medium text-red-600">{stats.absentCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Current Streak</span>
                          <Badge variant="outline">{stats.currentStreak} days</Badge>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Location Analytics */}
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location Analytics
                </CardTitle>
                <CardDescription>
                  Attendance location patterns and accuracy metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">98.5%</p>
                    <p className="text-sm text-muted-foreground">Location Accuracy</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-green-600">15m</p>
                    <p className="text-sm text-muted-foreground">Avg Distance</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">2.3s</p>
                    <p className="text-sm text-muted-foreground">Avg Check-in Time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Biometric Test Panel */}
            <BiometricTestPanel className="md:col-span-2" />
            {/* Student Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Student Settings
                </CardTitle>
                <CardDescription>
                  Configure student identification and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Enter student ID"
                  />
                </div>
                <Button className="w-full">
                  Update Student ID
                </Button>
              </CardContent>
            </Card>

            {/* Export Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Data
                </CardTitle>
                <CardDescription>
                  Export attendance records for reporting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleExportCSV} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export to CSV
                </Button>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure attendance reminders and alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Period Start Reminders</p>
                      <p className="text-sm text-muted-foreground">Get notified 5 minutes before each period</p>
                    </div>
                    <Badge variant="outline">Coming Soon</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Attendance Window Alerts</p>
                      <p className="text-sm text-muted-foreground">Alert when attendance window is closing</p>
                    </div>
                    <Badge variant="outline">Coming Soon</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Location Warnings</p>
                      <p className="text-sm text-muted-foreground">Warn when outside geofenced area</p>
                    </div>
                    <Badge variant="outline">Coming Soon</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default Attendance;

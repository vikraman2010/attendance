import React, { useState } from 'react';
import { User, Calendar, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeofenceStatus } from './GeofenceStatus';
import { FaceScanner } from './FaceScanner';
import { WebAuthnButton } from './WebAuthnButton';
import { AttendanceHistory } from './AttendanceHistory';
import { useToast } from '@/hooks/use-toast';

export const StudentDashboard: React.FC = () => {
  const [faceVerified, setFaceVerified] = useState(false);
  const [webauthnVerified, setWebauthnVerified] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const { toast } = useToast();

  // Mock student data
  const student = {
    name: "John Doe",
    rollNo: "CS21B001",
    course: "Computer Science",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
  };

  const handleFaceVerified = (confidence: number) => {
    setFaceVerified(true);
  };

  const handleWebauthnVerified = () => {
    setWebauthnVerified(true);
  };

  const handleMarkAttendance = () => {
    setAttendanceMarked(true);
    toast({
      title: "Attendance Marked",
      description: `Present status recorded for ${new Date().toLocaleDateString()}`,
    });
  };

  const canMarkAttendance = faceVerified && webauthnVerified;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Card className="p-6 attendance-card">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-primary/10">
                <img 
                  src={student.avatar} 
                  alt={student.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-1">{student.name}</h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span>Roll No: {student.rollNo}</span>
                  <span>•</span>
                  <span>{student.course}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-lg font-semibold">{new Date().toLocaleDateString()}</p>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <GeofenceStatus />
              
              <FaceScanner 
                onFaceVerified={handleFaceVerified}
                disabled={attendanceMarked}
              />
              
              <WebAuthnButton
                userId={student.rollNo}
                userName={student.name}
                onAuthenticated={handleWebauthnVerified}
                disabled={attendanceMarked}
              />
            </div>

            {/* Attendance Button */}
            <Card className="p-6 attendance-card">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className={`flex items-center gap-2 ${faceVerified ? 'text-success' : 'text-muted-foreground'}`}>
                    <CheckCircle className="w-5 h-5" />
                    <span>Face Verified</span>
                  </div>
                  <div className={`flex items-center gap-2 ${webauthnVerified ? 'text-success' : 'text-muted-foreground'}`}>
                    <CheckCircle className="w-5 h-5" />
                    <span>Device Authenticated</span>
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
                    Complete face verification and device authentication to mark attendance
                  </p>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <AttendanceHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
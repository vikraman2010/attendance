import React, { useState } from 'react';
import { Calendar, MapPin, Download, Filter, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAttendanceHistory } from '@/hooks/useStudent';

interface AttendanceRecord {
  id: string;
  date: string;
  time: string;
  status: 'Present' | 'Absent';
  location: {
    lat: number;
    lng: number;
    accuracy: number;
  };
  faceScore: number;
  webauthnVerified: boolean;
  deviceInfo: string;
}

// Mock data - in production, this would come from your backend
const mockAttendanceData: AttendanceRecord[] = [
  {
    id: '1',
    date: '2024-01-15',
    time: '09:15:23',
    status: 'Present',
    location: { lat: 40.7128, lng: -74.0060, accuracy: 5 },
    faceScore: 95.6,
    webauthnVerified: true,
    deviceInfo: 'Chrome/Windows',
  },
  {
    id: '2',
    date: '2024-01-14',
    time: '09:12:45',
    status: 'Present',
    location: { lat: 40.7128, lng: -74.0060, accuracy: 8 },
    faceScore: 92.3,
    webauthnVerified: true,
    deviceInfo: 'Chrome/Windows',
  },
  {
    id: '3',
    date: '2024-01-13',
    time: '09:18:12',
    status: 'Present',
    location: { lat: 40.7128, lng: -74.0060, accuracy: 4 },
    faceScore: 96.8,
    webauthnVerified: true,
    deviceInfo: 'Chrome/Windows',
  },
  {
    id: '4',
    date: '2024-01-12',
    time: '--:--:--',
    status: 'Absent',
    location: { lat: 0, lng: 0, accuracy: 0 },
    faceScore: 0,
    webauthnVerified: false,
    deviceInfo: 'N/A',
  },
];

interface AttendanceHistoryProps {
  studentId: string;
}

export const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({ studentId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { attendance, loading, error } = useAttendanceHistory(studentId);
  
  // Convert Supabase attendance data to the expected format
  const attendanceData: AttendanceRecord[] = attendance.map(record => ({
    id: record.id,
    date: record.date,
    time: record.created_at ? new Date(record.created_at).toLocaleTimeString() : '--:--:--',
    status: record.status === 'present' ? 'Present' : 'Absent',
    location: { lat: 40.7128, lng: -74.0060, accuracy: 5 }, // Mock location data
    faceScore: record.face_verified ? 95.6 : 0,
    webauthnVerified: record.webauthn_verified,
    deviceInfo: 'Chrome/Windows', // Mock device info
  }));

  const filteredData = attendanceData.filter(record =>
    record.date.includes(searchTerm) ||
    record.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Status', 'Location', 'Face Score', 'WebAuthn', 'Device'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(record => [
        record.date,
        record.time,
        record.status,
        `"${record.location.lat}, ${record.location.lng}"`,
        `${record.faceScore}%`,
        record.webauthnVerified ? 'Yes' : 'No',
        record.deviceInfo,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const presentCount = filteredData.filter(r => r.status === 'Present').length;
  const absentCount = filteredData.filter(r => r.status === 'Absent').length;
  const attendanceRate = filteredData.length > 0 ? (presentCount / filteredData.length) * 100 : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading attendance history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <XCircle className="w-12 h-12 text-error mx-auto mb-4" />
          <p className="text-error">Error loading attendance history</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 attendance-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-success">{presentCount}</p>
              <p className="text-sm text-muted-foreground">Days Present</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 attendance-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-error" />
            </div>
            <div>
              <p className="text-2xl font-bold text-error">{absentCount}</p>
              <p className="text-sm text-muted-foreground">Days Absent</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 attendance-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{attendanceRate.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Attendance Rate</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Controls */}
      <Card className="p-4 attendance-card">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by date or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </Card>

      {/* Attendance Table */}
      <Card className="attendance-card">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Attendance Records</h3>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Face Score</TableHead>
                  <TableHead>WebAuthn</TableHead>
                  <TableHead>Device</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {new Date(record.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{record.time}</TableCell>
                    <TableCell>
                      <span className={`status-pill ${
                        record.status === 'Present' ? 'success' : 'error'
                      }`}>
                        {record.status === 'Present' ? (
                          <><CheckCircle className="w-3 h-3" /> Present</>
                        ) : (
                          <><XCircle className="w-3 h-3" /> Absent</>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      {record.status === 'Present' ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {record.location.lat.toFixed(4)}, {record.location.lng.toFixed(4)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            (±{record.location.accuracy}m)
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.status === 'Present' ? (
                        <span className={`font-medium ${
                          record.faceScore >= 90 ? 'text-success' :
                          record.faceScore >= 70 ? 'text-warning' : 'text-error'
                        }`}>
                          {record.faceScore.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.status === 'Present' ? (
                        <span className={`status-pill ${
                          record.webauthnVerified ? 'success' : 'error'
                        }`}>
                          {record.webauthnVerified ? '✅ Verified' : '❌ Failed'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {record.deviceInfo}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No attendance records found</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
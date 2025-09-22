import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Download, Filter, CheckCircle, XCircle, ChevronLeft, ChevronRight, BarChart3, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { attendanceService, AttendanceRecord } from '@/utils/attendanceService';

interface PaginatedData {
  records: AttendanceRecord[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
}

interface MonthlyStats {
  month: number;
  monthName: string;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  attendanceRate: number;
  totalPeriods: number;
}


interface AttendanceHistoryProps {
  studentId: string;
}

export const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({ studentId }) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'monthly'>('table');
  const [paginatedData, setPaginatedData] = useState<PaginatedData | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [yearlyStats, setYearlyStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const recordsPerPage = 50;
  const availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    loadAttendanceData();
  }, [studentId, selectedYear, currentPage, searchTerm]);

  const loadAttendanceData = () => {
    setLoading(true);
    
    const startDate = `${selectedYear}-01-01`;
    const endDate = `${selectedYear}-12-31`;
    
    // Get paginated records
    const paginated = attendanceService.getPaginatedAttendance(
      studentId,
      startDate,
      endDate,
      currentPage,
      recordsPerPage
    );
    
    // Filter records based on search term
    if (searchTerm) {
      const filteredRecords = paginated.records.filter(record =>
        record.date.includes(searchTerm) ||
        record.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.periodLabel.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setPaginatedData({
        ...paginated,
        records: filteredRecords,
        totalRecords: filteredRecords.length
      });
    } else {
      setPaginatedData(paginated);
    }
    
    // Get yearly statistics
    const stats = attendanceService.getYearlyAttendanceStats(studentId, selectedYear);
    setYearlyStats(stats);
    
    // Get monthly breakdown
    const monthly = attendanceService.getMonthlyAttendanceSummary(studentId, selectedYear);
    setMonthlyStats(monthly);
    
    setLoading(false);
  };

  const exportToCSV = () => {
    const startDate = `${selectedYear}-01-01`;
    const endDate = `${selectedYear}-12-31`;
    
    const csvData = attendanceService.exportAttendanceCSV(studentId, startDate, endDate);
    
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${studentId}-${selectedYear}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'text-green-600';
      case 'late': return 'text-yellow-600';
      case 'absent': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present': return <Badge className="bg-green-100 text-green-800">Present</Badge>;
      case 'late': return <Badge className="bg-yellow-100 text-yellow-800">Late</Badge>;
      case 'absent': return <Badge className="bg-red-100 text-red-800">Absent</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading attendance history for {selectedYear}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Year Selection and View Mode */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Attendance History - {selectedYear}
              </CardTitle>
              <CardDescription>
                Complete attendance records and analytics
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="year-select">Year:</Label>
                <Select value={selectedYear.toString()} onValueChange={(value) => {
                  setSelectedYear(parseInt(value));
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  Table View
                </Button>
                <Button
                  variant={viewMode === 'monthly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('monthly')}
                >
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Monthly View
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      {yearlyStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{yearlyStats.presentCount}</p>
                  <p className="text-sm text-muted-foreground">Present</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{yearlyStats.lateCount}</p>
                  <p className="text-sm text-muted-foreground">Late</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{yearlyStats.absentCount}</p>
                  <p className="text-sm text-muted-foreground">Absent</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{yearlyStats.attendanceRate.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">Attendance Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Monthly View */}
      {viewMode === 'monthly' && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Breakdown - {selectedYear}</CardTitle>
            <CardDescription>Attendance statistics by month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monthlyStats.map((month) => (
                <Card key={month.month} className="border">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{month.monthName}</h4>
                        <Badge variant={month.attendanceRate >= 80 ? "default" : "destructive"}>
                          {month.attendanceRate.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-green-600">Present:</span>
                          <span>{month.presentCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-yellow-600">Late:</span>
                          <span>{month.lateCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-red-600">Absent:</span>
                          <span>{month.absentCount}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <>
          {/* Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-sm">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by date, status, or period..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Button onClick={exportToCSV} variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export {selectedYear} CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>
                {paginatedData ? `Showing ${paginatedData.records.length} of ${paginatedData.totalRecords} records` : 'Loading records...'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paginatedData && paginatedData.records.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Period</TableHead>
                          <TableHead>Check In</TableHead>
                          <TableHead>Check Out</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Location</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedData.records.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">
                              {new Date(record.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{record.periodLabel}</TableCell>
                            <TableCell>{record.checkInTime || '--'}</TableCell>
                            <TableCell>{record.checkOutTime || '--'}</TableCell>
                            <TableCell>
                              {getStatusBadge(record.status)}
                            </TableCell>
                            <TableCell>
                              {record.location ? (
                                <div className="flex items-center gap-1 text-sm">
                                  <MapPin className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">
                                    {record.location.latitude.toFixed(4)}, {record.location.longitude.toFixed(4)}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    (±{record.location.accuracy}m)
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">--</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {paginatedData.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        Page {paginatedData.currentPage} of {paginatedData.totalPages}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(paginatedData.totalPages, currentPage + 1))}
                          disabled={currentPage === paginatedData.totalPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No attendance records found for {selectedYear}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {searchTerm ? 'Try adjusting your search terms' : 'Records will appear here once attendance is marked'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
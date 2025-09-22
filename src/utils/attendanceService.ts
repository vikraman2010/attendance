import { geolocationService, Location } from './geolocation';
import { periodManager, PeriodManager } from './periodManager';
import { ClassPeriod } from '@/types/periods';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  periodNumber: number | null;
  periodLabel: string;
  date: string; // YYYY-MM-DD
  checkInTime?: string; // HH:MM:SS
  checkOutTime?: string;
  status: 'present' | 'absent' | 'late' | 'partial';
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  };
  locationVerified: boolean;
  distanceFromGeofence?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceStats {
  totalPeriods: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendanceRate: number;
  currentStreak: number;
}

export class AttendanceService {
  private records: AttendanceRecord[] = [];
  private periodManager: PeriodManager;

  constructor() {
    this.periodManager = periodManager;
    this.loadAttendanceRecords();
  }

  private loadAttendanceRecords(): void {
    try {
      const stored = localStorage.getItem('attendanceRecords');
      if (stored) {
        this.records = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading attendance records:', error);
      this.records = [];
    }
  }

  private saveAttendanceRecords(): void {
    try {
      localStorage.setItem('attendanceRecords', JSON.stringify(this.records));
    } catch (error) {
      console.error('Error saving attendance records:', error);
    }
  }

  private generateId(): string {
    return `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getCurrentTime(): string {
    return new Date().toTimeString().split(' ')[0];
  }

  /**
   * Check if user is within geofence for attendance
   */
  private async verifyLocation(): Promise<{ verified: boolean; location?: Location; distance?: number; error?: string }> {
    try {
      const activeGeofence = geolocationService.getActiveGeofenceArea();
      if (!activeGeofence) {
        return { verified: false, error: 'No active location registered for attendance' };
      }

      const currentLocation = await geolocationService.getCurrentPosition();
      
      // Validate location accuracy
      if (!geolocationService.validateLocationAccuracy(currentLocation)) {
        return { 
          verified: false, 
          location: currentLocation,
          error: 'Location accuracy too poor for attendance verification' 
        };
      }

      const isWithinGeofence = geolocationService.isWithinGeofence(currentLocation, activeGeofence);
      const distance = geolocationService.getDistanceFromGeofence(currentLocation, activeGeofence);

      return {
        verified: isWithinGeofence,
        location: currentLocation,
        distance,
        error: isWithinGeofence ? undefined : `You are ${distance}m away from the attendance location`
      };
    } catch (error) {
      return { 
        verified: false, 
        error: `Location verification failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Mark attendance for current period
   */
  async markAttendance(studentId: string): Promise<{ success: boolean; message: string; record?: AttendanceRecord }> {
    const periodStatus = this.periodManager.getPeriodStatus();
    
    if (!periodStatus.currentPeriod) {
      return { success: false, message: 'No active period found' };
    }

    if (!periodStatus.currentPeriod.is_active) {
      return { success: false, message: 'Attendance not required during breaks' };
    }

    const attendanceWindow = this.periodManager.getAttendanceWindow(periodStatus.currentPeriod);
    
    if (!attendanceWindow.canCheckIn) {
      return { 
        success: false, 
        message: attendanceWindow.reason || 'Attendance window is closed' 
      };
    }

    // Check if already marked for this period today
    const existingRecord = this.getTodayAttendance(studentId, periodStatus.currentPeriod.period);
    if (existingRecord && existingRecord.checkInTime) {
      return { 
        success: false, 
        message: `Attendance already marked for ${periodStatus.currentPeriod.label}` 
      };
    }

    // Verify location
    const locationVerification = await this.verifyLocation();
    
    if (!locationVerification.verified) {
      return { 
        success: false, 
        message: locationVerification.error || 'Location verification failed' 
      };
    }

    // Determine attendance status
    const currentTime = new Date().getHours() * 60 + new Date().getMinutes();
    const periodStartTime = this.timeToMinutes(periodStatus.currentPeriod.start_time);
    const isLate = currentTime > periodStartTime + 5; // 5 minutes grace period

    const record: AttendanceRecord = {
      id: existingRecord?.id || this.generateId(),
      studentId,
      periodNumber: periodStatus.currentPeriod.period,
      periodLabel: periodStatus.currentPeriod.label,
      date: this.getTodayDate(),
      checkInTime: this.getCurrentTime(),
      status: isLate ? 'late' : 'present',
      location: locationVerification.location ? {
        latitude: locationVerification.location.latitude,
        longitude: locationVerification.location.longitude,
        accuracy: locationVerification.location.accuracy || 0,
        timestamp: locationVerification.location.timestamp
      } : undefined,
      locationVerified: true,
      distanceFromGeofence: locationVerification.distance,
      createdAt: existingRecord?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingRecord) {
      // Update existing record
      const index = this.records.findIndex(r => r.id === existingRecord.id);
      this.records[index] = record;
    } else {
      // Add new record
      this.records.push(record);
    }

    this.saveAttendanceRecords();

    return { 
      success: true, 
      message: `Attendance marked successfully for ${periodStatus.currentPeriod.label}${isLate ? ' (Late)' : ''}`,
      record 
    };
  }

  /**
   * Mark check-out for current period
   */
  async markCheckOut(studentId: string): Promise<{ success: boolean; message: string; record?: AttendanceRecord }> {
    const periodStatus = this.periodManager.getPeriodStatus();
    
    if (!periodStatus.currentPeriod) {
      return { success: false, message: 'No active period found' };
    }

    const existingRecord = this.getTodayAttendance(studentId, periodStatus.currentPeriod.period);
    if (!existingRecord || !existingRecord.checkInTime) {
      return { success: false, message: 'No check-in record found for this period' };
    }

    if (existingRecord.checkOutTime) {
      return { success: false, message: 'Already checked out for this period' };
    }

    const attendanceWindow = this.periodManager.getAttendanceWindow(periodStatus.currentPeriod);
    if (!attendanceWindow.canCheckOut) {
      return { success: false, message: 'Check-out not allowed at this time' };
    }

    // Update record with check-out time
    existingRecord.checkOutTime = this.getCurrentTime();
    existingRecord.updatedAt = new Date().toISOString();

    const index = this.records.findIndex(r => r.id === existingRecord.id);
    this.records[index] = existingRecord;
    this.saveAttendanceRecords();

    return { 
      success: true, 
      message: `Checked out successfully from ${periodStatus.currentPeriod.label}`,
      record: existingRecord 
    };
  }

  /**
   * Get attendance record for specific period today
   */
  getTodayAttendance(studentId: string, periodNumber: number | null): AttendanceRecord | null {
    const today = this.getTodayDate();
    return this.records.find(record => 
      record.studentId === studentId && 
      record.date === today && 
      record.periodNumber === periodNumber
    ) || null;
  }

  /**
   * Get all attendance records for a student on a specific date
   */
  getAttendanceByDate(studentId: string, date: string): AttendanceRecord[] {
    return this.records.filter(record => 
      record.studentId === studentId && record.date === date
    );
  }

  /**
   * Get attendance records for a date range
   */
  getAttendanceByDateRange(studentId: string, startDate: string, endDate: string): AttendanceRecord[] {
    return this.records.filter(record => 
      record.studentId === studentId && 
      record.date >= startDate && 
      record.date <= endDate
    );
  }

  /**
   * Generate attendance statistics
   */
  getAttendanceStats(studentId: string, days: number = 30): AttendanceStats {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const records = this.getAttendanceByDateRange(
      studentId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    const activePeriods = this.periodManager.getActivePeriods();
    const totalPossiblePeriods = days * activePeriods.length;

    const presentCount = records.filter(r => r.status === 'present').length;
    const lateCount = records.filter(r => r.status === 'late').length;
    const absentCount = totalPossiblePeriods - presentCount - lateCount;

    const attendanceRate = totalPossiblePeriods > 0 ? 
      ((presentCount + lateCount) / totalPossiblePeriods) * 100 : 0;

    // Calculate current streak
    let currentStreak = 0;
    const sortedRecords = records
      .filter(r => r.status === 'present' || r.status === 'late')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (const record of sortedRecords) {
      if (record.status === 'present' || record.status === 'late') {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      totalPeriods: totalPossiblePeriods,
      presentCount,
      absentCount,
      lateCount,
      attendanceRate,
      currentStreak
    };
  }

  /**
   * Get yearly attendance statistics
   */
  getYearlyAttendanceStats(studentId: string, year?: number): AttendanceStats {
    const targetYear = year || new Date().getFullYear();
    const startDate = `${targetYear}-01-01`;
    const endDate = `${targetYear}-12-31`;

    return this.getAttendanceStatsByDateRange(studentId, startDate, endDate);
  }

  /**
   * Get attendance statistics for a specific date range
   */
  getAttendanceStatsByDateRange(studentId: string, startDate: string, endDate: string): AttendanceStats {
    const records = this.getAttendanceByDateRange(studentId, startDate, endDate);
    
    // Calculate working days between dates (excluding weekends)
    const start = new Date(startDate);
    const end = new Date(endDate);
    let workingDays = 0;
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude Sunday (0) and Saturday (6)
        workingDays++;
      }
    }

    const activePeriods = this.periodManager.getActivePeriods();
    const totalPossiblePeriods = workingDays * activePeriods.length;

    const presentCount = records.filter(r => r.status === 'present').length;
    const lateCount = records.filter(r => r.status === 'late').length;
    const absentCount = totalPossiblePeriods - presentCount - lateCount;

    const attendanceRate = totalPossiblePeriods > 0 ? 
      ((presentCount + lateCount) / totalPossiblePeriods) * 100 : 0;

    // Calculate current streak
    let currentStreak = 0;
    const sortedRecords = records
      .filter(r => r.status === 'present' || r.status === 'late')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (const record of sortedRecords) {
      if (record.status === 'present' || record.status === 'late') {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      totalPeriods: totalPossiblePeriods,
      presentCount,
      absentCount,
      lateCount,
      attendanceRate,
      currentStreak
    };
  }

  /**
   * Get paginated attendance records
   */
  getPaginatedAttendance(
    studentId: string, 
    startDate: string, 
    endDate: string, 
    page: number = 1, 
    limit: number = 50
  ): {
    records: AttendanceRecord[];
    totalRecords: number;
    totalPages: number;
    currentPage: number;
  } {
    const allRecords = this.getAttendanceByDateRange(studentId, startDate, endDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const totalRecords = allRecords.length;
    const totalPages = Math.ceil(totalRecords / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const records = allRecords.slice(startIndex, endIndex);

    return {
      records,
      totalRecords,
      totalPages,
      currentPage: page
    };
  }

  /**
   * Get monthly attendance summary for a year
   */
  getMonthlyAttendanceSummary(studentId: string, year: number): Array<{
    month: number;
    monthName: string;
    presentCount: number;
    lateCount: number;
    absentCount: number;
    attendanceRate: number;
    totalPeriods: number;
  }> {
    const months = [];
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    for (let month = 0; month < 12; month++) {
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
      
      const stats = this.getAttendanceStatsByDateRange(studentId, startDate, endDate);
      
      months.push({
        month: month + 1,
        monthName: monthNames[month],
        presentCount: stats.presentCount,
        lateCount: stats.lateCount,
        absentCount: stats.absentCount,
        attendanceRate: stats.attendanceRate,
        totalPeriods: stats.totalPeriods
      });
    }

    return months;
  }

  /**
   * Get today's attendance summary
   */
  getTodayAttendanceSummary(studentId: string): {
    date: string;
    periods: Array<{
      period: ClassPeriod;
      record?: AttendanceRecord;
      status: 'present' | 'absent' | 'late' | 'upcoming' | 'current';
      canMarkAttendance: boolean;
    }>;
  } {
    const today = this.getTodayDate();
    const activePeriods = this.periodManager.getActivePeriods();
    const currentPeriod = this.periodManager.getCurrentPeriod();
    
    const periods = activePeriods.map(period => {
      const record = this.getTodayAttendance(studentId, period.period);
      const attendanceWindow = this.periodManager.getAttendanceWindow(period);
      
      let status: 'present' | 'absent' | 'late' | 'upcoming' | 'current';
      
      if (record) {
        status = record.status as 'present' | 'absent' | 'late';
      } else if (currentPeriod?.period === period.period) {
        status = 'current';
      } else {
        const currentTime = new Date().getHours() * 60 + new Date().getMinutes();
        const periodStartTime = this.timeToMinutes(period.start_time);
        
        if (currentTime < periodStartTime) {
          status = 'upcoming';
        } else {
          status = 'absent';
        }
      }

      return {
        period,
        record,
        status,
        canMarkAttendance: attendanceWindow.canCheckIn && !record?.checkInTime
      };
    });

    return {
      date: today,
      periods
    };
  }

  private timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Export attendance data as CSV
   */
  exportAttendanceCSV(studentId: string, startDate?: string, endDate?: string): string {
    const records = startDate && endDate ? 
      this.getAttendanceByDateRange(studentId, startDate, endDate) :
      this.records.filter(r => r.studentId === studentId);

    const headers = [
      'Date',
      'Period',
      'Period Label', 
      'Check In Time',
      'Check Out Time',
      'Status',
      'Location Verified',
      'Distance (m)',
      'Latitude',
      'Longitude',
      'Accuracy (m)'
    ];

    const csvRows = records.map(record => [
      record.date,
      record.periodNumber?.toString() || '',
      record.periodLabel,
      record.checkInTime || '',
      record.checkOutTime || '',
      record.status,
      record.locationVerified ? 'Yes' : 'No',
      record.distanceFromGeofence?.toString() || '',
      record.location?.latitude.toString() || '',
      record.location?.longitude.toString() || '',
      record.location?.accuracy.toString() || ''
    ]);

    return [headers, ...csvRows].map(row => row.join(',')).join('\n');
  }
}

// Singleton instance
export const attendanceService = new AttendanceService();

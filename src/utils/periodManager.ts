import { ClassPeriod, PeriodStatus, AttendanceWindow } from '@/types/periods';

// Period timetable based on your provided data
export const PERIOD_TIMETABLE: ClassPeriod[] = [
  {
    period: 1,
    label: "Period 1",
    start_time: "08:45",
    end_time: "09:45",
    is_active: true
  },
  {
    period: 2,
    label: "Period 2", 
    start_time: "09:45",
    end_time: "10:35",
    is_active: true
  },
  {
    period: null,
    label: "Break",
    start_time: "10:35", 
    end_time: "10:55",
    is_active: false
  },
  {
    period: 3,
    label: "Period 3",
    start_time: "10:55",
    end_time: "11:45", 
    is_active: true
  },
  {
    period: 4,
    label: "Period 4",
    start_time: "11:45",
    end_time: "12:35",
    is_active: true
  },
  {
    period: null,
    label: "Lunch Break",
    start_time: "12:35",
    end_time: "13:45",
    is_active: false
  },
  {
    period: 5,
    label: "Period 5", 
    start_time: "13:45",
    end_time: "14:35",
    is_active: true
  },
  {
    period: 6,
    label: "Period 6",
    start_time: "14:35",
    end_time: "15:25",
    is_active: true
  },
  {
    period: 7,
    label: "Period 7",
    start_time: "15:25",
    end_time: "16:15",
    is_active: true
  }
];

export class PeriodManager {
  private periods: ClassPeriod[];

  constructor(customPeriods?: ClassPeriod[]) {
    this.periods = customPeriods || PERIOD_TIMETABLE;
  }

  /**
   * Convert time string (HH:MM) to minutes since midnight
   */
  private timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes since midnight to time string (HH:MM)
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Get current time in minutes since midnight
   */
  private getCurrentTimeInMinutes(): number {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  /**
   * Find the current period based on current time
   */
  getCurrentPeriod(): ClassPeriod | null {
    const currentTime = this.getCurrentTimeInMinutes();
    
    for (const period of this.periods) {
      const startTime = this.timeToMinutes(period.start_time);
      const endTime = this.timeToMinutes(period.end_time);
      
      if (currentTime >= startTime && currentTime < endTime) {
        return period;
      }
    }
    
    return null;
  }

  /**
   * Find the next period after current time
   */
  getNextPeriod(): ClassPeriod | null {
    const currentTime = this.getCurrentTimeInMinutes();
    
    for (const period of this.periods) {
      const startTime = this.timeToMinutes(period.start_time);
      
      if (currentTime < startTime) {
        return period;
      }
    }
    
    return null;
  }

  /**
   * Get comprehensive period status
   */
  getPeriodStatus(): PeriodStatus {
    const currentPeriod = this.getCurrentPeriod();
    const nextPeriod = this.getNextPeriod();
    const currentTime = this.getCurrentTimeInMinutes();
    
    let timeUntilNext = 0;
    let timeRemaining = 0;
    
    if (nextPeriod) {
      const nextStartTime = this.timeToMinutes(nextPeriod.start_time);
      timeUntilNext = Math.max(0, nextStartTime - currentTime);
    }
    
    if (currentPeriod) {
      const currentEndTime = this.timeToMinutes(currentPeriod.end_time);
      timeRemaining = Math.max(0, currentEndTime - currentTime);
    }
    
    return {
      currentPeriod,
      nextPeriod,
      isInActivePeriod: currentPeriod?.is_active || false,
      timeUntilNext,
      timeRemaining
    };
  }

  /**
   * Check if attendance can be marked for a specific period
   * Attendance window: 5 minutes before start to 10 minutes after start
   */
  getAttendanceWindow(period: ClassPeriod): AttendanceWindow {
    const currentTime = this.getCurrentTimeInMinutes();
    const startTime = this.timeToMinutes(period.start_time);
    const endTime = this.timeToMinutes(period.end_time);
    
    // Attendance window: 5 minutes before start to 10 minutes after start
    const attendanceWindowStart = startTime - 5;
    const attendanceWindowEnd = startTime + 10;
    
    const canCheckIn = currentTime >= attendanceWindowStart && 
                      currentTime <= attendanceWindowEnd && 
                      period.is_active;
    
    // Can check out during the entire period
    const canCheckOut = currentTime >= startTime && 
                       currentTime <= endTime && 
                       period.is_active;
    
    let reason: string | undefined;
    
    if (!period.is_active) {
      reason = "Attendance not required for breaks";
    } else if (currentTime < attendanceWindowStart) {
      const minutesUntil = attendanceWindowStart - currentTime;
      reason = `Attendance window opens in ${minutesUntil} minutes`;
    } else if (currentTime > attendanceWindowEnd && currentTime < startTime + 10) {
      reason = "Late check-in window (within 10 minutes of start)";
    } else if (currentTime > attendanceWindowEnd) {
      reason = "Attendance window closed";
    }
    
    return {
      period,
      canCheckIn,
      canCheckOut,
      reason
    };
  }

  /**
   * Get all active periods (excluding breaks)
   */
  getActivePeriods(): ClassPeriod[] {
    return this.periods.filter(period => period.is_active);
  }

  /**
   * Get all periods for a day
   */
  getAllPeriods(): ClassPeriod[] {
    return [...this.periods];
  }

  /**
   * Find period by number
   */
  getPeriodByNumber(periodNumber: number): ClassPeriod | null {
    return this.periods.find(period => period.period === periodNumber) || null;
  }

  /**
   * Check if current time is within school hours
   */
  isWithinSchoolHours(): boolean {
    const currentTime = this.getCurrentTimeInMinutes();
    const firstPeriodStart = this.timeToMinutes(this.periods[0].start_time);
    const lastPeriodEnd = this.timeToMinutes(this.periods[this.periods.length - 1].end_time);
    
    return currentTime >= firstPeriodStart && currentTime <= lastPeriodEnd;
  }

  /**
   * Get formatted time remaining string
   */
  formatTimeRemaining(minutes: number): string {
    if (minutes <= 0) return "0 minutes";
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  /**
   * Get period progress percentage (0-100)
   */
  getPeriodProgress(period: ClassPeriod): number {
    const currentTime = this.getCurrentTimeInMinutes();
    const startTime = this.timeToMinutes(period.start_time);
    const endTime = this.timeToMinutes(period.end_time);
    
    if (currentTime < startTime) return 0;
    if (currentTime > endTime) return 100;
    
    const totalDuration = endTime - startTime;
    const elapsed = currentTime - startTime;
    
    return Math.round((elapsed / totalDuration) * 100);
  }
}

// Singleton instance
export const periodManager = new PeriodManager();

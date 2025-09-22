export interface ClassPeriod {
  period: number | null;
  label: string;
  start_time: string; // Format: "HH:MM"
  end_time: string;   // Format: "HH:MM"
  is_active: boolean; // true for attendance periods, false for breaks
}

export interface PeriodStatus {
  currentPeriod: ClassPeriod | null;
  nextPeriod: ClassPeriod | null;
  isInActivePeriod: boolean;
  timeUntilNext: number; // minutes until next period
  timeRemaining: number; // minutes remaining in current period
}

export interface AttendanceWindow {
  period: ClassPeriod;
  canCheckIn: boolean;
  canCheckOut: boolean;
  reason?: string; // Why attendance is not allowed
}

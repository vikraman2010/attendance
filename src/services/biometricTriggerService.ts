import { periodManager } from '@/utils/periodManager';
import { ClassPeriod } from '@/types/periods';

export interface BiometricTriggerEvent {
  period: ClassPeriod;
  minutesRemaining: number;
  triggerTime: Date;
  reason: 'period_ending' | 'attendance_window_closing';
}

export type BiometricTriggerCallback = (event: BiometricTriggerEvent) => void;

class BiometricTriggerService {
  private callbacks: BiometricTriggerCallback[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private triggeredPeriods: Set<string> = new Set();
  private isActive: boolean = false;

  /**
   * Start monitoring periods for biometric triggers
   */
  start(): void {
    if (this.isActive) return;
    
    this.isActive = true;
    this.triggeredPeriods.clear();
    
    // Check every 30 seconds for period status
    this.intervalId = setInterval(() => {
      this.checkPeriodStatus();
    }, 30000);
    
    // Initial check
    this.checkPeriodStatus();
    
    console.log('BiometricTriggerService started');
  }

  /**
   * Stop monitoring periods
   */
  stop(): void {
    if (!this.isActive) return;
    
    this.isActive = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.triggeredPeriods.clear();
    console.log('BiometricTriggerService stopped');
  }

  /**
   * Subscribe to biometric trigger events
   */
  subscribe(callback: BiometricTriggerCallback): () => void {
    this.callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Check current period status and trigger biometric if needed
   */
  private checkPeriodStatus(): void {
    const periodStatus = periodManager.getPeriodStatus();
    const currentPeriod = periodStatus.currentPeriod;
    
    if (!currentPeriod || !currentPeriod.is_active) {
      return;
    }

    const timeRemaining = periodStatus.timeRemaining;
    const periodKey = `${currentPeriod.period}-${currentPeriod.start_time}`;
    
    // Trigger biometric 5 minutes before period ends
    if (timeRemaining <= 5 && timeRemaining > 0 && !this.triggeredPeriods.has(periodKey)) {
      this.triggeredPeriods.add(periodKey);
      
      const event: BiometricTriggerEvent = {
        period: currentPeriod,
        minutesRemaining: timeRemaining,
        triggerTime: new Date(),
        reason: 'period_ending'
      };
      
      this.notifyCallbacks(event);
      console.log(`Biometric trigger activated for ${currentPeriod.label} - ${timeRemaining} minutes remaining`);
    }
    
    // Also trigger if attendance window is closing (within 2 minutes of window end)
    const attendanceWindow = periodManager.getAttendanceWindow(currentPeriod);
    if (attendanceWindow.canCheckIn && timeRemaining <= 2 && timeRemaining > 0) {
      const windowKey = `${periodKey}-window`;
      if (!this.triggeredPeriods.has(windowKey)) {
        this.triggeredPeriods.add(windowKey);
        
        const event: BiometricTriggerEvent = {
          period: currentPeriod,
          minutesRemaining: timeRemaining,
          triggerTime: new Date(),
          reason: 'attendance_window_closing'
        };
        
        this.notifyCallbacks(event);
      }
    }
  }

  /**
   * Notify all subscribed callbacks
   */
  private notifyCallbacks(event: BiometricTriggerEvent): void {
    this.callbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in biometric trigger callback:', error);
      }
    });
  }

  /**
   * Manually trigger biometric for testing
   */
  manualTrigger(): void {
    const periodStatus = periodManager.getPeriodStatus();
    const currentPeriod = periodStatus.currentPeriod;
    
    if (currentPeriod && currentPeriod.is_active) {
      const event: BiometricTriggerEvent = {
        period: currentPeriod,
        minutesRemaining: periodStatus.timeRemaining,
        triggerTime: new Date(),
        reason: 'period_ending'
      };
      
      this.notifyCallbacks(event);
      console.log('Manual biometric trigger activated');
    }
  }

  /**
   * Get current service status
   */
  getStatus(): { isActive: boolean; triggeredPeriodsCount: number } {
    return {
      isActive: this.isActive,
      triggeredPeriodsCount: this.triggeredPeriods.size
    };
  }

  /**
   * Reset triggered periods (useful for testing)
   */
  resetTriggeredPeriods(): void {
    this.triggeredPeriods.clear();
    console.log('Triggered periods reset');
  }
}

// Singleton instance
export const biometricTriggerService = new BiometricTriggerService();

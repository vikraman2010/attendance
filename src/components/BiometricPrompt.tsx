import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Fingerprint, 
  Clock, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import { BiometricTriggerEvent } from '@/services/biometricTriggerService';
import { cn } from '@/lib/utils';

interface BiometricPromptProps {
  isOpen: boolean;
  isAuthenticating: boolean;
  triggerEvent: BiometricTriggerEvent | null;
  onAuthenticate: () => Promise<boolean>;
  onDismiss: () => void;
  className?: string;
}

export const BiometricPrompt: React.FC<BiometricPromptProps> = ({
  isOpen,
  isAuthenticating,
  triggerEvent,
  onAuthenticate,
  onDismiss,
  className
}) => {
  const handleAuthenticate = async () => {
    await onAuthenticate();
  };

  const getReasonText = (reason: string) => {
    switch (reason) {
      case 'period_ending':
        return 'Period ending soon';
      case 'attendance_window_closing':
        return 'Attendance window closing';
      default:
        return 'Authentication required';
    }
  };

  const getUrgencyColor = (minutesRemaining: number) => {
    if (minutesRemaining <= 2) return 'text-red-600';
    if (minutesRemaining <= 5) return 'text-yellow-600';
    return 'text-blue-600';
  };

  const getUrgencyBadgeVariant = (minutesRemaining: number): "default" | "secondary" | "destructive" | "outline" => {
    if (minutesRemaining <= 2) return 'destructive';
    if (minutesRemaining <= 5) return 'secondary';
    return 'default';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onDismiss}>
      <DialogContent className={cn("sm:max-w-md", className)}>
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            {isAuthenticating ? (
              <div className="animate-spin">
                <Fingerprint className="w-8 h-8 text-primary" />
              </div>
            ) : (
              <Fingerprint className="w-8 h-8 text-primary" />
            )}
          </div>
          
          <DialogTitle className="text-xl font-semibold">
            Biometric Authentication Required
          </DialogTitle>
          
          <DialogDescription className="text-center space-y-3">
            {triggerEvent && (
              <>
                <div className="flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">{triggerEvent.period.label}</span>
                  <Badge variant={getUrgencyBadgeVariant(triggerEvent.minutesRemaining)}>
                    {getReasonText(triggerEvent.reason)}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      {triggerEvent.period.start_time} - {triggerEvent.period.end_time}
                    </span>
                  </div>
                  <div className={cn("flex items-center gap-1 font-medium", getUrgencyColor(triggerEvent.minutesRemaining))}>
                    <AlertTriangle className="w-4 h-4" />
                    <span>{triggerEvent.minutesRemaining} min remaining</span>
                  </div>
                </div>
              </>
            )}
            
            <p className="text-muted-foreground">
              Please authenticate using your fingerprint or face ID to continue with attendance tracking.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          {/* Authentication Status */}
          {isAuthenticating && (
            <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 rounded-lg">
              <div className="animate-pulse">
                <Fingerprint className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-blue-800 font-medium">
                Waiting for biometric authentication...
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleAuthenticate}
              disabled={isAuthenticating}
              className="flex-1"
            >
              {isAuthenticating ? (
                <>
                  <div className="animate-spin mr-2">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                  Authenticating...
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4 mr-2" />
                  Authenticate
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={onDismiss}
              disabled={isAuthenticating}
              className="px-4"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>
              • Touch the fingerprint sensor or look at your device's camera
            </p>
            <p>
              • Authentication is required for secure attendance tracking
            </p>
            <p>
              • This prompt appears 5 minutes before each period ends
            </p>
          </div>
        </div>

        {/* Period Progress Indicator */}
        {triggerEvent && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Period Progress</span>
              <span>{Math.max(0, 100 - (triggerEvent.minutesRemaining / 60) * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  triggerEvent.minutesRemaining <= 2 ? "bg-red-500" :
                  triggerEvent.minutesRemaining <= 5 ? "bg-yellow-500" : "bg-blue-500"
                )}
                style={{ 
                  width: `${Math.max(0, 100 - (triggerEvent.minutesRemaining / 60) * 100)}%` 
                }}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

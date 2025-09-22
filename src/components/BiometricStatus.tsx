import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Fingerprint, 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Play,
  Pause,
  Settings
} from 'lucide-react';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { cn } from '@/lib/utils';

interface BiometricStatusProps {
  className?: string;
  showControls?: boolean;
  compact?: boolean;
}

export const BiometricStatus: React.FC<BiometricStatusProps> = ({
  className,
  showControls = true,
  compact = false
}) => {
  const biometric = useBiometricAuth({ autoStart: false, showToasts: true });

  const getStatusColor = () => {
    if (!biometric.isSupported) return 'text-gray-500';
    if (!biometric.isRegistered) return 'text-yellow-600';
    if (!biometric.isEnabled) return 'text-red-600';
    return 'text-green-600';
  };

  const getStatusBadgeVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    if (!biometric.isSupported || !biometric.isRegistered) return 'secondary';
    if (!biometric.isEnabled) return 'destructive';
    return 'default';
  };

  const getStatusText = () => {
    if (!biometric.isSupported) return 'Not Supported';
    if (!biometric.isRegistered) return 'Not Registered';
    if (!biometric.isEnabled) return 'Inactive';
    return 'Active';
  };

  const getStatusIcon = () => {
    if (!biometric.isSupported || !biometric.isRegistered) {
      return <AlertTriangle className="w-4 h-4" />;
    }
    if (!biometric.isEnabled) {
      return <Pause className="w-4 h-4" />;
    }
    return <CheckCircle className="w-4 h-4" />;
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className={cn("flex items-center gap-1", getStatusColor())}>
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusText()}</span>
        </div>
        {biometric.isEnabled && biometric.lastAuthTime && (
          <Badge variant="outline" className="text-xs">
            Last auth: {biometric.lastAuthTime.toLocaleTimeString()}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Fingerprint className="w-5 h-5" />
          Biometric Authentication
        </CardTitle>
        <CardDescription>
          Automatic biometric prompts for secure attendance tracking
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("flex items-center gap-1", getStatusColor())}>
              {getStatusIcon()}
              <span className="font-medium">{getStatusText()}</span>
            </div>
            <Badge variant={getStatusBadgeVariant()}>
              {biometric.isEnabled ? 'Monitoring' : 'Stopped'}
            </Badge>
          </div>
          
          {showControls && (
            <div className="flex gap-2">
              {biometric.isEnabled ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={biometric.stopBiometricMonitoring}
                >
                  <Pause className="w-4 h-4 mr-1" />
                  Stop
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={biometric.startBiometricMonitoring}
                  disabled={!biometric.isSupported || !biometric.isRegistered}
                >
                  <Play className="w-4 h-4 mr-1" />
                  Start
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Detailed Status */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Device Support:</span>
              <span className={biometric.isSupported ? 'text-green-600' : 'text-red-600'}>
                {biometric.isSupported ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Registration:</span>
              <span className={biometric.isRegistered ? 'text-green-600' : 'text-yellow-600'}>
                {biometric.isRegistered ? 'Complete' : 'Required'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monitoring:</span>
              <span className={biometric.isEnabled ? 'text-green-600' : 'text-red-600'}>
                {biometric.isEnabled ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Auth Count:</span>
              <span className="font-medium">{biometric.authenticationCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Auth:</span>
              <span className="font-medium">
                {biometric.lastAuthTime 
                  ? biometric.lastAuthTime.toLocaleTimeString()
                  : 'Never'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Recent Auth:</span>
              <span className={biometric.isRecentlyAuthenticated() ? 'text-green-600' : 'text-gray-500'}>
                {biometric.isRecentlyAuthenticated() ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Registration Required */}
        {biometric.isSupported && !biometric.isRegistered && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Registration Required</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Please register your biometric authentication to enable automatic prompts.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => biometric.registerBiometric('student_001', 'Student User')}
            >
              <Fingerprint className="w-4 h-4 mr-1" />
              Register Now
            </Button>
          </div>
        )}

        {/* Not Supported */}
        {!biometric.isSupported && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 text-gray-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Not Supported</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Your device or browser doesn't support biometric authentication.
            </p>
          </div>
        )}

        {/* Active Monitoring Info */}
        {biometric.isEnabled && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <Shield className="w-4 h-4" />
              <span className="font-medium">Active Monitoring</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              You'll be prompted for biometric authentication 5 minutes before each period ends.
            </p>
            {showControls && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={biometric.manualTrigger}
              >
                <Settings className="w-4 h-4 mr-1" />
                Test Trigger
              </Button>
            )}
          </div>
        )}

        {/* Service Status */}
        <div className="text-xs text-muted-foreground border-t pt-2">
          <div className="flex justify-between">
            <span>Service Status:</span>
            <span>{biometric.serviceStatus.isActive ? 'Running' : 'Stopped'}</span>
          </div>
          <div className="flex justify-between">
            <span>Triggered Periods:</span>
            <span>{biometric.serviceStatus.triggeredPeriodsCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

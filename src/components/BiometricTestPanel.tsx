import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  TestTube, 
  Play, 
  Pause, 
  RotateCcw,
  Clock,
  Fingerprint,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { biometricTriggerService } from '@/services/biometricTriggerService';
import { periodManager } from '@/utils/periodManager';
import { useToast } from '@/hooks/use-toast';

interface BiometricTestPanelProps {
  className?: string;
}

export const BiometricTestPanel: React.FC<BiometricTestPanelProps> = ({ className }) => {
  const [testUserId, setTestUserId] = useState('test_student_001');
  const [testUserName, setTestUserName] = useState('Test Student');
  const { toast } = useToast();
  
  const biometric = useBiometricAuth({ 
    autoStart: false, 
    showToasts: true,
    requireReauth: false 
  });

  const handleRegisterTest = async () => {
    const success = await biometric.registerBiometric(testUserId, testUserName);
    if (success) {
      toast({
        title: "Test Registration Successful",
        description: "Biometric authentication registered for testing",
      });
    }
  };

  const handleManualTrigger = () => {
    biometric.manualTrigger();
    toast({
      title: "Manual Trigger Activated",
      description: "Biometric prompt should appear now",
    });
  };

  const handleResetService = () => {
    biometricTriggerService.resetTriggeredPeriods();
    toast({
      title: "Service Reset",
      description: "Triggered periods have been reset",
    });
  };

  const getCurrentPeriodInfo = () => {
    const status = periodManager.getPeriodStatus();
    return {
      current: status.currentPeriod,
      timeRemaining: status.timeRemaining,
      isActive: status.isInActivePeriod
    };
  };

  const periodInfo = getCurrentPeriodInfo();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Biometric Testing Panel
        </CardTitle>
        <CardDescription>
          Test biometric authentication and period-based triggers
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Period Status */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Current Period Status
          </h4>
          {periodInfo.current ? (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Period:</span>
                <span className="font-medium">{periodInfo.current.label}</span>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span>{periodInfo.current.start_time} - {periodInfo.current.end_time}</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining:</span>
                <span className="font-medium">{periodInfo.timeRemaining} minutes</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge variant={periodInfo.isActive ? "default" : "secondary"}>
                  {periodInfo.isActive ? "Active" : "Break"}
                </Badge>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active period</p>
          )}
        </div>

        {/* Biometric Status */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Fingerprint className="w-4 h-4" />
            Biometric Status
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span>Supported:</span>
              <span className={biometric.isSupported ? 'text-green-600' : 'text-red-600'}>
                {biometric.isSupported ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Registered:</span>
              <span className={biometric.isRegistered ? 'text-green-600' : 'text-yellow-600'}>
                {biometric.isRegistered ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Monitoring:</span>
              <span className={biometric.isEnabled ? 'text-green-600' : 'text-red-600'}>
                {biometric.isEnabled ? 'Active' : 'Stopped'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Auth Count:</span>
              <span className="font-medium">{biometric.authenticationCount}</span>
            </div>
          </div>
        </div>

        {/* Test Registration */}
        <div className="space-y-3">
          <h4 className="font-medium">Test Registration</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="testUserId" className="text-xs">User ID</Label>
              <Input
                id="testUserId"
                value={testUserId}
                onChange={(e) => setTestUserId(e.target.value)}
                placeholder="test_student_001"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="testUserName" className="text-xs">User Name</Label>
              <Input
                id="testUserName"
                value={testUserName}
                onChange={(e) => setTestUserName(e.target.value)}
                placeholder="Test Student"
                className="h-8 text-sm"
              />
            </div>
          </div>
          <Button
            onClick={handleRegisterTest}
            disabled={!biometric.isSupported}
            size="sm"
            className="w-full"
          >
            <Fingerprint className="w-3 h-3 mr-2" />
            Register Test Biometric
          </Button>
        </div>

        {/* Test Controls */}
        <div className="space-y-3">
          <h4 className="font-medium">Test Controls</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={biometric.isEnabled ? biometric.stopBiometricMonitoring : biometric.startBiometricMonitoring}
              disabled={!biometric.isSupported || !biometric.isRegistered}
              variant="outline"
              size="sm"
            >
              {biometric.isEnabled ? (
                <>
                  <Pause className="w-3 h-3 mr-1" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 mr-1" />
                  Start
                </>
              )}
            </Button>
            
            <Button
              onClick={handleManualTrigger}
              disabled={!biometric.isSupported || !biometric.isRegistered}
              variant="outline"
              size="sm"
            >
              <TestTube className="w-3 h-3 mr-1" />
              Manual Trigger
            </Button>
          </div>
          
          <Button
            onClick={handleResetService}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset Service
          </Button>
        </div>

        {/* Service Status */}
        <div className="p-3 bg-green-50 rounded-lg">
          <h4 className="font-medium mb-2">Service Status</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span>Service:</span>
              <span className={biometric.serviceStatus.isActive ? 'text-green-600' : 'text-red-600'}>
                {biometric.serviceStatus.isActive ? 'Running' : 'Stopped'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Triggered:</span>
              <span className="font-medium">{biometric.serviceStatus.triggeredPeriodsCount}</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            Testing Instructions
          </h4>
          <ol className="text-xs text-yellow-800 space-y-1 list-decimal list-inside">
            <li>First register test biometric authentication</li>
            <li>Start the biometric monitoring service</li>
            <li>Use "Manual Trigger" to test the prompt immediately</li>
            <li>The service will automatically trigger 5 minutes before period ends</li>
            <li>Reset service to clear triggered periods for retesting</li>
          </ol>
        </div>

        {/* Current Prompt Status */}
        {biometric.isPromptVisible && (
          <div className="p-3 bg-blue-100 border border-blue-300 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Biometric Prompt Active</span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              The biometric authentication prompt is currently visible.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

import React, { useEffect } from 'react';
import { Fingerprint, Shield, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useWebAuthn } from '@/hooks/useWebAuthn';
import { useToast } from '@/hooks/use-toast';

interface WebAuthnButtonProps {
  userId: string;
  userName: string;
  onAuthenticated: () => void;
  disabled?: boolean;
}

export const WebAuthnButton: React.FC<WebAuthnButtonProps> = ({
  userId,
  userName,
  onAuthenticated,
  disabled
}) => {
  const {
    isSupported,
    isRegistering,
    isAuthenticating,
    isRegistered,
    error,
    register,
    authenticate,
    checkRegistration,
    clearError,
  } = useWebAuthn();

  const { toast } = useToast();

  useEffect(() => {
    checkRegistration();
  }, [checkRegistration]);

  useEffect(() => {
    if (error) {
      toast({
        title: "WebAuthn Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleRegister = async () => {
    clearError();
    const success = await register(userId, userName);
    
    if (success) {
      toast({
        title: "Registration Successful",
        description: "Your device has been registered for secure authentication",
      });
    }
  };

  const handleAuthenticate = async () => {
    clearError();
    const success = await authenticate();
    
    if (success) {
      onAuthenticated();
      toast({
        title: "Authentication Successful",
        description: "Device authentication completed",
      });
    }
  };

  if (!isSupported) {
    return (
      <Card className="p-4 attendance-card border-warning/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-warning" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-warning">WebAuthn Not Supported</p>
            <p className="text-sm text-muted-foreground">
              Your browser doesn't support biometric authentication
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 attendance-card">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isRegistered 
              ? 'bg-success/10' 
              : 'bg-primary/10'
          }`}>
            {isRegistered ? (
              <Shield className="w-4 h-4 text-success" />
            ) : (
              <Fingerprint className="w-4 h-4 text-primary" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">Device Authentication</span>
              {isRegistered && (
                <span className="status-pill success">
                  ✅ Registered
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {isRegistered 
                ? 'Verify your identity using biometrics or PIN'
                : 'Register this device for secure authentication'
              }
            </p>
          </div>
        </div>

        {!isRegistered ? (
          <Button
            onClick={handleRegister}
            disabled={disabled || isRegistering}
            variant="hero"
            className="w-full"
          >
            {isRegistering ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Registering Device</>
            ) : (
              <><Fingerprint className="w-4 h-4" /> Register Device</>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleAuthenticate}
            disabled={disabled || isAuthenticating}
            variant="success"
            className="w-full"
          >
            {isAuthenticating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating</>
            ) : (
              <><CheckCircle className="w-4 h-4" /> Authenticate</>
            )}
          </Button>
        )}

        {error && (
          <div className="p-3 bg-error/10 border border-error/20 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-error flex-shrink-0" />
            <p className="text-sm text-error">{error}</p>
          </div>
        )}
      </div>
    </Card>
  );
};
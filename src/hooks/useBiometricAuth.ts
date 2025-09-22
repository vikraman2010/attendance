import { useState, useCallback, useEffect } from 'react';
import { useWebAuthn } from './useWebAuthn';
import { biometricTriggerService, BiometricTriggerEvent } from '@/services/biometricTriggerService';
import { useToast } from '@/hooks/use-toast';

export interface BiometricAuthState {
  isEnabled: boolean;
  isAuthenticating: boolean;
  isPromptVisible: boolean;
  lastAuthTime: Date | null;
  currentTriggerEvent: BiometricTriggerEvent | null;
  authenticationCount: number;
}

export interface BiometricAuthOptions {
  autoStart?: boolean;
  showToasts?: boolean;
  requireReauth?: boolean; // Require re-authentication for each period
}

export const useBiometricAuth = (options: BiometricAuthOptions = {}) => {
  const { 
    autoStart = true, 
    showToasts = true, 
    requireReauth = true 
  } = options;
  
  const webAuthn = useWebAuthn();
  const { toast } = useToast();
  
  const [state, setState] = useState<BiometricAuthState>({
    isEnabled: false,
    isAuthenticating: false,
    isPromptVisible: false,
    lastAuthTime: null,
    currentTriggerEvent: null,
    authenticationCount: 0
  });

  /**
   * Handle biometric trigger events
   */
  const handleBiometricTrigger = useCallback((event: BiometricTriggerEvent) => {
    console.log('Biometric trigger received:', event);
    
    // Check if we need to re-authenticate
    const needsAuth = requireReauth || !state.lastAuthTime || 
                     (Date.now() - state.lastAuthTime.getTime()) > 30 * 60 * 1000; // 30 minutes
    
    if (needsAuth && webAuthn.isSupported && webAuthn.isRegistered) {
      setState(prev => ({
        ...prev,
        isPromptVisible: true,
        currentTriggerEvent: event
      }));
      
      if (showToasts) {
        toast({
          title: "Biometric Authentication Required",
          description: `Please authenticate for ${event.period.label} (${event.minutesRemaining} min remaining)`,
          duration: 10000,
        });
      }
    }
  }, [requireReauth, state.lastAuthTime, webAuthn.isSupported, webAuthn.isRegistered, showToasts, toast]);

  /**
   * Start biometric monitoring
   */
  const startBiometricMonitoring = useCallback(() => {
    if (!webAuthn.isSupported) {
      console.warn('WebAuthn not supported, biometric monitoring disabled');
      return;
    }

    setState(prev => ({ ...prev, isEnabled: true }));
    biometricTriggerService.start();
    
    if (showToasts) {
      toast({
        title: "Biometric Monitoring Active",
        description: "You'll be prompted for authentication 5 minutes before each period ends",
      });
    }
  }, [webAuthn.isSupported, showToasts, toast]);

  /**
   * Stop biometric monitoring
   */
  const stopBiometricMonitoring = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isEnabled: false,
      isPromptVisible: false,
      currentTriggerEvent: null
    }));
    biometricTriggerService.stop();
    
    if (showToasts) {
      toast({
        title: "Biometric Monitoring Stopped",
        description: "Automatic biometric prompts have been disabled",
      });
    }
  }, [showToasts, toast]);

  /**
   * Perform biometric authentication
   */
  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!webAuthn.isSupported || !webAuthn.isRegistered) {
      if (showToasts) {
        toast({
          title: "Biometric Not Available",
          description: "Please register biometric authentication first",
          variant: "destructive"
        });
      }
      return false;
    }

    setState(prev => ({ ...prev, isAuthenticating: true }));

    try {
      const success = await webAuthn.authenticate();
      
      if (success) {
        const now = new Date();
        setState(prev => ({
          ...prev,
          isAuthenticating: false,
          isPromptVisible: false,
          lastAuthTime: now,
          authenticationCount: prev.authenticationCount + 1,
          currentTriggerEvent: null
        }));

        if (showToasts) {
          toast({
            title: "Authentication Successful",
            description: "Biometric authentication completed successfully",
          });
        }

        return true;
      } else {
        setState(prev => ({ ...prev, isAuthenticating: false }));
        
        if (showToasts) {
          toast({
            title: "Authentication Failed",
            description: webAuthn.error || "Biometric authentication failed",
            variant: "destructive"
          });
        }
        
        return false;
      }
    } catch (error) {
      setState(prev => ({ ...prev, isAuthenticating: false }));
      console.error('Biometric authentication error:', error);
      
      if (showToasts) {
        toast({
          title: "Authentication Error",
          description: "An error occurred during biometric authentication",
          variant: "destructive"
        });
      }
      
      return false;
    }
  }, [webAuthn, showToasts, toast]);

  /**
   * Dismiss the current biometric prompt
   */
  const dismissPrompt = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPromptVisible: false,
      currentTriggerEvent: null
    }));
  }, []);

  /**
   * Register biometric authentication
   */
  const registerBiometric = useCallback(async (userId: string, userName: string): Promise<boolean> => {
    const success = await webAuthn.register(userId, userName);
    
    if (success && showToasts) {
      toast({
        title: "Biometric Registration Successful",
        description: "You can now use biometric authentication for attendance",
      });
    }
    
    return success;
  }, [webAuthn, showToasts, toast]);

  /**
   * Check if user is authenticated recently
   */
  const isRecentlyAuthenticated = useCallback((maxAgeMinutes: number = 30): boolean => {
    if (!state.lastAuthTime) return false;
    
    const ageMs = Date.now() - state.lastAuthTime.getTime();
    const ageMinutes = ageMs / (1000 * 60);
    
    return ageMinutes <= maxAgeMinutes;
  }, [state.lastAuthTime]);

  /**
   * Manual trigger for testing
   */
  const manualTrigger = useCallback(() => {
    biometricTriggerService.manualTrigger();
  }, []);

  // Subscribe to biometric trigger events
  useEffect(() => {
    const unsubscribe = biometricTriggerService.subscribe(handleBiometricTrigger);
    return unsubscribe;
  }, [handleBiometricTrigger]);

  // Auto-start monitoring if enabled
  useEffect(() => {
    if (autoStart && webAuthn.isSupported && webAuthn.isRegistered && !state.isEnabled) {
      startBiometricMonitoring();
    }
  }, [autoStart, webAuthn.isSupported, webAuthn.isRegistered, state.isEnabled, startBiometricMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      biometricTriggerService.stop();
    };
  }, []);

  return {
    // State
    ...state,
    
    // WebAuthn state
    isSupported: webAuthn.isSupported,
    isRegistered: webAuthn.isRegistered,
    webAuthnError: webAuthn.error,
    
    // Actions
    startBiometricMonitoring,
    stopBiometricMonitoring,
    authenticate,
    registerBiometric,
    dismissPrompt,
    manualTrigger,
    
    // Utilities
    isRecentlyAuthenticated,
    
    // Service status
    serviceStatus: biometricTriggerService.getStatus()
  };
};

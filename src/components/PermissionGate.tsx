import React, { useState, useEffect } from 'react';
import { MapPin, Fingerprint, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface PermissionGateProps {
  children: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({ children }) => {
  const [locationPermission, setLocationPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [biometricPermission, setBiometricPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const requestLocationPermission = async () => {
    setIsLoading(true);
    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        setLocationPermission('denied');
        toast({
          title: "Location Not Supported",
          description: "Your browser doesn't support geolocation.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Check if we're on HTTPS or localhost (required for geolocation)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        setLocationPermission('denied');
        toast({
          title: "HTTPS Required",
          description: "Location access requires HTTPS. Please use https:// or localhost.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // First try to check permission status if available
      if ('permissions' in navigator) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          console.log('Permission state:', permission.state);
          
          if (permission.state === 'denied') {
            setLocationPermission('denied');
            toast({
              title: "Location Blocked",
              description: "Location is blocked in browser settings. Click the location icon in address bar to allow.",
              variant: "destructive"
            });
            setIsLoading(false);
            return;
          }
        } catch (permError) {
          console.log('Permission API not supported, continuing with direct request');
        }
      }

      // Request location access with more lenient settings for laptops
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Location granted:', position.coords);
          setLocationPermission('granted');
          toast({
            title: "Location Access Granted",
            description: `Location: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)} (±${Math.round(position.coords.accuracy)}m)`,
          });
          setIsLoading(false);
        },
        (error) => {
          console.error('Location error:', error);
          let errorMessage = "Please enable location services.";
          let title = "Location Access Failed";
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              title = "Location Permission Denied";
              errorMessage = "Click the location icon in your browser's address bar and select 'Allow'. Then try again.";
              break;
            case error.POSITION_UNAVAILABLE:
              title = "Location Unavailable";
              errorMessage = "Location services are unavailable. For laptops, try enabling location in Windows Settings > Privacy > Location.";
              break;
            case error.TIMEOUT:
              title = "Location Timeout";
              errorMessage = "Location request timed out. This is normal for laptops. Click 'Continue Without Precise Location' below.";
              break;
          }
          
          toast({
            title,
            description: errorMessage,
            variant: "destructive"
          });
          setLocationPermission('denied');
          setIsLoading(false);
        },
        { 
          enableHighAccuracy: false, // Less strict for laptops
          timeout: 10000, // Shorter timeout
          maximumAge: 300000 // 5 minutes cache
        }
      );
    } catch (error) {
      console.error('Location permission error:', error);
      setLocationPermission('denied');
      toast({
        title: "Location Error",
        description: "Failed to request location permission.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const requestBiometricPermission = async () => {
    setIsLoading(true);
    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        setBiometricPermission('denied');
        toast({
          title: "Biometric Not Supported",
          description: "Your browser doesn't support WebAuthn/biometric authentication.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Check if platform authenticator (biometric) is available
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      
      if (available) {
        // Try to create a credential to test biometric access
        try {
          const credential = await navigator.credentials.create({
            publicKey: {
              challenge: new Uint8Array(32),
              rp: {
                name: "Coal Worker Attendance",
                id: window.location.hostname,
              },
              user: {
                id: new Uint8Array(16),
                name: "test@example.com",
                displayName: "Test User",
              },
              pubKeyCredParams: [{alg: -7, type: "public-key"}],
              authenticatorSelection: {
                authenticatorAttachment: "platform",
                userVerification: "required"
              },
              timeout: 60000,
              attestation: "direct"
            }
          });

          if (credential) {
            setBiometricPermission('granted');
            toast({
              title: "Biometric Authentication Ready",
              description: "Fingerprint/Face ID authentication is available.",
            });
          }
        } catch (credError: any) {
          console.log('Biometric test error:', credError);
          if (credError.name === 'NotAllowedError') {
            setBiometricPermission('denied');
            toast({
              title: "Biometric Access Denied",
              description: "Please allow biometric authentication when prompted.",
              variant: "destructive"
            });
          } else {
            setBiometricPermission('granted');
            toast({
              title: "Biometric Available",
              description: "Biometric authentication is ready (test failed but device supports it).",
            });
          }
        }
      } else {
        setBiometricPermission('denied');
        toast({
          title: "Biometric Not Available",
          description: "This device doesn't have biometric authentication (fingerprint/face ID).",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Biometric permission error:', error);
      setBiometricPermission('denied');
      toast({
        title: "Biometric Check Failed",
        description: "Unable to check biometric authentication availability.",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const allPermissionsGranted = locationPermission === 'granted' && biometricPermission === 'granted';

  if (allPermissionsGranted) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Coal Worker Attendance System</h1>
          <p className="text-muted-foreground">
            Please grant the following permissions to use the attendance system
          </p>
        </div>

        <div className="grid gap-4">
          {/* Location Permission */}
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                locationPermission === 'granted' 
                  ? 'bg-success/10' 
                  : locationPermission === 'denied' 
                  ? 'bg-error/10' 
                  : 'bg-primary/10'
              }`}>
                {locationPermission === 'granted' ? (
                  <CheckCircle className="w-6 h-6 text-success" />
                ) : locationPermission === 'denied' ? (
                  <AlertTriangle className="w-6 h-6 text-error" />
                ) : (
                  <MapPin className="w-6 h-6 text-primary" />
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Location Access</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Required for geofence-based attendance tracking within the coal mine premises
                </p>
                
                {locationPermission === 'pending' && (
                  <Button 
                    onClick={requestLocationPermission}
                    disabled={isLoading}
                    className="w-full sm:w-auto"
                  >
                    {isLoading ? 'Requesting...' : 'Grant Location Access'}
                  </Button>
                )}
                
                {locationPermission === 'granted' && (
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Location access granted</span>
                  </div>
                )}
                
                {locationPermission === 'denied' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-error">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">Location access denied</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={requestLocationPermission}
                    >
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Biometric Permission */}
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                biometricPermission === 'granted' 
                  ? 'bg-success/10' 
                  : biometricPermission === 'denied' 
                  ? 'bg-error/10' 
                  : 'bg-primary/10'
              }`}>
                {biometricPermission === 'granted' ? (
                  <CheckCircle className="w-6 h-6 text-success" />
                ) : biometricPermission === 'denied' ? (
                  <AlertTriangle className="w-6 h-6 text-error" />
                ) : (
                  <Fingerprint className="w-6 h-6 text-primary" />
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Biometric Authentication</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Required for secure identity verification before marking attendance
                </p>
                
                {biometricPermission === 'pending' && (
                  <Button 
                    onClick={requestBiometricPermission}
                    disabled={isLoading}
                    className="w-full sm:w-auto"
                  >
                    {isLoading ? 'Checking...' : 'Check Biometric Availability'}
                  </Button>
                )}
                
                {biometricPermission === 'granted' && (
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Biometric authentication available</span>
                  </div>
                )}
                
                {biometricPermission === 'denied' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-error">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">Biometric authentication not available</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      You can still use the system, but some security features will be limited
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {locationPermission === 'denied' && (
          <div className="text-center">
            <Button 
              onClick={() => setLocationPermission('granted')} 
              variant="outline"
              className="w-full sm:w-auto"
            >
              Continue Without Precise Location
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Use approximate location for attendance (suitable for laptops)
            </p>
          </div>
        )}

        {locationPermission === 'granted' && biometricPermission === 'denied' && (
          <div className="text-center">
            <Button 
              onClick={() => setBiometricPermission('granted')} 
              variant="outline"
              className="w-full sm:w-auto"
            >
              Continue Without Biometric
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              You can enable biometric authentication later in settings
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

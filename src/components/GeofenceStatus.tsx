import React, { useEffect } from 'react';
import { MapPin, Shield, AlertTriangle } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface GeofenceStatusProps {
  onStatusChange?: (isWithin: boolean) => void;
}

export const GeofenceStatus: React.FC<GeofenceStatusProps> = ({ onStatusChange }) => {
  const { isInsideGeofence, latitude, longitude, accuracy, loading, error, distanceFromGeofence } = useGeolocation();

  useEffect(() => {
    if (onStatusChange && !loading && !error) {
      onStatusChange(isInsideGeofence);
    }
  }, [isInsideGeofence, loading, error, onStatusChange]);

  // Handle error case - don't auto-enable for demo
  useEffect(() => {
    if (error && onStatusChange) {
      onStatusChange(false); // Location not verified when there's an error
    }
  }, [error, onStatusChange]);

  if (loading) {
    return (
      <Card className="p-4 attendance-card">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          <div className="flex-1">
            <div className="h-4 bg-muted rounded animate-pulse mb-2" />
            <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
          </div>
        </div>
      </Card>
    );
  }

  const requestLocationPermission = async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        });
      });
      
      // Force a page reload to restart the geolocation hook
      console.log('Location permission granted:', position);
      window.location.reload();
    } catch (error) {
      console.error('Failed to get location permission:', error);
      // Show instructions for manual permission
      alert('Please manually enable location permission:\n1. Click the location icon in the address bar\n2. Select "Allow" for location access\n3. Refresh the page');
    }
  };

  if (error) {
    return (
      <Card className="p-4 attendance-card border-error/20">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-error" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">Location Status</span>
                <span className="status-pill error">
                  ❌ Location Disabled
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Location access is required to mark attendance
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={requestLocationPermission}
              variant="outline"
              className="w-full"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Enable Location Access
            </Button>
            
            <Button 
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition((position) => {
                    const coords = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
                    const accuracy = position.coords.accuracy;
                    navigator.clipboard.writeText(coords);
                    alert(`Your EXACT current location:\nCoordinates: ${coords}\nAccuracy: ±${Math.round(accuracy)}m\n\nClassroom set to: 10.416229, 77.899375\n\nCoordinates copied to clipboard!`);
                  }, (error) => {
                    alert(`Location error: ${error.message}`);
                  }, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                  });
                }
              }}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              📍 Get My EXACT Current Location
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="text-xs">
              If the button doesn't work, manually enable location:
            </p>
            <p className="text-xs">
              1. Click the location icon 🔒 in your address bar
            </p>
            <p className="text-xs">
              2. Select "Allow" for location access
            </p>
            <p className="text-xs">
              3. Refresh the page
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const refreshLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        console.log('Fresh location:', position.coords);
        // Force page reload to get fresh location data
        window.location.reload();
      }, (error) => {
        console.error('Location refresh error:', error);
      }, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    }
  };

  return (
    <Card className="p-4 attendance-card">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isInsideGeofence 
              ? 'bg-success/10' 
              : 'bg-error/10'
          }`}>
            {isInsideGeofence ? (
              <Shield className="w-4 h-4 text-success" />
            ) : (
              <MapPin className="w-4 h-4 text-error" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">Location Status</span>
              <span className={`status-pill ${isInsideGeofence ? 'success' : 'error'}`}>
                {isInsideGeofence ? '✅ Inside Campus' : '❌ Outside Campus'}
              </span>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-1">
              {latitude && longitude && (
                <p>
                  Your Location: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </p>
              )}
              <p>
                Classroom Center: 10.416229, 77.899375 (Your Classroom)
              </p>
              {distanceFromGeofence && (
                <p>
                  Distance from classroom: {Math.round(distanceFromGeofence)}m
                </p>
              )}
              {accuracy && (
                <p>
                  GPS Accuracy: ±{Math.round(accuracy)}m
                </p>
              )}
              <p className="text-xs">
                Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={refreshLocation}
          variant="outline" 
          size="sm"
          className="w-full"
        >
          🔄 Refresh My Location
        </Button>
      </div>
    </Card>
  );
};
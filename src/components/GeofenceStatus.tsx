import React from 'react';
import { MapPin, Shield, AlertTriangle } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Card } from '@/components/ui/card';

export const GeofenceStatus: React.FC = () => {
  const { isInsideGeofence, latitude, longitude, accuracy, loading, error } = useGeolocation();

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

  if (error) {
    return (
      <Card className="p-4 attendance-card border-error/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-error" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-error">Location Access Denied</p>
            <p className="text-sm text-muted-foreground">
              Please enable location services to mark attendance
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 attendance-card">
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
                Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </p>
            )}
            {accuracy && (
              <p>
                Accuracy: ±{Math.round(accuracy)}m
              </p>
            )}
            <p className="text-xs">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
import { useState, useEffect, useCallback, useRef } from 'react';
import { geolocationService, Location, GeofenceArea } from '@/utils/geolocation';

export interface GeolocationState {
  loading: boolean;
  accuracy: number | null;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  timestamp: number | null;
}

export interface GeolocationError {
  code: number;
  message: string;
}

export const useGeolocation = (geofenceArea?: GeofenceArea, options?: PositionOptions) => {
  const [state, setState] = useState<GeolocationState>({
    loading: true,
    accuracy: null,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    latitude: null,
    longitude: null,
    speed: null,
    timestamp: null,
  });
  const [error, setError] = useState<GeolocationError | null>(null);
  const [isInsideGeofence, setIsInsideGeofence] = useState(false);
  const [distanceFromGeofence, setDistanceFromGeofence] = useState<number | null>(null);
  const locationHistoryRef = useRef<Location[]>([]);

  // Use provided geofence or get active registered location
  const getActiveGeofence = (): GeofenceArea | null => {
    if (geofenceArea) return geofenceArea;
    return geolocationService.getActiveGeofenceArea();
  };

  const [activeGeofence, setActiveGeofence] = useState<GeofenceArea | null>(getActiveGeofence());

  // Update active geofence when registered locations change
  useEffect(() => {
    const updateGeofence = () => {
      const newGeofence = getActiveGeofence();
      setActiveGeofence(newGeofence);
    };
    
    // Listen for storage changes (when locations are updated)
    window.addEventListener('storage', updateGeofence);
    
    return () => {
      window.removeEventListener('storage', updateGeofence);
    };
  }, [geofenceArea]);

  const onLocationUpdate = useCallback((location: Location) => {
    setState({
      loading: false,
      accuracy: location.accuracy || null,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      latitude: location.latitude,
      longitude: location.longitude,
      speed: null,
      timestamp: location.timestamp,
    });

    // Add to location history for anti-spoofing
    locationHistoryRef.current.push(location);
    if (locationHistoryRef.current.length > 10) {
      locationHistoryRef.current.shift(); // Keep only last 10 locations
    }

    // Check geofence if available
    if (activeGeofence) {
      const isInside = geolocationService.isWithinGeofence(location, activeGeofence);
      const distance = geolocationService.getDistanceFromGeofence(location, activeGeofence);
      
      setIsInsideGeofence(isInside);
      setDistanceFromGeofence(distance);
    } else {
      setIsInsideGeofence(false);
      setDistanceFromGeofence(null);
    }

    // Anti-spoofing check
    if (geolocationService.detectLocationSpoofing(locationHistoryRef.current)) {
      setError({
        code: 999,
        message: 'Location spoofing detected. Please ensure GPS is enabled and location services are authentic.',
      });
    }
  }, [activeGeofence]);

  const onLocationError = useCallback((error: GeolocationPositionError) => {
    setError({
      code: error.code,
      message: error.message,
    });
    setState(s => ({
      ...s,
      loading: false,
    }));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by this browser.',
      });
      setState(s => ({
        ...s,
        loading: false,
      }));
      return;
    }

    // Clear any previous errors
    setError(null);

    // Check permission first before starting location watch
    const checkPermissionAndStart = async () => {
      try {
        console.log('Requesting geolocation permission...');
        
        // Try to get current position first to check permission
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              console.log('Geolocation success:', pos);
              resolve(pos);
            },
            (err) => {
              console.log('Geolocation error:', err);
              reject(err);
            },
            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 60000
            }
          );
        });

        // If we get here, permission is granted
        console.log('Setting location state with position:', position);
        setState({
          loading: false,
          accuracy: position.coords.accuracy || null,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speed: null,
          timestamp: position.timestamp,
        });

        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };

        onLocationUpdate(location);

        // Now start watching for updates
        geolocationService.startWatching();
        
        const unsubscribeLocation = geolocationService.onLocationUpdate(onLocationUpdate);
        const unsubscribeError = geolocationService.onLocationError(onLocationError);

        return () => {
          unsubscribeLocation();
          unsubscribeError();
          geolocationService.stopWatching();
        };
      } catch (error) {
        console.log('Geolocation permission error:', error);
        const geoError = error as GeolocationPositionError;
        onLocationError(geoError);
      }
    };

    const cleanup = checkPermissionAndStart();
    
    return () => {
      if (cleanup instanceof Promise) {
        cleanup.then(cleanupFn => cleanupFn?.());
      }
    };
  }, [onLocationUpdate, onLocationError]);

  const getCurrentPosition = useCallback(async () => {
    try {
      setState(s => ({ ...s, loading: true }));
      const location = await geolocationService.getCurrentPosition();
      onLocationUpdate(location);
      return location;
    } catch (err) {
      const error = err as GeolocationPositionError;
      onLocationError(error);
      throw error;
    }
  }, [onLocationUpdate, onLocationError]);

  return { 
    ...state, 
    error, 
    isInsideGeofence, 
    distanceFromGeofence,
    getCurrentPosition,
    locationHistory: locationHistoryRef.current,
    activeGeofence,
    hasActiveLocation: activeGeofence !== null,
  };
};
import { useState, useEffect, useCallback } from 'react';

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

const CLASSROOM_COORDS = { lat: 40.7128, lng: -74.0060 }; // Default NYC coordinates
const GEOFENCE_RADIUS = 100; // meters

// Haversine distance calculation
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

export const useGeolocation = (options?: PositionOptions) => {
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

  const onEvent = useCallback((event: GeolocationPosition) => {
    const { coords, timestamp } = event;
    setState({
      loading: false,
      accuracy: coords.accuracy,
      altitude: coords.altitude,
      altitudeAccuracy: coords.altitudeAccuracy,
      heading: coords.heading,
      latitude: coords.latitude,
      longitude: coords.longitude,
      speed: coords.speed,
      timestamp,
    });

    // Check geofence
    if (coords.latitude && coords.longitude) {
      const distance = calculateDistance(
        coords.latitude,
        coords.longitude,
        CLASSROOM_COORDS.lat,
        CLASSROOM_COORDS.lng
      );
      setIsInsideGeofence(distance <= GEOFENCE_RADIUS);
    }
  }, []);

  const onEventError = useCallback((error: GeolocationPositionError) => {
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

    const watchId = navigator.geolocation.watchPosition(
      onEvent,
      onEventError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        ...options,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [onEvent, onEventError, options]);

  return { ...state, error, isInsideGeofence };
};
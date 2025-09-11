import { getDistance } from 'geolib';

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export interface GeofenceArea {
  id: string;
  name: string;
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number; // in meters
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisteredLocation {
  id: string;
  locationName: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class GeolocationService {
  private watchId: number | null = null;
  private currentPosition: Location | null = null;
  private callbacks: ((location: Location) => void)[] = [];
  private errorCallbacks: ((error: GeolocationPositionError) => void)[] = [];
  private registeredLocations: RegisteredLocation[] = [];
  private activeLocationId: string | null = null;

  constructor() {
    this.checkGeolocationSupport();
    this.loadRegisteredLocations();
  }

  private checkGeolocationSupport(): boolean {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser.');
      return false;
    }
    return true;
  }

  async getCurrentPosition(): Promise<Location> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
          };
          this.currentPosition = location;
          resolve(location);
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: false, // More lenient for laptops
          timeout: 15000, // Longer timeout for laptops
          maximumAge: 300000, // 5 minutes cache
        }
      );
    });
  }

  startWatching(): void {
    if (!navigator.geolocation || this.watchId !== null) {
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        };
        
        this.currentPosition = location;
        this.callbacks.forEach(callback => callback(location));
      },
      (error) => {
        console.error('Geolocation error:', error);
        this.errorCallbacks.forEach(callback => callback(error));
      },
      {
        enableHighAccuracy: false, // More lenient for laptops
        timeout: 20000, // Longer timeout for laptops
        maximumAge: 300000, // 5 minutes cache
      }
    );
  }

  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  onLocationUpdate(callback: (location: Location) => void): () => void {
    this.callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  onLocationError(callback: (error: GeolocationPositionError) => void): () => void {
    this.errorCallbacks.push(callback);
    
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  isWithinGeofence(location: Location, geofence: GeofenceArea): boolean {
    const distance = getDistance(
      { latitude: location.latitude, longitude: location.longitude },
      { latitude: geofence.center.latitude, longitude: geofence.center.longitude }
    );
    
    return distance <= geofence.radius;
  }

  getDistanceFromGeofence(location: Location, geofence: GeofenceArea): number {
    return getDistance(
      { latitude: location.latitude, longitude: location.longitude },
      { latitude: geofence.center.latitude, longitude: geofence.center.longitude }
    );
  }

  getCurrentLocation(): Location | null {
    return this.currentPosition;
  }

  // Anti-spoofing checks
  validateLocationAccuracy(location: Location): boolean {
    // Reject locations with very poor accuracy (> 100m)
    return location.accuracy ? location.accuracy <= 100 : false;
  }

  detectLocationSpoofing(locations: Location[]): boolean {
    if (locations.length < 2) return false;

    // Check for impossible speed (teleportation detection)
    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i - 1];
      const curr = locations[i];
      
      const distance = getDistance(
        { latitude: prev.latitude, longitude: prev.longitude },
        { latitude: curr.latitude, longitude: curr.longitude }
      );
      
      const timeDiff = (curr.timestamp - prev.timestamp) / 1000; // seconds
      const speed = distance / timeDiff; // m/s
      
      // Flag if speed > 50 m/s (180 km/h) - impossible for walking workers
      if (speed > 50) {
        return true;
      }
    }

    return false;
  }

  // Location Registration Methods
  private loadRegisteredLocations(): void {
    try {
      const stored = localStorage.getItem('registeredLocations');
      if (stored) {
        this.registeredLocations = JSON.parse(stored);
      }
      
      const activeId = localStorage.getItem('activeLocationId');
      if (activeId) {
        this.activeLocationId = activeId;
      }
    } catch (error) {
      console.error('Error loading registered locations:', error);
      this.registeredLocations = [];
    }
  }

  private saveRegisteredLocations(): void {
    try {
      localStorage.setItem('registeredLocations', JSON.stringify(this.registeredLocations));
      if (this.activeLocationId) {
        localStorage.setItem('activeLocationId', this.activeLocationId);
      }
    } catch (error) {
      console.error('Error saving registered locations:', error);
    }
  }

  registerLocation(locationName: string, latitude: number, longitude: number, radiusMeters: number = 100): RegisteredLocation {
    const now = new Date().toISOString();
    const newLocation: RegisteredLocation = {
      id: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      locationName,
      latitude,
      longitude,
      radiusMeters,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    // Deactivate other locations if this is the first or if specified
    this.registeredLocations.forEach(loc => loc.isActive = false);
    
    this.registeredLocations.push(newLocation);
    this.activeLocationId = newLocation.id;
    this.saveRegisteredLocations();
    
    return newLocation;
  }

  getRegisteredLocations(): RegisteredLocation[] {
    return [...this.registeredLocations];
  }

  getActiveLocation(): RegisteredLocation | null {
    return this.registeredLocations.find(loc => loc.id === this.activeLocationId) || null;
  }

  setActiveLocation(locationId: string): boolean {
    const location = this.registeredLocations.find(loc => loc.id === locationId);
    if (!location) return false;

    // Deactivate all locations
    this.registeredLocations.forEach(loc => loc.isActive = false);
    
    // Activate selected location
    location.isActive = true;
    location.updatedAt = new Date().toISOString();
    this.activeLocationId = locationId;
    
    this.saveRegisteredLocations();
    return true;
  }

  updateLocation(locationId: string, updates: Partial<Omit<RegisteredLocation, 'id' | 'createdAt'>>): boolean {
    const location = this.registeredLocations.find(loc => loc.id === locationId);
    if (!location) return false;

    Object.assign(location, updates, { updatedAt: new Date().toISOString() });
    this.saveRegisteredLocations();
    return true;
  }

  deleteLocation(locationId: string): boolean {
    const index = this.registeredLocations.findIndex(loc => loc.id === locationId);
    if (index === -1) return false;

    this.registeredLocations.splice(index, 1);
    
    if (this.activeLocationId === locationId) {
      this.activeLocationId = this.registeredLocations.length > 0 ? this.registeredLocations[0].id : null;
      if (this.registeredLocations.length > 0) {
        this.registeredLocations[0].isActive = true;
      }
    }
    
    this.saveRegisteredLocations();
    return true;
  }

  getActiveGeofenceArea(): GeofenceArea | null {
    const activeLocation = this.getActiveLocation();
    if (!activeLocation) return null;

    return {
      id: activeLocation.id,
      name: activeLocation.locationName,
      center: {
        latitude: activeLocation.latitude,
        longitude: activeLocation.longitude
      },
      radius: activeLocation.radiusMeters,
      isActive: activeLocation.isActive,
      createdAt: activeLocation.createdAt,
      updatedAt: activeLocation.updatedAt
    };
  }

  // Helper method to convert RegisteredLocation to GeofenceArea
  locationToGeofence(location: RegisteredLocation): GeofenceArea {
    return {
      id: location.id,
      name: location.locationName,
      center: {
        latitude: location.latitude,
        longitude: location.longitude
      },
      radius: location.radiusMeters,
      isActive: location.isActive,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt
    };
  }
}

// Singleton instance
export const geolocationService = new GeolocationService();

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Plus, Trash2, CheckCircle, Circle, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { geolocationService, RegisteredLocation } from '@/utils/geolocation';
import { useGeolocation } from '@/hooks/useGeolocation';

const LocationRegistration = () => {
  const [locations, setLocations] = useState<RegisteredLocation[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: '',
    latitude: '',
    longitude: '',
    radius: '100'
  });
  const { toast } = useToast();
  const { latitude, longitude, loading: geoLoading, error: geoError } = useGeolocation();

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = () => {
    const registeredLocations = geolocationService.getRegisteredLocations();
    setLocations(registeredLocations);
  };

  const handleRegisterWindsurfOffice = () => {
    const windsurfLocation = {
      name: 'Windsurf AI Office',
      latitude: '10.416250437665107',
      longitude: '77.89942377920627',
      radius: '100'
    };
    
    handleRegisterLocation(windsurfLocation);
  };

  const handleRegisterCurrentLocation = () => {
    if (latitude && longitude) {
      setNewLocation({
        ...newLocation,
        latitude: latitude.toString(),
        longitude: longitude.toString()
      });
    } else {
      toast({
        title: "Location not available",
        description: "Please wait for GPS to acquire your current location or enter coordinates manually.",
        variant: "destructive"
      });
    }
  };

  const handleRegisterLocation = (locationData = newLocation) => {
    if (!locationData.name || !locationData.latitude || !locationData.longitude) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const lat = parseFloat(locationData.latitude);
    const lng = parseFloat(locationData.longitude);
    const radius = parseInt(locationData.radius) || 100;

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast({
        title: "Invalid coordinates",
        description: "Please enter valid latitude (-90 to 90) and longitude (-180 to 180) values.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsRegistering(true);
      const registered = geolocationService.registerLocation(locationData.name, lat, lng, radius);
      
      toast({
        title: "Location registered successfully",
        description: `${registered.locationName} has been registered as an attendance point with ${radius}m radius.`,
      });

      loadLocations();
      setNewLocation({ name: '', latitude: '', longitude: '', radius: '100' });
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "Failed to register location. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSetActive = (locationId: string) => {
    const success = geolocationService.setActiveLocation(locationId);
    if (success) {
      toast({
        title: "Active location updated",
        description: "The selected location is now active for attendance tracking.",
      });
      loadLocations();
    } else {
      toast({
        title: "Failed to update",
        description: "Could not set the location as active.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteLocation = (locationId: string) => {
    const success = geolocationService.deleteLocation(locationId);
    if (success) {
      toast({
        title: "Location deleted",
        description: "The location has been removed from registered locations.",
      });
      loadLocations();
    } else {
      toast({
        title: "Failed to delete",
        description: "Could not delete the location.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Location Registration</h1>
        <p className="text-muted-foreground">
          Register and manage attendance locations with geofencing capabilities.
        </p>
      </div>

      {/* Quick Register Windsurf AI Office */}
      <Card className="mb-6 border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <MapPin className="h-5 w-5" />
            Quick Register: Windsurf AI Office
          </CardTitle>
          <CardDescription>
            Register the official Windsurf AI Office location (Lat: 10.416250437665107, Lng: 77.89942377920627) 
            with a 100-meter geofence radius.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleRegisterWindsurfOffice}
            disabled={isRegistering}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Register Windsurf AI Office
          </Button>
        </CardContent>
      </Card>

      {/* Manual Location Registration */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Register New Location
          </CardTitle>
          <CardDescription>
            Add a new attendance location with custom coordinates and geofence radius.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="locationName">Location Name *</Label>
              <Input
                id="locationName"
                placeholder="e.g., Main Office, Site A"
                value={newLocation.name}
                onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="radius">Geofence Radius (meters) *</Label>
              <Input
                id="radius"
                type="number"
                placeholder="100"
                value={newLocation.radius}
                onChange={(e) => setNewLocation({ ...newLocation, radius: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Latitude *</Label>
              <Input
                id="latitude"
                placeholder="e.g., 10.416250437665107"
                value={newLocation.latitude}
                onChange={(e) => setNewLocation({ ...newLocation, latitude: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude *</Label>
              <Input
                id="longitude"
                placeholder="e.g., 77.89942377920627"
                value={newLocation.longitude}
                onChange={(e) => setNewLocation({ ...newLocation, longitude: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleRegisterCurrentLocation}
              variant="outline"
              disabled={geoLoading || !latitude || !longitude}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Use Current Location
            </Button>
            <Button
              onClick={() => handleRegisterLocation()}
              disabled={isRegistering}
            >
              <Plus className="h-4 w-4 mr-2" />
              Register Location
            </Button>
          </div>

          {geoError && (
            <p className="text-sm text-red-600">
              GPS Error: {geoError.message}
            </p>
          )}
          
          {latitude && longitude && (
            <p className="text-sm text-green-600">
              Current GPS: {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Registered Locations List */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Locations ({locations.length})</CardTitle>
          <CardDescription>
            Manage your registered attendance locations. Only one location can be active at a time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No locations registered yet.</p>
              <p className="text-sm">Register your first location above to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className={`p-4 border rounded-lg ${
                    location.isActive ? 'border-green-200 bg-green-50/50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{location.locationName}</h3>
                        {location.isActive ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <Circle className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          <strong>Coordinates:</strong> {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                        </p>
                        <p>
                          <strong>Geofence Radius:</strong> {location.radiusMeters}m
                        </p>
                        <p>
                          <strong>Created:</strong> {new Date(location.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {!location.isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetActive(location.id)}
                        >
                          Set Active
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteLocation(location.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationRegistration;

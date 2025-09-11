import { geolocationService } from './geolocation';

/**
 * Automatically register the Windsurf AI Office location if it doesn't exist
 */
export const setupWindsurfOfficeLocation = (): void => {
  const existingLocations = geolocationService.getRegisteredLocations();
  
  // Check if Windsurf AI Office is already registered
  const windsurfOfficeExists = existingLocations.some(
    location => location.locationName.toLowerCase().includes('windsurf ai office')
  );
  
  if (!windsurfOfficeExists) {
    console.log('Registering Windsurf AI Office location...');
    
    const windsurfLocation = geolocationService.registerLocation(
      'Windsurf AI Office',
      10.416250437665107,
      77.89942377920627,
      100
    );
    
    console.log('Windsurf AI Office registered successfully:', windsurfLocation);
  } else {
    console.log('Windsurf AI Office location already exists');
  }
};

/**
 * Get the current active location info for display
 */
export const getActiveLocationInfo = () => {
  const activeLocation = geolocationService.getActiveLocation();
  if (!activeLocation) {
    return {
      hasActiveLocation: false,
      message: 'No active attendance location set. Please register a location first.',
      location: null
    };
  }
  
  return {
    hasActiveLocation: true,
    message: `Active location: ${activeLocation.locationName} (${activeLocation.radiusMeters}m radius)`,
    location: activeLocation
  };
};

import { useState, useEffect, useCallback } from 'react';
import { locationService, LocationData } from '../services/locationService';

export const useLocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loadingLocation, setLoadingLocation] = useState<boolean>(true);

  const fetchLocation = useCallback(async () => {
    setLoadingLocation(true);
    try {
      const loc = await locationService.getCurrentLocation();
      setLocation(loc);
    } catch (error) {
      console.warn('No se pudo determinar la ubicación del dispositivo:', error);
      setLocation(null);
    } finally {
      setLoadingLocation(false);
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return { location, loadingLocation, refreshLocation: fetchLocation };
};

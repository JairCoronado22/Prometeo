import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation, {
  type GeolocationResponse,
} from '@react-native-community/geolocation';

export interface LocationData {
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  source: 'gps' | 'ip' | 'fallback';
}

export const formatLocationLabel = (location: LocationData | null): string => {
  if (!location) {
    return 'Ubicación no disponible';
  }

  if (location.source === 'gps') {
    if (location.latitude === undefined || location.longitude === undefined) {
      return 'GPS';
    }

    return `GPS (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`;
  }

  const place = `${location.city}, ${location.country}`;
  return location.source === 'ip' ? `${place} (estimada por IP)` : `${place} (referencial)`;
};

export const locationService = {
  async requestPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Permiso de Ubicación',
          message: 'Prometeo utiliza tu ubicación para mostrar sugerencias de ejemplo por zona.',
          buttonPositive: 'Aceptar',
          buttonNegative: 'Cancelar',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Error al solicitar permiso de ubicación:', err);
      return false;
    }
  },

  async getCurrentLocation(): Promise<LocationData> {
    const hasPermission = await this.requestPermission();

    try {
      if (hasPermission) {
        Geolocation.setRNConfiguration({
          skipPermissionRequests: true,
          locationProvider: 'auto',
        });
        const position = await new Promise<GeolocationResponse>((resolve, reject) => {
          Geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 10000,
          });
        });

        const { latitude, longitude } = position.coords;
        return {
          city: '',
          country: '',
          latitude,
          longitude,
          source: 'gps',
        };
      }
    } catch (error) {
      console.warn('No se pudo obtener la ubicación GPS:', error);
    }

    try {
      const response = await fetch('http://ip-api.com/json');
      if (response.ok) {
        const data: {
          status?: string;
          city?: string;
          country?: string;
          lat?: number;
          lon?: number;
        } = await response.json();

        if (data.status === 'success' && data.city && data.country) {
          return {
            city: data.city,
            country: data.country,
            latitude: data.lat,
            longitude: data.lon,
            source: 'ip',
          };
        }
      } else {
        console.warn(`La ubicación por IP respondió con HTTP ${response.status}.`);
      }
    } catch (error) {
      console.warn('No se pudo obtener la ubicación aproximada por IP:', error);
    }

    return {
      city: 'Lima',
      country: 'Perú',
      latitude: -12.0464,
      longitude: -77.0428,
      source: 'fallback',
    };
  },
};

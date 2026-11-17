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
  precision?: 'precise' | 'approximate';
}

export interface LocationPermission {
  precise: boolean;
  approximate: boolean;
}

export const formatLocationLabel = (location: LocationData | null): string => {
  if (!location) {
    return 'Ubicación no disponible';
  }

  if (location.source === 'gps') {
    const accuracyLabel =
      location.precision === 'approximate' ? 'GPS aproximado' : 'GPS preciso';
    if (location.latitude === undefined || location.longitude === undefined) {
      return accuracyLabel;
    }

    return `${accuracyLabel} (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`;
  }

  const place = `${location.city}, ${location.country}`;
  return location.source === 'ip' ? `${place} (estimada por IP)` : `${place} (referencial)`;
};

export const locationService = {
  async requestPermission(): Promise<LocationPermission> {
    if (Platform.OS !== 'android') {
      return { precise: true, approximate: true };
    }

    try {
      const permissions = PermissionsAndroid.PERMISSIONS;
      const results = await PermissionsAndroid.requestMultiple([
        permissions.ACCESS_FINE_LOCATION,
        permissions.ACCESS_COARSE_LOCATION,
      ]);
      return {
        precise: results[permissions.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED,
        approximate:
          results[permissions.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED,
      };
    } catch (error) {
      console.log('[LocationService] Solicitud de permisos:', error);
      return { precise: false, approximate: false };
    }
  },

  async getCurrentLocation(): Promise<LocationData> {
    let permission: LocationPermission = { precise: false, approximate: false };
    try {
      permission = await this.requestPermission();
    } catch (error) {
      console.log('[LocationService] Permiso omitido:', error);
    }

    try {
      if (permission.precise || permission.approximate) {
        Geolocation.setRNConfiguration({
          skipPermissionRequests: true,
          locationProvider: 'auto',
        });
        const position = await new Promise<GeolocationResponse>((resolve, reject) => {
          Geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: permission.precise,
            timeout: 4000,
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
          precision: permission.precise ? 'precise' : 'approximate',
        };
      }
    } catch (error) {
      console.log('[LocationService] GPS no disponible o tiempo agotado, usando IP fallback:', error);
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
      }
    } catch (error) {
      console.log('[LocationService] Fallback IP no disponible:', error);
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

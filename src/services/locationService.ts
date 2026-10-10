import { PermissionsAndroid, Platform } from 'react-native';

export interface LocationData {
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export const locationService = {
  async requestPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Permiso de Ubicación',
          message: 'SongFinder utiliza tu ubicación para mostrar tendencias musicales de tu zona.',
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
      if (hasPermission && typeof navigator !== 'undefined' && navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 10000,
          });
        });

        const { latitude, longitude } = position.coords;
        return {
          city: 'Lima',
          country: 'Perú',
          latitude,
          longitude,
        };
      }
    } catch {
      // Fallback a servicio de geolocalización IP
    }

    try {
      const response = await fetch('http://ip-api.com/json');
      if (response.ok) {
        const data = await response.json();
        return {
          city: data.city || 'Lima',
          country: data.country || 'Perú',
          latitude: data.lat,
          longitude: data.lon,
        };
      }
    } catch {
      // Fallback predeterminado
    }

    return {
      city: 'Lima',
      country: 'Perú',
      latitude: -12.0464,
      longitude: -77.0428,
    };
  },
};

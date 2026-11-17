import PushNotification from 'react-native-push-notification';
import { Platform } from 'react-native';
import { apoloApi } from '../api/apoloApi';

/**
 * Servicio de notificaciones push para React Native.
 * Combina notificaciones locales (inmediatas) con registro de token en el backend.
 * El backend almacena los tokens de dispositivo y puede enviar notificaciones push.
 */

// Token local que identifica este dispositivo en el backend
let deviceToken: string | null = null;

/**
 * Genera un token único para este dispositivo.
 * En producción, esto sería el token FCM real.
 * Para notificaciones locales, usamos un ID generado localmente.
 */
function generateDeviceToken(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `device_${timestamp}_${random}`;
}

/**
 * Registra el token del dispositivo en el backend.
 */
export async function registerDeviceToken(
  userUsername: string,
  platform: string = Platform.OS
): Promise<any> {
  if (!deviceToken) {
    deviceToken = generateDeviceToken();
  }

  try {
    const result = await apoloApi.registerDeviceToken(deviceToken, userUsername, platform);
    console.log('[PushNotification] Token registrado en backend:', result);
    return result;
  } catch (error) {
    console.error('[PushNotification] Error al registrar token en backend:', error);
    throw error;
  }
}

/**
 * Desregistra el token del dispositivo en el backend.
 */
export async function unregisterDeviceToken(): Promise<void> {
  if (deviceToken) {
    try {
      await apoloApi.unregisterDeviceToken(deviceToken);
      console.log('[PushNotification] Token desregistrado del backend');
      deviceToken = null;
    } catch (error) {
      console.error('[PushNotification] Error al desregistrar token:', error);
    }
  }
}

/**
 * Obtiene el token del dispositivo actual.
 */
export function getDeviceToken(): string | null {
  return deviceToken;
}

// Configuración inicial
export function configureLocalNotifications() {
  PushNotification.configure({
    // Se llama cuando se hace clic en una notificación
    onNotification: (notification: any) => {
      console.log('[LocalNotification] Notificación recibida:', notification);
      // Aquí puedes navegar a una pantalla específica según el tipo de notificación
      notification.finish && notification.finish(2); // 2 = NoData
    },

    // Permite a los usuarios agendar notificaciones desde el JS
    permissions: {
      alert: true,
      badge: true,
      sound: true,
    },

    // PopInitialNotification para iOS
    popInitialNotification: true,

    // Request permissions (iOS only)
    requestPermissions: Platform.OS === 'ios',
  });
}

/**
 * Crea y muestra una notificación local inmediata.
 */
export function createNotification(params: {
  id?: number;
  title: string;
  message: string;
  subtitle?: string;
  sound?: string;
  number?: number;
  data?: object;
}) {
  const { id = Math.floor(Math.random() * 10000), title, message, ...rest } = params;

  PushNotification.localNotification({
    channelId: 'songfinder-channel',
    id,
    title,
    message,
    bigText: message,
    userInfo: rest.data || {},
  } as any);

  console.log(`[LocalNotification] Notificación creada: ${title}`);
  return id;
}

/**
 * Agenda una notificación para un momento futuro.
 */
export function scheduleNotification(params: {
  id?: number;
  title: string;
  message: string;
  date: Date;
  sound?: string;
  data?: object;
}) {
  const { id = Math.floor(Math.random() * 10000), title, message, date, ...rest } = params;

  PushNotification.localNotificationSchedule({
    channelId: 'songfinder-channel',
    id,
    title,
    message,
    bigText: message,
    number: 1,
    date,
    userInfo: rest.data || {},
  } as any);

  console.log(`[LocalNotification] Notificación agendada para: ${date.toISOString()}`);
  return id;
}

/**
 * Cancela una notificación por su ID.
 */
export function cancelNotification(id: number) {
  PushNotification.cancelLocalNotification(String(id));
  console.log(`[LocalNotification] Notificación cancelada: ${id}`);
}

/**
 * Cancela todas las notificaciones locales.
 */
export function cancelAllNotifications() {
  PushNotification.cancelAllLocalNotifications();
  console.log('[LocalNotification] Todas las notificaciones canceladas');
}

/**
 * Crea el canal de notificaciones para Android 8+.
 */
export function createNotificationChannel() {
  PushNotification.createChannel(
    {
      channelId: 'songfinder-channel',
      channelName: 'SongFinder',
      channelDescription: 'Notificaciones de SongFinder',
      playSound: true,
      soundName: 'default',
      importance: 4,
      vibrate: true,
    },
    (created: any) => console.log(`[LocalNotification] Canal creado: ${created}`)
  );
}

/**
 * Envía una notificación de prueba: local + notifica al backend.
 */
export async function sendTestNotification(userUsername?: string) {
  // Notificación local inmediata
  createNotification({
    title: 'SongFinder',
    message: '¡Notificación de prueba! Las notificaciones push están funcionando correctamente.',
  });

  // Notificar al backend para que registre el evento
  if (userUsername && userUsername !== 'Invitado') {
    try {
      await apoloApi.sendTestNotification(userUsername);
      console.log('[PushNotification] Backend notificado de prueba');
    } catch (error) {
      console.error('[PushNotification] Error al notificar backend:', error);
    }
  }
}

/**
 * Envía una notificación de bienvenida al usuario.
 */
export function sendWelcomeNotification(username: string) {
  createNotification({
    title: '¡Bienvenido!',
    message: `Hola ${username}, las notificaciones de SongFinder están activas.`,
  });
}

/**
 * Envía una notificación cuando se detecta una canción.
 */
export async function sendSongDetectedNotification(
  songTitle: string,
  artist: string,
  userUsername?: string
) {
  createNotification({
    title: '🎵 Canción detectada',
    message: `${songTitle} - ${artist}`,
  });

  // Notificar al backend
  if (userUsername && userUsername !== 'Invitado') {
    try {
      await apoloApi.sendSongNotification(userUsername, songTitle, artist);
      console.log('[PushNotification] Backend notificado de canción detectada');
    } catch (error) {
      console.error('[PushNotification] Error al notificar backend:', error);
    }
  }
}

export const localNotificationService = {
  configureLocalNotifications,
  createNotification,
  scheduleNotification,
  cancelNotification,
  cancelAllNotifications,
  createNotificationChannel,
  sendTestNotification,
  sendWelcomeNotification,
  sendSongDetectedNotification,
  registerDeviceToken,
  unregisterDeviceToken,
  getDeviceToken,
};

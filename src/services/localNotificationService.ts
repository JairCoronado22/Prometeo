import PushNotification from 'react-native-push-notification';
import { Platform, NativeModules } from 'react-native';
import { apoloApi } from '../api/apoloApi';

let deviceToken: string | null = null;

function generateDeviceToken(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `device_${timestamp}_${random}`;
}

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
    console.log('[PushNotification] Error al registrar token en backend:', error);
    return null;
  }
}

export async function unregisterDeviceToken(): Promise<void> {
  if (deviceToken) {
    try {
      await apoloApi.unregisterDeviceToken(deviceToken);
      console.log('[PushNotification] Token desregistrado del backend');
      deviceToken = null;
    } catch (error) {
      console.log('[PushNotification] Error al desregistrar token:', error);
    }
  }
}

export function getDeviceToken(): string | null {
  return deviceToken;
}

export function configureLocalNotifications() {
  try {
    if (Platform.OS === 'android' && !NativeModules.RNPushNotification) {
      console.log('[LocalNotification] Módulo nativo RNPushNotification no disponible. Modo degradado seguro.');
      return;
    }

    PushNotification.configure({
      onNotification: (notification: any) => {
        console.log('[LocalNotification] Notificación recibida:', notification);
        notification?.finish && notification.finish(2);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: false,
      requestPermissions: Platform.OS === 'ios',
    });
  } catch (error) {
    console.log('[LocalNotification] Error al configurar notificaciones:', error);
  }
}

export function createNotification(params: {
  id?: number;
  title: string;
  message: string;
  subtitle?: string;
  sound?: string;
  number?: number;
  data?: object;
}) {
  try {
    if (Platform.OS === 'android' && !NativeModules.RNPushNotification) {
      console.log(`[LocalNotification Simulado]: ${params.title} - ${params.message}`);
      return params.id || 1;
    }

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
  } catch (e) {
    console.log('[LocalNotification] Fallo al crear notificación:', e);
    return params.id || 1;
  }
}

export function scheduleNotification(params: {
  id?: number;
  title: string;
  message: string;
  date: Date;
  sound?: string;
  data?: object;
}) {
  try {
    if (Platform.OS === 'android' && !NativeModules.RNPushNotification) {
      return params.id || 1;
    }

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

    return id;
  } catch (e) {
    console.log('[LocalNotification] Fallo al agendar notificación:', e);
    return params.id || 1;
  }
}

export function cancelNotification(id: number) {
  try {
    if (Platform.OS === 'android' && !NativeModules.RNPushNotification) return;
    PushNotification.cancelLocalNotification(String(id));
  } catch (e) {
    console.log('[LocalNotification] Fallo al cancelar notificación:', e);
  }
}

export function cancelAllNotifications() {
  try {
    if (Platform.OS === 'android' && !NativeModules.RNPushNotification) return;
    PushNotification.cancelAllLocalNotifications();
  } catch (e) {
    console.log('[LocalNotification] Fallo al cancelar todas las notificaciones:', e);
  }
}

export function createNotificationChannel() {
  try {
    if (Platform.OS === 'android' && !NativeModules.RNPushNotification) return;
    PushNotification.createChannel(
      {
        channelId: 'songfinder-channel',
        channelName: 'Prometeo',
        channelDescription: 'Notificaciones de Prometeo',
        playSound: true,
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      (created: any) => console.log(`[LocalNotification] Canal creado: ${created}`)
    );
  } catch (e) {
    console.log('[LocalNotification] Fallo al crear canal de notificaciones:', e);
  }
}

export async function sendTestNotification(userUsername?: string) {
  createNotification({
    title: 'Prometeo',
    message: '¡Notificación de prueba! Las notificaciones están funcionando correctamente.',
  });

  if (userUsername && userUsername !== 'Invitado') {
    try {
      await apoloApi.sendTestNotification(userUsername);
    } catch (error) {
      console.log('[PushNotification] Error al notificar backend:', error);
    }
  }
}

export function sendWelcomeNotification(username: string) {
  createNotification({
    title: '¡Bienvenido!',
    message: `Hola ${username}, las notificaciones de Prometeo están activas.`,
  });
}

export async function sendSongDetectedNotification(
  songTitle: string,
  artist: string,
  userUsername?: string
) {
  createNotification({
    title: '🎵 Canción detectada',
    message: `${songTitle} - ${artist}`,
  });

  if (userUsername && userUsername !== 'Invitado') {
    try {
      await apoloApi.sendSongNotification(userUsername, songTitle, artist);
    } catch (error) {
      console.log('[PushNotification] Error al notificar backend:', error);
    }
  }
}

export async function sendRecommendationsReadyNotification(
  songTitle: string,
  count: number,
  userUsername?: string
) {
  createNotification({
    title: '🎵 Recomendaciones listas',
    message: `¡Listo! Encontramos ${count} canciones similares para "${songTitle}".`,
  });

  if (userUsername && userUsername !== 'Invitado') {
    try {
      await apoloApi.sendSongNotification(userUsername, songTitle, `Recomendaciones listas (${count})`);
    } catch (error) {
      console.log('[PushNotification] Error al notificar backend de recomendaciones:', error);
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
  sendRecommendationsReadyNotification,
  registerDeviceToken,
  unregisterDeviceToken,
  getDeviceToken,
};

import PushNotification from 'react-native-push-notification';
import { Platform } from 'react-native';
import { apoloApi } from '../api/apoloApi';

let deviceToken: string | null = null;
let channelInitialized = false;

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

export interface RecommendedSongPayload {
  type: 'song-recommendation';
  songName: string;
  songArtist: string;
}

type NotificationTapHandler = (payload: RecommendedSongPayload) => void;
let notificationTapHandler: NotificationTapHandler | null = null;

/** MainScreen registra aquí qué hacer al tocar una notificación de recomendación. */
export function setNotificationTapHandler(handler: NotificationTapHandler | null) {
  notificationTapHandler = handler;
}

function extractRecommendation(notification: any): RecommendedSongPayload | null {
  const data = notification?.data ?? notification?.userInfo ?? {};
  if (data?.type === 'song-recommendation' && data.songName && data.songArtist) {
    return { type: 'song-recommendation', songName: data.songName, songArtist: data.songArtist };
  }
  return null;
}

export function configureLocalNotifications() {
  try {
    PushNotification.configure({
      onNotification: (notification: any) => {
        console.log('[LocalNotification] Notificación recibida:', notification);
        const payload = extractRecommendation(notification);
        if (payload && notification?.userInteraction && notificationTapHandler) {
          notificationTapHandler(payload);
        }
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
    createNotificationChannel();
  } catch (error) {
    console.log('[LocalNotification] Error al configurar notificaciones:', error);
  }
}

export function createNotificationChannel() {
  if (channelInitialized) return;
  try {
    PushNotification.createChannel(
      {
        channelId: 'songfinder-channel',
        channelName: 'Prometeo',
        channelDescription: 'Notificaciones de la aplicación Prometeo',
        playSound: true,
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      (created: boolean) => {
        channelInitialized = true;
        console.log(`[LocalNotification] Canal nativo creado/verificado: ${created}`);
      }
    );
  } catch (e) {
    console.log('[LocalNotification] Error al crear canal:', e);
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
    createNotificationChannel();

    const notifId = params.id || Math.floor(Math.random() * 100000);

    PushNotification.localNotification({
      channelId: 'songfinder-channel',
      id: notifId,
      title: params.title,
      message: params.message,
      bigText: params.message,
      subText: params.subtitle || 'Prometeo',
      vibrate: true,
      vibration: 300,
      playSound: true,
      soundName: 'default',
      priority: 'high',
      importance: 'high',
      userInfo: params.data || {},
    } as any);

    console.log(`[LocalNotification] Notificación real enviada a Android: ${params.title}`);
    return notifId;
  } catch (e) {
    console.log('[LocalNotification] Fallo al disparar notificación:', e);
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
    createNotificationChannel();
    const notifId = params.id || Math.floor(Math.random() * 100000);

    PushNotification.localNotificationSchedule({
      channelId: 'songfinder-channel',
      id: notifId,
      title: params.title,
      message: params.message,
      bigText: params.message,
      number: 1,
      date: params.date,
      userInfo: params.data || {},
    } as any);

    return notifId;
  } catch (e) {
    console.log('[LocalNotification] Fallo al agendar notificación:', e);
    return params.id || 1;
  }
}

export function cancelNotification(id: number) {
  try {
    PushNotification.cancelLocalNotification(String(id));
  } catch (e) {
    console.log('[LocalNotification] Fallo al cancelar notificación:', e);
  }
}

export function cancelAllNotifications() {
  try {
    PushNotification.cancelAllLocalNotifications();
  } catch (e) {
    console.log('[LocalNotification] Fallo al cancelar todas las notificaciones:', e);
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
  const name = username && username !== 'Invitado' ? `, ${username}` : '';
  createNotification({
    title: `🎧 ¡Bienvenido a Prometeo${name}!`,
    message: 'Toca 🎲 o agita el teléfono y te recomendamos una canción.',
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

/**
 * Notificación local "Te recomendamos <canción>". Al tocarla, la app abre esa canción.
 * El aviso al backend es solo para el log y no bloquea.
 */
export function sendSongRecommendationNotification(
  songName: string,
  songArtist: string,
  userUsername?: string
) {
  const payload: RecommendedSongPayload = { type: 'song-recommendation', songName, songArtist };
  createNotification({
    title: '🎲 Te recomendamos',
    message: `${songName} — ${songArtist}. Toca para escucharla.`,
    data: payload,
  });

  if (userUsername) {
    apoloApi
      .sendSongNotification(userUsername, songName, songArtist)
      .catch((error) => console.log('[PushNotification] Backend no registró la recomendación:', error));
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
  sendSongRecommendationNotification,
  setNotificationTapHandler,
  registerDeviceToken,
  unregisterDeviceToken,
  getDeviceToken,
};

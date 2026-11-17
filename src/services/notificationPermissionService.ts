import { PermissionsAndroid, Platform } from 'react-native';

export type NotificationPermissionStatus =
  | 'granted'
  | 'denied'
  | 'blocked'
  | 'not-required'
  | 'unsupported';

const POST_NOTIFICATIONS = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;

export const notificationPermissionService = {
  async getStatus(): Promise<NotificationPermissionStatus> {
    if (Platform.OS !== 'android') {
      return 'unsupported';
    }

    if (Platform.Version < 33) {
      return 'not-required';
    }

    return (await PermissionsAndroid.check(POST_NOTIFICATIONS)) ? 'granted' : 'denied';
  },

  async requestPermission(): Promise<NotificationPermissionStatus> {
    const currentStatus = await this.getStatus();
    if (currentStatus !== 'denied') {
      return currentStatus;
    }

    const result = await PermissionsAndroid.request(POST_NOTIFICATIONS, {
      title: 'Permitir notificaciones',
      message: 'Prometeo necesita permiso para mostrar notificaciones en este dispositivo.',
      buttonPositive: 'Permitir',
      buttonNegative: 'Ahora no',
    });

    if (result === PermissionsAndroid.RESULTS.GRANTED) {
      return 'granted';
    }
    if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      return 'blocked';
    }
    return 'denied';
  },
};

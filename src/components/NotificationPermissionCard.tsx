import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  notificationPermissionService,
  NotificationPermissionStatus,
} from '../services/notificationPermissionService';
import { localNotificationService } from '../services/localNotificationService';
import { useAuth } from '../context/AuthContext';
import { cleanDisplayName } from '../utils/songDisplay';

const statusMessage: Record<
  NotificationPermissionStatus | 'checking' | 'error' | 'active' | 'registered',
  string
> = {
  granted: 'Notificaciones activas. Puedes recibir alertas de Prometeo.',
  active: 'Notificaciones locales activas.',
  registered: 'Token registrado en el backend. Notificaciones push activas.',
  denied: 'Actívalas y te recomendaremos canciones al azar con un toque 🎲',
  blocked: 'El permiso está bloqueado. Actívalo desde los ajustes de Android.',
  'not-required': 'Notificaciones locales activas.',
  unsupported: 'La solicitud de permiso está configurada actualmente para Android.',
  checking: 'Revisando permiso de notificaciones…',
  error: 'No se pudo revisar el permiso de notificaciones.',
};

interface NotificationPermissionCardProps {
  /** Elige una canción al azar y la envía como notificación. */
  onRecommend?: () => Promise<void> | void;
  recommending?: boolean;
  /** Última canción recomendada, para poder escucharla desde la app. */
  lastRecommendation?: { songName: string; songArtist: string } | null;
  onPlayRecommendation?: () => void;
}

export const NotificationPermissionCard: React.FC<NotificationPermissionCardProps> = ({
  onRecommend,
  recommending = false,
  lastRecommendation,
  onPlayRecommendation,
}) => {
  const [status, setStatus] = useState<
    NotificationPermissionStatus | 'checking' | 'error' | 'active' | 'registered'
  >('checking');
  const [requesting, setRequesting] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const { username } = useAuth();

  useEffect(() => {
    let active = true;
    notificationPermissionService
      .getStatus()
      .then((permissionStatus) => {
        if (active) {
          setStatus(permissionStatus);
          localNotificationService.createNotificationChannel();
          if (permissionStatus === 'granted' || permissionStatus === 'not-required') {
            if (username && username !== 'Invitado') {
              const token = localNotificationService.getDeviceToken();
              if (token) {
                setStatus('registered');
              } else {
                setStatus('active');
              }
            } else {
              setStatus('active');
            }
          }
        }
      })
      .catch((error: unknown) => {
        console.log('No se pudo revisar el permiso de notificaciones:', error);
        if (active) {
          setStatus('error');
        }
      });

    return () => {
      active = false;
    };
  }, [username]);

  const requestPermission = async () => {
    setRequesting(true);
    try {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      }

      const permissionStatus = await notificationPermissionService.requestPermission();
      setStatus(permissionStatus);

      localNotificationService.createNotificationChannel();

      // Solo se marca como activa si Android concedió el permiso (antes se marcaba siempre).
      const granted = permissionStatus === 'granted' || permissionStatus === 'not-required';
      if (!granted) {
        // se mantiene 'denied' / 'blocked' para que el botón "Activar" siga visible
      } else if (username && username !== 'Invitado') {
        try {
          await localNotificationService.registerDeviceToken(username);
          setStatus('registered');
        } catch (error) {
          console.log('[NotificationCard] Error al registrar token:', error);
          setStatus('active');
        }
      } else {
        setStatus('active');
      }

      if (permissionStatus === 'blocked') {
        Alert.alert(
          'Permiso bloqueado',
          'Activa las notificaciones de Prometeo desde los ajustes de Android.',
          [
            { text: 'Ahora no', style: 'cancel' },
            { text: 'Abrir ajustes', onPress: () => void Linking.openSettings() },
          ]
        );
      }
    } catch (error) {
      console.log('No se pudo solicitar el permiso de notificaciones:', error);
      setStatus('error');
    } finally {
      setRequesting(false);
    }
  };

  const recommend = async () => {
    setSendingTest(true);
    try {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      }

      localNotificationService.createNotificationChannel();
      if (onRecommend) {
        await onRecommend();
      } else {
        await localNotificationService.sendTestNotification(username);
      }
    } catch (error) {
      console.log('Error al enviar la recomendación:', error);
    } finally {
      setSendingTest(false);
    }
  };

  const isActive =
    status === 'granted' || status === 'active' || status === 'registered' || status === 'not-required';
  const busy = sendingTest || recommending;

  if (isActive) {
    return (
      <View style={styles.activeContainer}>
        <View style={styles.activeRow}>
          <Text style={styles.activeLabel}>🔔 Notificaciones activas</Text>
          <TouchableOpacity
            style={[styles.recommendButton, busy && styles.buttonBusy]}
            onPress={() => void recommend()}
            disabled={busy}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Recomiéndame una canción al azar"
          >
            {busy ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.recommendButtonText}>🎲 Recomiéndame una canción</Text>
            )}
          </TouchableOpacity>
        </View>
        {lastRecommendation && (
          <TouchableOpacity
            style={styles.lastRow}
            onPress={onPlayRecommendation}
            disabled={!onPlayRecommendation}
            activeOpacity={0.6}
            accessibilityRole="button"
            accessibilityLabel={`Escuchar ${lastRecommendation.songName}`}
          >
            <Text style={styles.lastText} numberOfLines={1}>
              Te recomendamos:{' '}
              <Text style={styles.lastSong}>
                {cleanDisplayName(lastRecommendation.songName)} — {cleanDisplayName(lastRecommendation.songArtist)}
              </Text>
            </Text>
            <Text style={styles.lastPlay}>Escuchar ▶</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.messageContainer}>
        <Text style={styles.title}>🔔 Notificaciones</Text>
        <Text style={styles.message}>{statusMessage[status]}</Text>
      </View>
      <View style={styles.buttonContainer}>
        {(status === 'denied' || status === 'blocked' || status === 'error') && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => void requestPermission()}
            disabled={requesting}
            accessibilityRole="button"
            accessibilityLabel="Permitir notificaciones"
          >
            <Text style={styles.buttonText}>{requesting ? '…' : 'Activar'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
  },
  messageContainer: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  message: {
    color: '#909090',
    fontSize: 10,
    marginTop: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    backgroundColor: '#1DB954',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  activeContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  activeRow: {
    gap: 8,
  },
  activeLabel: {
    color: '#B3B3B3',
    fontSize: 12,
  },
  recommendButton: {
    backgroundColor: '#4a90d9',
    borderRadius: 22,
    minHeight: 44,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonBusy: {
    opacity: 0.7,
  },
  recommendButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  lastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#333333',
    minHeight: 36,
  },
  lastText: {
    flex: 1,
    color: '#909090',
    fontSize: 12,
  },
  lastSong: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  lastPlay: {
    color: '#1DB954',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

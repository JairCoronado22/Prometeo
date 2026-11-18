import React, { useEffect, useState } from 'react';
import {
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

const statusMessage: Record<
  NotificationPermissionStatus | 'checking' | 'error' | 'active' | 'registered',
  string
> = {
  granted: 'Notificaciones activas. Puedes recibir alertas de Prometeo.',
  active: 'Notificaciones locales activas.',
  registered: 'Token registrado en el backend. Notificaciones push activas.',
  denied: 'Permite notificaciones para habilitarlas en el dispositivo.',
  blocked: 'El permiso está bloqueado. Actívalo desde los ajustes de Android.',
  'not-required': 'Notificaciones locales activas.',
  unsupported: 'La solicitud de permiso está configurada actualmente para Android.',
  checking: 'Revisando permiso de notificaciones…',
  error: 'No se pudo revisar el permiso de notificaciones.',
};

export const NotificationPermissionCard: React.FC = () => {
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

      if (username && username !== 'Invitado') {
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

  const sendTestNotification = async () => {
    setSendingTest(true);
    try {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      }

      localNotificationService.createNotificationChannel();
      await localNotificationService.sendTestNotification(username);
    } catch (error) {
      console.log('Error al enviar notificación de prueba:', error);
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.messageContainer}>
        <Text style={styles.title}>Notificaciones</Text>
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
        {(status === 'granted' || status === 'active' || status === 'registered' || status === 'not-required') && (
          <TouchableOpacity
            style={styles.testButton}
            onPress={() => void sendTestNotification()}
            disabled={sendingTest}
            accessibilityRole="button"
            accessibilityLabel="Enviar notificación de prueba"
          >
            <Text style={styles.testButtonText}>{sendingTest ? '…' : 'Probar'}</Text>
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
  testButton: {
    backgroundColor: '#4a90d9',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

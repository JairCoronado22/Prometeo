import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  notificationPermissionService,
  NotificationPermissionStatus,
} from '../services/notificationPermissionService';

const statusMessage: Record<NotificationPermissionStatus | 'checking' | 'error', string> = {
  granted: 'Permiso concedido. Apolo todavía no envía notificaciones push.',
  denied: 'Permite notificaciones para habilitarlas en el dispositivo.',
  blocked: 'El permiso está bloqueado. Actívalo desde los ajustes de Android.',
  'not-required': 'Esta versión de Android no requiere permiso de notificaciones.',
  unsupported: 'La solicitud de permiso está configurada actualmente para Android.',
  checking: 'Revisando permiso de notificaciones…',
  error: 'No se pudo revisar el permiso de notificaciones.',
};

export const NotificationPermissionCard: React.FC = () => {
  const [status, setStatus] = useState<NotificationPermissionStatus | 'checking' | 'error'>(
    'checking'
  );
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    let active = true;
    notificationPermissionService
      .getStatus()
      .then((permissionStatus) => {
        if (active) {
          setStatus(permissionStatus);
        }
      })
      .catch((error: unknown) => {
        console.warn('No se pudo revisar el permiso de notificaciones:', error);
        if (active) {
          setStatus('error');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const requestPermission = async () => {
    setRequesting(true);
    try {
      const permissionStatus = await notificationPermissionService.requestPermission();
      setStatus(permissionStatus);
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
      console.error('No se pudo solicitar el permiso de notificaciones:', error);
      setStatus('error');
      Alert.alert('Error', 'No se pudo solicitar el permiso de notificaciones.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.messageContainer}>
        <Text style={styles.title}>Notificaciones</Text>
        <Text style={styles.message}>{statusMessage[status]}</Text>
      </View>
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
});

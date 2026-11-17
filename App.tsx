import React, { useEffect } from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { localNotificationService } from './src/services/localNotificationService';

export default function App() {
  useEffect(() => {
    try {
      localNotificationService.configureLocalNotifications();
      localNotificationService.createNotificationChannel();
    } catch (e) {
      console.warn('[App] Error al inicializar notificaciones:', e);
    }
  }, []);

  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

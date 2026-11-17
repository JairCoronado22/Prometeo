import React, { useEffect } from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { localNotificationService } from './src/services/localNotificationService';

export default function App() {
  useEffect(() => {
    // Inicializar notificaciones locales al arrancar la app
    localNotificationService.configureLocalNotifications();
    localNotificationService.createNotificationChannel();
  }, []);

  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

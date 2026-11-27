import React, { createContext, useState, useContext, ReactNode } from 'react';
import { localNotificationService } from '../services/localNotificationService';

interface AuthContextType {
  username: string;
  setUsername: (user: string) => void;
  backendSyncEnabled: boolean;
  setBackendSyncEnabled: (enabled: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  username: 'Invitado',
  setUsername: () => {},
  backendSyncEnabled: false,
  setBackendSyncEnabled: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [username, setUsernameState] = useState<string>('Invitado');
  const [backendSyncEnabled, setBackendSyncEnabled] = useState(false);

  // Wrapper para setUsername que registra token y envía notificación de bienvenida
  const setUsername = (user: string) => {
    setUsernameState(user);
    if (user && user !== 'Invitado') {
      // Registrar token del dispositivo en el backend
      localNotificationService.registerDeviceToken(user).catch((error) => {
        console.error('[Auth] Error al registrar token en backend:', error);
      });
      // La bienvenida por notificación la envía MainScreen al entrar (también para Invitado).
    }
  };

  const logout = () => {
    // Desregistrar token del backend al cerrar sesión
    localNotificationService.unregisterDeviceToken().catch((error) => {
      console.error('[Auth] Error al desregistrar token:', error);
    });
    setUsernameState('Invitado');
    setBackendSyncEnabled(false);
  };

  return (
    <AuthContext.Provider
      value={{ username, setUsername, backendSyncEnabled, setBackendSyncEnabled, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


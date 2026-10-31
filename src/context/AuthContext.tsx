import React, { createContext, useState, useContext, ReactNode } from 'react';

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
  const [username, setUsername] = useState<string>('Invitado');
  const [backendSyncEnabled, setBackendSyncEnabled] = useState(false);

  const logout = () => {
    setUsername('Invitado');
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

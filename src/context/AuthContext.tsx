import React, { createContext, useState, useContext, ReactNode } from 'react';

interface AuthContextType {
  username: string;
  setUsername: (user: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  username: 'Invitado',
  setUsername: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState<string>('Invitado');

  const logout = () => {
    setUsername('Invitado');
  };

  return (
    <AuthContext.Provider value={{ username, setUsername, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

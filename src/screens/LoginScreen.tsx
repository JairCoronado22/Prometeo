import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { apoloApi } from '../api/apoloApi';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [inputUsername, setInputUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUsername } = useAuth();

  const handleLogin = async () => {
    const trimmedUser = inputUsername.trim();
    if (!trimmedUser) {
      Alert.alert('Atención', 'Ingresa un usuario');
      return;
    }

    setLoading(true);

    // Asignar sesión e ingresar inmediatamente a la pantalla principal
    setUsername(trimmedUser);
    navigation.replace('Main', { username: trimmedUser });

    // Sincronizar con el backend en segundo plano sin bloquear el flujo del usuario
    try {
      const existingUser = await apoloApi.getUser(trimmedUser);
      if (!existingUser) {
        await apoloApi.createUser({ username: trimmedUser });
      }
    } catch {
      // Sincronización transparente
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    setUsername('Invitado');
    navigation.replace('Main', { username: 'Invitado' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>P</Text>
          </View>
        </View>

        <Text style={styles.title}>Prometeus</Text>
        <Text style={styles.subtitle}>Millones de canciones en Prometeus.</Text>

        <TextInput
          style={styles.input}
          placeholder="Nombre de usuario"
          placeholderTextColor="#606060"
          value={inputUsername}
          onChangeText={setInputUsername}
          autoCapitalize="none"
          onSubmitEditing={handleLogin}
          returnKeyType="go"
        />

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>ENTRAR</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleGuest} style={styles.guestButton} activeOpacity={0.7}>
          <Text style={styles.guestText}>CONTINUAR COMO INVITADO</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 36,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1DB954',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#121212',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: 'bold',
    letterSpacing: -0.8,
  },
  subtitle: {
    color: '#909090',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 56,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 58,
    backgroundColor: '#222222',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
    color: '#FFFFFF',
    paddingHorizontal: 22,
    fontSize: 15,
    marginBottom: 20,
  },
  loginButton: {
    width: '100%',
    height: 58,
    backgroundColor: '#1DB954',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  guestButton: {
    marginTop: 32,
    padding: 8,
  },
  guestText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    opacity: 0.7,
  },
});

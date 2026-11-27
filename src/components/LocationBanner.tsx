import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  LayoutAnimation,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationData } from '../services/locationService';
import { SimilarSongDTO } from '../types';
import { SongItem } from './SongItem';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const OPEN_STATE_KEY = 'prometeo.localSongsOpen';

interface LocationBannerProps {
  location: LocationData | null;
  loading: boolean;
  onRefresh: () => void;
  songs: SimilarSongDTO[];
  onSelectSong?: (song: SimilarSongDTO) => void;
}

/**
 * Sin permiso de ubicación: tarjeta compacta para concederlo.
 * Con permiso (GPS): barra plegable "Canciones de tu zona" con flechita.
 */
export const LocationBanner: React.FC<LocationBannerProps> = ({
  location,
  loading,
  onRefresh,
  songs,
  onSelectSong,
}) => {
  const [open, setOpen] = useState(false);
  const askedOnce = useRef(false);
  const hasPermission = location?.source === 'gps';

  useEffect(() => {
    AsyncStorage.getItem(OPEN_STATE_KEY)
      .then((value) => setOpen(value === '1'))
      .catch(() => undefined);
  }, []);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((current) => {
      const next = !current;
      AsyncStorage.setItem(OPEN_STATE_KEY, next ? '1' : '0').catch(() => undefined);
      return next;
    });
  };

  const requestPermission = () => {
    if (askedOnce.current && !loading) {
      // Si ya se pidió y sigue sin permiso, probablemente está bloqueado: abrir ajustes.
      void Linking.openSettings();
      return;
    }
    askedOnce.current = true;
    onRefresh();
  };

  if (loading && !location) {
    return (
      <View style={[styles.bar, styles.barMuted]}>
        <ActivityIndicator size="small" color="#1DB954" />
        <Text style={styles.mutedText}>Buscando tu ubicación…</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.permissionCard}>
        <View style={styles.permissionText}>
          <Text style={styles.permissionTitle}>📍 Canciones de tu zona</Text>
          <Text style={styles.mutedText}>
            Activa la ubicación para ver sugerencias cerca de ti. No se envía a Apolo.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Permitir ubicación"
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.permissionButtonText}>Permitir</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.bar}>
        <TouchableOpacity
          style={styles.barToggle}
          onPress={toggle}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={`Canciones de tu zona, ${songs.length}. ${open ? 'Plegar' : 'Desplegar'}`}
        >
          <Text style={styles.arrow}>{open ? '▾' : '▸'}</Text>
          <Text style={styles.barTitle}>📍 Canciones de tu zona</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{songs.length}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={loading}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel="Actualizar ubicación"
          hitSlop={8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#909090" />
          ) : (
            <Text style={styles.refreshIcon}>↻</Text>
          )}
        </TouchableOpacity>
      </View>

      {open && (
        <View style={styles.list}>
          {location?.precision === 'approximate' && (
            <Text style={styles.precisionNotice}>
              Ubicación aproximada. Toca ↻ para pedir más precisión.
            </Text>
          )}
          {songs.map((song) => (
            <SongItem
              key={`${song.songName}-${song.artist}`}
              similarSong={song}
              onPress={onSelectSong ? () => onSelectSong(song) : undefined}
              style={styles.songItem}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    minHeight: 48,
    paddingLeft: 4,
    paddingRight: 8,
    gap: 8,
  },
  barMuted: {
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  barToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 10,
  },
  arrow: {
    color: '#1DB954',
    fontSize: 18,
    width: 20,
  },
  barTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  countBadge: {
    backgroundColor: '#1DB95433',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    color: '#1DB954',
    fontSize: 12,
    fontWeight: 'bold',
  },
  refreshButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIcon: {
    color: '#909090',
    fontSize: 20,
  },
  list: {
    marginTop: 8,
  },
  songItem: {
    marginBottom: 8,
  },
  permissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#1DB954',
  },
  permissionText: {
    flex: 1,
    paddingRight: 10,
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  permissionButton: {
    backgroundColor: '#1DB954',
    borderRadius: 8,
    minHeight: 44,
    minWidth: 88,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  mutedText: {
    color: '#909090',
    fontSize: 12,
    marginLeft: 0,
  },
  precisionNotice: {
    color: '#E8B923',
    fontSize: 11,
    marginBottom: 8,
  },
});

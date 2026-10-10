import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LocationData } from '../services/locationService';

interface LocationBannerProps {
  location: LocationData | null;
  loading: boolean;
  onRefresh: () => void;
}

export const LocationBanner: React.FC<LocationBannerProps> = ({
  location,
  loading,
  onRefresh,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>UBICACIÓN DEDUCIDA</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton} activeOpacity={0.7}>
          <Text style={styles.refreshText}>Actualizar GPS</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color="#1DB954" style={styles.loader} />
      ) : (
        <View style={styles.content}>
          <Text style={styles.locationTitle}>
            {location ? `${location.city}, ${location.country}` : 'Lima, Perú'}
          </Text>
          <Text style={styles.locationSubtitle}>
            Tendencias activas según tu localización geográfica
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 14,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#1DB954',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    backgroundColor: '#222222',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#1DB954',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  refreshButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  refreshText: {
    color: '#909090',
    fontSize: 12,
  },
  loader: {
    marginVertical: 8,
  },
  content: {
    marginTop: 2,
  },
  locationTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  locationSubtitle: {
    color: '#909090',
    fontSize: 12,
    marginTop: 2,
  },
});

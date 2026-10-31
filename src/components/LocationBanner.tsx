import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { formatLocationLabel, LocationData } from '../services/locationService';

interface LocationBannerProps {
  location: LocationData | null;
  loading: boolean;
  onRefresh: () => void;
  onRecommendByLocation?: () => void;
}

export const LocationBanner: React.FC<LocationBannerProps> = ({
  location,
  loading,
  onRefresh,
  onRecommendByLocation,
}) => {
  const locationString = formatLocationLabel(location);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>UBICACIÓN DEL DISPOSITIVO</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton} activeOpacity={0.7}>
          <Text style={styles.refreshText}>Actualizar ubicación</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color="#1DB954" style={styles.loader} />
      ) : (
        <View style={styles.contentRow}>
          <View style={styles.textContent}>
            <Text style={styles.locationTitle}>Tu ubicación</Text>
            <Text style={styles.locationSubtitle}>
              {locationString}
            </Text>
            <Text style={styles.locationDisclaimer}>
              Las sugerencias por zona son ejemplos locales, no tendencias consultadas a Apolo.
            </Text>
          </View>

          {onRecommendByLocation && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={onRecommendByLocation}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnText}>Ver sugerencias</Text>
            </TouchableOpacity>
          )}
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
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  textContent: {
    flex: 1,
    paddingRight: 10,
  },
  locationTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  locationSubtitle: {
    color: '#909090',
    fontSize: 12,
    marginTop: 2,
  },
  locationDisclaimer: {
    color: '#707070',
    fontSize: 10,
    marginTop: 4,
  },
  actionBtn: {
    backgroundColor: '#1DB954',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

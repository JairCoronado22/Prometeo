import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Song } from '../types';
import { apoloApi } from '../api/apoloApi';
import { useAuth } from '../context/AuthContext';
import { historyStorage } from '../services/historyStorage';
import { SongItem } from '../components/SongItem';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

export const HistoryScreen: React.FC<Props> = ({ navigation }) => {
  const [historySongs, setHistorySongs] = useState<Song[]>([]);
  const { username } = useAuth();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const songs = await historyStorage.getHistory();
    setHistorySongs(songs);
  };

  const deleteSong = async (song: Song) => {
    try {
      const userHistory = await apoloApi.getUserHistory(username);
      const matchingRecords = userHistory.filter(
        (record) =>
          record.song.id.songName === song.id.songName &&
          record.song.id.songArtist === song.id.songArtist
      );
      await Promise.all(matchingRecords.map((record) => apoloApi.deleteHistory(record.id)));
      await historyStorage.removeSong(song);
      setHistorySongs((current) =>
        current.filter(
          (item) =>
            item.id.songName !== song.id.songName ||
            item.id.songArtist !== song.id.songArtist
        )
      );
    } catch (error) {
      console.error('Error al eliminar canción del historial:', error);
      Alert.alert('No se pudo eliminar', 'Inténtalo de nuevo más tarde.' + error);
    }
  };

  const confirmDeleteSong = (song: Song) => {
    Alert.alert(
      'Eliminar canción',
      `¿Quieres eliminar "${song.id.songName}" del historial?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            void deleteSong(song);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial</Text>
      </View>

      <FlatList
        data={historySongs}
        keyExtractor={(item, index) => `${item.id.songName}-${index}`}
        renderItem={({ item }) => (
          <View style={styles.songRow}>
            <SongItem song={item} style={styles.songItem} />
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => confirmDeleteSong(item)}
              accessibilityRole="button"
              accessibilityLabel={`Eliminar ${item.id.songName} del historial`}
              activeOpacity={0.7}
            >
              <Text style={styles.deleteButtonText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay canciones guardadas en el historial.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonIcon: {
    color: '#FFFFFF',
    fontSize: 28,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#707070',
    fontSize: 14,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  songItem: {
    flex: 1,
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: '#3a1d1d',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 10,
    marginBottom: 10,
  },
  deleteButtonText: {
    color: '#ff6b6b',
    fontSize: 13,
    fontWeight: '600',
  },
});

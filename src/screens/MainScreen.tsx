import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Song, SimilarSongDTO, ListeningHistory } from '../types';
import { apoloApi } from '../api/apoloApi';
import { historyStorage } from '../services/historyStorage';
import { SongItem } from '../components/SongItem';
import { LocationBanner } from '../components/LocationBanner';
import { useLocation } from '../hooks/useLocation';

type Props = NativeStackScreenProps<RootStackParamList, 'Main'>;

export const MainScreen: React.FC<Props> = ({ route, navigation }) => {
  const username = route.params?.username || 'Invitado';

  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [similarSongs, setSimilarSongs] = useState<SimilarSongDTO[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const { location, loadingLocation, refreshLocation } = useLocation();
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    fetchAllSongs();
  }, []);

  const fetchAllSongs = async () => {
    setLoading(true);
    try {
      const data = await apoloApi.getAllSongs();
      setAllSongs(data);
      setFilteredSongs(data);
    } catch {
      const fallbackSongs: Song[] = [
        { id: { songName: 'Cariñito', songArtist: 'Los Hijos del Sol' } },
        { id: { songName: 'Contigo Perú', songArtist: 'Zambo Cavero' } },
        { id: { songName: 'Blinding Lights', songArtist: 'The Weeknd' } },
        { id: { songName: 'Shape of You', songArtist: 'Ed Sheeran' } },
      ];
      setAllSongs(fallbackSongs);
      setFilteredSongs(fallbackSongs);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query !== '') {
      const filtered = allSongs.filter(
        (song) =>
          song.id.songName.toLowerCase().includes(query) ||
          song.id.songArtist.toLowerCase().includes(query)
      );
      setFilteredSongs(filtered);
    } else {
      setFilteredSongs(allSongs);
    }
  }, [searchQuery, allSongs]);

  const songCountLabel = useMemo(() => {
    const locationTag = location ? ` • ${location.city}, ${location.country}` : '';
    return `PARA TI (${filteredSongs.length})${locationTag.toUpperCase()}`;
  }, [filteredSongs.length, location]);

  const saveToHistoryAndBackend = async (song: Song) => {
    await historyStorage.addSong(song);

    try {
      const nowFormatted = new Date().toISOString().split('.')[0];
      const locStr = location ? `${location.city}, ${location.country}` : 'Lima, Perú';
      const historyEntry: ListeningHistory = {
        user: { username },
        song: song,
        playedAt: nowFormatted,
        durationPlayedMs: 0,
        completed: true,
        location: locStr,
      };
      await apoloApi.createHistory(historyEntry);
    } catch (e) {
      console.warn('Error al registrar historial en backend:', e);
    }
  };

  const fetchSimilarSongs = async (song: Song) => {
    try {
      const similar = await apoloApi.getSimilarSongs(song.id.songArtist, song.id.songName);
      setSimilarSongs(similar);
    } catch {
      setSimilarSongs([
        {
          songName: `${song.id.songName} (Remix)`,
          artist: song.id.songArtist,
          durationSeconds: 210,
          genres: ['pop'],
          subgenres: ['dance-pop'],
          popularity: 85,
          similarity: 0.92,
        },
      ]);
    }
  };

  const handleSelectSong = (song: Song) => {
    const locInfo = location ? ` en ${location.city}, ${location.country}` : '';
    Alert.alert('Reproduciendo', `${song.id.songName}${locInfo}`);
    saveToHistoryAndBackend(song);
    fetchSimilarSongs(song);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Explorar</Text>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('History')}
          activeOpacity={0.7}
        >
          <Text style={styles.historyButtonText}>Historial</Text>
        </TouchableOpacity>
      </View>

      <LocationBanner
        location={location}
        loading={loadingLocation}
        onRefresh={refreshLocation}
      />

      <View style={styles.searchRow}>
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="Canciones o artistas..."
          placeholderTextColor="#707070"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch} activeOpacity={0.8}>
          <Text style={styles.searchButtonText}>IR</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>{songCountLabel}</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#1DB954" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredSongs}
          keyExtractor={(item, index) => `${item.id.songName}-${item.id.songArtist}-${index}`}
          renderItem={({ item }) => (
            <SongItem song={item} onPress={() => handleSelectSong(item)} />
          )}
          style={styles.songsList}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Text style={[styles.sectionTitle, styles.discoveriesTitle]}>DESCUBRIMIENTOS</Text>

      <FlatList
        data={similarSongs}
        keyExtractor={(item, index) => `${item.songName}-${item.artist}-${index}`}
        renderItem={({ item }) => <SongItem similarSong={item} />}
        style={styles.similarList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Selecciona una canción para ver descubrimientos.</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  historyButton: {
    backgroundColor: '#333333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  historyButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    height: 52,
    backgroundColor: '#222222',
    borderRadius: 8,
    color: '#FFFFFF',
    paddingHorizontal: 18,
    fontSize: 15,
  },
  searchButton: {
    width: 60,
    height: 52,
    backgroundColor: '#1DB954',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: '#1DB954',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  discoveriesTitle: {
    marginTop: 20,
  },
  songsList: {
    flex: 1.3,
  },
  similarList: {
    flex: 1,
  },
  loader: {
    marginVertical: 20,
  },
  emptyText: {
    color: '#707070',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 10,
  },
});

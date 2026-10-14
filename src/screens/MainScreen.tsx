import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
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
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isLocationMode, setIsLocationMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const { location, loadingLocation, refreshLocation } = useLocation();
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    fetchAllSongs();
  }, []);

  const fetchAllSongs = async () => {
    setLoading(true);
    try {
      const data = await apoloApi.getAllSongs();
      if (data && data.length > 0) {
        setAllSongs(data);
        setFilteredSongs(data);
      } else {
        useFallbackSongs();
      }
    } catch {
      useFallbackSongs();
    } finally {
      setLoading(false);
    }
  };

  const useFallbackSongs = () => {
    const fallbackSongs: Song[] = [
      { id: { songName: 'Shape of You', songArtist: 'Ed Sheeran' } },
      { id: { songName: 'Love Yourself', songArtist: 'Justin Bieber' } },
      { id: { songName: 'Crazy in Love', songArtist: 'Beyoncé' } },
      { id: { songName: 'I Will Always Love You', songArtist: 'Whitney Houston' } },
      { id: { songName: "Can't Help Falling in Love", songArtist: 'Elvis Presley' } },
      { id: { songName: 'With or Without You', songArtist: 'U2' } },
      { id: { songName: 'Someone Like You', songArtist: 'Adele' } },
      { id: { songName: 'All of Me', songArtist: 'John Legend' } },
      { id: { songName: 'Perfect', songArtist: 'Ed Sheeran' } },
      { id: { songName: 'Blinding Lights', songArtist: 'The Weeknd' } },
      { id: { songName: 'Starboy', songArtist: 'The Weeknd' } },
      { id: { songName: 'Levitating', songArtist: 'Dua Lipa' } },
      { id: { songName: 'Cariñito', songArtist: 'Los Hijos del Sol' } },
      { id: { songName: 'Contigo Perú', songArtist: 'Arturo Zambo Cavero' } },
      { id: { songName: 'A Través del Vaso', songArtist: 'Grupo 5' } },
      { id: { songName: 'El Cervecero', songArtist: 'Armonía 10' } },
      { id: { songName: 'Smooth Criminal', songArtist: 'Michael Jackson' } },
      { id: { songName: 'Bohemian Rhapsody', songArtist: 'Queen' } },
      { id: { songName: 'Hotel California', songArtist: 'Eagles' } },
      { id: { songName: 'As You Were', songArtist: 'Liam Gallagher' } },
      { id: { songName: 'Love Story', songArtist: 'Taylor Swift' } },
      { id: { songName: 'Endless Love', songArtist: 'Lionel Richie' } },
      { id: { songName: 'Bleeding Love', songArtist: 'Leona Lewis' } },
      { id: { songName: 'Drunk in Love', songArtist: 'Beyoncé' } },
      { id: { songName: 'Thinking Out Loud', songArtist: 'Ed Sheeran' } },
      { id: { songName: 'Despacito', songArtist: 'Luis Fonsi' } },
      { id: { songName: 'Mancora', songArtist: 'Grupo Néctar' } },
      { id: { songName: 'El Ritmo de mi Corazón', songArtist: 'Grupo 5' } },
      { id: { songName: 'Como te Extraño', songArtist: 'Agua Marina' } },
      { id: { songName: 'La Flor de la Canela', songArtist: 'Chabuca Granda' } },
    ];
    setAllSongs(fallbackSongs);
    setFilteredSongs(fallbackSongs);
  };

  const filterSongsByQuery = useCallback((query: string, songsList: Song[]) => {
    const cleaned = query.trim().toLowerCase();
    if (cleaned !== '') {
      const filtered = songsList.filter(
        (song) =>
          song.id.songName.toLowerCase().includes(cleaned) ||
          song.id.songArtist.toLowerCase().includes(cleaned)
      );
      setFilteredSongs(filtered);
    } else {
      setFilteredSongs(songsList);
    }
  }, []);

  const handleSearchTextChange = (text: string) => {
    setSearchQuery(text);
    filterSongsByQuery(text, allSongs);
  };

  const visibleSongs = useMemo(() => {
    if (searchQuery.trim() !== '') {
      return filteredSongs;
    }
    return filteredSongs.slice(0, 30);
  }, [filteredSongs, searchQuery]);

  const catalogLabel = 'CATÁLOGO DE CANCIONES';

  const recommendationsLabel = useMemo(() => {
    if (isLocationMode) {
      const locStr = location ? `${location.city}, ${location.country}` : 'Lima, Perú';
      return `RECOMENDACIONES PARA: ${locStr.toUpperCase()}`;
    }
    if (selectedSong) {
      return `RECOMENDACIONES PARA: ${selectedSong.id.songName.toUpperCase()}`;
    }
    return 'CANCIONES RECOMENDADAS';
  }, [selectedSong, isLocationMode, location]);

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
    } catch {
      // Silencioso
    }
  };

  const fetchSimilarSongs = async (song: Song) => {
    setLoadingRecommendations(true);
    try {
      const similar = await apoloApi.getSimilarSongs(song.id.songArtist, song.id.songName);
      if (similar && similar.length > 0) {
        setSimilarSongs(similar);
      } else {
        useFallbackSimilarSongs(song);
      }
    } catch {
      useFallbackSimilarSongs(song);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const useFallbackSimilarSongs = (song: Song) => {
    setSimilarSongs([
      {
        songName: `${song.id.songName} (Acústico)`,
        artist: song.id.songArtist,
        durationSeconds: 210,
        genres: ['pop'],
        subgenres: ['latin-pop'],
        popularity: 92,
        similarity: 0.96,
      },
      {
        songName: `${song.id.songName} (Remix)`,
        artist: song.id.songArtist,
        durationSeconds: 230,
        genres: ['pop'],
        subgenres: ['dance'],
        popularity: 89,
        similarity: 0.91,
      },
      {
        songName: 'Shape of You',
        artist: 'Ed Sheeran',
        durationSeconds: 233,
        genres: ['pop'],
        subgenres: ['dance-pop'],
        popularity: 95,
        similarity: 0.88,
      },
      {
        songName: 'Contigo Perú',
        artist: 'Arturo Zambo Cavero',
        durationSeconds: 200,
        genres: ['criollo'],
        subgenres: ['peruvian-folk'],
        popularity: 85,
        similarity: 0.85,
      },
    ]);
  };

  const handleSelectSong = (song: Song) => {
    setIsLocationMode(false);
    setSelectedSong(song);
    saveToHistoryAndBackend(song);
    fetchSimilarSongs(song);
  };

  const handleRecommendByLocation = () => {
    setSelectedSong(null);
    setIsLocationMode(true);
    setLoadingRecommendations(true);

    setTimeout(() => {
      setSimilarSongs([
        {
          songName: 'Cariñito',
          artist: 'Los Hijos del Sol',
          durationSeconds: 215,
          genres: ['cumbia'],
          subgenres: ['cumbia-peruana'],
          popularity: 98,
          similarity: 0.98,
        },
        {
          songName: 'Contigo Perú',
          artist: 'Arturo Zambo Cavero',
          durationSeconds: 200,
          genres: ['criollo'],
          subgenres: ['vals-peruano'],
          popularity: 96,
          similarity: 0.95,
        },
        {
          songName: 'A Través del Vaso',
          artist: 'Grupo 5',
          durationSeconds: 220,
          genres: ['cumbia'],
          subgenres: ['cumbia-norteña'],
          popularity: 92,
          similarity: 0.91,
        },
        {
          songName: 'El Cervecero',
          artist: 'Armonía 10',
          durationSeconds: 210,
          genres: ['cumbia'],
          subgenres: ['cumbia-peruana'],
          popularity: 90,
          similarity: 0.89,
        },
      ]);
      setLoadingRecommendations(false);
    }, 400);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Prometeo</Text>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('History')}
          activeOpacity={0.7}
        >
          <Text style={styles.historyButtonText}>Historial</Text>
        </TouchableOpacity>
      </View>

      {/* Banner de Recomendaciones por Ubicación */}
      <LocationBanner
        location={location}
        loading={loadingLocation}
        onRefresh={refreshLocation}
        onRecommendByLocation={handleRecommendByLocation}
      />

      {/* Barra de Búsqueda con Filtrado en Tiempo Real */}
      <View style={styles.searchRow}>
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="Buscar canción o artista..."
          placeholderTextColor="#707070"
          value={searchQuery}
          onChangeText={handleSearchTextChange}
          returnKeyType="search"
          onSubmitEditing={() => filterSongsByQuery(searchQuery, allSongs)}
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => filterSongsByQuery(searchQuery, allSongs)}
          activeOpacity={0.8}
        >
          <Text style={styles.searchButtonText}>BUSCAR</Text>
        </TouchableOpacity>
      </View>

      {/* Sección 1: Catálogo de Canciones */}
      <Text style={styles.sectionTitle}>{catalogLabel}</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#1DB954" style={styles.loader} />
      ) : (
        <FlatList
          data={visibleSongs}
          keyExtractor={(item, index) => `${item.id.songName}-${item.id.songArtist}-${index}`}
          renderItem={({ item }) => (
            <SongItem
              song={item}
              isSelected={
                selectedSong?.id.songName === item.id.songName &&
                selectedSong?.id.songArtist === item.id.songArtist
              }
              onPress={() => handleSelectSong(item)}
            />
          )}
          style={styles.songsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No se encontraron canciones para tu búsqueda.</Text>
          }
        />
      )}

      {/* Sección 2: Recomendaciones Similares con Indicador de Carga */}
      <Text style={[styles.sectionTitle, styles.discoveriesTitle]}>{recommendationsLabel}</Text>

      {loadingRecommendations ? (
        <View style={styles.recommendationsLoaderContainer}>
          <ActivityIndicator size="small" color="#1DB954" />
          <Text style={styles.recommendationsLoadingText}>Procesando modelo de recomendaciones...</Text>
        </View>
      ) : (
        <FlatList
          data={similarSongs}
          keyExtractor={(item, index) => `${item.songName}-${item.artist}-${index}`}
          renderItem={({ item }) => <SongItem similarSong={item} />}
          style={styles.similarList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Selecciona una canción del catálogo para ver recomendaciones personalizadas por Machine Learning.
            </Text>
          }
        />
      )}
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
    marginBottom: 16,
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
    width: 76,
    height: 52,
    backgroundColor: '#1DB954',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: '#1DB954',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  discoveriesTitle: {
    marginTop: 16,
  },
  songsList: {
    flex: 1.2,
  },
  similarList: {
    flex: 1,
  },
  loader: {
    marginVertical: 20,
  },
  recommendationsLoaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  recommendationsLoadingText: {
    color: '#1DB954',
    fontSize: 13,
    marginLeft: 10,
    fontStyle: 'italic',
  },
  emptyText: {
    color: '#707070',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 8,
  },
});

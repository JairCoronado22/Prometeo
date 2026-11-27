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
  Alert,
  Vibration,
  RefreshControl,
  BackHandler,
  ScrollView,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Song, SimilarSongDTO, ListeningHistory } from '../types';
import { apoloApi, MAIN_MENU_LIMIT, SEARCH_LIMIT, LOCAL_SONGS_LIMIT } from '../api/apoloApi';
import { historyStorage } from '../services/historyStorage';
import { SongItem, isValidSong, isValidSimilarSong } from '../components/SongItem';
import { LocationBanner } from '../components/LocationBanner';
import { useLocation } from '../hooks/useLocation';
import { useShake } from '../hooks/useShake';
import { useAuth } from '../context/AuthContext';
import { NotificationPermissionCard } from '../components/NotificationPermissionCard';
import { localNotificationService } from '../services/localNotificationService';
import { LOCAL_ZONE_SONGS } from '../data/localSongs';
import { cleanDisplayName, pickRandomSong, songKey } from '../utils/songDisplay';
import { findLocalTrack } from '../data/localTracks';
import { usePlayback } from '../hooks/usePlayback';
import { SeekBar } from '../components/SeekBar';

type Props = NativeStackScreenProps<RootStackParamList, 'Main'>;

/** Filas de la lista única que hace scroll en toda la pantalla. */
type Row =
  | { type: 'title'; key: string; text: string }
  | { type: 'song'; key: string; song: Song }
  | { type: 'similar'; key: string; similar: SimilarSongDTO }
  | { type: 'skeleton'; key: string }
  | { type: 'offline'; key: string }
  | { type: 'loadingRecs'; key: string }
  | { type: 'empty'; key: string; text: string };

const RANDOM_POOL_SIZE = 50;

const formatPlaybackTime = (rawSeconds: number): string => {
  const seconds = Math.max(0, Math.floor(rawSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const MainScreen: React.FC<Props> = ({ route, navigation }) => {
  const username = route.params?.username || 'Invitado';
  const { backendSyncEnabled } = useAuth();

  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [similarSongs, setSimilarSongs] = useState<SimilarSongDTO[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  // Se incrementa en cada selección para que volver a tocar la misma canción la reinicie.
  const [selectionNonce, setSelectionNonce] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [catalogOffline, setCatalogOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recommending, setRecommending] = useState(false);
  const [lastRecommendation, setLastRecommendation] = useState<Song | null>(null);

  const { location, loadingLocation, refreshLocation } = useLocation();
  const searchInputRef = useRef<TextInput>(null);
  const isScreenFocused = useIsFocused();
  const recommendationsRequestId = useRef(0);
  const searchRequestId = useRef(0);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackDurationSeconds = selectedSong?.durationMs
    ? Math.max(1, Math.floor(selectedSong.durationMs / 1000))
    : 210;

  // Audio real si la canción tiene MP3 en /Canciones; si no, vista previa simulada.
  const localAsset = selectedSong
    ? findLocalTrack(selectedSong.id.songName, selectedSong.id.songArtist)
    : null;
  const playback = usePlayback(
    selectedSong ? `${songKey(selectedSong)}#${selectionNonce}` : null,
    localAsset,
    fallbackDurationSeconds
  );
  const isPlaying = playback.isPlaying;
  const playbackPosition = playback.position;
  const playbackDurationSeconds = Math.max(1, playback.duration);

  useEffect(() => {
    fetchAllSongs();
  }, []);

  const fetchAllSongs = async (showSpinner = true) => {
    if (showSpinner) {
      setLoading(true);
    }
    try {
      const data = await apoloApi.getAllSongs(MAIN_MENU_LIMIT);
      if (data && data.length > 0) {
        const validSongs = data.filter(isValidSong);
        if (validSongs.length > 0) {
          setAllSongs(validSongs);
          setFilteredSongs(validSongs);
          setCatalogOffline(false);
        } else {
          useFallbackSongs();
        }
      } else {
        useFallbackSongs();
      }
    } catch (error) {
      console.log('No se pudo leer el catálogo de Apolo, usando fallback:', error);
      useFallbackSongs();
      setCatalogOffline(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setSearchQuery('');
    await Promise.all([fetchAllSongs(false), refreshLocation()]);
    setRefreshing(false);
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

  // Búsqueda en el backend (LIMIT 20 en SQL). Mientras responde se muestra el filtro local.
  const runRemoteSearch = useCallback(async (query: string) => {
    const cleaned = query.trim();
    const requestId = ++searchRequestId.current;
    if (cleaned.length < 2) {
      return;
    }
    try {
      const results = await apoloApi.searchSongs(cleaned, SEARCH_LIMIT);
      if (requestId !== searchRequestId.current) {
        return;
      }
      setFilteredSongs(results.filter(isValidSong).slice(0, SEARCH_LIMIT));
    } catch (error) {
      console.log('Búsqueda remota no disponible, se mantiene el filtro local:', error);
    }
  }, []);

  const scheduleRemoteSearch = (query: string, delayMs: number) => {
    searchRequestId.current += 1; // invalida respuestas de búsquedas anteriores
    if (searchDebounce.current) {
      clearTimeout(searchDebounce.current);
    }
    searchDebounce.current = setTimeout(() => runRemoteSearch(query), delayMs);
  };

  useEffect(() => () => {
    if (searchDebounce.current) {
      clearTimeout(searchDebounce.current);
    }
  }, []);

  const handleSearchTextChange = (text: string) => {
    setSearchQuery(text);
    filterSongsByQuery(text, allSongs);
    scheduleRemoteSearch(text, 350);
  };

  const handleSearchSubmit = () => {
    filterSongsByQuery(searchQuery, allSongs);
    scheduleRemoteSearch(searchQuery, 0);
  };

  const handleClearSearch = () => {
    searchRequestId.current += 1;
    if (searchDebounce.current) {
      clearTimeout(searchDebounce.current);
    }
    setSearchQuery('');
    setFilteredSongs(allSongs);
    searchInputRef.current?.focus();
  };

  const visibleSongs = useMemo(() => {
    if (searchQuery.trim() !== '') {
      return filteredSongs.slice(0, SEARCH_LIMIT);
    }
    return filteredSongs.slice(0, MAIN_MENU_LIMIT);
  }, [filteredSongs, searchQuery]);

  const catalogLabel =
    searchQuery.trim() !== ''
      ? `RESULTADOS PARA “${searchQuery.trim().toUpperCase()}”`
      : 'CATÁLOGO DE CANCIONES';

  const queueSummary = loadingRecommendations
    ? 'Buscando recomendadas…'
    : similarSongs.length > 0
      ? `Ver ${similarSongs.length} recomendadas ›`
      : 'Abrir reproductor ›';

  const saveToHistoryAndBackend = async (song: Song) => {
    try {
      await historyStorage.addSong(song);
    } catch (error) {
      console.error('No se pudo guardar la canción en el historial local:', error);
    }

    if (!backendSyncEnabled) {
      return;
    }

    try {
      const nowFormatted = new Date().toISOString().split('.')[0];
      const historyEntry: ListeningHistory = {
        user: { username },
        song,
        playedAt: nowFormatted,
        durationPlayedMs: 0,
        completed: false,
      };
      await apoloApi.createHistory(historyEntry);
    } catch (error) {
      console.log('No se pudo registrar la canción en el historial de Apolo:', error);
    }
  };

  const fetchSimilarSongs = async (song: Song) => {
    const requestId = ++recommendationsRequestId.current;
    setLoadingRecommendations(true);

    const fetchPromise = apoloApi.getSimilarSongs(song.id.songArtist, song.id.songName);
    const timeoutPromise = new Promise<SimilarSongDTO[]>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout de recomendación')), 2200)
    );

    try {
      const similar = await Promise.race([fetchPromise, timeoutPromise]);
      if (requestId !== recommendationsRequestId.current) {
        return;
      }

      // Las recomendadas se muestran en la cola del reproductor; ya no se avisa por notificación.
      if (similar && similar.length > 0) {
        const validSimilar = similar.filter(isValidSimilarSong);
        if (validSimilar.length > 0) {
          setSimilarSongs(validSimilar);
        } else {
          useFallbackSimilarSongs(song);
        }
      } else {
        useFallbackSimilarSongs(song);
      }
    } catch (error) {
      if (requestId !== recommendationsRequestId.current) {
        return;
      }

      console.log('Respuesta rápida de recomendaciones:', error);
      useFallbackSimilarSongs(song);
    } finally {
      if (requestId === recommendationsRequestId.current) {
        setLoadingRecommendations(false);
      }
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
    Vibration.vibrate(20);
    setSelectedSong(song);
    setIsPlayerExpanded(true);
    setSelectionNonce((n) => n + 1); // usePlayback reinicia y empieza a sonar
    saveToHistoryAndBackend(song);
    fetchSimilarSongs(song);
  };

  // Agitar el teléfono = "🎲 Recomiéndame una canción" (en la pantalla principal y en el reproductor).
  const handleShake = () => {
    if (recommending) {
      return;
    }
    void handleRandomRecommendation();
  };

  const shakeSensorAvailable = useShake(handleShake, isScreenFocused);

  // "Canciones de tu zona": al tocar una, se abre en el reproductor como cualquier otra.
  const handleSelectLocalSong = (local: SimilarSongDTO) => {
    handleSelectSong({
      id: { songName: local.songName, songArtist: local.artist },
      songPopularity: local.popularity,
      durationMs: local.durationSeconds * 1000,
    });
  };

  // 🎲 Recomiéndame una canción: elige una al azar del backend y la envía como notificación.
  const handleRandomRecommendation = async () => {
    setRecommending(true);
    try {
      let pool: Song[] = [];
      try {
        const query = searchQuery.trim();
        const fromBackend =
          query.length >= 2
            ? await apoloApi.searchSongs(query, SEARCH_LIMIT)
            : await apoloApi.getAllSongs(RANDOM_POOL_SIZE);
        pool = fromBackend.filter(isValidSong);
      } catch (error) {
        console.log('Recomendación al azar sin backend, usando el catálogo cargado:', error);
      }
      if (pool.length === 0) {
        pool = allSongs;
      }

      const pick = pickRandomSong(pool, lastRecommendation ? songKey(lastRecommendation) : null);
      if (!pick) {
        Alert.alert('Sin canciones', 'No hay canciones disponibles para recomendar ahora mismo.');
        return;
      }

      setLastRecommendation(pick);
      Vibration.vibrate(60);
      localNotificationService.sendSongRecommendationNotification(
        cleanDisplayName(pick.id.songName),
        cleanDisplayName(pick.id.songArtist),
        username
      );
    } finally {
      setRecommending(false);
    }
  };

  // El botón "atrás" de Android cierra el reproductor grande en vez de salir de la app.
  useEffect(() => {
    if (!isPlayerExpanded) {
      return;
    }
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setIsPlayerExpanded(false);
      return true;
    });
    return () => subscription.remove();
  }, [isPlayerExpanded]);

  // Bienvenida por notificación al entrar (una vez por inicio de sesión).
  useEffect(() => {
    localNotificationService.sendWelcomeNotification(username);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Al cambiar de canción, la vista del reproductor vuelve arriba.
  const playerScrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    playerScrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [selectedSong]);

  // Al tocar la notificación de recomendación se abre esa canción.
  const handleSelectSongRef = useRef(handleSelectSong);
  handleSelectSongRef.current = handleSelectSong;
  useEffect(() => {
    localNotificationService.setNotificationTapHandler((payload) => {
      handleSelectSongRef.current({
        id: { songName: payload.songName, songArtist: payload.songArtist },
      });
    });
    return () => localNotificationService.setNotificationTapHandler(null);
  }, []);

  if (selectedSong && isPlayerExpanded) {
    return (
      <SafeAreaView style={styles.fullPlayerContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />

        <View style={styles.fullPlayerHeader}>
          <TouchableOpacity
            style={styles.collapseButton}
            onPress={() => setIsPlayerExpanded(false)}
            accessibilityRole="button"
            accessibilityLabel="Volver al catálogo"
            hitSlop={8}
          >
            <Text style={styles.collapseButtonIcon}>⌄</Text>
          </TouchableOpacity>
          <Text style={[styles.fullPlayerEyebrow, playback.isReal && styles.fullPlayerEyebrowReal]}>
            {playback.isReal ? 'REPRODUCIENDO' : 'VISTA PREVIA SIMULADA'}
          </Text>
          <View style={styles.headerButtonSpacer} />
        </View>

        <ScrollView
          ref={playerScrollRef}
          contentContainerStyle={styles.fullPlayerScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.fullPlayerArtworkArea}>
            <View style={styles.fullPlayerArtwork}>
              <Text style={styles.fullPlayerArtworkIcon}>♫</Text>
            </View>
          </View>

          <View style={styles.fullPlayerInfo}>
            <Text style={styles.fullPlayerSongName} numberOfLines={2}>
              {cleanDisplayName(selectedSong.id.songName)}
            </Text>
            <Text style={styles.fullPlayerArtist} numberOfLines={1}>
              {cleanDisplayName(selectedSong.id.songArtist)}
            </Text>
            {playback.loading ? (
              <Text style={styles.playerDisclaimer}>Cargando audio…</Text>
            ) : playback.isReal ? (
              <Text style={[styles.playerDisclaimer, styles.playerAudioReal]}>🎧 Audio incluido en la app</Text>
            ) : (
              <Text style={styles.playerDisclaimer}>
                Vista previa: esta canción no tiene audio en la app, solo se simula la reproducción.
              </Text>
            )}
          </View>

          <View style={styles.fullPlayerProgress}>
            <SeekBar
              position={playbackPosition}
              duration={playbackDurationSeconds}
              onSeek={playback.seekTo}
            />
            <View style={styles.playerFooter}>
              <Text style={styles.playerTime}>{formatPlaybackTime(playbackPosition)}</Text>
              <Text style={styles.playerTime}>
                {formatPlaybackTime(playbackDurationSeconds)}
              </Text>
            </View>
          </View>

          <View style={styles.fullPlayerControls}>
            <TouchableOpacity
              onPress={() => playback.skip(-10)}
              accessibilityRole="button"
              accessibilityLabel="Retroceder 10 segundos"
              hitSlop={12}
            >
              <Text style={styles.fullPlayerSkipControl}>−10</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.fullPlayerPlayButton}
              onPress={playback.toggle}
              disabled={playback.loading}
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? 'Pausar' : 'Reproducir'}
              activeOpacity={0.8}
            >
              {playback.loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.fullPlayerPlayButtonIcon}>{isPlaying ? 'Ⅱ' : '▶'}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => playback.skip(10)}
              accessibilityRole="button"
              accessibilityLabel="Avanzar 10 segundos"
              hitSlop={12}
            >
              <Text style={styles.fullPlayerSkipControl}>+10</Text>
            </TouchableOpacity>
          </View>

          {/* Cola: recomendadas para esta canción (como el "A continuación" de Spotify) */}
          <View style={styles.queueHeader}>
            <Text style={styles.queueTitle} numberOfLines={1}>
              A CONTINUACIÓN · RECOMENDADAS
            </Text>
            {!loadingRecommendations && similarSongs.length > 0 && (
              <Text style={styles.queueCount}>{similarSongs.length}</Text>
            )}
          </View>
          {loadingRecommendations ? (
            <View style={styles.recommendationsLoaderContainer}>
              <ActivityIndicator size="small" color="#1DB954" />
              <Text style={styles.recommendationsLoadingText}>Buscando canciones parecidas…</Text>
            </View>
          ) : similarSongs.length === 0 ? (
            <Text style={styles.emptyText}>Aún no hay recomendadas para esta canción.</Text>
          ) : (
            similarSongs.map((similar, index) => (
              <SongItem
                key={`queue-${similar.songName}-${similar.artist}-${index}`}
                similarSong={similar}
                onPress={() =>
                  handleSelectSong({
                    id: { songName: similar.songName, songArtist: similar.artist },
                    songPopularity: similar.popularity,
                  })
                }
              />
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---- Lista única: toda la pantalla hace scroll ----
  const rows: Row[] = [];
  rows.push({ type: 'title', key: 'title-catalog', text: catalogLabel });
  if (catalogOffline && searchQuery.trim() === '') {
    rows.push({ type: 'offline', key: 'offline' });
  }
  if (loading) {
    for (let i = 0; i < 5; i++) {
      rows.push({ type: 'skeleton', key: `skeleton-${i}` });
    }
  } else if (visibleSongs.length === 0) {
    rows.push({
      type: 'empty',
      key: 'empty-catalog',
      text:
        searchQuery.trim() !== ''
          ? `No encontramos “${searchQuery.trim()}”. Prueba con otro nombre o artista.`
          : 'Aún no hay canciones. Desliza hacia abajo para recargar.',
    });
  } else {
    visibleSongs.forEach((song, index) =>
      rows.push({ type: 'song', key: `song-${songKey(song)}-${index}`, song })
    );
  }
  // Las recomendadas viven en la cola del reproductor ("A continuación"), no al final del catálogo.

  const renderRow = ({ item }: { item: Row }) => {
    switch (item.type) {
      case 'title':
        return (
          <Text
            style={[styles.sectionTitle, item.key === 'title-recs' && styles.discoveriesTitle]}
            numberOfLines={1}
          >
            {item.text}
          </Text>
        );
      case 'song':
        return (
          <SongItem
            song={item.song}
            isSelected={
              selectedSong?.id.songName === item.song.id.songName &&
              selectedSong?.id.songArtist === item.song.id.songArtist
            }
            onPress={() => handleSelectSong(item.song)}
          />
        );
      case 'similar':
        return (
          <SongItem
            similarSong={item.similar}
            onPress={() =>
              handleSelectSong({
                id: { songName: item.similar.songName, songArtist: item.similar.artist },
                songPopularity: item.similar.popularity,
              })
            }
          />
        );
      case 'skeleton':
        return (
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonIcon} />
            <View style={styles.skeletonLines}>
              <View style={styles.skeletonLineLong} />
              <View style={styles.skeletonLineShort} />
            </View>
          </View>
        );
      case 'offline':
        return (
          <View style={styles.offlineCard}>
            <Text style={styles.offlineText}>
              📡 Sin conexión con Prometeo. Te mostramos canciones de ejemplo.
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => void fetchAllSongs()}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Reintentar conexión"
            >
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        );
      case 'loadingRecs':
        return (
          <View style={styles.recommendationsLoaderContainer}>
            <ActivityIndicator size="small" color="#1DB954" />
            <Text style={styles.recommendationsLoadingText}>Buscando canciones parecidas…</Text>
          </View>
        );
      case 'empty':
        return <Text style={styles.emptyText}>{item.text}</Text>;
      default:
        return null;
    }
  };

  const listHeader = (
    <View>
      {/* Cabecera */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Prometeo</Text>
          <Text style={styles.greeting} numberOfLines={1}>
            Hola, {cleanDisplayName(username)} 👋
          </Text>
        </View>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('History')}
          activeOpacity={0.7}
          accessibilityRole="button"
        >
          <Text style={styles.historyButtonText}>Historial</Text>
        </TouchableOpacity>
      </View>

      {/* Notificaciones arriba; con permiso queda en una sola fila con 🎲 */}
      <NotificationPermissionCard
        onRecommend={handleRandomRecommendation}
        recommending={recommending}
        lastRecommendation={lastRecommendation?.id ?? null}
        onPlayRecommendation={
          lastRecommendation ? () => handleSelectSong(lastRecommendation) : undefined
        }
      />

      {/* Ubicación: tarjeta para pedir permiso o barra plegable "Canciones de tu zona" */}
      <LocationBanner
        location={location}
        loading={loadingLocation}
        onRefresh={refreshLocation}
        songs={LOCAL_ZONE_SONGS.slice(0, LOCAL_SONGS_LIMIT)}
        onSelectSong={handleSelectLocalSong}
      />

      {/* Búsqueda: busca al escribir; ✕ limpia */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Busca una canción o artista"
            placeholderTextColor="#707070"
            value={searchQuery}
            onChangeText={handleSearchTextChange}
            returnKeyType="search"
            onSubmitEditing={handleSearchSubmit}
            autoCorrect={false}
          />
          {searchQuery !== '' && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearSearch}
              accessibilityRole="button"
              accessibilityLabel="Limpiar búsqueda"
              hitSlop={8}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearchSubmit}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={styles.searchButtonText}>BUSCAR</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.shakeHint} accessibilityLiveRegion="polite">
        {shakeSensorAvailable === false
          ? 'Toca una canción para escucharla y ver sus recomendadas.'
          : 'Toca una canción para ver sus recomendadas · 📳 Agita el teléfono y te recomendamos una al azar.'}
      </Text>

      {selectedSong && (
        <TouchableOpacity
          style={styles.playerCard}
          onPress={() => setIsPlayerExpanded(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`Abrir reproductor de ${cleanDisplayName(selectedSong.id.songName)}`}
        >
          <View style={styles.playerArtwork}>
            <Text style={styles.playerArtworkIcon}>♫</Text>
          </View>
          <View style={styles.playerContent}>
            <Text style={styles.playerEyebrow}>
              {playback.isReal ? '🎧 REPRODUCIENDO' : 'VISTA PREVIA · SIN AUDIO'}
            </Text>
            <Text style={styles.playerSongName} numberOfLines={1}>
              {cleanDisplayName(selectedSong.id.songName)}
            </Text>
            <Text style={styles.playerArtist} numberOfLines={1}>
              {cleanDisplayName(selectedSong.id.songArtist)}
            </Text>
            <Text style={styles.queueLink}>{queueSummary}</Text>
            <SeekBar
              compact
              position={playbackPosition}
              duration={playbackDurationSeconds}
              onSeek={playback.seekTo}
            />
            <View style={styles.playerFooter}>
              <Text style={styles.playerTime}>{formatPlaybackTime(playbackPosition)}</Text>
              <View style={styles.playerControls}>
                <TouchableOpacity
                  onPress={() => playback.skip(-10)}
                  accessibilityRole="button"
                  accessibilityLabel="Retroceder 10 segundos"
                  hitSlop={8}
                >
                  <Text style={styles.skipControl}>−10</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={playback.toggle}
                  disabled={playback.loading}
                  accessibilityRole="button"
                  accessibilityLabel={isPlaying ? 'Pausar' : 'Reproducir'}
                  activeOpacity={0.8}
                  hitSlop={8}
                >
                  <Text style={styles.playButtonIcon}>{isPlaying ? 'Ⅱ' : '▶'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => playback.skip(10)}
                  accessibilityRole="button"
                  accessibilityLabel="Avanzar 10 segundos"
                  hitSlop={8}
                >
                  <Text style={styles.skipControl}>+10</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.playerTime}>
                {formatPlaybackTime(playbackDurationSeconds)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <FlatList
        data={rows}
        keyExtractor={(item) => item.key}
        renderItem={renderRow}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            colors={['#1DB954']}
            tintColor="#1DB954"
            progressBackgroundColor="#1e1e1e"
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  queueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 28,
    marginBottom: 10,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#333333',
  },
  queueTitle: {
    color: '#1DB954',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    flex: 1,
  },
  queueCount: {
    color: '#1DB954',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: '#1DB95433',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  queueLink: {
    color: '#1DB954',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 32,
  },
  headerTitles: {
    flex: 1,
    paddingRight: 12,
  },
  greeting: {
    color: '#B3B3B3',
    fontSize: 14,
    marginTop: 2,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: '#222222',
    borderRadius: 26,
    paddingLeft: 14,
    paddingRight: 6,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
    opacity: 0.7,
  },
  clearButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333333',
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
  },
  skeletonIcon: {
    width: 48,
    height: 48,
    borderRadius: 4,
    backgroundColor: '#262626',
  },
  skeletonLines: {
    flex: 1,
    marginLeft: 16,
  },
  skeletonLineLong: {
    height: 14,
    width: '70%',
    borderRadius: 4,
    backgroundColor: '#262626',
  },
  skeletonLineShort: {
    height: 11,
    width: '40%',
    borderRadius: 4,
    backgroundColor: '#262626',
    marginTop: 8,
  },
  offlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2216',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  offlineText: {
    flex: 1,
    color: '#E8B923',
    fontSize: 12,
    paddingRight: 8,
  },
  retryButton: {
    backgroundColor: '#E8B923',
    borderRadius: 6,
    minHeight: 40,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: '#121212',
    fontSize: 12,
    fontWeight: 'bold',
  },
  fullPlayerContainer: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  fullPlayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  collapseButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  collapseButtonIcon: {
    color: '#FFFFFF',
    fontSize: 32,
    lineHeight: 36,
  },
  fullPlayerEyebrow: {
    color: '#B3B3B3',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  headerButtonSpacer: {
    width: 40,
  },
  fullPlayerEyebrowReal: {
    color: '#1DB954',
  },
  playerAudioReal: {
    color: '#1DB954',
  },
  fullPlayerScroll: {
    paddingBottom: 32,
  },
  fullPlayerArtworkArea: {
    justifyContent: 'center',
    paddingVertical: 20,
  },
  fullPlayerArtwork: {
    width: '78%',
    aspectRatio: 1,
    maxWidth: 320,
    maxHeight: 320,
    alignSelf: 'center',
    borderRadius: 12,
    backgroundColor: '#282828',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullPlayerArtworkIcon: {
    color: '#1DB954',
    fontSize: 120,
    fontWeight: 'bold',
  },
  fullPlayerInfo: {
    marginBottom: 24,
  },
  fullPlayerSongName: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 'bold',
  },
  fullPlayerArtist: {
    color: '#B3B3B3',
    fontSize: 16,
    marginTop: 8,
  },
  playerDisclaimer: {
    color: '#909090',
    fontSize: 12,
    marginTop: 8,
  },
  fullPlayerProgress: {
    marginBottom: 20,
  },
  fullPlayerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginBottom: 20,
  },
  fullPlayerSkipControl: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 12,
  },
  fullPlayerPlayButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1DB954',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullPlayerPlayButtonIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
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
    color: '#FFFFFF',
    paddingHorizontal: 4,
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
  shakeHint: {
    color: '#909090',
    fontSize: 11,
    marginBottom: 12,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#333333',
  },
  playerArtwork: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#282828',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  playerArtworkIcon: {
    color: '#1DB954',
    fontSize: 34,
    fontWeight: 'bold',
  },
  playerContent: {
    flex: 1,
  },
  playerEyebrow: {
    color: '#1DB954',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 3,
  },
  playerSongName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  playerArtist: {
    color: '#909090',
    fontSize: 12,
    marginTop: 2,
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#444444',
    borderRadius: 2,
    marginTop: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1DB954',
    borderRadius: 2,
  },
  playerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  playerTime: {
    color: '#909090',
    fontSize: 10,
    minWidth: 28,
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skipControl: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 10,
  },
  playButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1DB954',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonIcon: {
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

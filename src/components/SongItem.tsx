import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Song, SimilarSongDTO } from '../types';

interface SongItemProps {
  song?: Song;
  similarSong?: SimilarSongDTO;
  onPress?: () => void;
}

export const SongItem: React.FC<SongItemProps> = ({ song, similarSong, onPress }) => {
  const songName = song?.id.songName || similarSong?.songName || 'Sin Título';
  const artistName = song?.id.songArtist || similarSong?.artist || 'Artista Desconocido';
  const similarityText = similarSong ? ` • ${Math.round(similarSong.similarity * 100)}% coincidencia` : '';

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        <Text style={styles.musicNoteIcon}>♪</Text>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.songName} numberOfLines={1}>
          {songName}
        </Text>
        <Text style={styles.artistName} numberOfLines={1}>
          {artistName}{similarityText}
        </Text>
      </View>
      <View style={styles.playIconContainer}>
        <Text style={styles.playIcon}>▶</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
  },
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#222222',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  musicNoteIcon: {
    color: '#1DB954',
    fontSize: 22,
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 16,
  },
  songName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  artistName: {
    color: '#909090',
    fontSize: 13,
    marginTop: 4,
  },
  playIconContainer: {
    paddingLeft: 8,
    opacity: 0.7,
  },
  playIcon: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});

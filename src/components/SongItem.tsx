import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Song, SimilarSongDTO } from '../types';

interface SongItemProps {
  song?: Song;
  similarSong?: SimilarSongDTO;
  isSelected?: boolean;
  onPress?: () => void;
}

export function isValidSong(song: Song): boolean {
  if (!song || !song.id || !song.id.songName || !song.id.songArtist) {
    return false;
  }

  const name = song.id.songName.trim();
  const artist = song.id.songArtist.trim();

  if (/(?:ï¿½|\uFFFD)/.test(name) || /(?:ï¿½|\uFFFD)/.test(artist)) {
    return false;
  }

  return /[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/.test(name) && /[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/.test(artist);
}

export function isValidSimilarSong(similar: SimilarSongDTO): boolean {
  if (!similar || !similar.songName || !similar.artist) {
    return false;
  }

  const name = similar.songName.trim();
  const artist = similar.artist.trim();

  if (/(?:ï¿½|\uFFFD)/.test(name) || /(?:ï¿½|\uFFFD)/.test(artist)) {
    return false;
  }

  return /[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/.test(name) && /[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/.test(artist);
}

export const SongItem: React.FC<SongItemProps> = ({ song, similarSong, isSelected, onPress }) => {
  const songName = song?.id.songName || similarSong?.songName || '';
  const artistName = song?.id.songArtist || similarSong?.artist || '';
  const similarityText = similarSong ? ` • ${Math.round(similarSong.similarity * 100)}% coincidencia` : '';

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={onPress}
      activeOpacity={0.7}
    >
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
      <View style={styles.actionContainer}>
        <Text style={[styles.actionIcon, isSelected && styles.selectedActionIcon]}>
          {similarSong ? '★' : isSelected ? '✓' : '➜'}
        </Text>
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
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedContainer: {
    backgroundColor: '#282828',
    borderColor: '#1DB954',
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
  actionContainer: {
    paddingLeft: 8,
    opacity: 0.8,
  },
  actionIcon: {
    color: '#909090',
    fontSize: 16,
  },
  selectedActionIcon: {
    color: '#1DB954',
    fontWeight: 'bold',
  },
});

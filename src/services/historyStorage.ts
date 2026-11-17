import AsyncStorage from '@react-native-async-storage/async-storage';
import { Song } from '../types';

const HISTORY_KEY = '@prometeo_listening_history';

const isStoredSong = (item: unknown): item is Song =>
  item !== null &&
  typeof item === 'object' &&
  'id' in item &&
  item.id !== null &&
  typeof item.id === 'object' &&
  'songName' in item.id &&
  typeof item.id.songName === 'string' &&
  'songArtist' in item.id &&
  typeof item.id.songArtist === 'string';

export const historyStorage = {
  async getHistory(): Promise<Song[]> {
    const jsonValue = await AsyncStorage.getItem(HISTORY_KEY);
    if (jsonValue == null) {
      return [];
    }

    const parsed: unknown = JSON.parse(jsonValue);
    if (!Array.isArray(parsed)) {
      throw new Error('El historial guardado tiene un formato inválido.');
    }

    if (!parsed.every(isStoredSong)) {
      throw new Error('El historial guardado contiene canciones con formato inválido.');
    }

    return parsed;
  },

  async addSong(song: Song): Promise<Song[]> {
    const currentHistory = await this.getHistory();

    const existsIndex = currentHistory.findIndex(
      (item) => item.id.songName === song.id.songName && item.id.songArtist === song.id.songArtist
    );

    const updatedHistory = [...currentHistory];
    if (existsIndex !== -1) {
      updatedHistory.splice(existsIndex, 1);
    }

    updatedHistory.unshift(song);

    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    return updatedHistory;
  },

  async removeSong(song: Song): Promise<void> {
    const currentHistory = await this.getHistory();
    const updatedHistory = currentHistory.filter(
      (item) =>
        item.id.songName !== song.id.songName ||
        item.id.songArtist !== song.id.songArtist
    );
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  },

  async clearHistory(): Promise<void> {
    await AsyncStorage.removeItem(HISTORY_KEY);
  },
};

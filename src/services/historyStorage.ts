import AsyncStorage from '@react-native-async-storage/async-storage';
import { Song } from '../types';

const HISTORY_KEY = '@prometeo_listening_history';

export const historyStorage = {
  async getHistory(): Promise<Song[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(HISTORY_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error('Error al leer el historial:', e);
      return [];
    }
  },

  async addSong(song: Song): Promise<Song[]> {
    try {
      const currentHistory = await this.getHistory();

      const existsIndex = currentHistory.findIndex(
        (item) => item.id.songName === song.id.songName && item.id.songArtist === song.id.songArtist
      );

      let updatedHistory = [...currentHistory];
      if (existsIndex !== -1) {
        updatedHistory.splice(existsIndex, 1);
      }

      updatedHistory.unshift(song);

      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
      return updatedHistory;
    } catch (e) {
      console.error('Error al guardar canción en el historial:', e);
      return [];
    }
  },

  async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(HISTORY_KEY);
    } catch (e) {
      console.error('Error al limpiar el historial:', e);
    }
  },
};

import { Song, SimilarSongDTO, User, ListeningHistory } from '../types';

// Servidor Backend Spring Boot (C:\Users\artik\Apolo\prometeo)
// Emulador Android: 'http://10.0.2.2:8080' | Dispositivo Físico / Red Local: 'http://192.168.1.13:8080'
export const BASE_URL = 'http://10.0.2.2:8080';

export const apoloApi = {
  async getUser(username: string): Promise<User> {
    const response = await fetch(`${BASE_URL}/api/users/${encodeURIComponent(username)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return response.json();
  },

  async createUser(user: Partial<User>): Promise<User> {
    const defaultUser: User = {
      username: user.username || 'Invitado',
      email: user.email || `${user.username}@example.com`,
      createdAt: user.createdAt || new Date().toISOString().split('.')[0],
    };

    const response = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(defaultUser),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return response.json();
  },

  async getAllSongs(): Promise<Song[]> {
    const response = await fetch(`${BASE_URL}/api/songs`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return response.json();
  },

  async getSimilarSongs(artist: string, songName: string): Promise<SimilarSongDTO[]> {
    const url = `${BASE_URL}/api/songs/similar?artist=${encodeURIComponent(artist)}&songName=${encodeURIComponent(songName)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return response.json();
  },

  async createHistory(history: ListeningHistory): Promise<ListeningHistory> {
    const payload = {
      user: {
        username: history.user.username,
        email: history.user.email || `${history.user.username}@example.com`,
        createdAt: history.user.createdAt || new Date().toISOString().split('.')[0],
      },
      song: {
        id: {
          songName: history.song.id.songName,
          songArtist: history.song.id.songArtist,
        },
      },
      playedAt: history.playedAt,
      durationPlayedMs: history.durationPlayedMs || 0,
      completed: history.completed ?? true,
    };

    const response = await fetch(`${BASE_URL}/api/listening-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return response.json();
  },
};

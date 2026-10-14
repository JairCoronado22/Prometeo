import { Song, SimilarSongDTO, User, ListeningHistory } from '../types';

const BASE_URLS = ['http://10.0.2.2:8080', 'http://localhost:8080', 'http://127.0.0.1:8080'];

async function fetchWithFallback(endpoint: string, options?: RequestInit): Promise<Response> {
  let lastError: any = null;
  for (const baseUrl of BASE_URLS) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options?.headers || {}),
        },
      });
      if (response.ok) {
        return response;
      }
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error('Network request failed');
}

export const apoloApi = {
  async getUser(username: string): Promise<User> {
    const response = await fetchWithFallback(`/api/users/${encodeURIComponent(username)}`, {
      method: 'GET',
    });
    return response.json();
  },

  async createUser(user: Partial<User>): Promise<User> {
    const defaultUser: User = {
      username: user.username || 'Invitado',
      email: user.email || `${user.username}@example.com`,
      createdAt: user.createdAt || new Date().toISOString().split('.')[0],
    };

    const response = await fetchWithFallback('/api/users', {
      method: 'POST',
      body: JSON.stringify(defaultUser),
    });

    return response.json();
  },

  async getAllSongs(): Promise<Song[]> {
    const response = await fetchWithFallback('/api/songs', {
      method: 'GET',
    });
    return response.json();
  },

  async getSimilarSongs(artist: string, songName: string): Promise<SimilarSongDTO[]> {
    const url = `/api/songs/similar?artist=${encodeURIComponent(artist)}&songName=${encodeURIComponent(songName)}`;
    const response = await fetchWithFallback(url, {
      method: 'GET',
    });
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

    const response = await fetchWithFallback('/api/listening-history', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return response.json();
  },
};

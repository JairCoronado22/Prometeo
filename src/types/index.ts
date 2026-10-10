export interface SongId {
  songName: string;
  songArtist: string;
}

export interface Song {
  id: SongId;
  songPopularity?: number;
  durationMs?: number;
  danceability?: number;
}

export interface SimilarSongDTO {
  songName: string;
  artist: string;
  durationSeconds: number;
  genres: string[];
  subgenres: string[];
  popularity: number;
  similarity: number;
}

export interface User {
  username: string;
  email?: string;
  createdAt?: string;
}

export interface UserLocation {
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface ListeningHistory {
  user: User;
  song: Song;
  playedAt: string;
  durationPlayedMs: number;
  completed?: boolean;
  location?: string;
}

export type RootStackParamList = {
  Login: undefined;
  Main: { username: string };
  History: undefined;
};

import { Song } from '../types';

/** Colapsa espacios repetidos (el dataset trae p. ej. "Qu   Pena" porque perdió la tilde). */
export function cleanDisplayName(value: string | undefined | null): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Texto de similitud amable: "87% parecida".
 * Si no es la misma canción nunca muestra 100% (tope 99%).
 */
export function formatSimilarity(similarity: number, isSameSong = false): string {
  if (!Number.isFinite(similarity)) {
    return '';
  }
  const percent = Math.floor(Math.max(0, Math.min(1, similarity)) * 100);
  const shown = isSameSong ? percent : Math.min(percent, 99);
  return `${shown}% parecida`;
}

/**
 * Clave para comparar canciones ignorando mayúsculas, apóstrofos curvos (’ vs ')
 * y espacios repetidos. Ej.: "Don’t Start Now" == "Don't Start Now".
 */
export function normalizeTrackKey(songName: string, songArtist: string): string {
  const norm = (value: string) =>
    cleanDisplayName(value)
      .toLowerCase()
      .replace(/[’‘`´]/g, "'");
  return `${norm(songName)}::${norm(songArtist)}`;
}

export function songKey(song: Pick<Song, 'id'>): string {
  return `${song.id.songName}::${song.id.songArtist}`;
}

/** Elige una canción al azar, evitando repetir la última recomendada si hay alternativa. */
export function pickRandomSong<T extends Pick<Song, 'id'>>(
  songs: T[],
  excludeKey?: string | null,
  random: () => number = Math.random
): T | null {
  if (!songs || songs.length === 0) {
    return null;
  }
  const candidates =
    excludeKey && songs.length > 1 ? songs.filter((s) => songKey(s) !== excludeKey) : songs;
  const pool = candidates.length > 0 ? candidates : songs;
  const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
  return pool[index];
}

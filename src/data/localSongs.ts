import { SimilarSongDTO } from '../types';

/**
 * "Canciones de tu zona": lista fija local (no hay endpoint de backend por ubicación).
 * Nota: estas canciones no están en el catálogo de Railway.
 */
export const LOCAL_ZONE_SONGS: SimilarSongDTO[] = [
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
];

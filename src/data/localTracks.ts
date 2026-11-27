import { normalizeTrackKey } from '../utils/songDisplay';

/**
 * Canciones con audio real incluido en la app (carpeta Prometeo-Frontend/Canciones).
 * La clave es el nombre/artista TAL COMO VIENE DEL CATÁLOGO (backend), no el del archivo:
 * algunos difieren (p. ej. "KAROL G" vs "Karol G", "RITMO (Bad Boys For Life)").
 * Para añadir una canción: copiar el .mp3 a /Canciones y agregar una línea aquí.
 */
interface LocalTrack {
  songName: string;
  songArtist: string;
  asset: number; // require(...) del mp3
}

const TRACKS: LocalTrack[] = [
  { songName: 'Blinding Lights', songArtist: 'The Weeknd', asset: require('../../Canciones/Blinding Lights - The Weeknd.mp3') },
  { songName: 'Tusa', songArtist: 'KAROL G', asset: require('../../Canciones/Tusa - Karol G.mp3') },
  { songName: 'The Box', songArtist: 'Roddy Ricch', asset: require('../../Canciones/The Box - Roddy Ricch.mp3') },
  { songName: 'Memories', songArtist: 'Maroon 5', asset: require('../../Canciones/Memories - Maroon 5.mp3') },
  { songName: 'Falling', songArtist: 'Trevor Daniel', asset: require('../../Canciones/Falling - Trevor Daniel.mp3') },
  { songName: "Don't Start Now", songArtist: 'Dua Lipa', asset: require('../../Canciones/Don’t Start Now - Dua Lipa.mp3') },
  { songName: 'everything i wanted', songArtist: 'Billie Eilish', asset: require('../../Canciones/everything i wanted - Billie Eilish.mp3') },
  { songName: 'RITMO (Bad Boys For Life)', songArtist: 'The Black Eyed Peas', asset: require('../../Canciones/RITMO - Black Eyed Peas, J Balvin.mp3') },
  { songName: 'bad guy', songArtist: 'Billie Eilish', asset: require('../../Canciones/bad guy - Billie Eilish.mp3') },
  { songName: 'Yummy', songArtist: 'Justin Bieber', asset: require('../../Canciones/Yummy - Justin Bieber.mp3') },
];

const BY_KEY = new Map(TRACKS.map((t) => [normalizeTrackKey(t.songName, t.songArtist), t.asset]));

/** Devuelve el asset de audio si la canción tiene MP3 en la app; si no, null (vista previa simulada). */
export function findLocalTrack(songName: string, songArtist: string): number | null {
  return BY_KEY.get(normalizeTrackKey(songName, songArtist)) ?? null;
}

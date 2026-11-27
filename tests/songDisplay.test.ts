import { describe, expect, it } from 'vitest';
import {
  cleanDisplayName,
  formatSimilarity,
  normalizeTrackKey,
  pickRandomSong,
  songKey,
} from '../src/utils/songDisplay';

const song = (songName: string, songArtist: string) => ({ id: { songName, songArtist } });

describe('cleanDisplayName', () => {
  it('collapses repeated spaces from the dataset', () => {
    expect(cleanDisplayName('Qu   Pena')).toBe('Qu Pena');
  });
  it('trims and tolerates empty values', () => {
    expect(cleanDisplayName('  Hola  ')).toBe('Hola');
    expect(cleanDisplayName(undefined)).toBe('');
  });
});

describe('formatSimilarity', () => {
  it('caps different songs at 99%', () => {
    expect(formatSimilarity(0.9996)).toBe('99% parecida');
    expect(formatSimilarity(1)).toBe('99% parecida');
  });
  it('floors instead of rounding up', () => {
    expect(formatSimilarity(0.876)).toBe('87% parecida');
  });
  it('allows 100% only for the same song', () => {
    expect(formatSimilarity(1, true)).toBe('100% parecida');
  });
  it('returns empty text for invalid numbers', () => {
    expect(formatSimilarity(Number.NaN)).toBe('');
  });
});

describe('normalizeTrackKey', () => {
  it('matches catalog names against file names with curly apostrophes and other casing', () => {
    expect(normalizeTrackKey('Don’t Start Now', 'Dua Lipa')).toBe(
      normalizeTrackKey("Don't Start Now", 'dua lipa')
    );
    expect(normalizeTrackKey('Tusa', 'Karol G')).toBe(normalizeTrackKey('Tusa', 'KAROL G'));
  });
  it('ignores repeated spaces', () => {
    expect(normalizeTrackKey('Qu   Pena', 'Maluma')).toBe(normalizeTrackKey('Qu Pena', 'Maluma'));
  });
  it('keeps different songs apart', () => {
    expect(normalizeTrackKey('bad guy', 'Billie Eilish')).not.toBe(
      normalizeTrackKey('everything i wanted', 'Billie Eilish')
    );
  });
});

describe('pickRandomSong', () => {
  const songs = [song('A', 'x'), song('B', 'y'), song('C', 'z')];

  it('returns null for an empty list', () => {
    expect(pickRandomSong([])).toBeNull();
  });
  it('avoids the excluded song when there are alternatives', () => {
    for (const r of [0, 0.34, 0.99]) {
      expect(songKey(pickRandomSong(songs, songKey(songs[0]), () => r)!)).not.toBe(
        songKey(songs[0])
      );
    }
  });
  it('still returns the only song if it is the excluded one', () => {
    expect(pickRandomSong([songs[0]], songKey(songs[0]))).toBe(songs[0]);
  });
  it('never goes out of bounds when random() returns 1', () => {
    expect(pickRandomSong(songs, null, () => 1)).toBe(songs[2]);
  });
});

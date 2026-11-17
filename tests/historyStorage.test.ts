// Runtime validation coverage for: local listening history persistence
import { beforeEach, describe, expect, it, vi } from 'vitest';

const storageMock = vi.hoisted(() => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: storageMock,
}));

import { historyStorage } from '../src/services/historyStorage';

describe('Local listening history persistence', () => {
  beforeEach(() => {
    storageMock.getItem.mockReset();
    storageMock.setItem.mockReset();
    storageMock.removeItem.mockReset();
  });

  it('stores the newest selection and replaces an existing copy', async () => {
    const previousSong = { id: { songName: 'Luz', songArtist: 'AC/DC' } };
    const newestSong = {
      id: { songName: 'Luz', songArtist: 'AC/DC' },
      durationMs: 180000,
    };
    storageMock.getItem.mockResolvedValueOnce(JSON.stringify([previousSong]));
    storageMock.setItem.mockResolvedValueOnce(undefined);

    const result = await historyStorage.addSong(newestSong);

    expect(result).toEqual([newestSong]);
    expect(storageMock.setItem).toHaveBeenCalledWith(
      '@prometeo_listening_history',
      JSON.stringify([newestSong])
    );
  });

  it('propagates persistence failures so the UI can report them', async () => {
    const song = { id: { songName: 'Luz', songArtist: 'AC/DC' } };
    storageMock.getItem.mockResolvedValueOnce(null);
    storageMock.setItem.mockRejectedValueOnce(new Error('storage unavailable'));

    await expect(historyStorage.addSong(song)).rejects.toThrow('storage unavailable');
  });

  it('rejects malformed saved history instead of presenting it as empty', async () => {
    storageMock.getItem.mockResolvedValueOnce(JSON.stringify([{ id: {} }]));

    await expect(historyStorage.getHistory()).rejects.toThrow('formato inválido');
  });
});

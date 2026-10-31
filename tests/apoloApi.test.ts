// Runtime validation coverage for: Apolo API request contracts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apoloApi } from '../src/api/apoloApi';

const fetchMock = vi.fn();

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('Apolo API request contracts', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('encodes artist and song names in the similar-song query', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]));

    await apoloApi.getSimilarSongs('AC/DC', 'Song & Name');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/songs/similar?artist=AC%2FDC&songName=Song%20%26%20Name',
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  });

  it('sends an incomplete listening selection with the backend song identity', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ historyId: 7 }));

    await apoloApi.createHistory({
      user: { username: 'ana' },
      song: {
        id: { songName: 'Luz', songArtist: 'AC/DC' },
        durationMs: 180000,
      },
      playedAt: '2026-10-31T12:00:00',
      durationPlayedMs: 0,
      completed: false,
    });

    const [, options] = fetchMock.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({
      user: {
        username: 'ana',
        email: 'ana@example.com',
        createdAt: expect.any(String),
      },
      song: {
        id: { songName: 'Luz', songArtist: 'AC/DC' },
      },
      playedAt: '2026-10-31T12:00:00',
      durationPlayedMs: 0,
      completed: false,
    });
  });

  it('reports backend HTTP errors instead of treating them as successful responses', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'unavailable' }, 503));

    await expect(apoloApi.getAllSongs()).rejects.toThrow('HTTP 503');
  });
});

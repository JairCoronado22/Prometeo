import { useCallback, useEffect, useRef, useState } from 'react';
import Sound from 'react-native-sound';

Sound.setCategory('Playback');

const TICK_MS = 250;

export interface PlaybackState {
  /** Posición actual en segundos. */
  position: number;
  /** Duración total en segundos. */
  duration: number;
  isPlaying: boolean;
  /** true si suena el MP3 real; false = vista previa simulada. */
  isReal: boolean;
  loading: boolean;
  error: string | null;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seekTo: (seconds: number) => void;
  skip: (deltaSeconds: number) => void;
}

/**
 * Reproducción de la canción seleccionada.
 * - Con `asset` (MP3 incluido en la app): audio real con react-native-sound.
 * - Sin `asset`: la vista previa simulada de siempre (un contador).
 * Al cambiar `trackKey` se detiene lo anterior y empieza la nueva canción.
 */
export function usePlayback(
  trackKey: string | null,
  asset: number | null,
  fallbackDurationSec: number
): PlaybackState {
  const soundRef = useRef<Sound | null>(null);
  const loadIdRef = useRef(0);
  const positionRef = useRef(0);

  const [position, setPositionState] = useState(0);
  const [duration, setDuration] = useState(fallbackDurationSec);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReal = asset != null && error == null;

  const setPosition = useCallback((seconds: number) => {
    positionRef.current = seconds;
    setPositionState(seconds);
  }, []);

  const releaseSound = useCallback(() => {
    const sound = soundRef.current;
    soundRef.current = null;
    if (sound) {
      sound.stop();
      sound.release();
    }
  }, []);

  const startSound = useCallback(
    (sound: Sound) => {
      setIsPlaying(true);
      sound.play((success) => {
        if (soundRef.current !== sound) {
          return;
        }
        setIsPlaying(false);
        if (success) {
          setPosition(sound.getDuration());
        }
      });
    },
    [setPosition]
  );

  // Cambio de canción: detener la anterior y cargar/empezar la nueva.
  useEffect(() => {
    const loadId = ++loadIdRef.current;
    releaseSound();
    setPosition(0);
    setError(null);
    setDuration(fallbackDurationSec);

    if (!trackKey) {
      setIsPlaying(false);
      setLoading(false);
      return;
    }

    if (asset == null) {
      setLoading(false);
      setIsPlaying(true); // vista previa simulada
      return;
    }

    setLoading(true);
    setIsPlaying(false);
    const sound = new Sound(asset, (loadError) => {
      if (loadId !== loadIdRef.current) {
        sound.release();
        return;
      }
      setLoading(false);
      if (loadError) {
        console.log('[usePlayback] No se pudo cargar el audio, se usa la vista previa:', loadError);
        sound.release();
        setError('No se pudo cargar el audio');
        setIsPlaying(true);
        return;
      }
      soundRef.current = sound;
      setDuration(sound.getDuration());
      startSound(sound);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackKey, asset]);

  // Al desmontar (p. ej. cerrar sesión) se libera el audio.
  useEffect(
    () => () => {
      loadIdRef.current += 1;
      releaseSound();
    },
    [releaseSound]
  );

  // Avance de la barra: posición real del MP3 o contador simulado.
  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    const timer = setInterval(() => {
      const sound = soundRef.current;
      if (sound) {
        sound.getCurrentTime((seconds) => {
          if (soundRef.current === sound) {
            setPosition(seconds);
          }
        });
      } else if (!isReal) {
        const next = Math.min(positionRef.current + TICK_MS / 1000, duration);
        setPosition(next);
        if (next >= duration) {
          setIsPlaying(false);
        }
      }
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [isPlaying, isReal, duration, setPosition]);

  const play = useCallback(() => {
    const atEnd = positionRef.current >= duration - 0.25;
    if (isReal) {
      const sound = soundRef.current;
      if (!sound) {
        return;
      }
      if (atEnd) {
        sound.setCurrentTime(0);
        setPosition(0);
      }
      startSound(sound);
      return;
    }
    if (atEnd) {
      setPosition(0);
    }
    setIsPlaying(true);
  }, [duration, isReal, setPosition, startSound]);

  const pause = useCallback(() => {
    soundRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);

  const seekTo = useCallback(
    (seconds: number) => {
      const target = Math.max(0, Math.min(seconds, duration));
      soundRef.current?.setCurrentTime(target);
      setPosition(target);
    },
    [duration, setPosition]
  );

  const skip = useCallback(
    (deltaSeconds: number) => seekTo(positionRef.current + deltaSeconds),
    [seekTo]
  );

  return { position, duration, isPlaying, isReal, loading, error, play, pause, toggle, seekTo, skip };
}

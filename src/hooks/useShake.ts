import { useEffect, useRef, useState } from 'react';
import {
  accelerometer,
  SensorTypes,
  setUpdateIntervalForType,
} from 'react-native-sensors';

const SHAKE_THRESHOLD = 16;
const SHAKE_COOLDOWN_MS = 1200;

export const useShake = (onShake: () => void, enabled: boolean): boolean | null => {
  const onShakeRef = useRef(onShake);
  const lastShakeAt = useRef(0);
  const [sensorAvailable, setSensorAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    onShakeRef.current = onShake;
  }, [onShake]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let active = true;
    lastShakeAt.current = 0;
    setSensorAvailable(null);

    try {
      setUpdateIntervalForType(SensorTypes.accelerometer, 100);
      const subscription = accelerometer.subscribe({
        next: ({ x, y, z }) => {
          const magnitude = Math.sqrt(x * x + y * y + z * z);
          const now = Date.now();

          if (magnitude < SHAKE_THRESHOLD || now - lastShakeAt.current < SHAKE_COOLDOWN_MS) {
            return;
          }

          lastShakeAt.current = now;
          onShakeRef.current();
        },
        error: (error: unknown) => {
          if (active) {
            console.warn('No se pudo acceder al acelerómetro:', error);
            setSensorAvailable(false);
          }
        },
      });

      setSensorAvailable(true);
      return () => {
        active = false;
        subscription.unsubscribe();
      };
    } catch (error) {
      console.warn('No se pudo iniciar el acelerómetro:', error);
      setSensorAvailable(false);
    }
  }, [enabled]);

  return sensorAvailable;
};

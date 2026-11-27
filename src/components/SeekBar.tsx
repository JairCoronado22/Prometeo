import React, { useMemo, useRef, useState } from 'react';
import { GestureResponderEvent, PanResponder, StyleSheet, View } from 'react-native';

interface SeekBarProps {
  position: number;
  duration: number;
  /** Se llama al soltar (o tocar) con el segundo elegido. */
  onSeek: (seconds: number) => void;
  /** Barra fina sin "bolita" (mini-reproductor). */
  compact?: boolean;
}

/** Barra de progreso que se puede tocar o arrastrar para moverse por la canción. */
export const SeekBar: React.FC<SeekBarProps> = ({ position, duration, onSeek, compact = false }) => {
  const trackRef = useRef<View>(null);
  const layout = useRef({ x: 0, width: 1 });
  const [dragRatio, setDragRatio] = useState<number | null>(null);

  const ratioFromEvent = (event: GestureResponderEvent) => {
    const { x, width } = layout.current;
    return Math.max(0, Math.min(1, (event.nativeEvent.pageX - x) / Math.max(width, 1)));
  };

  // Callbacks frescos aunque el PanResponder se cree una sola vez.
  const latest = useRef({ duration, onSeek });
  latest.current = { duration, onSeek };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false, // que el ScrollView no "robe" el arrastre
        onPanResponderGrant: (event) => setDragRatio(ratioFromEvent(event)),
        onPanResponderMove: (event) => setDragRatio(ratioFromEvent(event)),
        onPanResponderRelease: (event) => {
          const ratio = ratioFromEvent(event);
          setDragRatio(null);
          latest.current.onSeek(ratio * latest.current.duration);
        },
        onPanResponderTerminate: () => setDragRatio(null),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const measure = () => {
    trackRef.current?.measureInWindow((x, _y, width) => {
      layout.current = { x, width };
    });
  };

  const ratio =
    dragRatio ?? (duration > 0 ? Math.max(0, Math.min(1, position / duration)) : 0);

  return (
    <View
      ref={trackRef}
      onLayout={measure}
      style={compact ? styles.touchAreaCompact : styles.touchArea}
      accessibilityRole="adjustable"
      accessibilityLabel="Progreso de la canción"
      {...panResponder.panHandlers}
    >
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
      </View>
      {!compact && (
        <View
          pointerEvents="none"
          style={[styles.thumb, dragRatio != null && styles.thumbActive, { left: `${ratio * 100}%` }]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  touchArea: {
    height: 32,
    justifyContent: 'center',
  },
  touchAreaCompact: {
    height: 20,
    justifyContent: 'center',
  },
  track: {
    height: 4,
    backgroundColor: '#444444',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#1DB954',
  },
  thumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: -7,
    backgroundColor: '#FFFFFF',
    top: 9,
  },
  thumbActive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: -10,
    top: 6,
    backgroundColor: '#1DB954',
  },
});

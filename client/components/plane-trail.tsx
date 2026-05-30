/**
 * Dotted curvy trail that draws itself behind the flying paper plane.
 *
 * Dots are placed at fixed positions along `planePath(t)` and fade in
 * one-by-one as the shared `progress` value (0 → 1) ticks up, so the trail
 * "draws" itself as the plane flies along the same curve.
 *
 * Drop it inside an absolutely-positioned overlay that's centred over the
 * card; the trail anchors to that centre.
 */

import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { planePath } from '@/lib/plane-path';

type PlaneTrailProps = {
  progress: SharedValue<number>;
  color: string;
  /** Where the plane ends up. Must match the value used in the screen. */
  endX?: number;
  endY?: number;
  /** Total number of dots in the trail. More dots = smoother curve. */
  count?: number;
  /** Diameter of each dot in px. */
  size?: number;
};

export function PlaneTrail({
  progress,
  color,
  endX = 300,
  endY = -900,
  count = 22,
  size = 5,
}: PlaneTrailProps) {
  return (
    <View style={styles.layer}>
      <View style={styles.anchor}>
        {Array.from({ length: count }).map((_, i) => (
          <TrailDot
            key={i}
            index={i}
            count={count}
            endX={endX}
            endY={endY}
            size={size}
            color={color}
            progress={progress}
          />
        ))}
      </View>
    </View>
  );
}

type TrailDotProps = {
  index: number;
  count: number;
  endX: number;
  endY: number;
  size: number;
  color: string;
  progress: SharedValue<number>;
};

function TrailDot({ index, count, endX, endY, size, color, progress }: TrailDotProps) {
  const t = (index + 1) / (count + 1);
  const { x, y } = planePath(t, endX, endY);

  const style = useAnimatedStyle(() => {
    // Each dot lights up when the plane reaches its position on the path
    // and then stays lit until the parent fades the whole trail out.
    const opacity = interpolate(
      progress.value,
      [Math.max(0, t - 0.05), t, 1],
      [0, 0.75, 0.75],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          transform: [{ translateX: x - size / 2 }, { translateY: y - size / 2 }],
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  anchor: {
    width: 0,
    height: 0,
  },
  dot: {
    position: 'absolute',
  },
});

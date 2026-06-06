/**
 * Press target that ignores touches that moved — swipes won't fire onPress.
 * Use on list rows inside TabSwipeRegion so horizontal pans switch tabs /
 * segments instead of opening detail screens.
 */

import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { runOnJS } from 'react-native-reanimated';

const MAX_TAP_DISTANCE = 12;

type Props = {
  onPress?: () => void;
  onLongPress?: () => void;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  delayLongPress?: number;
};

export function SwipeSafePressable({
  onPress,
  onLongPress,
  children,
  style,
  disabled,
  delayLongPress = 320,
}: Props) {
  const [pressed, setPressed] = useState(false);
  const setPressedTrue = useCallback(() => setPressed(true), []);
  const setPressedFalse = useCallback(() => setPressed(false), []);

  const gesture = useMemo(() => {
    const tap = Gesture.Tap()
      .maxDistance(MAX_TAP_DISTANCE)
      .enabled(!disabled && !!onPress)
      .onBegin(() => {
        'worklet';
        runOnJS(setPressedTrue)();
      })
      .onFinalize(() => {
        'worklet';
        runOnJS(setPressedFalse)();
      })
      .onEnd(() => {
        'worklet';
        if (onPress) runOnJS(onPress)();
      });

    if (!onLongPress) return tap;

    const longPress = Gesture.LongPress()
      .minDuration(delayLongPress)
      .maxDistance(MAX_TAP_DISTANCE)
      .enabled(!disabled)
      .onStart(() => {
        'worklet';
        runOnJS(setPressedFalse)();
        runOnJS(onLongPress)();
      });

    return Gesture.Exclusive(longPress, tap);
  }, [
    delayLongPress,
    disabled,
    onLongPress,
    onPress,
    setPressedFalse,
    setPressedTrue,
  ]);

  const flatStyle = StyleSheet.flatten([
    style,
    pressed && !disabled ? { opacity: 0.75 } : null,
  ]);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={flatStyle}>{children}</Animated.View>
    </GestureDetector>
  );
}

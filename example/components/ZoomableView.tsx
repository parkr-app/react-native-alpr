import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import {
  GestureDetector,
  usePanGesture,
  usePinchGesture,
  useExclusiveGestures,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const MAX_SCALE = 6;
const DOUBLE_TAP_SCALE = 3;

type Props = {
  style?: StyleProp<ViewStyle>;
  onLayout?: (size: { width: number; height: number }) => void;
  children: ReactNode;
};

// Pinch to zoom around the fingers, drag to pan, double-tap to toggle zoom.
// Translation is relative to the view's centre, which is the transform origin.
export function ZoomableView({ style, onLayout, children }: Props) {
  const width = useSharedValue(0);
  const height = useSharedValue(0);
  const scale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const start = useSharedValue({ scale: 1, x: 0, y: 0, focalX: 0, focalY: 0 });

  const clamp = (value: number, s: number, size: number) => {
    'worklet';
    const max = Math.max(0, ((s - 1) * size) / 2);
    return Math.min(max, Math.max(-max, value));
  };

  const animateTo = (s: number, x: number, y: number) => {
    'worklet';
    scale.value = withTiming(s);
    tx.value = withTiming(clamp(x, s, width.value));
    ty.value = withTiming(clamp(y, s, height.value));
  };

  const pinch = usePinchGesture({
    onActivate: (e) => {
      start.value = {
        scale: scale.value,
        x: tx.value,
        y: ty.value,
        focalX: e.focalX - width.value / 2,
        focalY: e.focalY - height.value / 2,
      };
    },
    onUpdate: (e) => {
      const s0 = start.value;
      const s = Math.min(MAX_SCALE, Math.max(0.8, s0.scale * e.scale));
      const fx = e.focalX - width.value / 2;
      const fy = e.focalY - height.value / 2;
      // Keep the content point that started under the fingers under them.
      scale.value = s;
      tx.value = fx - (s * (s0.focalX - s0.x)) / s0.scale;
      ty.value = fy - (s * (s0.focalY - s0.y)) / s0.scale;
    },
    onDeactivate: () => {
      const s = Math.max(1, scale.value);
      animateTo(s, s === 1 ? 0 : tx.value, s === 1 ? 0 : ty.value);
    },
  });

  const pan = usePanGesture({
    maxPointers: 1,
    onActivate: () => {
      start.value = { ...start.value, x: tx.value, y: ty.value };
    },
    onUpdate: (e) => {
      tx.value = clamp(start.value.x + e.translationX, scale.value, width.value);
      ty.value = clamp(start.value.y + e.translationY, scale.value, height.value);
    },
  });

  const doubleTap = useTapGesture({
    numberOfTaps: 2,
    onActivate: (e) => {
      if (scale.value > 1.01) {
        animateTo(1, 0, 0);
        return;
      }
      const fx = e.x - width.value / 2;
      const fy = e.y - height.value / 2;
      const k = DOUBLE_TAP_SCALE / scale.value;
      animateTo(DOUBLE_TAP_SCALE, fx - k * (fx - tx.value), fy - k * (fy - ty.value));
    },
  });

  const pinchAndPan = useSimultaneousGestures(pinch, pan);
  const gesture = useExclusiveGestures(doubleTap, pinchAndPan);

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[styles.container, style]}
        onLayout={(e) => {
          width.value = e.nativeEvent.layout.width;
          height.value = e.nativeEvent.layout.height;
          onLayout?.(e.nativeEvent.layout);
        }}
      >
        <Animated.View style={[StyleSheet.absoluteFill, contentStyle]}>{children}</Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
});

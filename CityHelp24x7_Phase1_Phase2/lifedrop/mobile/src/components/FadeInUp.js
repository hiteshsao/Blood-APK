import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform } from 'react-native';

/**
 * Entrance animation: fades the children in while sliding them up (optionally popping from a smaller scale).
 * Plays once, when the component mounts. Use `delay` to stagger sections.
 */
export const FadeInUp = ({ delay = 0, duration = 480, distance = 18, fromScale = 1, style, children }) => {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const transform = [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }];
  if (fromScale !== 1) {
    transform.push({ scale: v.interpolate({ inputRange: [0, 1], outputRange: [fromScale, 1] }) });
  }

  return <Animated.View style={[style, { opacity: v, transform }]}>{children}</Animated.View>;
};

export default FadeInUp;

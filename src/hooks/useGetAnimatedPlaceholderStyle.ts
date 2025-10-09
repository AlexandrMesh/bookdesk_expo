import { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

const useGetAnimatedPlaceholderStyle = (shouldStartAnimation: boolean) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const sharedAnimationConfig = {
    duration: 1000,
    useNativeDriver: true,
  };

  const stopAnimation = useCallback(() => {
    Animated.timing(pulseAnim, {
      ...sharedAnimationConfig,
      toValue: 0,
      easing: Easing.out(Easing.ease),
    }).start();
    pulseAnim.stopAnimation();
  }, [pulseAnim]);

  useEffect(() => {
    if (shouldStartAnimation) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            ...sharedAnimationConfig,
            toValue: 1,
            easing: Easing.out(Easing.ease),
          }),
          Animated.timing(pulseAnim, {
            ...sharedAnimationConfig,
            toValue: 0,
            easing: Easing.in(Easing.ease),
          }),
        ]),
      ).start();
    } else {
      stopAnimation();
    }

    return () => {
      stopAnimation();
    };
  }, [shouldStartAnimation, pulseAnim, stopAnimation]);

  useEffect(() => {
    if (!shouldStartAnimation) {
      stopAnimation();
    }
  }, [stopAnimation, shouldStartAnimation]);

  const opacityAnimation = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.55],
  });

  return opacityAnimation;
};

export default useGetAnimatedPlaceholderStyle;

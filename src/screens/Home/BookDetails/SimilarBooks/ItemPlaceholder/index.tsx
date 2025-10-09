import React from 'react';
import { Animated, View } from 'react-native';
import useGetAnimatedPlaceholderStyle from '~hooks/useGetAnimatedPlaceholderStyle';
import styles from './styles';

const ItemPlaceholder = () => {
  const animatedStyle = useGetAnimatedPlaceholderStyle(true);

  return (
    <Animated.View style={[styles.emptyItem, { opacity: animatedStyle }]}>
      <View style={styles.item} />
      <View style={styles.item} />
      <View style={styles.item} />
    </Animated.View>
  );
};

export default ItemPlaceholder;

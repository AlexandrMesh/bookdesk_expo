import React from 'react';

import { Animated, View } from 'react-native';

import useGetAnimatedPlaceholderStyle from '~hooks/useGetAnimatedPlaceholderStyle';

import styles from './styles';

const ItemPlaceholder = () => {
  const animatedStyle = useGetAnimatedPlaceholderStyle(true);

  return (
    <Animated.View style={[styles.emptyItem, { opacity: animatedStyle }]}>
      <View style={styles.leftSide}>
        <View style={styles.img} />
      </View>
      <View style={styles.rightSide}>
        <View style={styles.title} />
        <View style={styles.item} />
        <View style={styles.item} />
        <View style={styles.item} />
        <View style={styles.item} />
      </View>
    </Animated.View>
  );
};

export default ItemPlaceholder;

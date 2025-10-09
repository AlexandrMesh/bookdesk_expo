import React from 'react';
import { Animated, View } from 'react-native';
import useGetAnimatedPlaceholderStyle from '~hooks/useGetAnimatedPlaceholderStyle';
import styles from './styles';

const Placeholder = () => {
  const animatedStyle = useGetAnimatedPlaceholderStyle(true);

  return (
    <View style={styles.emptyWrapper}>
      <Animated.View style={{ opacity: animatedStyle }}>
        <View style={styles.header}>
          <View style={styles.img} />
          <View style={styles.title} />
          <View style={styles.author} />
        </View>
        <View style={styles.description} />
        <View style={styles.description} />
        <View style={styles.description} />
        <View style={styles.description} />
        <View style={styles.description} />
      </Animated.View>
    </View>
  );
};

export default Placeholder;

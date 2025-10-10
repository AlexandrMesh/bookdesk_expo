import React from 'react';

import { View } from 'react-native';

import { Spinner } from '~UI/Spinner';

import styles from './styles';

const Splash = () => {
  return (
    <View style={styles.wrapper}>
      <Spinner />
    </View>
  );
};

export default Splash;

import React from 'react';

import { View } from 'react-native';

import { Spinner } from '~UI/Spinner';
import { useThemedStyles } from '~theme/useThemedStyles';

import createStyles from './styles';

const Splash = () => {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.wrapper}>
      <Spinner />
    </View>
  );
};

export default Splash;

import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { Pressable } from 'react-native';
import { CLOSE_ICON } from '~constants/dimensions';
import CloseIcon from '~assets/close.svg';
import colors from '~styles/colors';
import styles from './styles';

const CloseComponent = () => {
  const navigation = useNavigation();

  return (
    <Pressable style={styles.wrapper} onPress={() => navigation.goBack()}>
      <CloseIcon width={CLOSE_ICON.width} height={CLOSE_ICON.height} fill={colors.neutral_medium} />
    </Pressable>
  );
};

export default CloseComponent;

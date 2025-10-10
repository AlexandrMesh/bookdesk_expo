import React, { FC, memo } from 'react';

import { Text, View } from 'react-native';

import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import styles from './styles';

export type Props = {
  className?: any;
};

const Logo: FC<Props> = ({ className }) => {
  const { t } = useTranslation('app');

  return (
    <View style={styles.logoWrapper}>
      <Image source={require('~assets/logo.webp')} style={[styles.logo, className]} />
      <Text style={styles.title}>{t('appName')}</Text>
      <Text style={styles.subTitle}>{t('appTitle')}</Text>
    </View>
  );
};

export default memo(Logo);

import React from 'react';

import { ScrollView, Text, Linking } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

import Button from '~UI/Button';

import styles from './styles';

const UpdateApp = () => {
  const { t } = useTranslation(['app', 'common']);

  const handleUpdate = async () => {
    const googlePlayUrl = (await AsyncStorage.getItem('googlePlayUrl')) as string;
    Linking.openURL(googlePlayUrl);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>{t('app:needsToBeUpdated')}</Text>
      <Button style={styles.button} onPress={handleUpdate} title={t('common:update')} />
    </ScrollView>
  );
};

export default UpdateApp;

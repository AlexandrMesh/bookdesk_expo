import React, { useState } from 'react';

import { ScrollView, Text } from 'react-native';

import { useNetInfo, refresh } from '@react-native-community/netinfo';
import { useTranslation } from 'react-i18next';

import Button from '~UI/Button';

import styles from './styles';

const NoConnection = () => {
  const { t } = useTranslation(['app', 'common']);
  const [connectionType, setConnectionType] = useState('');
  const { type } = useNetInfo();

  const handleCheckConnection = () => {
    refresh();
    setConnectionType(type);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>{t('noConnectionMessage')}</Text>
      <Button style={styles.button} onPress={handleCheckConnection} title={t('common:retry')} />
      {connectionType ? <Text style={[styles.label, styles.mTop]}>{t('connectionType', { type: t(connectionType) })}</Text> : null}
    </ScrollView>
  );
};

export default NoConnection;

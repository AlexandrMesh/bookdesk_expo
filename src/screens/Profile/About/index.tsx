import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, Text, View } from 'react-native';
import Button from '~UI/Button';
import { Spinner } from '~UI/Spinner';
import { SECONDARY } from '~constants/themes';
import styles from './styles';

const About = () => {
  const { t } = useTranslation('app');

  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');

  const loadInfo = useCallback(async () => {
    setIsLoading(true);
    const name = await AsyncStorage.getItem('appName');
    const email = await AsyncStorage.getItem('email');
    const description = await AsyncStorage.getItem('description');
    setName(name as string);
    setEmail(email as string);
    setDescription(description as string);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadInfo();
  }, [loadInfo]);

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.spinnerWrapper}>
          <Spinner />
        </View>
      ) : (
        <>
          <Text style={styles.label}>
            {t('name')} <Text style={styles.value}>{name}</Text>
          </Text>
          <Text style={styles.label}>
            {t('version')} <Text style={styles.value}>{Constants.expoConfig?.version || '1.0.0'}</Text>
          </Text>
          <Text style={styles.label}>
            {t('feedback')}{' '}
            <Button
              theme={SECONDARY}
              style={styles.supportButton}
              titleStyle={styles.titleStyle}
              title={t('support')}
              onPress={() => Linking.openURL(`mailto:${email}`)}
            />
          </Text>
          <Text style={styles.label}>{t('description')}</Text>
          <ScrollView>
            <Text style={styles.value}>{description}</Text>
          </ScrollView>
        </>
      )}
    </View>
  );
};

export default About;

import React from 'react';

import { Text, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ADD_GOAL } from '~constants/routes';
import Button from '~UI/Button';

import styles from './styles';

const Goals = () => {
  const { t } = useTranslation('goals');
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View>
        <View>
          <Text style={styles.text}>{t('goalsDescription')}</Text>
          <View style={styles.buttons}>
            <Button style={styles.button} onPress={() => navigation.navigate(ADD_GOAL)} title={t('addGoal')} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Goals;

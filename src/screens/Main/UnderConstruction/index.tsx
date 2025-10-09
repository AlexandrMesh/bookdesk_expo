import React, { useState, useEffect } from 'react';
import { ScrollView, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from './styles';

const UnderConstruction = () => {
  const [underConstructionMessage, setUnderConstructionMessage] = useState('');

  const getUnderConstructionMessage = async () => {
    const underConstructionMessage = (await AsyncStorage.getItem('underConstructionMessage')) as string;
    setUnderConstructionMessage(underConstructionMessage);
  };

  useEffect(() => {
    getUnderConstructionMessage();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>{underConstructionMessage}</Text>
    </ScrollView>
  );
};

export default UnderConstruction;

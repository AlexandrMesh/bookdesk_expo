import { I18nManager } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { RU, EN } from '~constants/languages';

const detectLanguage = async () => {
  const language = await AsyncStorage.getItem('language');
  if (language) {
    return language;
  }
  const userLocale = (I18nManager?.getConstants()?.localeIdentifier || EN).split('_');
  return userLocale[0] === RU ? RU : EN;
};

export default detectLanguage;

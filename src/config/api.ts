import AsyncStorage from '@react-native-async-storage/async-storage';

import { APP_CONFIG } from './appConfig';

const _URL = {
  development: 'http://localhost:3000',
  // development: 'http://10.9.249.81:3000',
};

export const getImgUrl = async () => {
  const imgUrl = await AsyncStorage.getItem('imgUrl');
  return imgUrl ? `${imgUrl}/images/covers` : `${APP_CONFIG.imgUrl}/images/covers`;
};

export const getApiUrl = async () => {
  const apiUrl = await AsyncStorage.getItem('apiUrl');
  return apiUrl || APP_CONFIG.apiUrl;
};

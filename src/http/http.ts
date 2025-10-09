import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const http = axios.create({
  baseURL: 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

http.interceptors.request.use(
  async (config: any) => {
    try {
      const value = await AsyncStorage.getItem('token');
      // eslint-disable-next-line no-param-reassign
      if (value) {
        config.headers.Authorization = `Bearer ${value}`;
      }
    } catch (e) {
      console.error(e);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export default http;

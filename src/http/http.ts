import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const http = axios.create({
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

http.interceptors.request.use(
  async (config: any) => {
    try {
      const value = await AsyncStorage.getItem('token');

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

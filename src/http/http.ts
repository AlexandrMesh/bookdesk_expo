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

// Response interceptor для обработки ошибок авторизации
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Если получили ошибку 401 или 403, удаляем невалидный токен
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      try {
        await AsyncStorage.removeItem('token');
        console.error('Token removed due to authentication error');
      } catch (storageError) {
        console.error('Error removing token from AsyncStorage:', storageError);
      }
    }
    return Promise.reject(error);
  },
);

export default http;

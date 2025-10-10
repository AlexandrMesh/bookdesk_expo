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
      // eslint-disable-next-line no-param-reassign
      if (value) {
        config.headers.Authorization = `Bearer ${value}`;
      }
      // Log request URL for debugging
      if (__DEV__) {
        console.log('HTTP Request:', config.method?.toUpperCase(), config.url);
      }
    } catch (e) {
      console.error('HTTP Interceptor Error:', e);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

http.interceptors.response.use(
  (response) => response,
  (error) => {
    // Always log errors for debugging, even in production
    console.error('HTTP Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      data: error.response?.data,
    });
    return Promise.reject(error);
  },
);

export default http;

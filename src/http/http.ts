import axios from 'axios';

import { getToken, removeToken } from '~utils/secureStorage';

const http = axios.create({
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

http.interceptors.request.use(
  async (config: any) => {
    try {
      const value = await getToken();

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
        await removeToken();
        console.error('Token removed due to authentication error');
      } catch (storageError) {
        console.error('Error removing token:', storageError);
      }
    }
    return Promise.reject(error);
  },
);

export default http;

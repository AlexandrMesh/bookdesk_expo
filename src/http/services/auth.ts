import http from '../http';
import { getApiUrl } from '../../config/api';

const AuthService = () => ({
  signIn: async (params: any) => {
    const apiUrl = await getApiUrl();
    const url = `${apiUrl}/signIn`;
    console.log('AuthService.signIn URL:', url);
    return http.post(url, params);
  },
  signUp: async (params: any) => {
    const apiUrl = await getApiUrl();
    const url = `${apiUrl}/signUp`;
    console.log('AuthService.signUp URL:', url);
    return http.post(url, params);
  },
  checkAuth: async (token: string) => {
    const apiUrl = await getApiUrl();
    const url = `${apiUrl}/checkAuth?token=${token}`;
    console.log('AuthService.checkAuth URL:', url);
    return http.get(url);
  },
});

export default AuthService;

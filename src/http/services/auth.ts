import { getApiUrl } from '../../config/api';
import http from '../http';

const AuthService = () => ({
  signIn: async (params: any) => http.post(`${await getApiUrl()}/signIn`, params),
  signUp: async (params: any) => http.post(`${await getApiUrl()}/signUp`, params),
  checkAuth: async (token: string) => http.get(`${await getApiUrl()}/checkAuth?token=${token}`),
});

export default AuthService;

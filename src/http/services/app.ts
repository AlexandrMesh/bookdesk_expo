import http from '../http';
import { getApiUrl } from '../../config/api';

const AppService = () => ({
  getAppInfo: async (params?: any) => http.get(`${await getApiUrl()}/appInfo`, params),
  supportApp: async (params: any) => http.post(`${await getApiUrl()}/supportApp`, params),
});

export default AppService;

import http from '../http';
import { getApiUrl } from '../../config/api';

const CustomBooksService = () => ({
  getSuggestCoversList: async (params: any) => http.get(`${await getApiUrl()}/coversList`, { params }),
  addCustomBook: async (params: any) => http.post(`${await getApiUrl()}/addCustomBook`, params),
  getCustomBooks: async (params: any) => http.get(`${await getApiUrl()}/customBooks`, { params }),
  updateCustomBook: async (params: any) => http.post(`${await getApiUrl()}/updateCustomBook`, params),
});

export default CustomBooksService;

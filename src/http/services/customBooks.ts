import { getApiUrl } from '../../config/api';
import http from '../http';

const CustomBooksService = () => ({
  getSuggestCoversList: async (params: any) => http.get(`${await getApiUrl()}/coversList`, { params }),
  addCustomBook: async (params: any) => http.post(`${await getApiUrl()}/addCustomBook`, params),
  getCustomBooks: async (params: any) => http.get(`${await getApiUrl()}/customBooks`, { params }),
  updateCustomBook: async (params: any) => http.post(`${await getApiUrl()}/updateCustomBook`, params),
});

export default CustomBooksService;

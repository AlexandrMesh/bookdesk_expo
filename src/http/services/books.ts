import { getApiUrl } from '../../config/api';
import http from '../http';

const DataService = () => ({
  getBookList: async (params: any) => http.get(`${await getApiUrl()}/books`, { params }),
  getCategories: async (params: any) => http.get(`${await getApiUrl()}/categories`, { params }),
});

export default DataService;

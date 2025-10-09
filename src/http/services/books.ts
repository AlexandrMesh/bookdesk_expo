import http from '../http';
import { getApiUrl } from '../../config/api';

const DataService = () => ({
  getUsersCompletedBooksCount: async (params: any) => http.get(`${await getApiUrl()}/usersCompletedBooksCount`, { params }),
  getBookList: async (params: any) => http.get(`${await getApiUrl()}/books`, { params }),
  getBookComment: async (params: any) => http.get(`${await getApiUrl()}/userBookComment`, { params }),
  getUserBookRating: async (params: any) => http.get(`${await getApiUrl()}/userBookRating`, { params }),
  getSimilarBooks: async (params: any) => http.get(`${await getApiUrl()}/similarBooks`, { params }),
  updateUserBook: async (params: any) => http.post(`${await getApiUrl()}/updateUserBook`, params),
  updateUserComment: async (params: any) => http.post(`${await getApiUrl()}/updateUserComment`, params),
  updateUserBookRating: async (params: any) => http.post(`${await getApiUrl()}/updateUserBookRatingV2`, params),
  updateBookVotes: async (params: any) => http.post(`${await getApiUrl()}/updateBookVotes`, params),
  getCategories: async (params: any) => http.get(`${await getApiUrl()}/categories`, { params }),
  getBookDetails: async (params: any) => http.get(`${await getApiUrl()}/book`, { params }),
  getBooksCountByYear: async (params: any) => http.get(`${await getApiUrl()}/booksCountByYearV2`, { params }),
  getBooksCountByYearForStat: async (params: any) => http.get(`${await getApiUrl()}/booksCountByYearV3`, { params }),
  updateUserBookAddedValue: async (params: any) => http.post(`${await getApiUrl()}/updateUserBookAddedValue`, params),
  deleteUserBookRating: async (params: any) => http.post(`${await getApiUrl()}/deleteUserBookRating`, params),
  deleteUserComment: async (params: any) => http.post(`${await getApiUrl()}/deleteUserComment`, params),
});

export default DataService;

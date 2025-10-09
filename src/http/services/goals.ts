import http from '../http';
import { getApiUrl } from '../../config/api';

const GoalsService = () => ({
  getGoalItems: async (params?: any) => http.get(`${await getApiUrl()}/userGoalItems`, { params }),
  getUserGoalItemsByYear: async (params?: any) => http.get(`${await getApiUrl()}/userGoalItemsByYear`, { params }),
  addGoalItem: async (params: any) => http.post(`${await getApiUrl()}/addUserGoalItem`, params),
  addGoal: async (params: any) => http.post(`${await getApiUrl()}/addUserGoal`, params),
  updateGoal: async (params: any) => http.post(`${await getApiUrl()}/updateUserGoal`, params),
  deleteUserGoalItem: async (params: any) => http.post(`${await getApiUrl()}/deleteUserGoalItem`, params),
});

export default GoalsService;

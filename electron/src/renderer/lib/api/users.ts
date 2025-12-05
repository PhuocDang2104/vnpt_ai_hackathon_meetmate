import api from '../apiClient';
import type { User, UserListResponse, DepartmentListResponse } from '../../shared/dto/user';

const ENDPOINT = '/users';

export const usersApi = {
  list: async (params?: { search?: string; department_id?: string }): Promise<UserListResponse> => {
    return api.get<UserListResponse>(ENDPOINT, params as Record<string, string>);
  },

  getMe: async (): Promise<User> => {
    return api.get<User>(`${ENDPOINT}/me`);
  },

  get: async (id: string): Promise<User> => {
    return api.get<User>(`${ENDPOINT}/${id}`);
  },

  getDepartments: async (): Promise<DepartmentListResponse> => {
    return api.get<DepartmentListResponse>(`${ENDPOINT}/departments`);
  },
};

export default usersApi;


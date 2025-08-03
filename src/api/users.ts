// Users API Service
import { apiRequest } from './client';
import { 
  User, 
  CreateUserRequest, 
  Distributor, 
  CreateDistributorRequest,
  UserQueryParams,
  ApiResponse 
} from '../types/api';

export const usersAPI = {
  // Create a new user
  async createUser(userData: CreateUserRequest): Promise<ApiResponse<User>> {
    return apiRequest<User>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Get all users with filtering and pagination
  async getUsers(params?: UserQueryParams): Promise<ApiResponse<User[]>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/users?${queryString}` : '/users';
    
    return apiRequest<User[]>(endpoint);
  },

  // Get user by ID
  async getUserById(id: string): Promise<ApiResponse<User>> {
    return apiRequest<User>(`/users/${id}`);
  },

  // Check user by email
  async checkUserByEmail(email: string): Promise<ApiResponse<User>> {
    return apiRequest<User>(`/users/email/${email}`);
  },

  // Check user by user ID
  async checkUserByUserId(userId: string): Promise<ApiResponse<User>> {
    return apiRequest<User>(`/users/userId/${userId}`);
  },

  // Get user statistics overview
  async getUserStatsOverview(): Promise<ApiResponse<any>> {
    return apiRequest<any>('/users/stats/overview');
  },

  // Create distributor application
  async createDistributor(distributorData: CreateDistributorRequest): Promise<ApiResponse<Distributor>> {
    return apiRequest<Distributor>('/distributors/signup', {
      method: 'POST',
      body: JSON.stringify(distributorData),
    });
  },

  // Distributor login
  async distributorLogin(loginData: {
    username: string;
    password: string;
  }): Promise<ApiResponse<any>> {
    return apiRequest<any>('/distributors/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    });
  },

  // Get distributor dashboard
  async getDistributorDashboard(id: string): Promise<ApiResponse<any>> {
    return apiRequest<any>(`/distributors/dashboard/${id}`);
  }
}; 
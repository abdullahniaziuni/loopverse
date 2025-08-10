import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Define the base API URL based on environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

/**
 * Create and configure Axios instance
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies if using cookie-based auth
});

/**
 * Request interceptor for API calls
 */
apiClient.interceptors.request.use(
  (config) => {
    // Changed from 'token' to 'auth_token'
    const token = localStorage.getItem('auth_token');
    
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for API calls
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized errors (token expired)
    if (error.response?.status === 401 && !originalRequest?.headers?._retry) {
      // Mark original request as retried to prevent infinite loops
      if (originalRequest?.headers) {
        originalRequest.headers._retry = true;
      }

      try {
        // You could implement token refresh logic here
        // const refreshToken = localStorage.getItem('refreshToken');
        // const response = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, { refreshToken });
        // const newToken = response.data.token;
        // localStorage.setItem('token', newToken);
        
        // Retry original request with new token
        // if (originalRequest?.headers) {
        //   originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        // }
        // return apiClient(originalRequest);
        
        // For now, just logout on 401
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } catch (refreshError) {
        // If token refresh fails, redirect to login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Create a more informative error message
    const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Something went wrong';

    // You can handle specific error status codes here
    switch (error.response?.status) {
      case 400:
        console.error('Bad request:', errorMessage);
        break;
      case 403:
        console.error('Forbidden:', errorMessage);
        break;
      case 404:
        console.error('Not found:', errorMessage);
        break;
      case 500:
        console.error('Server error:', errorMessage);
        break;
      default:
        console.error('API error:', errorMessage);
    }

    return Promise.reject(error);
  }
);

// Helper methods for common HTTP methods
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) => 
    apiClient.get<T>(url, config).then(response => response.data),
  
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.post<T>(url, data, config).then(response => response.data),
  
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.put<T>(url, data, config).then(response => response.data),
  
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.patch<T>(url, data, config).then(response => response.data),
  
  delete: <T>(url: string, config?: AxiosRequestConfig) => 
    apiClient.delete<T>(url, config).then(response => response.data)
};

/**
 * Get the current auth token with validation
 */
export const getAuthToken = () => {
  const token = localStorage.getItem('token');
  
  // Check if token exists and has the expected format
  if (!token || token === 'undefined' || token === 'null') {
    return null;
  }
  
  return token;
};

export default api;
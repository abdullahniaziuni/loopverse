import { 
  User, 
  Session, 
  BookingRequest, 
  AvailabilitySlot, 
  SessionFeedback,
  ApiResponse,
  LoginForm,
  SignupForm,
  DashboardStats,
  Mentor
} from '../types';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  // Helper method to set authorization header
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Helper method for API requests
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Set authentication token
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  // Clear authentication token
  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // Authentication endpoints
  async login(credentials: LoginForm): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async signup(userData: SignupForm): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout(): Promise<ApiResponse<void>> {
    const response = await this.request('/auth/logout', {
      method: 'POST',
    });
    this.clearToken();
    return response;
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request('/auth/me');
  }

  async forgotPassword(email: string): Promise<ApiResponse<void>> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string): Promise<ApiResponse<void>> {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  // User profile endpoints
  async updateProfile(profileData: Partial<User>): Promise<ApiResponse<User>> {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async uploadAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
    const formData = new FormData();
    formData.append('avatar', file);

    return this.request('/users/avatar', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        // Don't set Content-Type for FormData
      },
    });
  }

  // Mentor endpoints
  async getMentors(filters?: {
    skills?: string[];
    rating?: number;
    availability?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ mentors: Mentor[]; total: number; page: number; totalPages: number }>> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v.toString()));
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });
    }

    const endpoint = `/mentors${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getMentorById(id: string): Promise<ApiResponse<Mentor>> {
    return this.request(`/mentors/${id}`);
  }

  async getMentorAvailability(mentorId: string, date?: string): Promise<ApiResponse<AvailabilitySlot[]>> {
    const endpoint = `/mentors/${mentorId}/availability${date ? `?date=${date}` : ''}`;
    return this.request(endpoint);
  }

  async updateMentorAvailability(slots: AvailabilitySlot[]): Promise<ApiResponse<AvailabilitySlot[]>> {
    return this.request('/mentors/availability', {
      method: 'PUT',
      body: JSON.stringify({ slots }),
    });
  }

  async applyAsMentor(applicationData: {
    bio: string;
    skills: string[];
    experience: string;
    hourlyRate: number;
  }): Promise<ApiResponse<void>> {
    return this.request('/mentors/apply', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  }

  // Session endpoints
  async getSessions(filters?: {
    status?: string;
    mentorId?: string;
    learnerId?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ sessions: Session[]; total: number; page: number; totalPages: number }>> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/sessions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getSessionById(id: string): Promise<ApiResponse<Session>> {
    return this.request(`/sessions/${id}`);
  }

  async createSession(sessionData: {
    mentorId: string;
    date: string;
    startTime: string;
    endTime: string;
    topic?: string;
  }): Promise<ApiResponse<Session>> {
    return this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<ApiResponse<Session>> {
    return this.request(`/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async cancelSession(id: string, reason?: string): Promise<ApiResponse<void>> {
    return this.request(`/sessions/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Booking endpoints
  async createBookingRequest(bookingData: {
    mentorId: string;
    slotId: string;
    message?: string;
  }): Promise<ApiResponse<BookingRequest>> {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async getBookingRequests(filters?: {
    status?: string;
    mentorId?: string;
    learnerId?: string;
  }): Promise<ApiResponse<BookingRequest[]>> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/bookings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async respondToBookingRequest(
    id: string, 
    response: 'accepted' | 'rejected', 
    message?: string
  ): Promise<ApiResponse<BookingRequest>> {
    return this.request(`/bookings/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify({ response, message }),
    });
  }

  // Feedback endpoints
  async submitFeedback(sessionId: string, feedback: {
    rating: number;
    comment?: string;
  }): Promise<ApiResponse<SessionFeedback>> {
    return this.request(`/sessions/${sessionId}/feedback`, {
      method: 'POST',
      body: JSON.stringify(feedback),
    });
  }

  async getFeedback(sessionId: string): Promise<ApiResponse<SessionFeedback>> {
    return this.request(`/sessions/${sessionId}/feedback`);
  }

  // Admin endpoints
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request('/admin/stats');
  }

  async getPendingMentorApplications(): Promise<ApiResponse<any[]>> {
    return this.request('/admin/mentor-applications');
  }

  async approveMentorApplication(
    applicationId: string, 
    approved: boolean, 
    comments?: string
  ): Promise<ApiResponse<void>> {
    return this.request(`/admin/mentor-applications/${applicationId}`, {
      method: 'PUT',
      body: JSON.stringify({ approved, comments }),
    });
  }

  async getAllUsers(filters?: {
    role?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ users: User[]; total: number; page: number; totalPages: number }>> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/admin/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  // AI endpoints
  async generateSessionSummary(sessionId: string): Promise<ApiResponse<{ summary: string }>> {
    return this.request(`/ai/sessions/${sessionId}/summary`, {
      method: 'POST',
    });
  }

  async getRecommendations(type: 'mentors' | 'topics'): Promise<ApiResponse<any[]>> {
    return this.request(`/ai/recommendations/${type}`);
  }

  // File upload endpoints
  async uploadFile(file: File, type: 'avatar' | 'resource' | 'portfolio'): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.request('/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });
  }

  // Search endpoints
  async searchMentors(query: string, filters?: any): Promise<ApiResponse<Mentor[]>> {
    const queryParams = new URLSearchParams({ q: query });
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v.toString()));
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });
    }

    return this.request(`/search/mentors?${queryParams.toString()}`);
  }

  // Notification endpoints
  async getNotifications(): Promise<ApiResponse<any[]>> {
    return this.request('/notifications');
  }

  async markNotificationAsRead(id: string): Promise<ApiResponse<void>> {
    return this.request(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();
export default apiService;

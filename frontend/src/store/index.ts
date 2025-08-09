import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  User, 
  Session, 
  BookingRequest, 
  Mentor, 
  AvailabilitySlot,
  DashboardStats,
  SessionFeedback
} from '../types';
import { apiService } from '../services/api';

// Auth Store
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: any) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        token: null,
        isLoading: false,
        error: null,

        login: async (email: string, password: string) => {
          set({ isLoading: true, error: null });
          try {
            const response = await apiService.login({ email, password });
            if (response.success && response.data) {
              const { user, token } = response.data;
              apiService.setToken(token);
              set({ user, token, isLoading: false });
            } else {
              set({ error: response.error || 'Login failed', isLoading: false });
            }
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Login failed', 
              isLoading: false 
            });
          }
        },

        signup: async (userData: any) => {
          set({ isLoading: true, error: null });
          try {
            const response = await apiService.signup(userData);
            if (response.success && response.data) {
              const { user, token } = response.data;
              apiService.setToken(token);
              set({ user, token, isLoading: false });
            } else {
              set({ error: response.error || 'Signup failed', isLoading: false });
            }
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Signup failed', 
              isLoading: false 
            });
          }
        },

        logout: () => {
          apiService.clearToken();
          set({ user: null, token: null, error: null });
        },

        updateProfile: async (data: Partial<User>) => {
          set({ isLoading: true, error: null });
          try {
            const response = await apiService.updateProfile(data);
            if (response.success && response.data) {
              set({ user: response.data, isLoading: false });
            } else {
              set({ error: response.error || 'Profile update failed', isLoading: false });
            }
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Profile update failed', 
              isLoading: false 
            });
          }
        },

        clearError: () => set({ error: null }),
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({ user: state.user, token: state.token }),
      }
    ),
    { name: 'auth-store' }
  )
);

// Mentors Store
interface MentorsState {
  mentors: Mentor[];
  currentMentor: Mentor | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    skills: string[];
    rating: number | null;
    availability: string | null;
    search: string;
  };
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };

  // Actions
  fetchMentors: (filters?: any) => Promise<void>;
  fetchMentorById: (id: string) => Promise<void>;
  setFilters: (filters: Partial<MentorsState['filters']>) => void;
  clearFilters: () => void;
  setCurrentMentor: (mentor: Mentor | null) => void;
}

export const useMentorsStore = create<MentorsState>()(
  devtools(
    (set, get) => ({
      mentors: [],
      currentMentor: null,
      isLoading: false,
      error: null,
      filters: {
        skills: [],
        rating: null,
        availability: null,
        search: '',
      },
      pagination: {
        page: 1,
        totalPages: 1,
        total: 0,
      },

      fetchMentors: async (filters?: any) => {
        set({ isLoading: true, error: null });
        try {
          const currentFilters = get().filters;
          const mergedFilters = { ...currentFilters, ...filters };
          
          const response = await apiService.getMentors(mergedFilters);
          if (response.success && response.data) {
            const { mentors, total, page, totalPages } = response.data;
            set({ 
              mentors, 
              pagination: { page, totalPages, total },
              isLoading: false 
            });
          } else {
            set({ error: response.error || 'Failed to fetch mentors', isLoading: false });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch mentors', 
            isLoading: false 
          });
        }
      },

      fetchMentorById: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiService.getMentorById(id);
          if (response.success && response.data) {
            set({ currentMentor: response.data, isLoading: false });
          } else {
            set({ error: response.error || 'Failed to fetch mentor', isLoading: false });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch mentor', 
            isLoading: false 
          });
        }
      },

      setFilters: (newFilters) => {
        const currentFilters = get().filters;
        set({ filters: { ...currentFilters, ...newFilters } });
      },

      clearFilters: () => {
        set({
          filters: {
            skills: [],
            rating: null,
            availability: null,
            search: '',
          }
        });
      },

      setCurrentMentor: (mentor) => set({ currentMentor: mentor }),
    }),
    { name: 'mentors-store' }
  )
);

// Sessions Store
interface SessionsState {
  sessions: Session[];
  currentSession: Session | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchSessions: (filters?: any) => Promise<void>;
  fetchSessionById: (id: string) => Promise<void>;
  createSession: (sessionData: any) => Promise<void>;
  updateSession: (id: string, updates: Partial<Session>) => Promise<void>;
  cancelSession: (id: string, reason?: string) => Promise<void>;
  submitFeedback: (sessionId: string, feedback: any) => Promise<void>;
}

export const useSessionsStore = create<SessionsState>()(
  devtools(
    (set, get) => ({
      sessions: [],
      currentSession: null,
      isLoading: false,
      error: null,

      fetchSessions: async (filters?: any) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiService.getSessions(filters);
          if (response.success && response.data) {
            set({ sessions: response.data.sessions, isLoading: false });
          } else {
            set({ error: response.error || 'Failed to fetch sessions', isLoading: false });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch sessions', 
            isLoading: false 
          });
        }
      },

      fetchSessionById: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiService.getSessionById(id);
          if (response.success && response.data) {
            set({ currentSession: response.data, isLoading: false });
          } else {
            set({ error: response.error || 'Failed to fetch session', isLoading: false });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch session', 
            isLoading: false 
          });
        }
      },

      createSession: async (sessionData: any) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiService.createSession(sessionData);
          if (response.success && response.data) {
            const sessions = get().sessions;
            set({ sessions: [...sessions, response.data], isLoading: false });
          } else {
            set({ error: response.error || 'Failed to create session', isLoading: false });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create session', 
            isLoading: false 
          });
        }
      },

      updateSession: async (id: string, updates: Partial<Session>) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiService.updateSession(id, updates);
          if (response.success && response.data) {
            const sessions = get().sessions;
            const updatedSessions = sessions.map(session => 
              session.id === id ? response.data! : session
            );
            set({ sessions: updatedSessions, isLoading: false });
          } else {
            set({ error: response.error || 'Failed to update session', isLoading: false });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update session', 
            isLoading: false 
          });
        }
      },

      cancelSession: async (id: string, reason?: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiService.cancelSession(id, reason);
          if (response.success) {
            const sessions = get().sessions;
            const updatedSessions = sessions.map(session => 
              session.id === id ? { ...session, status: 'cancelled' as const } : session
            );
            set({ sessions: updatedSessions, isLoading: false });
          } else {
            set({ error: response.error || 'Failed to cancel session', isLoading: false });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to cancel session', 
            isLoading: false 
          });
        }
      },

      submitFeedback: async (sessionId: string, feedback: any) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiService.submitFeedback(sessionId, feedback);
          if (response.success) {
            const sessions = get().sessions;
            const updatedSessions = sessions.map(session => 
              session.id === sessionId ? { ...session, feedback: response.data } : session
            );
            set({ sessions: updatedSessions, isLoading: false });
          } else {
            set({ error: response.error || 'Failed to submit feedback', isLoading: false });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to submit feedback', 
            isLoading: false 
          });
        }
      },
    }),
    { name: 'sessions-store' }
  )
);

// Bookings Store
interface BookingsState {
  bookingRequests: BookingRequest[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchBookingRequests: (filters?: any) => Promise<void>;
  createBookingRequest: (bookingData: any) => Promise<void>;
  respondToBookingRequest: (id: string, response: 'accepted' | 'rejected', message?: string) => Promise<void>;
}

export const useBookingsStore = create<BookingsState>()(
  devtools(
    (set, get) => ({
      bookingRequests: [],
      isLoading: false,
      error: null,

      fetchBookingRequests: async (filters?: any) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiService.getBookingRequests(filters);
          if (response.success && response.data) {
            set({ bookingRequests: response.data, isLoading: false });
          } else {
            set({ error: response.error || 'Failed to fetch booking requests', isLoading: false });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch booking requests', 
            isLoading: false 
          });
        }
      },

      createBookingRequest: async (bookingData: any) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiService.createBookingRequest(bookingData);
          if (response.success && response.data) {
            const bookingRequests = get().bookingRequests;
            set({ bookingRequests: [...bookingRequests, response.data], isLoading: false });
          } else {
            set({ error: response.error || 'Failed to create booking request', isLoading: false });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create booking request', 
            isLoading: false 
          });
        }
      },

      respondToBookingRequest: async (id: string, response: 'accepted' | 'rejected', message?: string) => {
        set({ isLoading: true, error: null });
        try {
          const apiResponse = await apiService.respondToBookingRequest(id, response, message);
          if (apiResponse.success && apiResponse.data) {
            const bookingRequests = get().bookingRequests;
            const updatedRequests = bookingRequests.map(request => 
              request.id === id ? apiResponse.data! : request
            );
            set({ bookingRequests: updatedRequests, isLoading: false });
          } else {
            set({ error: apiResponse.error || 'Failed to respond to booking request', isLoading: false });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to respond to booking request', 
            isLoading: false 
          });
        }
      },
    }),
    { name: 'bookings-store' }
  )
);

// Admin Store
interface AdminState {
  dashboardStats: DashboardStats | null;
  pendingApplications: any[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchDashboardStats: () => Promise<void>;
  fetchPendingApplications: () => Promise<void>;
  approveMentorApplication: (id: string, approved: boolean, comments?: string) => Promise<void>;
}

export const useAdminStore = create<AdminState>()(
  devtools(
    (set, get) => ({
      dashboardStats: null,
      pendingApplications: [],
      isLoading: false,
      error: null,

      fetchDashboardStats: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiService.getDashboardStats();
          if (response.success && response.data) {
            set({ dashboardStats: response.data, isLoading: false });
          } else {
            set({ error: response.error || 'Failed to fetch dashboard stats', isLoading: false });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats', 
            isLoading: false 
          });
        }
      },

      fetchPendingApplications: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiService.getPendingMentorApplications();
          if (response.success && response.data) {
            set({ pendingApplications: response.data, isLoading: false });
          } else {
            set({ error: response.error || 'Failed to fetch pending applications', isLoading: false });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch pending applications', 
            isLoading: false 
          });
        }
      },

      approveMentorApplication: async (id: string, approved: boolean, comments?: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiService.approveMentorApplication(id, approved, comments);
          if (response.success) {
            const pendingApplications = get().pendingApplications;
            const updatedApplications = pendingApplications.filter(app => app.id !== id);
            set({ pendingApplications: updatedApplications, isLoading: false });
          } else {
            set({ error: response.error || 'Failed to process application', isLoading: false });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to process application', 
            isLoading: false 
          });
        }
      },
    }),
    { name: 'admin-store' }
  )
);

// Export all stores
export {
  useAuthStore,
  useMentorsStore,
  useSessionsStore,
  useBookingsStore,
  useAdminStore,
};

import { apiService } from '../services/api';
import { 
  User, 
  Session, 
  Mentor, 
  BookingRequest, 
  AvailabilitySlot,
  SessionFeedback,
  DashboardStats 
} from '../types';

// Data transformation utilities
 class DataManager {
  // Transform API data to frontend format
  static transformUser(apiUser: any): User {
    return {
      id: apiUser.id || apiUser._id,
      name: apiUser.name || apiUser.fullName,
      email: apiUser.email,
      role: apiUser.role,
      avatar: apiUser.avatar || apiUser.profilePicture,
      timezone: apiUser.timezone || 'UTC',
      createdAt: apiUser.createdAt || apiUser.created_at,
      updatedAt: apiUser.updatedAt || apiUser.updated_at,
    };
  }

  static transformMentor(apiMentor: any): Mentor {
    return {
      ...this.transformUser(apiMentor),
      role: 'mentor',
      bio: apiMentor.bio || apiMentor.description,
      skills: apiMentor.skills || [],
      rating: apiMentor.rating || apiMentor.averageRating || 0,
      totalSessions: apiMentor.totalSessions || apiMentor.sessionCount || 0,
      isApproved: apiMentor.isApproved || apiMentor.approved || false,
      hourlyRate: apiMentor.hourlyRate || apiMentor.rate || 0,
    };
  }

  static transformSession(apiSession: any): Session {
    return {
      id: apiSession.id || apiSession._id,
      learnerId: apiSession.learnerId || apiSession.learner_id,
      mentorId: apiSession.mentorId || apiSession.mentor_id,
      learnerName: apiSession.learnerName || apiSession.learner?.name,
      mentorName: apiSession.mentorName || apiSession.mentor?.name,
      date: apiSession.date || apiSession.scheduledDate,
      startTime: apiSession.startTime || apiSession.start_time,
      endTime: apiSession.endTime || apiSession.end_time,
      status: apiSession.status,
      topic: apiSession.topic || apiSession.subject,
      notes: apiSession.notes,
      aiSummary: apiSession.aiSummary || apiSession.ai_summary,
      feedback: apiSession.feedback ? this.transformFeedback(apiSession.feedback) : undefined,
      createdAt: apiSession.createdAt || apiSession.created_at,
    };
  }

  static transformBookingRequest(apiBooking: any): BookingRequest {
    return {
      id: apiBooking.id || apiBooking._id,
      learnerId: apiBooking.learnerId || apiBooking.learner_id,
      mentorId: apiBooking.mentorId || apiBooking.mentor_id,
      learnerName: apiBooking.learnerName || apiBooking.learner?.name,
      slotId: apiBooking.slotId || apiBooking.slot_id,
      date: apiBooking.date || apiBooking.requestedDate,
      startTime: apiBooking.startTime || apiBooking.start_time,
      endTime: apiBooking.endTime || apiBooking.end_time,
      status: apiBooking.status,
      message: apiBooking.message,
      createdAt: apiBooking.createdAt || apiBooking.created_at,
    };
  }

  static transformAvailabilitySlot(apiSlot: any): AvailabilitySlot {
    return {
      id: apiSlot.id || apiSlot._id,
      mentorId: apiSlot.mentorId || apiSlot.mentor_id,
      date: apiSlot.date,
      startTime: apiSlot.startTime || apiSlot.start_time,
      endTime: apiSlot.endTime || apiSlot.end_time,
      isBooked: apiSlot.isBooked || apiSlot.is_booked || false,
    };
  }

  static transformFeedback(apiFeedback: any): SessionFeedback {
    return {
      rating: apiFeedback.rating,
      comment: apiFeedback.comment || apiFeedback.review,
      createdAt: apiFeedback.createdAt || apiFeedback.created_at,
    };
  }

  static transformDashboardStats(apiStats: any): DashboardStats {
    return {
      totalLearners: apiStats.totalLearners || apiStats.learnerCount || 0,
      totalMentors: apiStats.totalMentors || apiStats.mentorCount || 0,
      totalSessions: apiStats.totalSessions || apiStats.sessionCount || 0,
      pendingApprovals: apiStats.pendingApprovals || apiStats.pendingMentors || 0,
    };
  }

  // Transform frontend data to API format
  static toApiUser(user: Partial<User>): any {
    return {
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      timezone: user.timezone,
    };
  }

  static toApiSession(session: Partial<Session>): any {
    return {
      learner_id: session.learnerId,
      mentor_id: session.mentorId,
      date: session.date,
      start_time: session.startTime,
      end_time: session.endTime,
      topic: session.topic,
      notes: session.notes,
    };
  }

  static toApiBookingRequest(booking: any): any {
    return {
      mentor_id: booking.mentorId,
      slot_id: booking.slotId,
      message: booking.message,
    };
  }

  static toApiFeedback(feedback: any): any {
    return {
      rating: feedback.rating,
      comment: feedback.comment,
    };
  }
}

// Cache management for offline support
export class CacheManager {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  static set(key: string, data: any, ttlMinutes: number = 5): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000,
    });
  }

  static get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  static clear(): void {
    this.cache.clear();
  }

  static remove(key: string): void {
    this.cache.delete(key);
  }

  // Generate cache keys
  static keys = {
    mentors: (filters?: any) => `mentors_${JSON.stringify(filters || {})}`,
    mentor: (id: string) => `mentor_${id}`,
    sessions: (filters?: any) => `sessions_${JSON.stringify(filters || {})}`,
    session: (id: string) => `session_${id}`,
    availability: (mentorId: string, date?: string) => `availability_${mentorId}_${date || 'all'}`,
    bookings: (filters?: any) => `bookings_${JSON.stringify(filters || {})}`,
    dashboardStats: () => 'dashboard_stats',
    userProfile: (userId: string) => `user_profile_${userId}`,
  };
}

// Error handling utilities
export class ErrorHandler {
  static handle(error: any): string {
    if (error.response) {
      // API error response
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return data.message || 'Invalid request. Please check your input.';
        case 401:
          return 'You are not authorized. Please log in again.';
        case 403:
          return 'You do not have permission to perform this action.';
        case 404:
          return 'The requested resource was not found.';
        case 409:
          return data.message || 'A conflict occurred. Please try again.';
        case 422:
          return data.message || 'Validation failed. Please check your input.';
        case 429:
          return 'Too many requests. Please wait a moment and try again.';
        case 500:
          return 'Server error. Please try again later.';
        default:
          return data.message || 'An unexpected error occurred.';
      }
    } else if (error.request) {
      // Network error
      return 'Network error. Please check your connection and try again.';
    } else {
      // Other error
      return error.message || 'An unexpected error occurred.';
    }
  }

  static isNetworkError(error: any): boolean {
    return error.request && !error.response;
  }

  static isAuthError(error: any): boolean {
    return error.response && [401, 403].includes(error.response.status);
  }

  static isValidationError(error: any): boolean {
    return error.response && [400, 422].includes(error.response.status);
  }
}

// Data validation utilities
export class Validator {
  static email(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static password(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static phone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }

  static url(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static required(value: any): boolean {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    return value !== null && value !== undefined;
  }

  static minLength(value: string, min: number): boolean {
    return value.length >= min;
  }

  static maxLength(value: string, max: number): boolean {
    return value.length <= max;
  }

  static range(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }
}

// Local storage utilities
export class StorageManager {
  static set(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  static get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return null;
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  }

  static clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }

  // Predefined keys
  static keys = {
    authToken: 'auth_token',
    userProfile: 'user_profile',
    preferences: 'user_preferences',
    recentSearches: 'recent_searches',
    draftMessages: 'draft_messages',
  };
}

// Date and time utilities
export class DateTimeUtils {
  static formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString();
  }

  static formatTime(time: string): string {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  static formatDateTime(dateTime: string | Date): string {
    return new Date(dateTime).toLocaleString();
  }

  static isToday(date: string | Date): boolean {
    const today = new Date();
    const checkDate = new Date(date);
    return today.toDateString() === checkDate.toDateString();
  }

  static isFuture(date: string | Date): boolean {
    return new Date(date) > new Date();
  }

  static isPast(date: string | Date): boolean {
    return new Date(date) < new Date();
  }

  static addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60000);
  }

  static getTimezoneOffset(): number {
    return new Date().getTimezoneOffset();
  }

  static convertToTimezone(date: string | Date, timezone: string): Date {
    // This would use a proper timezone library in production
    return new Date(date);
  }
}

// Export all utilities
export {
  DataManager,
  CacheManager,
  ErrorHandler,
  Validator,
  StorageManager,
  DateTimeUtils,
};

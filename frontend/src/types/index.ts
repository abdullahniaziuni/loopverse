// User roles
export type UserRole = 'learner' | 'mentor' | 'admin';

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface Learner extends User {
  role: 'learner';
  interests?: string[];
}

export interface Mentor extends User {
  role: 'mentor';
  bio?: string;
  skills: string[];
  rating: number;
  totalSessions: number;
  isApproved: boolean;
  hourlyRate?: number;
}

export interface Admin extends User {
  role: 'admin';
}

// Session types
export type SessionStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Session {
  id: string;
  learnerId: string;
  mentorId: string;
  learnerName: string;
  mentorName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: SessionStatus;
  topic?: string;
  notes?: string;
  aiSummary?: string;
  feedback?: SessionFeedback;
  createdAt: string;
}

export interface SessionFeedback {
  rating: number;
  comment?: string;
  createdAt: string;
}

// Availability types
export interface AvailabilitySlot {
  id: string;
  mentorId: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

// Booking types
export interface BookingRequest {
  id: string;
  learnerId: string;
  mentorId: string;
  learnerName: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  createdAt: string;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface SignupForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

export interface ForgotPasswordForm {
  email: string;
}

export interface AvailabilityForm {
  date: string;
  startTime: string;
  endTime: string;
}

export interface FeedbackForm {
  rating: number;
  comment: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Auth context types
export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupForm) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// Dashboard stats
export interface DashboardStats {
  totalLearners: number;
  totalMentors: number;
  totalSessions: number;
  pendingApprovals: number;
}

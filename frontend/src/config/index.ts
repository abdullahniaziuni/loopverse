// Environment configuration
const env = import.meta.env;

// API Configuration
export const API_CONFIG = {
  BASE_URL: env.VITE_API_URL || 'http://localhost:3000/api',
  TIMEOUT: parseInt(env.VITE_API_TIMEOUT || '10000'),
  RETRY_ATTEMPTS: parseInt(env.VITE_API_RETRY_ATTEMPTS || '3'),
  RETRY_DELAY: parseInt(env.VITE_API_RETRY_DELAY || '1000'),
};

// Authentication Configuration
export const AUTH_CONFIG = {
  TOKEN_KEY: 'auth_token',
  REFRESH_TOKEN_KEY: 'refresh_token',
  USER_KEY: 'user_profile',
  SESSION_TIMEOUT: parseInt(env.VITE_SESSION_TIMEOUT || '3600000'), // 1 hour
  REMEMBER_ME_DURATION: parseInt(env.VITE_REMEMBER_ME_DURATION || '2592000000'), // 30 days
};

// AI Configuration
export const AI_CONFIG = {
  GEMINI_API_KEY: env.VITE_GEMINI_API_KEY,
  ENABLE_AI_FEATURES: env.VITE_ENABLE_AI_FEATURES !== 'false',
  AI_RESPONSE_TIMEOUT: parseInt(env.VITE_AI_RESPONSE_TIMEOUT || '30000'),
  MAX_AI_RETRIES: parseInt(env.VITE_MAX_AI_RETRIES || '2'),
};

// WebSocket Configuration
export const WEBSOCKET_CONFIG = {
  URL: env.VITE_WEBSOCKET_URL || 'ws://localhost:3000',
  RECONNECT_ATTEMPTS: parseInt(env.VITE_WS_RECONNECT_ATTEMPTS || '5'),
  RECONNECT_DELAY: parseInt(env.VITE_WS_RECONNECT_DELAY || '3000'),
  HEARTBEAT_INTERVAL: parseInt(env.VITE_WS_HEARTBEAT_INTERVAL || '30000'),
};

// File Upload Configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: parseInt(env.VITE_MAX_FILE_SIZE || '10485760'), // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  UPLOAD_ENDPOINT: '/upload',
};

// Video Call Configuration
export const VIDEO_CONFIG = {
  ENABLE_VIDEO_CALLS: env.VITE_ENABLE_VIDEO_CALLS !== 'false',
  WEBRTC_CONFIG: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  },
  MAX_CALL_DURATION: parseInt(env.VITE_MAX_CALL_DURATION || '7200000'), // 2 hours
  CALL_QUALITY_SETTINGS: {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  },
};

// Notification Configuration
export const NOTIFICATION_CONFIG = {
  ENABLE_PUSH_NOTIFICATIONS: env.VITE_ENABLE_PUSH_NOTIFICATIONS !== 'false',
  VAPID_PUBLIC_KEY: env.VITE_VAPID_PUBLIC_KEY,
  NOTIFICATION_TIMEOUT: parseInt(env.VITE_NOTIFICATION_TIMEOUT || '5000'),
  MAX_NOTIFICATIONS: parseInt(env.VITE_MAX_NOTIFICATIONS || '5'),
};

// Cache Configuration
export const CACHE_CONFIG = {
  ENABLE_CACHING: env.VITE_ENABLE_CACHING !== 'false',
  DEFAULT_TTL: parseInt(env.VITE_CACHE_DEFAULT_TTL || '300000'), // 5 minutes
  MAX_CACHE_SIZE: parseInt(env.VITE_MAX_CACHE_SIZE || '100'),
  CACHE_KEYS: {
    MENTORS: 'mentors',
    SESSIONS: 'sessions',
    USER_PROFILE: 'user_profile',
    DASHBOARD_STATS: 'dashboard_stats',
  },
};

// Pagination Configuration
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: parseInt(env.VITE_DEFAULT_PAGE_SIZE || '10'),
  MAX_PAGE_SIZE: parseInt(env.VITE_MAX_PAGE_SIZE || '100'),
  INFINITE_SCROLL_THRESHOLD: parseInt(env.VITE_INFINITE_SCROLL_THRESHOLD || '200'),
};

// Search Configuration
export const SEARCH_CONFIG = {
  DEBOUNCE_DELAY: parseInt(env.VITE_SEARCH_DEBOUNCE_DELAY || '300'),
  MIN_SEARCH_LENGTH: parseInt(env.VITE_MIN_SEARCH_LENGTH || '2'),
  MAX_SEARCH_RESULTS: parseInt(env.VITE_MAX_SEARCH_RESULTS || '50'),
  SEARCH_HISTORY_LIMIT: parseInt(env.VITE_SEARCH_HISTORY_LIMIT || '10'),
};

// UI Configuration
export const UI_CONFIG = {
  THEME: env.VITE_THEME || 'light',
  ENABLE_DARK_MODE: env.VITE_ENABLE_DARK_MODE !== 'false',
  ANIMATION_DURATION: parseInt(env.VITE_ANIMATION_DURATION || '200'),
  TOAST_DURATION: parseInt(env.VITE_TOAST_DURATION || '5000'),
  MODAL_ANIMATION_DURATION: parseInt(env.VITE_MODAL_ANIMATION_DURATION || '150'),
};

// Analytics Configuration
export const ANALYTICS_CONFIG = {
  ENABLE_ANALYTICS: env.VITE_ENABLE_ANALYTICS !== 'false',
  GOOGLE_ANALYTICS_ID: env.VITE_GOOGLE_ANALYTICS_ID,
  MIXPANEL_TOKEN: env.VITE_MIXPANEL_TOKEN,
  TRACK_USER_INTERACTIONS: env.VITE_TRACK_USER_INTERACTIONS !== 'false',
};

// Security Configuration
export const SECURITY_CONFIG = {
  ENABLE_CSP: env.VITE_ENABLE_CSP !== 'false',
  ENABLE_HTTPS_ONLY: env.VITE_ENABLE_HTTPS_ONLY === 'true',
  SESSION_STORAGE_ENCRYPTION: env.VITE_SESSION_STORAGE_ENCRYPTION !== 'false',
  API_KEY_ROTATION_INTERVAL: parseInt(env.VITE_API_KEY_ROTATION_INTERVAL || '86400000'), // 24 hours
};

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_AI_RECOMMENDATIONS: env.VITE_ENABLE_AI_RECOMMENDATIONS !== 'false',
  ENABLE_REAL_TIME_CHAT: env.VITE_ENABLE_REAL_TIME_CHAT !== 'false',
  ENABLE_VIDEO_RECORDING: env.VITE_ENABLE_VIDEO_RECORDING === 'true',
  ENABLE_SCREEN_SHARING: env.VITE_ENABLE_SCREEN_SHARING !== 'false',
  ENABLE_FILE_SHARING: env.VITE_ENABLE_FILE_SHARING !== 'false',
  ENABLE_MENTOR_VERIFICATION: env.VITE_ENABLE_MENTOR_VERIFICATION !== 'false',
  ENABLE_PAYMENT_INTEGRATION: env.VITE_ENABLE_PAYMENT_INTEGRATION === 'true',
  ENABLE_CALENDAR_INTEGRATION: env.VITE_ENABLE_CALENDAR_INTEGRATION === 'true',
  ENABLE_EMAIL_NOTIFICATIONS: env.VITE_ENABLE_EMAIL_NOTIFICATIONS !== 'false',
  ENABLE_SMS_NOTIFICATIONS: env.VITE_ENABLE_SMS_NOTIFICATIONS === 'true',
};

// Development Configuration
export const DEV_CONFIG = {
  ENABLE_REDUX_DEVTOOLS: env.VITE_ENABLE_REDUX_DEVTOOLS !== 'false' && env.DEV,
  ENABLE_MOCK_DATA: env.VITE_ENABLE_MOCK_DATA === 'true',
  LOG_LEVEL: env.VITE_LOG_LEVEL || 'info',
  ENABLE_API_MOCKING: env.VITE_ENABLE_API_MOCKING === 'true',
  MOCK_DELAY: parseInt(env.VITE_MOCK_DELAY || '500'),
};

// Application Metadata
export const APP_CONFIG = {
  NAME: 'SkillSphere',
  VERSION: env.VITE_APP_VERSION || '1.0.0',
  DESCRIPTION: 'Professional Mentorship Platform',
  AUTHOR: 'SkillSphere Team',
  HOMEPAGE: env.VITE_APP_HOMEPAGE || 'https://skillsphere.com',
  SUPPORT_EMAIL: env.VITE_SUPPORT_EMAIL || 'support@skillsphere.com',
  PRIVACY_POLICY_URL: env.VITE_PRIVACY_POLICY_URL || '/privacy',
  TERMS_OF_SERVICE_URL: env.VITE_TERMS_OF_SERVICE_URL || '/terms',
};

// Route Configuration
export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  // Learner routes
  LEARNER_DASHBOARD: '/dashboard',
  MENTORS: '/mentors',
  MENTOR_PROFILE: '/mentors/:mentorId',
  BOOK_SESSION: '/mentors/:mentorId/book',
  MY_BOOKINGS: '/bookings',
  SESSION_HISTORY: '/history',
  
  // Mentor routes
  MENTOR_DASHBOARD: '/mentor/dashboard',
  MENTOR_AVAILABILITY: '/mentor/availability',
  MENTOR_REQUESTS: '/mentor/requests',
  MENTOR_SESSIONS: '/mentor/sessions',
  MENTOR_PROFILE_EDIT: '/mentor/profile',
  
  // Admin routes
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_MENTORS: '/admin/mentors',
  ADMIN_USERS: '/admin/users',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_FEEDBACK: '/admin/feedback',
  
  // Shared routes
  VIDEO_CALL: '/video-call/:sessionId',
  SETTINGS: '/settings',
  AI_RECOMMENDATIONS: '/ai-recommendations',
  FEEDBACK: '/feedback/:sessionId',
  
  // Error routes
  NOT_FOUND: '/404',
  SERVER_ERROR: '/500',
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
  
  // Users
  USER_PROFILE: '/users/profile',
  UPDATE_PROFILE: '/users/profile',
  UPLOAD_AVATAR: '/users/avatar',
  DELETE_ACCOUNT: '/users/account',
  
  // Mentors
  MENTORS: '/mentors',
  MENTOR_DETAILS: '/mentors/:id',
  MENTOR_AVAILABILITY: '/mentors/:id/availability',
  MENTOR_REVIEWS: '/mentors/:id/reviews',
  APPLY_AS_MENTOR: '/mentors/apply',
  
  // Sessions
  SESSIONS: '/sessions',
  SESSION_DETAILS: '/sessions/:id',
  CREATE_SESSION: '/sessions',
  UPDATE_SESSION: '/sessions/:id',
  CANCEL_SESSION: '/sessions/:id/cancel',
  SESSION_FEEDBACK: '/sessions/:id/feedback',
  
  // Bookings
  BOOKINGS: '/bookings',
  CREATE_BOOKING: '/bookings',
  RESPOND_TO_BOOKING: '/bookings/:id/respond',
  
  // AI
  AI_RECOMMENDATIONS: '/ai/recommendations',
  AI_SESSION_SUMMARY: '/ai/sessions/:id/summary',
  AI_LEARNING_PATH: '/ai/learning-path',
  
  // Admin
  ADMIN_STATS: '/admin/stats',
  ADMIN_USERS: '/admin/users',
  ADMIN_MENTOR_APPLICATIONS: '/admin/mentor-applications',
  
  // Notifications
  NOTIFICATIONS: '/notifications',
  MARK_NOTIFICATION_READ: '/notifications/:id/read',
  
  // File Upload
  UPLOAD: '/upload',
  
  // Search
  SEARCH_MENTORS: '/search/mentors',
  SEARCH_SESSIONS: '/search/sessions',
};

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
  },
  PASSWORD: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    message: 'Password must be at least 8 characters with uppercase, lowercase, and number',
  },
  NAME: {
    required: true,
    minLength: 2,
    maxLength: 50,
    message: 'Name must be between 2 and 50 characters',
  },
  PHONE: {
    pattern: /^\+?[\d\s\-\(\)]+$/,
    message: 'Please enter a valid phone number',
  },
  HOURLY_RATE: {
    required: true,
    min: 0,
    max: 1000,
    message: 'Hourly rate must be between $0 and $1000',
  },
  RATING: {
    required: true,
    min: 1,
    max: 5,
    message: 'Rating must be between 1 and 5 stars',
  },
};

// Export environment check utilities
export const isProduction = env.PROD;
export const isDevelopment = env.DEV;
export const isTest = env.MODE === 'test';

// Export configuration validator
export const validateConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!API_CONFIG.BASE_URL) {
    errors.push('API_CONFIG.BASE_URL is required');
  }
  
  if (FEATURE_FLAGS.ENABLE_AI_RECOMMENDATIONS && !AI_CONFIG.GEMINI_API_KEY) {
    errors.push('AI_CONFIG.GEMINI_API_KEY is required when AI features are enabled');
  }
  
  if (ANALYTICS_CONFIG.ENABLE_ANALYTICS && !ANALYTICS_CONFIG.GOOGLE_ANALYTICS_ID) {
    errors.push('ANALYTICS_CONFIG.GOOGLE_ANALYTICS_ID is required when analytics are enabled');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Export all configurations
export default {
  API_CONFIG,
  AUTH_CONFIG,
  AI_CONFIG,
  WEBSOCKET_CONFIG,
  UPLOAD_CONFIG,
  VIDEO_CONFIG,
  NOTIFICATION_CONFIG,
  CACHE_CONFIG,
  PAGINATION_CONFIG,
  SEARCH_CONFIG,
  UI_CONFIG,
  ANALYTICS_CONFIG,
  SECURITY_CONFIG,
  FEATURE_FLAGS,
  DEV_CONFIG,
  APP_CONFIG,
  ROUTES,
  API_ENDPOINTS,
  VALIDATION_RULES,
};

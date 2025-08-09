// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:4001/api',
  TIMEOUT: 30000,
};

// WebSocket Configuration
export const WEBSOCKET_CONFIG = {
  URL: import.meta.env.VITE_WS_URL || 'http://localhost:4001',
  RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 3000,
  HEARTBEAT_INTERVAL: 30000,
};

// WebRTC Configuration
export const WEBRTC_CONFIG = {
  ICE_SERVERS: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
  VIDEO_CONSTRAINTS: {
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 60 },
  },
  AUDIO_CONSTRAINTS: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};

// AI Configuration
export const AI_CONFIG = {
  GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY || '',
  MAX_TOKENS: 1000,
  TEMPERATURE: 0.7,
};

// App Configuration
export const APP_CONFIG = {
  NAME: 'SkillSphere',
  VERSION: '1.0.0',
  DESCRIPTION: 'A Real-Time Microlearning & Mentorship Platform',
  SUPPORT_EMAIL: 'support@skillsphere.com',
};

// Feature Flags
export const FEATURES = {
  AI_RECOMMENDATIONS: true,
  VIDEO_CALLS: true,
  SCREEN_SHARING: true,
  FILE_SHARING: true,
  REAL_TIME_MESSAGING: true,
  NOTIFICATIONS: true,
  DARK_MODE: false,
};

// Validation Rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  SESSION_DURATION_MIN: 15, // minutes
  SESSION_DURATION_MAX: 180, // minutes
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};

// UI Configuration
export const UI_CONFIG = {
  THEME: {
    PRIMARY_COLOR: '#3B82F6',
    SECONDARY_COLOR: '#6B7280',
    SUCCESS_COLOR: '#10B981',
    WARNING_COLOR: '#F59E0B',
    ERROR_COLOR: '#EF4444',
  },
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
    '2XL': '1536px',
  },
  ANIMATION_DURATION: 200,
};

// Environment
export const ENV = {
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  IS_DEVELOPMENT: import.meta.env.NODE_ENV === 'development',
  IS_PRODUCTION: import.meta.env.NODE_ENV === 'production',
  IS_TEST: import.meta.env.NODE_ENV === 'test',
};

// Export all configs
export default {
  API_CONFIG,
  WEBSOCKET_CONFIG,
  WEBRTC_CONFIG,
  AI_CONFIG,
  APP_CONFIG,
  FEATURES,
  VALIDATION,
  UI_CONFIG,
  ENV,
};

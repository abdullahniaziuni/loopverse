// Date and time utilities
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatDateTime = (dateString: string, timeString: string): string => {
  return `${formatDate(dateString)} at ${formatTime(timeString)}`;
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

// String utilities
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Array utilities
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Rating utilities
export const renderStars = (rating: number): string => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - Math.ceil(rating);
  
  return '★'.repeat(fullStars) + 
         (hasHalfStar ? '☆' : '') + 
         '☆'.repeat(emptyStars);
};

// Local storage utilities
export const getFromStorage = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error getting ${key} from localStorage:`, error);
    return null;
  }
};

export const setToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting ${key} to localStorage:`, error);
  }
};

export const removeFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
  }
};

// Mock data generators for MVP
export const generateMockMentors = () => [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    role: 'mentor' as const,
    bio: 'Full-stack developer with 8+ years experience in React, Node.js, and cloud technologies.',
    skills: ['React', 'Node.js', 'TypeScript', 'AWS'],
    rating: 4.8,
    totalSessions: 156,
    isApproved: true,
    hourlyRate: 75,
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael@example.com',
    role: 'mentor' as const,
    bio: 'Data scientist and ML engineer specializing in Python, TensorFlow, and data visualization.',
    skills: ['Python', 'Machine Learning', 'TensorFlow', 'Data Analysis'],
    rating: 4.9,
    totalSessions: 203,
    isApproved: true,
    hourlyRate: 85,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    createdAt: '2024-01-10T10:00:00Z',
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily@example.com',
    role: 'mentor' as const,
    bio: 'UX/UI designer with expertise in Figma, user research, and design systems.',
    skills: ['UI/UX Design', 'Figma', 'User Research', 'Design Systems'],
    rating: 4.7,
    totalSessions: 89,
    isApproved: true,
    hourlyRate: 65,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    createdAt: '2024-02-01T10:00:00Z',
  },
];

export const generateMockSessions = () => [
  {
    id: '1',
    learnerId: '3',
    mentorId: '1',
    learnerName: 'Jane Learner',
    mentorName: 'Sarah Johnson',
    date: '2024-08-15',
    startTime: '14:00',
    endTime: '15:00',
    status: 'confirmed' as const,
    topic: 'React Hooks Deep Dive',
    createdAt: '2024-08-10T10:00:00Z',
  },
  {
    id: '2',
    learnerId: '3',
    mentorId: '2',
    learnerName: 'Jane Learner',
    mentorName: 'Michael Chen',
    date: '2024-08-12',
    startTime: '10:00',
    endTime: '11:00',
    status: 'completed' as const,
    topic: 'Python Data Analysis',
    aiSummary: 'Covered pandas basics, data cleaning techniques, and visualization with matplotlib.',
    feedback: {
      rating: 5,
      comment: 'Excellent session! Michael explained complex concepts very clearly.',
      createdAt: '2024-08-12T11:30:00Z',
    },
    createdAt: '2024-08-08T10:00:00Z',
  },
];

import { apiClient } from './apiClient.ts';

/**
 * Get mentor availability
 * @param mentorId - The ID of the mentor
 */
export const getMentorAvailability = async (mentorId) => {
  try {
    const response = await apiClient.get(`/api/availability/mentor/${mentorId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching mentor availability:', error);
    throw error;
  }
};

/**
 * Update mentor availability
 * @param mentorId - The ID of the mentor
 * @param availabilityDates - Array of availability dates
 */
export const updateMentorAvailability = async (mentorId, availabilityDates) => {
  try {
    // Verify authentication before making request
    checkAuth();
    
    const response = await apiClient.post(
      `/api/availability/mentor/${mentorId}`, 
      {
        availabilityDates
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating mentor availability:', error);
    
    // Provide more specific error handling
    if (error.response?.status === 401) {
      console.error('Authentication error: Your session may have expired');
      // Optionally trigger a logout or redirect
    }
    
    throw error;
  }
};

/**
 * Add a single availability date with time slots
 * @param mentorId - The ID of the mentor
 * @param date - The date string
 * @param timeSlots - Array of time slot objects
 */
export const addAvailabilityDate = async (mentorId, date, timeSlots) => {
  try {
    // Add this line to check authentication before making the request
    checkAuth();
    
    const response = await apiClient.post(
      `/api/availability/mentor/${mentorId}/date`,
      {
        date,
        timeSlots
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error adding availability date:', error);
    
    // Add specific error handling for 401 errors
    if (error.response?.status === 401) {
      console.error('Authentication error: Your session may have expired');
    }
    
    throw error;
  }
};

/**
 * Remove an availability date
 * @param mentorId - The ID of the mentor
 * @param dateId - The ID of the date to remove
 */
export const removeAvailabilityDate = async (mentorId, dateId) => {
  try {
    checkAuth();
    
    const response = await apiClient.delete(
      `/api/availability/mentor/${mentorId}/date/${dateId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error removing availability date:', error);
    if (error.response?.status === 401) {
      console.error('Authentication error: Your session may have expired');
    }
    throw error;
  }
};

/**
 * Update time slot booking status
 * @param mentorId - The ID of the mentor
 * @param dateId - The ID of the date
 * @param slotId - The ID of the time slot
 * @param isBooked - Whether the slot is booked
 * @param sessionId - Optional session ID for the booking
 */
export const updateTimeSlotStatus = async (mentorId, dateId, slotId, isBooked, sessionId = null) => {
  try {
    checkAuth();
    
    const response = await apiClient.patch(
      `/api/availability/mentor/${mentorId}/date/${dateId}/slot/${slotId}`,
      {
        isBooked,
        sessionId
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating time slot status:', error);
    if (error.response?.status === 401) {
      console.error('Authentication error: Your session may have expired');
    }
    throw error;
  }
};

/**
 * Find available mentors
 * @param params - Search parameters (date, startTime, endTime, skills)
 */
export const findAvailableMentors = async (params) => {
  try {
    const response = await apiClient.get('/api/availability/available', { params });
    return response.data;
  } catch (error) {
    console.error('Error finding available mentors:', error);
    throw error;
  }
};

// Helper function to check auth status before making requests
const checkAuth = () => {
  // Changed from 'token' to 'auth_token'
  const token = localStorage.getItem('auth_token');
  
  if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
    console.error('Invalid token state:', { token, tokenType: typeof token });
    throw new Error('Authentication required. Please log in.');
  }
  
  return token;
};
// Timezone utilities for handling scheduling across different timezones

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  date: string;
  timezone: string;
  isAvailable: boolean;
}

export interface TimezoneInfo {
  value: string;
  label: string;
  offset: string;
  abbreviation: string;
}

// Common timezones
export const COMMON_TIMEZONES: TimezoneInfo[] = [
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: 'UTC-5/-4', abbreviation: 'ET' },
  { value: 'America/Chicago', label: 'Central Time (CT)', offset: 'UTC-6/-5', abbreviation: 'CT' },
  { value: 'America/Denver', label: 'Mountain Time (MT)', offset: 'UTC-7/-6', abbreviation: 'MT' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: 'UTC-8/-7', abbreviation: 'PT' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)', offset: 'UTC+0/+1', abbreviation: 'GMT' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)', offset: 'UTC+1/+2', abbreviation: 'CET' },
  { value: 'Europe/Berlin', label: 'Central European Time (CET)', offset: 'UTC+1/+2', abbreviation: 'CET' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)', offset: 'UTC+9', abbreviation: 'JST' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)', offset: 'UTC+8', abbreviation: 'CST' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)', offset: 'UTC+5:30', abbreviation: 'IST' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)', offset: 'UTC+10/+11', abbreviation: 'AET' },
  { value: 'Pacific/Auckland', label: 'New Zealand Time (NZST)', offset: 'UTC+12/+13', abbreviation: 'NZST' },
];

// Get user's current timezone
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

// Get timezone info for a given timezone
export const getTimezoneInfo = (timezone: string): TimezoneInfo | null => {
  const found = COMMON_TIMEZONES.find(tz => tz.value === timezone);
  if (found) return found;

  // If not in common list, create basic info
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(now);
    const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value || timezone;
    
    return {
      value: timezone,
      label: timezone.replace('_', ' '),
      offset: 'UTC',
      abbreviation: timeZoneName
    };
  } catch {
    return null;
  }
};

// Convert time from one timezone to another
export const convertTimeToTimezone = (
  dateTime: string | Date,
  fromTimezone: string,
  toTimezone: string
): Date => {
  const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  
  // Create a date in the source timezone
  const sourceDate = new Date(date.toLocaleString('en-US', { timeZone: fromTimezone }));
  const targetDate = new Date(date.toLocaleString('en-US', { timeZone: toTimezone }));
  
  // Calculate the offset difference
  const offset = targetDate.getTime() - sourceDate.getTime();
  
  return new Date(date.getTime() + offset);
};

// Convert time slot to user's timezone
export const convertTimeSlotToUserTimezone = (
  slot: TimeSlot,
  userTimezone: string
): TimeSlot => {
  const startDateTime = new Date(`${slot.date}T${slot.startTime}`);
  const endDateTime = new Date(`${slot.date}T${slot.endTime}`);
  
  const convertedStart = convertTimeToTimezone(startDateTime, slot.timezone, userTimezone);
  const convertedEnd = convertTimeToTimezone(endDateTime, slot.timezone, userTimezone);
  
  return {
    ...slot,
    startTime: convertedStart.toTimeString().slice(0, 5), // HH:MM format
    endTime: convertedEnd.toTimeString().slice(0, 5),
    date: convertedStart.toISOString().split('T')[0], // YYYY-MM-DD format
    timezone: userTimezone
  };
};

// Format time with timezone
export const formatTimeWithTimezone = (
  time: string,
  date: string,
  timezone: string,
  userTimezone?: string
): string => {
  const dateTime = new Date(`${date}T${time}`);
  const targetTimezone = userTimezone || getUserTimezone();
  
  if (timezone === targetTimezone) {
    return dateTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone
    });
  }
  
  const convertedTime = convertTimeToTimezone(dateTime, timezone, targetTimezone);
  const timezoneInfo = getTimezoneInfo(targetTimezone);
  
  return `${convertedTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })} ${timezoneInfo?.abbreviation || targetTimezone}`;
};

// Get time slots for a specific date range in user's timezone
export const getAvailableTimeSlots = (
  mentorAvailability: Array<{
    day: string;
    startTime: string;
    endTime: string;
    timezone: string;
  }>,
  dateRange: { start: Date; end: Date },
  userTimezone: string,
  slotDuration: number = 60 // minutes
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const current = new Date(dateRange.start);
  
  while (current <= dateRange.end) {
    const dayName = current.toLocaleDateString('en-US', { weekday: 'long' });
    const availability = mentorAvailability.find(av => av.day === dayName);
    
    if (availability) {
      const dateStr = current.toISOString().split('T')[0];
      const startTime = new Date(`${dateStr}T${availability.startTime}`);
      const endTime = new Date(`${dateStr}T${availability.endTime}`);
      
      // Generate slots for this day
      let slotStart = new Date(startTime);
      while (slotStart < endTime) {
        const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);
        
        if (slotEnd <= endTime) {
          const slot: TimeSlot = {
            id: `${dateStr}-${slotStart.toTimeString().slice(0, 5)}`,
            startTime: slotStart.toTimeString().slice(0, 5),
            endTime: slotEnd.toTimeString().slice(0, 5),
            date: dateStr,
            timezone: availability.timezone,
            isAvailable: true
          };
          
          // Convert to user's timezone
          const convertedSlot = convertTimeSlotToUserTimezone(slot, userTimezone);
          slots.push(convertedSlot);
        }
        
        slotStart = new Date(slotStart.getTime() + slotDuration * 60000);
      }
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return slots;
};

// Check if a time slot conflicts with existing bookings
export const hasTimeConflict = (
  newSlot: TimeSlot,
  existingBookings: Array<{
    date: string;
    startTime: string;
    endTime: string;
    timezone: string;
  }>,
  timezone: string
): boolean => {
  const newStart = new Date(`${newSlot.date}T${newSlot.startTime}`);
  const newEnd = new Date(`${newSlot.date}T${newSlot.endTime}`);
  
  return existingBookings.some(booking => {
    const bookingStart = convertTimeToTimezone(
      new Date(`${booking.date}T${booking.startTime}`),
      booking.timezone,
      timezone
    );
    const bookingEnd = convertTimeToTimezone(
      new Date(`${booking.date}T${booking.endTime}`),
      booking.timezone,
      timezone
    );
    
    return (
      (newStart >= bookingStart && newStart < bookingEnd) ||
      (newEnd > bookingStart && newEnd <= bookingEnd) ||
      (newStart <= bookingStart && newEnd >= bookingEnd)
    );
  });
};

// Get relative time description
export const getRelativeTimeDescription = (
  date: string,
  time: string,
): string => {
  const dateTime = new Date(`${date}T${time}`);
  const now = new Date();
  const diffMs = dateTime.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
  
  return dateTime.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: diffDays > 365 || diffDays < -365 ? 'numeric' : undefined
  });
};

// Validate timezone
export const isValidTimezone = (timezone: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
};

// Get timezone offset in hours
export const getTimezoneOffset = (timezone: string): number => {
  const now = new Date();
  const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
  const target = new Date(utc.toLocaleString('en-US', { timeZone: timezone }));
  return (target.getTime() - utc.getTime()) / (1000 * 60 * 60);
};

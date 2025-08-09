// Email and notification service

export interface EmailTemplate {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  sessionReminders: boolean;
  bookingUpdates: boolean;
  mentorUpdates: boolean;
  platformUpdates: boolean;
}

class NotificationService {
  private apiUrl = '/api/notifications';

  // Send email notification
  async sendEmail(template: EmailTemplate): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(template),
      });

      const data = await response.json();
      return { success: response.ok, error: data.error };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: 'Failed to send email' };
    }
  }

  // Send booking confirmation email
  async sendBookingConfirmation(
    learnerEmail: string,
    mentorName: string,
    sessionDate: string,
    sessionTime: string,
    sessionTopic: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      to: learnerEmail,
      subject: 'Session Booking Confirmed - SkillSphere',
      template: 'booking_confirmation',
      data: {
        mentorName,
        sessionDate,
        sessionTime,
        sessionTopic,
        joinUrl: `${window.location.origin}/session/join`,
      },
    });
  }

  // Send session reminder
  async sendSessionReminder(
    userEmail: string,
    mentorName: string,
    learnerName: string,
    sessionDate: string,
    sessionTime: string,
    sessionId: string,
    isForMentor: boolean = false
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      to: userEmail,
      subject: 'Session Reminder - Starting Soon!',
      template: 'session_reminder',
      data: {
        mentorName,
        learnerName,
        sessionDate,
        sessionTime,
        sessionId,
        isForMentor,
        joinUrl: `${window.location.origin}/video-call/${sessionId}`,
      },
    });
  }

  // Send mentor application status
  async sendMentorApplicationStatus(
    mentorEmail: string,
    mentorName: string,
    status: 'approved' | 'rejected',
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      to: mentorEmail,
      subject: `Mentor Application ${status === 'approved' ? 'Approved' : 'Update'} - SkillSphere`,
      template: 'mentor_application_status',
      data: {
        mentorName,
        status,
        reason,
        dashboardUrl: `${window.location.origin}/mentor/dashboard`,
      },
    });
  }

  // Send session feedback request
  async sendFeedbackRequest(
    learnerEmail: string,
    learnerName: string,
    mentorName: string,
    sessionId: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      to: learnerEmail,
      subject: 'How was your session? - SkillSphere',
      template: 'feedback_request',
      data: {
        learnerName,
        mentorName,
        sessionId,
        feedbackUrl: `${window.location.origin}/sessions/${sessionId}/feedback`,
      },
    });
  }

  // Send welcome email
  async sendWelcomeEmail(
    userEmail: string,
    userName: string,
    userRole: 'learner' | 'mentor'
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      to: userEmail,
      subject: 'Welcome to SkillSphere!',
      template: 'welcome',
      data: {
        userName,
        userRole,
        dashboardUrl: `${window.location.origin}/${userRole}/dashboard`,
        exploreUrl: `${window.location.origin}/mentors`,
      },
    });
  }

  // Get notification preferences
  async getNotificationPreferences(): Promise<{
    success: boolean;
    data?: NotificationPreferences;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.apiUrl}/preferences`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      return { success: response.ok, data: data.preferences, error: data.error };
    } catch (error) {
      console.error('Get preferences error:', error);
      return { success: false, error: 'Failed to get notification preferences' };
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(preferences),
      });

      const data = await response.json();
      return { success: response.ok, error: data.error };
    } catch (error) {
      console.error('Update preferences error:', error);
      return { success: false, error: 'Failed to update notification preferences' };
    }
  }

  // Schedule session reminder
  async scheduleSessionReminder(
    sessionId: string,
    reminderTime: number // minutes before session
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/schedule-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ sessionId, reminderTime }),
      });

      const data = await response.json();
      return { success: response.ok, error: data.error };
    } catch (error) {
      console.error('Schedule reminder error:', error);
      return { success: false, error: 'Failed to schedule reminder' };
    }
  }

  // Send push notification (if supported)
  async sendPushNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    if (!('Notification' in window)) {
      return { success: false, error: 'Push notifications not supported' };
    }

    if (Notification.permission === 'denied') {
      return { success: false, error: 'Push notifications denied' };
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return { success: false, error: 'Push notification permission not granted' };
      }
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Handle notification click based on data
        if (data?.url) {
          window.location.href = data.url;
        }
      };

      return { success: true };
    } catch (error) {
      console.error('Push notification error:', error);
      return { success: false, error: 'Failed to send push notification' };
    }
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }

    return Notification.permission;
  }

  // Check if notifications are supported and enabled
  isNotificationSupported(): boolean {
    return 'Notification' in window;
  }

  isNotificationEnabled(): boolean {
    return this.isNotificationSupported() && Notification.permission === 'granted';
  }

  // Send session starting notification
  async notifySessionStarting(
    sessionId: string,
    mentorName: string,
    timeUntilStart: number // minutes
  ): Promise<void> {
    const title = 'Session Starting Soon!';
    const body = `Your session with ${mentorName} starts in ${timeUntilStart} minutes`;
    
    await this.sendPushNotification(title, body, {
      type: 'session_reminder',
      sessionId,
      url: `/video-call/${sessionId}`,
    });
  }

  // Send booking update notification
  async notifyBookingUpdate(
    status: 'confirmed' | 'cancelled' | 'rescheduled',
    mentorName: string,
    sessionDate: string
  ): Promise<void> {
    const title = `Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`;
    const body = `Your session with ${mentorName} on ${sessionDate} has been ${status}`;
    
    await this.sendPushNotification(title, body, {
      type: 'booking_update',
      status,
      url: '/learner/bookings',
    });
  }

  // Send new message notification
  async notifyNewMessage(
    senderName: string,
    messagePreview: string,
    sessionId?: string
  ): Promise<void> {
    const title = `New message from ${senderName}`;
    const body = messagePreview.length > 50 
      ? messagePreview.substring(0, 50) + '...' 
      : messagePreview;
    
    await this.sendPushNotification(title, body, {
      type: 'new_message',
      sessionId,
      url: sessionId ? `/video-call/${sessionId}` : '/messages',
    });
  }
}

// Create and export singleton instance
export const notificationService = new NotificationService();
export default notificationService;

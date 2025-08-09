import React, { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, MessageSquare, Calendar, User, Globe } from 'lucide-react';
import { Button } from '../ui';
import { useToast } from '../../hooks/useToast';
import { notificationService, NotificationPreferences } from '../../services/notifications';

export const NotificationSettings: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: false,
    smsNotifications: false,
    sessionReminders: true,
    bookingUpdates: true,
    mentorUpdates: true,
    platformUpdates: false,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

  const { success: showSuccess, error: showError } = useToast();

  useEffect(() => {
    loadPreferences();
    checkPushPermission();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const response = await notificationService.getNotificationPreferences();
      
      if (response.success && response.data) {
        setPreferences(response.data);
      } else {
        showError(response.error || 'Failed to load notification preferences');
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      showError('Failed to load notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const checkPushPermission = () => {
    if (notificationService.isNotificationSupported()) {
      setPushPermission(Notification.permission);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    try {
      setIsSaving(true);
      const response = await notificationService.updateNotificationPreferences({
        [key]: value,
      });

      if (response.success) {
        showSuccess('Notification preferences updated');
      } else {
        // Revert on error
        setPreferences(preferences);
        showError(response.error || 'Failed to update preferences');
      }
    } catch (error) {
      // Revert on error
      setPreferences(preferences);
      console.error('Error updating preferences:', error);
      showError('Failed to update preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const requestPushPermission = async () => {
    try {
      const permission = await notificationService.requestNotificationPermission();
      setPushPermission(permission);
      
      if (permission === 'granted') {
        await updatePreference('pushNotifications', true);
        showSuccess('Push notifications enabled');
      } else {
        showError('Push notification permission denied');
      }
    } catch (error) {
      console.error('Error requesting push permission:', error);
      showError('Failed to enable push notifications');
    }
  };

  const testNotification = async () => {
    try {
      await notificationService.sendPushNotification(
        'Test Notification',
        'This is a test notification from SkillSphere',
        { type: 'test' }
      );
      showSuccess('Test notification sent');
    } catch (error) {
      console.error('Error sending test notification:', error);
      showError('Failed to send test notification');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4 w-1/3"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="h-6 bg-gray-300 rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <Bell className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Notification Preferences
          </h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Choose how you want to be notified about important updates
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Notification Channels */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Notification Channels</h4>
          <div className="space-y-4">
            {/* Email Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={(e) => updatePreference('emailNotifications', e.target.checked)}
                  disabled={isSaving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Push Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Smartphone className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Push Notifications</p>
                  <p className="text-sm text-gray-500">
                    Receive browser notifications
                    {pushPermission === 'denied' && (
                      <span className="text-red-500 ml-1">(Permission denied)</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {pushPermission === 'granted' ? (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.pushNotifications}
                      onChange={(e) => updatePreference('pushNotifications', e.target.checked)}
                      disabled={isSaving}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={requestPushPermission}
                    disabled={pushPermission === 'denied'}
                  >
                    Enable
                  </Button>
                )}
              </div>
            </div>

            {/* Test Notification */}
            {preferences.pushNotifications && pushPermission === 'granted' && (
              <div className="ml-8">
                <Button variant="ghost" size="sm" onClick={testNotification}>
                  Send Test Notification
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Notification Types */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">What to notify me about</h4>
          <div className="space-y-4">
            {/* Session Reminders */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Session Reminders</p>
                  <p className="text-sm text-gray-500">Get reminded before your sessions start</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.sessionReminders}
                  onChange={(e) => updatePreference('sessionReminders', e.target.checked)}
                  disabled={isSaving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Booking Updates */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Booking Updates</p>
                  <p className="text-sm text-gray-500">Session confirmations, cancellations, and changes</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.bookingUpdates}
                  onChange={(e) => updatePreference('bookingUpdates', e.target.checked)}
                  disabled={isSaving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Mentor Updates */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Mentor Updates</p>
                  <p className="text-sm text-gray-500">New messages and updates from your mentors</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.mentorUpdates}
                  onChange={(e) => updatePreference('mentorUpdates', e.target.checked)}
                  disabled={isSaving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Platform Updates */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Globe className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Platform Updates</p>
                  <p className="text-sm text-gray-500">New features, announcements, and platform news</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.platformUpdates}
                  onChange={(e) => updatePreference('platformUpdates', e.target.checked)}
                  disabled={isSaving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> You can change these preferences at any time. 
            Critical notifications (like session cancellations) will always be sent regardless of your preferences.
          </p>
        </div>
      </div>
    </div>
  );
};

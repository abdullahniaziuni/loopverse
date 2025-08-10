import { useState, useEffect } from 'react';
import { notificationService, Notification, BookingRequest } from '../services/notificationService';

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  sendBookingRequest: (bookingData: Omit<BookingRequest, 'id' | 'status' | 'createdAt'>) => Promise<BookingRequest>;
  respondToBooking: (bookingId: string, response: 'accepted' | 'rejected', message?: string) => Promise<void>;
  requestPermission: () => Promise<boolean>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Subscribe to notification updates
    const unsubscribe = notificationService.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications);
      setUnreadCount(updatedNotifications.filter(n => !n.read).length);
    });

    // Initialize with current notifications
    setNotifications(notificationService.getNotifications());
    setUnreadCount(notificationService.getUnreadCount());

    // Request notification permission on first load
    notificationService.requestNotificationPermission();

    return unsubscribe;
  }, []);

  const markAsRead = (id: string) => {
    notificationService.markAsRead(id);
  };

  const markAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const removeNotification = (id: string) => {
    notificationService.removeNotification(id);
  };

  const clearAll = () => {
    notificationService.clearAll();
  };

  const sendBookingRequest = async (bookingData: Omit<BookingRequest, 'id' | 'status' | 'createdAt'>) => {
    return await notificationService.sendBookingRequest(bookingData);
  };

  const respondToBooking = async (bookingId: string, response: 'accepted' | 'rejected', message?: string) => {
    await notificationService.respondToBooking(bookingId, response, message);
  };

  const requestPermission = async () => {
    return await notificationService.requestNotificationPermission();
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    sendBookingRequest,
    respondToBooking,
    requestPermission,
  };
};

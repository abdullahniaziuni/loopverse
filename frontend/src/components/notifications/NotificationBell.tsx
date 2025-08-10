import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, X, Clock, MessageSquare, Calendar, Video } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { Button } from '../ui';
import { formatDistanceToNow } from 'date-fns';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    respondToBooking,
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_request':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'booking_accepted':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'booking_rejected':
        return <X className="w-4 h-4 text-red-500" />;
      case 'session_reminder':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleAcceptBooking = async (bookingId: string, notificationId: string) => {
    try {
      await respondToBooking(bookingId, 'accepted');
      markAsRead(notificationId);
    } catch (error) {
      console.error('Failed to accept booking:', error);
    }
  };

  const handleRejectBooking = async (bookingId: string, notificationId: string) => {
    try {
      await respondToBooking(bookingId, 'rejected');
      markAsRead(notificationId);
    } catch (error) {
      console.error('Failed to reject booking:', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                      </p>

                      {/* Booking Request Actions */}
                      {notification.type === 'booking_request' && notification.data && (
                        <div className="flex space-x-2 mt-2">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptBooking(notification.data.id, notification.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs"
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectBooking(notification.data.id, notification.id)}
                            className="border-red-300 text-red-600 hover:bg-red-50 px-3 py-1 text-xs"
                          >
                            Decline
                          </Button>
                        </div>
                      )}

                      {/* Session Reminder Action */}
                      {notification.type === 'session_reminder' && notification.data && (
                        <div className="mt-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              window.open(`/video-call/${notification.data.sessionId}`, '_blank');
                              markAsRead(notification.id);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs"
                          >
                            <Video className="w-3 h-3 mr-1" />
                            Join Session
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Close button */}
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

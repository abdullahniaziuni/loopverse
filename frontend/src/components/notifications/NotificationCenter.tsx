import React, { useState } from 'react';
import { Bell, X, Check, Calendar, MessageSquare, User, AlertCircle } from 'lucide-react';
import { Button } from '../ui';
import { useNotifications } from '../../hooks/useWebSocket';
import { formatDate } from '../../utils';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_request':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'booking_response':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'session_update':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'general':
        return <MessageSquare className="h-5 w-5 text-gray-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking_request':
        return 'border-l-blue-500 bg-blue-50';
      case 'booking_response':
        return 'border-l-green-500 bg-green-50';
      case 'session_update':
        return 'border-l-orange-500 bg-orange-50';
      case 'general':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-end z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Bell className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-sm"
                >
                  Mark all read
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto max-h-96">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No notifications
              </h4>
              <p className="text-gray-600">
                You're all caught up! New notifications will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-l-4 ${getNotificationColor(notification.type)} ${
                    !(notification as any).read ? 'bg-opacity-100' : 'bg-opacity-50'
                  } hover:bg-opacity-75 transition-colors cursor-pointer`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-medium ${
                          !(notification as any).read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h4>
                        {!(notification as any).read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-2" />
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${
                        !(notification as any).read ? 'text-gray-700' : 'text-gray-500'
                      }`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDate(notification.timestamp.toISOString())}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={clearNotifications}
              className="w-full"
            >
              Clear all notifications
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Notification Badge Component
interface NotificationBadgeProps {
  count: number;
  onClick: () => void;
  className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  onClick,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      className={`relative p-2 text-gray-600 hover:text-gray-900 transition-colors ${className}`}
    >
      <Bell className="h-6 w-6" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
};

// Toast Notification Component
interface ToastNotificationProps {
  notification: {
    id: string;
    title: string;
    message: string;
    type: string;
  };
  onClose: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  notification,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(notification.id), 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  const getToastColor = (type: string) => {
    switch (type) {
      case 'booking_request':
        return 'bg-blue-500';
      case 'booking_response':
        return 'bg-green-500';
      case 'session_update':
        return 'bg-orange-500';
      case 'general':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
        <div className="flex items-start">
          <div className={`w-1 h-full ${getToastColor(notification.type)} rounded-full mr-3`} />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900">
              {notification.title}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {notification.message}
            </p>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onClose(notification.id), 300);
            }}
            className="ml-2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Toast Container Component
export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    title: string;
    message: string;
    type: string;
  }>>([]);

  const { notifications } = useNotifications();

  React.useEffect(() => {
    // Show toast for new notifications
    const latestNotification = notifications[0];
    if (latestNotification && !toasts.find(t => t.id === latestNotification.id)) {
      setToasts(prev => [...prev, {
        id: latestNotification.id,
        title: latestNotification.title,
        message: latestNotification.message,
        type: latestNotification.type,
      }]);
    }
  }, [notifications, toasts]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <>
      {toasts.map((toast) => (
        <ToastNotification
          key={toast.id}
          notification={toast}
          onClose={removeToast}
        />
      ))}
    </>
  );
};

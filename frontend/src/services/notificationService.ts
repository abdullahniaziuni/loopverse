import { webSocketService } from "./websocket";

export interface Notification {
  id: string;
  type:
    | "booking_request"
    | "booking_accepted"
    | "booking_rejected"
    | "session_reminder"
    | "message";
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
  userId: string;
}

export interface BookingRequest {
  id: string;
  learnerId: string;
  learnerName: string;
  mentorId: string;
  mentorName: string;
  sessionType: string;
  preferredDate: string;
  preferredTime: string;
  message: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
}

class NotificationService {
  private notifications: Notification[] = [];
  private listeners: ((notifications: Notification[]) => void)[] = [];

  constructor() {
    this.setupWebSocketListeners();
  }

  private setupWebSocketListeners() {
    const socket = webSocketService.socketInstance;
    if (socket) {
      // Listen for booking requests (for mentors)
      socket.on("booking_request", (data: BookingRequest) => {
        this.addNotification({
          id: `booking_${data.id}`,
          type: "booking_request",
          title: "New Booking Request",
          message: `${data.learnerName} wants to book a ${data.sessionType} session`,
          data: data,
          read: false,
          createdAt: new Date(),
          userId: data.mentorId,
        });
      });

      // Listen for booking responses (for learners)
      socket.on("booking_accepted", (data: any) => {
        this.addNotification({
          id: `accepted_${data.id}`,
          type: "booking_accepted",
          title: "Booking Accepted! 🎉",
          message: `Your session request has been accepted`,
          data: {
            mentorId: data.mentorId,
            mentorName: data.mentorName || "Mentor",
            sessionType: data.sessionType || "session",
            bookingId: data.id,
          },
          read: false,
          createdAt: new Date(),
          userId: data.learnerId || "current-user",
        });
      });

      socket.on("booking_rejected", (data: any) => {
        this.addNotification({
          id: `rejected_${data.id}`,
          type: "booking_rejected",
          title: "Booking Declined",
          message: `Your session request was declined`,
          data: {
            mentorId: data.mentorId,
            mentorName: data.mentorName || "Mentor",
            sessionType: data.sessionType || "session",
            bookingId: data.id,
          },
          read: false,
          createdAt: new Date(),
          userId: data.learnerId || "current-user",
        });
      });

      // Listen for session reminders
      socket.on("session_reminder", (data: any) => {
        this.addNotification({
          id: `reminder_${data.sessionId}`,
          type: "session_reminder",
          title: "Session Starting Soon",
          message: `Your session with ${data.participantName} starts in 15 minutes`,
          data: data,
          read: false,
          createdAt: new Date(),
          userId: data.userId,
        });
      });

      // Listen for new messages
      socket.on("new_message", (data: any) => {
        this.addNotification({
          id: `message_${data.messageId}`,
          type: "message",
          title: "New Message",
          message: `${data.senderName}: ${data.message.substring(0, 50)}...`,
          data: data,
          read: false,
          createdAt: new Date(),
          userId: data.recipientId,
        });
      });
    }
  }

  private addNotification(notification: Notification) {
    this.notifications.unshift(notification);
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }
    this.notifyListeners();

    // Show browser notification if permission granted
    this.showBrowserNotification(notification);
  }

  private showBrowserNotification(notification: Notification) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/favicon.ico",
        tag: notification.id,
      });
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener([...this.notifications]));
  }

  // Public methods
  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  markAsRead(notificationId: string) {
    const notification = this.notifications.find(
      (n) => n.id === notificationId
    );
    if (notification) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  markAllAsRead() {
    this.notifications.forEach((n) => (n.read = true));
    this.notifyListeners();
  }

  removeNotification(notificationId: string) {
    this.notifications = this.notifications.filter(
      (n) => n.id !== notificationId
    );
    this.notifyListeners();
  }

  clearAll() {
    this.notifications = [];
    this.notifyListeners();
  }

  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // Send booking request
  async sendBookingRequest(
    bookingData: Omit<BookingRequest, "id" | "status" | "createdAt">
  ) {
    const socket = webSocketService.socketInstance;
    if (socket) {
      const request: BookingRequest = {
        ...bookingData,
        id: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: "pending",
        createdAt: new Date(),
      };

      socket.emit("send_booking_request", request);
      console.log("📤 Sent booking request:", request);
      return request;
    }
    throw new Error("WebSocket not connected");
  }

  // Respond to booking request (mentor)
  async respondToBooking(
    bookingId: string,
    response: "accepted" | "rejected",
    message?: string
  ) {
    const socket = webSocketService.socketInstance;
    if (socket) {
      socket.emit("respond_to_booking", {
        bookingId,
        response,
        message,
        timestamp: new Date(),
      });
      console.log(`📤 Responded to booking ${bookingId}: ${response}`);
    }
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return false;
  }
}

export const notificationService = new NotificationService();

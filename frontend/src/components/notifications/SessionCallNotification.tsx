import React, { useState, useEffect } from "react";
import { Phone, PhoneOff, Video, User } from "lucide-react";
import { Button } from "../ui";
import { useToast } from "../../hooks/useToast";
import { webSocketService } from "../../services/websocket";

interface SessionCallNotificationProps {
  sessionId: string;
  callerName: string;
  callerRole: string;
  onAccept: () => void;
  onDecline: () => void;
  onClose: () => void;
}

export const SessionCallNotification: React.FC<
  SessionCallNotificationProps
> = ({ sessionId, callerName, callerRole, onAccept, onDecline, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds to respond
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto-decline after timeout
          onDecline();
          showError("Call timeout - automatically declined");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onDecline, showError]);

  const handleAccept = () => {
    showSuccess(`Accepted call from ${callerName}`);
    onAccept();
  };

  const handleDecline = () => {
    showSuccess(`Declined call from ${callerName}`);
    onDecline();
  };

  return (
    <div className="fixed top-4 right-4 bg-white rounded-lg shadow-2xl border border-gray-200 p-6 z-50 w-80 animate-bounce">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-900">
            Incoming Call
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ×
        </button>
      </div>

      {/* Caller Info */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <User className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{callerName}</h3>
        <p className="text-sm text-gray-600 capitalize">{callerRole}</p>
        <p className="text-xs text-gray-500 mt-1">Session: {sessionId}</p>
      </div>

      {/* Timer */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700">
            {timeLeft}s remaining
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <Button
          onClick={handleDecline}
          variant="outline"
          className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
        >
          <PhoneOff className="w-4 h-4 mr-2" />
          Decline
        </Button>
        <Button
          onClick={handleAccept}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          <Video className="w-4 h-4 mr-2" />
          Accept
        </Button>
      </div>

      {/* Call Type */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">Video call for session</p>
      </div>
    </div>
  );
};

interface SessionCallManagerProps {
  userId: string;
  userName: string;
  userRole: string;
}

export const SessionCallManager: React.FC<SessionCallManagerProps> = ({
  userId,
  userName,
  userRole,
}) => {
  const [incomingCall, setIncomingCall] = useState<{
    sessionId: string;
    callerName: string;
    callerRole: string;
    callerId: string;
  } | null>(null);

  useEffect(() => {
    // Listen for incoming session calls
    const handleIncomingSessionCall = (data: {
      sessionId: string;
      callerName: string;
      callerRole: string;
      callerId: string;
    }) => {
      // Don't show notification for own calls
      if (data.callerId === userId) return;

      console.log("📞 Incoming session call:", data);
      setIncomingCall(data);
    };

    // Listen for session call failures
    const handleSessionCallFailed = (data: {
      sessionId: string;
      targetUserId: string;
      reason: string;
    }) => {
      console.log("❌ Session call failed:", data);
      // You could show a toast notification here
    };

    // Set up WebSocket listeners
    const socket = webSocketService.socketInstance;
    if (socket) {
      socket.on("incoming_session_call", handleIncomingSessionCall);
      socket.on("session_call_failed", handleSessionCallFailed);
    }

    return () => {
      if (socket) {
        socket.off("incoming_session_call", handleIncomingSessionCall);
        socket.off("session_call_failed", handleSessionCallFailed);
      }
    };
  }, [userId]);

  const handleAcceptCall = () => {
    if (!incomingCall) return;

    // Navigate to video call
    window.location.href = `/video-call/${incomingCall.sessionId}`;
    setIncomingCall(null);
  };

  const handleDeclineCall = () => {
    if (!incomingCall) return;

    // Send decline notification
    webSocketService.socketInstance?.emit("decline_session_call", {
      sessionId: incomingCall.sessionId,
      callerId: incomingCall.callerId,
      declinedBy: userId,
    });

    setIncomingCall(null);
  };

  const handleCloseNotification = () => {
    setIncomingCall(null);
  };

  if (!incomingCall) return null;

  return (
    <SessionCallNotification
      sessionId={incomingCall.sessionId}
      callerName={incomingCall.callerName}
      callerRole={incomingCall.callerRole}
      onAccept={handleAcceptCall}
      onDecline={handleDeclineCall}
      onClose={handleCloseNotification}
    />
  );
};

// Helper function to initiate a session call
export const initiateSessionCall = (
  sessionId: string,
  targetUserId: string,
  callerName: string,
  callerRole: string
) => {
  const socket = webSocketService.socketInstance;
  if (socket) {
    socket.emit("initiate_session_call", {
      sessionId,
      targetUserId,
      callerName,
      callerRole,
      callerId: webSocketService.userId,
    });
    console.log(
      `📞 Initiating session call to ${targetUserId} for session ${sessionId}`
    );
  } else {
    console.error("❌ Cannot initiate session call - WebSocket not connected");
  }
};

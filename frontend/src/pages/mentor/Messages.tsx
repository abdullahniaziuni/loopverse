import React, { useState, useEffect } from "react";
import { MessageCircle, Users, Clock, Bell } from "lucide-react";
import { Layout } from "../../components/layout";
import { MessageCenter } from "../../components/messaging";
import { ChatWindow } from "../../components/messaging/ChatWindow";
import { useAuth } from "../../contexts/AuthContext";
import { apiService } from "../../services/api";
import { Button } from "../../components/ui/Button";

export const Messages: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeStudents: 0,
    upcomingSessions: 0,
    remindersSent: 0,
  });

  // Chat functionality
  const [showChat, setShowChat] = useState(false);
  const [chatParticipant, setChatParticipant] = useState<{
    id: string;
    name: string;
    role: string;
    avatar: string;
    isOnline: boolean;
  } | null>(null);

  // Recent conversations (learners who have messaged)
  const [recentConversations, setRecentConversations] = useState<any[]>([]);

  // Fetch real stats and conversations
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("📊 Messages - Fetching data");

        // Fetch mentor bookings to get learners with confirmed sessions
        const bookingsResponse = await apiService.getBookingRequests();
        if (bookingsResponse.success && bookingsResponse.data) {
          // Extract unique learners from confirmed bookings only
          const learners = bookingsResponse.data
            .filter((booking: any) => booking.status === "confirmed")
            .reduce((acc: any[], booking: any) => {
              const learner = booking.learner;
              if (learner && !acc.find((l) => l.id === learner.id)) {
                acc.push({
                  id: learner.id,
                  name: learner.name,
                  avatar: learner.profilePicture || "",
                  lastMessage: `Session: ${booking.title}`,
                  lastMessageTime: booking.startTime,
                  isOnline: true,
                  sessionTitle: booking.title,
                  sessionDate: booking.startTime,
                });
              }
              return acc;
            }, []);

          setRecentConversations(learners);

          setStats({
            activeStudents: learners.length,
            upcomingSessions: bookingsResponse.data.filter(
              (b: any) =>
                b.status === "confirmed" && new Date(b.startTime) > new Date()
            ).length,
            remindersSent: 0,
          });
        }

        console.log("✅ Messages - Data loaded");
      } catch (error) {
        console.error("💥 Messages - Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  if (!user) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-500">Please log in to access messages.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <MessageCircle className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          </div>
          <p className="text-gray-600">
            Communicate with your students about upcoming sessions and send
            reminders.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Active Students
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.activeStudents}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Upcoming Sessions
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.upcomingSessions}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Bell className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Reminders Sent
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.remindersSent}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Conversations */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Conversations
          </h3>
          {recentConversations.length > 0 ? (
            <div className="space-y-3">
              {recentConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setChatParticipant({
                      id: conversation.id,
                      name: conversation.name,
                      role: "learner",
                      avatar: conversation.avatar,
                      isOnline: conversation.isOnline,
                    });
                    setShowChat(true);
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {conversation.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {conversation.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {conversation.lastMessage}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(
                          conversation.sessionDate
                        ).toLocaleDateString()}{" "}
                        at{" "}
                        {new Date(conversation.sessionDate).toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setChatParticipant({
                        id: conversation.id,
                        name: conversation.name,
                        role: "learner",
                        avatar: conversation.avatar,
                        isOnline: conversation.isOnline,
                      });
                      setShowChat(true);
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Chat
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No active students yet</p>
              <p className="text-sm text-gray-400">
                Learners with confirmed sessions will appear here for messaging
              </p>
            </div>
          )}
        </div>

        {/* Message Center */}
        <div className="bg-white rounded-lg shadow">
          <MessageCenter
            currentUserId={user.id}
            currentUserRole="mentor"
            currentUserName={user.name}
          />
        </div>

        {/* Tips */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            💡 Messaging Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">Before Sessions:</h4>
              <ul className="space-y-1">
                <li>• Send preparation instructions</li>
                <li>• Share relevant resources</li>
                <li>• Confirm meeting details</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Reminders:</h4>
              <ul className="space-y-1">
                <li>• Send 24-hour advance notice</li>
                <li>• Include session agenda</li>
                <li>• Provide technical requirements</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Window */}
      {showChat && chatParticipant && (
        <ChatWindow
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          participant={chatParticipant}
          onStartVideoCall={() => {
            // Start video call with the learner
            const sessionId = `session_${Date.now()}`;
            window.open(`/video-call/${sessionId}`, "_blank");
          }}
        />
      )}
    </Layout>
  );
};

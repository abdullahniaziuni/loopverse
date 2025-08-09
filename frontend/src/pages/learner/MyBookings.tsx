import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, User, MessageCircle, Video, X } from "lucide-react";
import { Layout } from "../../components/layout";
import { Button, Modal } from "../../components/ui";
import { formatDate, formatTime } from "../../utils";
import { useToast } from "../../hooks/useToast";
import { Session } from "../../types";
import { apiService } from "../../services/api";

export const MyBookings: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<"upcoming" | "pending">(
    "upcoming"
  );
  const [cancellingSession, setCancellingSession] = useState<Session | null>(
    null
  );

  const { success: showSuccess, error: showError } = useToast();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        console.log("📚 MyBookings - Starting to fetch bookings");
        setIsLoading(true);

        const response = await apiService.getUserBookings();
        console.log("📚 MyBookings - API response:", response);

        if (response.success && response.data) {
          console.log(
            "✅ MyBookings - Bookings fetched successfully:",
            response.data
          );
          setSessions(response.data);
        } else {
          console.log("❌ MyBookings - No bookings data or failed response");
          console.log("📄 Response details:", response);
        }
      } catch (error) {
        console.error("💥 MyBookings - Error fetching bookings:", error);
        showError("Failed to fetch bookings");
      } finally {
        setIsLoading(false);
        console.log("⏳ MyBookings - Set loading to false");
      }
    };

    fetchBookings();
  }, [showError]);

  const upcomingSessions = sessions.filter(
    (session) =>
      session.status === "confirmed" &&
      new Date(session.startTime) >= new Date()
  );

  const pendingSessions = sessions.filter(
    (session) => session.status === "pending"
  );

  const handleCancelSession = (session: Session) => {
    setCancellingSession(session);
  };

  const confirmCancellation = () => {
    if (cancellingSession) {
      // Mock cancellation
      showSuccess(
        "Session cancelled successfully. You will receive a confirmation email."
      );
      setCancellingSession(null);
    }
  };

  const handleJoinSession = (session: Session) => {
    console.log("🎯 MyBookings - Joining session:", session.id);
    showSuccess("Joining session...");
    navigate(`/session/${session.id}`);
  };

  const tabs = [
    { id: "upcoming", label: "Upcoming", count: upcomingSessions.length },
    { id: "pending", label: "Pending", count: pendingSessions.length },
  ];

  const currentSessions =
    selectedTab === "upcoming" ? upcomingSessions : pendingSessions;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-2">
            Manage your upcoming and pending mentoring sessions.
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() =>
                    setSelectedTab(tab.id as "upcoming" | "pending")
                  }
                  className={`py-4 px-6 border-b-2 font-medium text-sm ${
                    selectedTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                        selectedTab === tab.id
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {currentSessions.length > 0 ? (
              <div className="space-y-6">
                {currentSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onCancel={handleCancelSession}
                    onJoin={handleJoinSession}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No {selectedTab} sessions
                </h3>
                <p className="text-gray-600 mb-4">
                  {selectedTab === "upcoming"
                    ? "You don't have any upcoming sessions scheduled."
                    : "You don't have any pending booking requests."}
                </p>
                <Button>
                  <a href="/mentors">Find a Mentor</a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      <Modal
        isOpen={!!cancellingSession}
        onClose={() => setCancellingSession(null)}
        title="Cancel Session"
      >
        {cancellingSession && (
          <div>
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to cancel this session?
              </p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Session:</span>
                  <span className="font-medium">{cancellingSession.topic}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mentor:</span>
                  <span className="font-medium">
                    {cancellingSession.mentorName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date & Time:</span>
                  <span className="font-medium">
                    {formatDate(cancellingSession.date)} at{" "}
                    {formatTime(cancellingSession.startTime)}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                <strong>Note:</strong> Cancellations made less than 24 hours
                before the session may be subject to a cancellation fee.
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCancellingSession(null)}
              >
                Keep Session
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={confirmCancellation}
              >
                Cancel Session
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

interface SessionCardProps {
  session: Session;
  onCancel: (session: Session) => void;
  onJoin: (session: Session) => void;
}

const SessionCard: React.FC<SessionCardProps> = ({
  session,
  onCancel,
  onJoin,
}) => {
  const isUpcoming = session.status === "confirmed";
  const sessionDate = new Date(session.date);
  const now = new Date();
  const isToday = sessionDate.toDateString() === now.toDateString();
  const canJoin = isToday && isUpcoming;

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {session.topic || "Mentoring Session"}
            </h3>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                session.status === "confirmed"
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {session.status}
            </span>
          </div>

          <div className="flex items-center text-gray-600 mb-2">
            <User className="h-4 w-4 mr-2" />
            <span>with {session.mentorName}</span>
          </div>

          <div className="flex items-center text-gray-600 mb-2">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{formatDate(session.date)}</span>
          </div>

          <div className="flex items-center text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            <span>
              {formatTime(session.startTime)} - {formatTime(session.endTime)}
            </span>
          </div>

          {session.notes && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Notes:</strong> {session.notes}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-2 ml-6">
          {canJoin && (
            <Button
              size="sm"
              onClick={() => onJoin(session)}
              className="flex items-center"
            >
              <Video className="h-4 w-4 mr-2" />
              Join Session
            </Button>
          )}

          <Button variant="outline" size="sm" className="flex items-center">
            <MessageCircle className="h-4 w-4 mr-2" />
            Message
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onCancel(session)}
            className="flex items-center text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

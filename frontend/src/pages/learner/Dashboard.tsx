import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Users,
  BookOpen,
  Clock,
  Star,
  Video,
  Brain,
  Sparkles,
  TrendingUp,
  Award,
  Target,
  MessageSquare,
  Bell,
  Settings,
  Search,
  Filter,
  Download,
  Share2,
  Check,
  X,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Layout } from "../../components/layout";
import { Button } from "../../components/ui";
import { LearningPathGenerator } from "../../components/ai/LearningPathGenerator";
import { SmartMentorRecommendations } from "../../components/ai/SmartMentorRecommendations";
import { ProgressTracker } from "../../components/analytics";
import { ChatWindow } from "../../components/messaging/ChatWindow";
import { useNotifications } from "../../hooks/useNotifications";
import { formatDate, formatTime } from "../../utils";
import { formatDistanceToNow } from "date-fns";
import { apiService } from "../../services/api";
import { Session } from "../../types";

export const LearnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { notifications } = useNotifications();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLearningPathOpen, setIsLearningPathOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatParticipant, setChatParticipant] = useState<any>(null);

  // Filter booking response notifications
  const bookingResponses = notifications.filter(
    (n) =>
      (n.type === "booking_accepted" || n.type === "booking_rejected") &&
      !n.read
  );
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);
  const [learningGoals, setLearningGoals] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);

  // Fetch user sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.getSessions();
        if (response.success && response.data) {
          setSessions(response.data.sessions || response.data);
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchSessions();
    }
  }, [user]);

  // Filter upcoming sessions
  const upcomingSessions = sessions.filter(
    (session) =>
      session.status === "confirmed" &&
      new Date(session.startTime) >= new Date()
  );

  // Filter recent completed sessions
  const recentSessions = sessions
    .filter((session) => session.status === "completed")
    .sort(
      (a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
    )
    .slice(0, 3);

  // Calculate stats from real data
  const stats = {
    totalSessions: sessions.filter((s) => s.status === "completed").length,
    hoursLearned:
      sessions
        .filter((s) => s.status === "completed")
        .reduce((total, session) => total + (session.duration || 0), 0) / 60,
    averageRating:
      sessions
        .filter((s) => s.learnerFeedback?.rating)
        .reduce((sum, s) => sum + (s.learnerFeedback?.rating || 0), 0) /
      Math.max(1, sessions.filter((s) => s.learnerFeedback?.rating).length),
    activeMentors: new Set(sessions.map((s) => s.mentor?.id)).size,
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 rounded"></div>
              ))}
            </div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-600">
            Continue your learning journey and discover new opportunities.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Sessions
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalSessions}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Hours Learned
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {Math.round(stats.hoursLearned)}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Average Rating
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.averageRating.toFixed(1)}
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Mentors
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.activeMentors}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* AI-Powered Features */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center mb-4">
              <Brain className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">
                AI Learning Path
              </h2>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              Get a personalized learning roadmap tailored to your goals.
            </p>
            <Button
              onClick={() => setIsLearningPathOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full"
              size="sm"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Path
            </Button>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center mb-4">
              <TrendingUp className="h-6 w-6 text-purple-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">
                Smart Recommendations
              </h2>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              Discover mentors that match your learning style.
            </p>
            <Button
              onClick={() => setShowAIRecommendations(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white w-full"
              size="sm"
            >
              <Brain className="h-4 w-4 mr-2" />
              Get Recommendations
            </Button>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center mb-4">
              <Target className="h-6 w-6 text-green-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">
                Learning Goals
              </h2>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              Set and track your learning objectives.
            </p>
            <Button
              variant="outline"
              className="w-full border-green-300 text-green-700 hover:bg-green-50"
              size="sm"
            >
              <Award className="h-4 w-4 mr-2" />
              Manage Goals
            </Button>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8">
          <div className="flex flex-wrap gap-3">
            <Link to="/video-call/demo-session-123">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Video className="h-4 w-4 mr-2" />
                Join Class
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Find a mentor from recent sessions or use available mentor
                const recentMentor =
                  sessions.length > 0 ? sessions[0].mentor : null;
                setChatParticipant({
                  id: recentMentor?.id || "mentor-available",
                  name: recentMentor?.name || "Available Mentor",
                  role: "mentor",
                  avatar: recentMentor?.profilePicture || "",
                  isOnline: true,
                });
                setShowChat(true);
              }}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Message Mentor
            </Button>
            <Link to="/learner/mentors">
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Find Mentors
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLearningPathOpen(true)}
            >
              <Brain className="h-4 w-4 mr-2" />
              AI Learning Path
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAIRecommendations(true)}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Recommendations
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Upcoming Sessions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Upcoming Sessions
              </h2>
              <Link to="/learner/bookings">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>

            {upcomingSessions.length > 0 ? (
              <div className="space-y-4">
                {upcomingSessions.slice(0, 3).map((session) => (
                  <div
                    key={session.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {session.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          with {session.mentor?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(session.startTime)} at{" "}
                          {formatTime(session.startTime)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link to={`/video-call/${session.id}`}>
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <Video className="h-4 w-4 mr-1" />
                            Join Call
                          </Button>
                        </Link>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Chat
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No upcoming sessions</p>
                <Link to="/learner/mentors">
                  <Button>
                    <Users className="h-4 w-4 mr-2" />
                    Find a Mentor
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Booking Responses */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Booking Responses
                {bookingResponses.length > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {bookingResponses.length}
                  </span>
                )}
              </h2>
              <Link to="/learner/bookings">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>

            {bookingResponses.length > 0 ? (
              <div className="space-y-4">
                {bookingResponses.slice(0, 3).map((notification) => {
                  const isAccepted = notification.type === "booking_accepted";
                  return (
                    <div
                      key={notification.id}
                      className={`border rounded-lg p-4 ${
                        isAccepted
                          ? "border-green-200 bg-green-50"
                          : "border-red-200 bg-red-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {isAccepted ? (
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-green-600" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                              <X className="w-4 h-4 text-red-600" />
                            </div>
                          )}
                          <div>
                            <h3
                              className={`font-medium ${
                                isAccepted ? "text-green-900" : "text-red-900"
                              }`}
                            >
                              {notification.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {notification.message}
                            </p>
                          </div>
                        </div>
                        {isAccepted && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => {
                              // Start chat with mentor
                              setChatParticipant({
                                id:
                                  notification.data?.mentorId ||
                                  "mentor-available",
                                name: notification.data?.mentorName || "Mentor",
                                role: "mentor",
                                avatar: "",
                                isOnline: true,
                              });
                              setShowChat(true);
                            }}
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Chat
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(notification.createdAt, {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No booking responses yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Send booking requests to mentors to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Tracking Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProgressTracker />
      </div>

      {/* AI Modals */}
      <LearningPathGenerator
        isOpen={isLearningPathOpen}
        onClose={() => setIsLearningPathOpen(false)}
        onPathGenerated={(path) => {
          // Handle the generated learning path
          setLearningGoals(path.goals || []);
        }}
      />

      <SmartMentorRecommendations
        isOpen={showAIRecommendations}
        onClose={() => setShowAIRecommendations(false)}
        onMentorSelect={(mentorId) => {
          // Handle mentor selection - start chat with selected mentor
          setChatParticipant({
            id: mentorId,
            name: "Selected Mentor",
            role: "mentor",
            avatar: "",
            isOnline: true,
          });
          setShowChat(true);
          setShowAIRecommendations(false);
        }}
      />

      {/* Chat Window */}
      {showChat && chatParticipant && (
        <ChatWindow
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          participant={chatParticipant}
          onStartVideoCall={() => {
            // Start video call with the mentor
            const sessionId = `session_${Date.now()}`;
            window.open(`/video-call/${sessionId}`, "_blank");
          }}
        />
      )}
    </Layout>
  );
};

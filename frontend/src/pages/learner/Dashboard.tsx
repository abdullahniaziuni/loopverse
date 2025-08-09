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
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Layout } from "../../components/layout";
import { Button } from "../../components/ui";
import { LearningPathGenerator } from "../../components/ai/LearningPathGenerator";
import { SmartMentorRecommendations } from "../../components/ai/SmartMentorRecommendations";
import { formatDate, formatTime } from "../../utils";
import { apiService } from "../../services/api";
import { Session } from "../../types";

export const LearnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLearningPathOpen, setIsLearningPathOpen] = useState(false);
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [learningGoals, setLearningGoals] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);

  // Fetch user sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.getUserSessions();
        if (response.success && response.data) {
          setSessions(response.data);
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
            <Link to="/mentors">
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Find Mentors
              </Button>
            </Link>
            <Link to="/video-call/demo-session-123">
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                size="sm"
              >
                <Video className="h-4 w-4 mr-2" />
                Join Video Call
              </Button>
            </Link>
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages
            </Button>
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download Progress
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share Achievement
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
              <Link to="/bookings">
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
                <Link to="/mentors">
                  <Button>
                    <Users className="h-4 w-4 mr-2" />
                    Find a Mentor
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Recent Sessions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Sessions
              </h2>
              <Link to="/history">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>

            {recentSessions.length > 0 ? (
              <div className="space-y-4">
                {recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="border border-gray-200 rounded-lg p-4"
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
                          {formatDate(session.endTime)}
                        </p>
                        {session.aiSummary && (
                          <p className="text-sm text-gray-700 mt-2 italic">
                            "{session.aiSummary}"
                          </p>
                        )}
                      </div>
                      <div className="flex items-center">
                        {session.learnerFeedback && (
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600 ml-1">
                              {session.learnerFeedback.rating}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No completed sessions yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Modals */}
      <LearningPathGenerator
        isOpen={isLearningPathOpen}
        onClose={() => setIsLearningPathOpen(false)}
        onPathGenerated={(path) => {
          console.log("Generated learning path:", path);
          // Handle the generated learning path
        }}
      />

      <SmartMentorRecommendations
        isOpen={showAIRecommendations}
        onClose={() => setShowAIRecommendations(false)}
        onMentorSelect={(mentorId) => {
          console.log("Selected mentor:", mentorId);
          // Handle mentor selection
        }}
      />
    </Layout>
  );
};

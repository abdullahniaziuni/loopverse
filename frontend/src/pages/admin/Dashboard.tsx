import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UserCheck,
  BookOpen,
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Video,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Layout } from "../../components/layout";
import { Button } from "../../components/ui";
import { formatDate } from "../../utils";
import { apiService } from "../../services/api";
import { Mentor, Session } from "../../types";

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [pendingMentors, setPendingMentors] = useState<Mentor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch admin dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // Fetch all mentors
        const mentorsResponse = await apiService.getMentors({
          page: 1,
          limit: 100,
        });
        if (mentorsResponse.success && mentorsResponse.data) {
          const allMentors = mentorsResponse.data.mentors;
          setMentors(allMentors.filter((m) => m.isVerified));
          setPendingMentors(allMentors.filter((m) => !m.isVerified));
        }

        // Fetch all sessions for admin view
        const sessionsResponse = await apiService.getSessions({
          page: 1,
          limit: 100, // Get more sessions for admin overview
        });
        if (sessionsResponse.success && sessionsResponse.data) {
          setSessions(sessionsResponse.data.sessions || sessionsResponse.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Recent feedback calculated from real sessions data
  const recentFeedback = sessions
    .filter((s) => s.learnerFeedback)
    .map((s) => ({
      id: s.id,
      sessionId: s.id,
      learnerName: s.learner?.name || "Unknown",
      mentorName: s.mentor?.name || "Unknown",
      rating: s.learnerFeedback?.rating || 0,
      comment: s.learnerFeedback?.comment || "",
      date: s.endTime,
      flagged: s.learnerFeedback?.rating < 3, // Flag low ratings
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const stats = {
    totalLearners: 0, // TODO: Add learners count API
    totalMentors: mentors.length,
    totalSessions: sessions.length,
    pendingApprovals: pendingMentors.length,
    averageRating:
      sessions.length > 0
        ? sessions
            .filter((s) => s.learnerFeedback?.rating)
            .reduce((sum, s) => sum + (s.learnerFeedback?.rating || 0), 0) /
          Math.max(1, sessions.filter((s) => s.learnerFeedback?.rating).length)
        : 0,
    flaggedFeedback: recentFeedback.filter((f) => f.flagged).length,
  };

  // Recent activity calculated from real data
  const recentActivity = [
    // Mentor applications
    ...pendingMentors.map((mentor) => ({
      id: `mentor-${mentor.id}`,
      type: "mentor_application",
      message: `${mentor.name} applied to become a mentor`,
      timestamp: mentor.createdAt,
    })),
    // Completed sessions
    ...sessions
      .filter((s) => s.status === "completed")
      .slice(0, 3)
      .map((session) => ({
        id: `session-${session.id}`,
        type: "session_completed",
        message: `Session completed between ${session.learner?.name} and ${session.mentor?.name}`,
        timestamp: session.endTime,
      })),
    // Flagged feedback
    ...recentFeedback
      .filter((f) => f.flagged)
      .slice(0, 2)
      .map((feedback) => ({
        id: `feedback-${feedback.id}`,
        type: "feedback_flagged",
        message: `Feedback flagged for review from ${feedback.learnerName}`,
        timestamp: feedback.date,
      })),
  ]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 5);

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(6)].map((_, i) => (
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Monitor platform activity and manage mentor approvals.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Learners
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalLearners.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Active Mentors
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalMentors}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Sessions
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalSessions.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.averageRating}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <Link to="/admin/mentors">
                  <Button variant="outline" className="w-full justify-start">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Mentor Approvals
                    {stats.pendingApprovals > 0 && (
                      <span className="ml-auto bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                        {stats.pendingApprovals}
                      </span>
                    )}
                  </Button>
                </Link>
                <Link to="/admin/feedback">
                  <Button variant="outline" className="w-full justify-start">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Review Feedback
                    {stats.flaggedFeedback > 0 && (
                      <span className="ml-auto bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                        {stats.flaggedFeedback}
                      </span>
                    )}
                  </Button>
                </Link>
                <Link to="/admin/analytics">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>
                </Link>
                {/* Debug Video Call Button */}
                <Link to="/video-call/admin-demo-789">
                  <Button className="w-full justify-start bg-orange-600 hover:bg-orange-700 text-white">
                    <Video className="h-4 w-4 mr-2" />
                    🧪 Test Video Call
                  </Button>
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Activity
              </h2>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Mentor Approvals */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Pending Mentor Approvals
                  {pendingMentors.length > 0 && (
                    <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                      {pendingMentors.length}
                    </span>
                  )}
                </h2>
                <Link to="/admin/mentors">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>

              {pendingMentors.length > 0 ? (
                <div className="space-y-4">
                  {pendingMentors.map((mentor) => (
                    <div
                      key={mentor.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {mentor.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {mentor.email}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {mentor.skills.slice(0, 3).map((skill) => (
                              <span
                                key={skill}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Applied {formatDate(mentor.appliedAt)}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" className="flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline">
                            Review
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No pending mentor applications
                  </p>
                </div>
              )}
            </div>

            {/* Flagged Feedback */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Flagged Feedback
                  {stats.flaggedFeedback > 0 && (
                    <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                      {stats.flaggedFeedback}
                    </span>
                  )}
                </h2>
                <Link to="/admin/feedback">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>

              {recentFeedback.filter((f) => f.flagged).length > 0 ? (
                <div className="space-y-4">
                  {recentFeedback
                    .filter((f) => f.flagged)
                    .map((feedback) => (
                      <div
                        key={feedback.id}
                        className="border border-red-200 rounded-lg p-4 bg-red-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <span className="font-medium text-gray-900">
                                {feedback.learnerName}
                              </span>
                              <span className="text-gray-500 mx-2">→</span>
                              <span className="text-gray-700">
                                {feedback.mentorName}
                              </span>
                              <div className="flex items-center ml-2">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < feedback.rating
                                        ? "text-yellow-400 fill-current"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">
                              "{feedback.comment}"
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(feedback.date)}
                            </p>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <Button size="sm" variant="outline">
                              Review
                            </Button>
                            <Button size="sm" variant="danger">
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No flagged feedback</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

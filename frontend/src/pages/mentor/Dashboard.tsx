import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Users,
  Clock,
  Star,
  TrendingUp,
  DollarSign,
  Bell,
  Video,
  Check,
  X,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Layout } from "../../components/layout";
import { Button } from "../../components/ui";
import { useNotifications } from "../../hooks/useNotifications";
import { formatDate, formatTime } from "../../utils";
import { apiService } from "../../services/api";
import { Session } from "../../types";

export const MentorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { notifications, respondToBooking } = useNotifications();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter booking request notifications
  const bookingRequests = notifications.filter(
    (n) => n.type === "booking_request" && !n.read
  );

  // Fetch mentor dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // Fetch mentor sessions
        const sessionsResponse = await apiService.getMentorSessions();
        if (sessionsResponse.success && sessionsResponse.data) {
          setSessions(sessionsResponse.data);
        }

        // Fetch pending booking requests
        const requestsResponse = await apiService.getPendingBookings();
        if (requestsResponse.success && requestsResponse.data) {
          setPendingRequests(requestsResponse.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Filter upcoming sessions
  const upcomingSessions = sessions
    .filter(
      (session) =>
        session.status === "confirmed" &&
        new Date(session.startTime) >= new Date()
    )
    .slice(0, 3);

  const stats = {
    totalSessions: sessions.filter((s) => s.status === "completed").length,
    totalEarnings: sessions
      .filter((s) => s.status === "completed")
      .reduce((sum, s) => sum + (s.price || 0), 0),
    averageRating:
      sessions.length > 0
        ? sessions
            .filter((s) => s.learnerFeedback?.rating)
            .reduce((sum, s) => sum + (s.learnerFeedback?.rating || 0), 0) /
          Math.max(1, sessions.filter((s) => s.learnerFeedback?.rating).length)
        : 0,
    responseRate: 98, // TODO: Calculate from booking response data
    nextSession: upcomingSessions[0],
    pendingRequests: pendingRequests.length,
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Get recent feedback from completed sessions
  const recentFeedback = sessions
    .filter(
      (session) => session.learnerFeedback && session.learnerFeedback.rating
    )
    .slice(0, 5)
    .map((session) => ({
      id: session.id,
      learnerName: session.learnerName || "Anonymous",
      rating: session.learnerFeedback?.rating || 0,
      comment: session.learnerFeedback?.comment || "",
      date: session.endTime || session.startTime,
    }));

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Here's an overview of your mentoring activity and upcoming sessions.
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
                  Total Sessions
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalSessions}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Earnings
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.totalEarnings.toLocaleString()}
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

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Response Rate
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.responseRate}%
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
                <Link to="/mentor/availability">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Manage Availability
                  </Button>
                </Link>
                <Link to="/mentor/bookings">
                  <Button variant="outline" className="w-full justify-start">
                    <Bell className="h-4 w-4 mr-2" />
                    Booking Requests
                    {stats.pendingRequests > 0 && (
                      <span className="ml-auto bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                        {stats.pendingRequests}
                      </span>
                    )}
                  </Button>
                </Link>
                <Link to="/mentor/sessions">
                  <Button variant="outline" className="w-full justify-start">
                    <Clock className="h-4 w-4 mr-2" />
                    My Sessions
                  </Button>
                </Link>
                <Link to="/video-call/demo-session-123">
                  <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white">
                    <Video className="h-4 w-4 mr-2" />
                    Join Session
                  </Button>
                </Link>
              </div>
            </div>

            {/* Next Session */}
            {stats.nextSession && (
              <div className="bg-white rounded-lg shadow p-6 mt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Next Session
                </h2>
                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                  <h3 className="font-medium text-blue-900">
                    {stats.nextSession.title}
                  </h3>
                  <p className="text-sm text-blue-700">
                    with {stats.nextSession.learner?.name}
                  </p>
                  <p className="text-sm text-blue-700">
                    {formatDate(stats.nextSession.startTime)} at{" "}
                    {formatTime(stats.nextSession.startTime)}
                  </p>
                  <Button size="sm" className="mt-3 w-full">
                    Join Session
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Requests */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Booking Requests
                  {bookingRequests.length > 0 && (
                    <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                      {bookingRequests.length}
                    </span>
                  )}
                </h2>
                <Link to="/mentor/bookings">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>

              {bookingRequests.length > 0 ? (
                <div className="space-y-4">
                  {bookingRequests.slice(0, 3).map((notification) => {
                    const request = notification.data;
                    return (
                      <div
                        key={notification.id}
                        className="border border-gray-200 rounded-lg p-4 bg-blue-50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">
                            {request.learnerName}
                          </h3>
                          <span className="text-sm text-gray-500">
                            {request.preferredDate} at {request.preferredTime}
                          </span>
                        </div>
                        <div className="mb-2">
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            {request.sessionType
                              .replace("-", " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        </div>
                        {request.message && (
                          <p className="text-sm text-gray-600 mb-3 italic">
                            "{request.message}"
                          </p>
                        )}
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={async () => {
                              try {
                                await respondToBooking(request.id, "accepted");
                                // Optionally show success message
                              } catch (error) {
                                console.error(
                                  "Failed to accept booking:",
                                  error
                                );
                              }
                            }}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                            onClick={async () => {
                              try {
                                await respondToBooking(request.id, "rejected");
                                // Optionally show success message
                              } catch (error) {
                                console.error(
                                  "Failed to reject booking:",
                                  error
                                );
                              }
                            }}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No pending booking requests</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Learners can send you booking requests from your profile
                  </p>
                </div>
              )}
            </div>

            {/* Recent Feedback */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Feedback
                </h2>
                <Link to="/mentor/feedback">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>

              {recentFeedback.length > 0 ? (
                <div className="space-y-4">
                  {recentFeedback.map((feedback) => (
                    <div
                      key={feedback.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900">
                            {feedback.learnerName}
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
                        <span className="text-sm text-gray-500">
                          {formatDate(feedback.date)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">
                        "{feedback.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No feedback yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Clock, Star, TrendingUp, DollarSign, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../../components/layout';
import { Button } from '../../components/ui';
import { generateMockSessions, formatDate, formatTime } from '../../utils';

export const MentorDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Mock data for MVP
  const upcomingSessions = generateMockSessions().filter(session => 
    session.status === 'confirmed' && new Date(session.date) >= new Date()
  ).slice(0, 3);
  
  const pendingRequests = [
    {
      id: '1',
      learnerName: 'Alice Johnson',
      date: '2024-08-16',
      startTime: '14:00',
      endTime: '15:00',
      message: 'Hi! I would love to learn about React hooks and state management.',
      createdAt: '2024-08-14T10:00:00Z',
    },
    {
      id: '2',
      learnerName: 'Bob Smith',
      date: '2024-08-17',
      startTime: '10:00',
      endTime: '11:00',
      message: 'Looking for help with TypeScript and advanced patterns.',
      createdAt: '2024-08-14T12:00:00Z',
    },
  ];

  const stats = {
    totalSessions: 156,
    totalEarnings: 11700,
    averageRating: 4.8,
    responseRate: 98,
    nextSession: upcomingSessions[0],
    pendingRequests: pendingRequests.length,
  };

  const recentFeedback = [
    {
      id: '1',
      learnerName: 'Sarah K.',
      rating: 5,
      comment: 'Excellent session! Very clear explanations and practical examples.',
      date: '2024-08-12',
    },
    {
      id: '2',
      learnerName: 'Mike R.',
      rating: 5,
      comment: 'Great mentor with deep knowledge. Very patient and helpful.',
      date: '2024-08-10',
    },
  ];

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
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalEarnings.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Response Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.responseRate}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link to="/mentor/availability">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Manage Availability
                  </Button>
                </Link>
                <Link to="/mentor/requests">
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
              </div>
            </div>

            {/* Next Session */}
            {stats.nextSession && (
              <div className="bg-white rounded-lg shadow p-6 mt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Next Session</h2>
                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                  <h3 className="font-medium text-blue-900">{stats.nextSession.topic}</h3>
                  <p className="text-sm text-blue-700">with {stats.nextSession.learnerName}</p>
                  <p className="text-sm text-blue-700">
                    {formatDate(stats.nextSession.date)} at {formatTime(stats.nextSession.startTime)}
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
                  Pending Booking Requests
                  {pendingRequests.length > 0 && (
                    <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                      {pendingRequests.length}
                    </span>
                  )}
                </h2>
                <Link to="/mentor/requests">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
              
              {pendingRequests.length > 0 ? (
                <div className="space-y-4">
                  {pendingRequests.slice(0, 2).map((request) => (
                    <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{request.learnerName}</h3>
                        <span className="text-sm text-gray-500">
                          {formatDate(request.date)} at {formatTime(request.startTime)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">"{request.message}"</p>
                      <div className="flex space-x-2">
                        <Button size="sm" className="flex-1">Accept</Button>
                        <Button size="sm" variant="outline" className="flex-1">Decline</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No pending requests</p>
                </div>
              )}
            </div>

            {/* Recent Feedback */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Feedback</h2>
                <Link to="/mentor/feedback">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
              
              {recentFeedback.length > 0 ? (
                <div className="space-y-4">
                  {recentFeedback.map((feedback) => (
                    <div key={feedback.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900">{feedback.learnerName}</span>
                          <div className="flex items-center ml-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < feedback.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">{formatDate(feedback.date)}</span>
                      </div>
                      <p className="text-sm text-gray-700">"{feedback.comment}"</p>
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

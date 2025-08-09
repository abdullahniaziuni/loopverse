import React from 'react';
import { Link } from 'react-router-dom';
import { Users, UserCheck, BookOpen, Star, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../../components/layout';
import { Button } from '../../components/ui';
import { generateMockMentors, generateMockSessions, formatDate } from '../../utils';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Mock data for MVP
  const allMentors = generateMockMentors();
  const allSessions = generateMockSessions();
  
  const pendingMentors = [
    {
      id: '4',
      name: 'David Wilson',
      email: 'david@example.com',
      skills: ['Python', 'Django', 'PostgreSQL'],
      experience: '5 years',
      appliedAt: '2024-08-13T10:00:00Z',
    },
    {
      id: '5',
      name: 'Lisa Chen',
      email: 'lisa@example.com',
      skills: ['React Native', 'Mobile Development', 'iOS'],
      experience: '4 years',
      appliedAt: '2024-08-12T15:00:00Z',
    },
  ];

  const recentFeedback = [
    {
      id: '1',
      sessionId: '1',
      learnerName: 'Alice J.',
      mentorName: 'Sarah Johnson',
      rating: 5,
      comment: 'Excellent session! Very clear explanations.',
      date: '2024-08-12',
      flagged: false,
    },
    {
      id: '2',
      sessionId: '2',
      learnerName: 'Bob S.',
      mentorName: 'Michael Chen',
      rating: 1,
      comment: 'Mentor was unprepared and session was not helpful.',
      date: '2024-08-11',
      flagged: true,
    },
  ];

  const stats = {
    totalLearners: 1247,
    totalMentors: allMentors.length,
    totalSessions: 3456,
    pendingApprovals: pendingMentors.length,
    averageRating: 4.7,
    flaggedFeedback: recentFeedback.filter(f => f.flagged).length,
  };

  const recentActivity = [
    {
      id: '1',
      type: 'mentor_application',
      message: 'David Wilson applied to become a mentor',
      timestamp: '2024-08-13T10:00:00Z',
    },
    {
      id: '2',
      type: 'session_completed',
      message: 'Session completed between Alice J. and Sarah Johnson',
      timestamp: '2024-08-12T15:00:00Z',
    },
    {
      id: '3',
      type: 'feedback_flagged',
      message: 'Feedback flagged for review from Bob S.',
      timestamp: '2024-08-11T14:00:00Z',
    },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
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
                <p className="text-sm font-medium text-gray-600">Total Learners</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalLearners.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Mentors</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMentors}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSessions.toLocaleString()}</p>
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
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
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.message}</p>
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
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
              
              {pendingMentors.length > 0 ? (
                <div className="space-y-4">
                  {pendingMentors.map((mentor) => (
                    <div key={mentor.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{mentor.name}</h3>
                          <p className="text-sm text-gray-600">{mentor.email}</p>
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
                  <p className="text-gray-600">No pending mentor applications</p>
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
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
              
              {recentFeedback.filter(f => f.flagged).length > 0 ? (
                <div className="space-y-4">
                  {recentFeedback.filter(f => f.flagged).map((feedback) => (
                    <div key={feedback.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span className="font-medium text-gray-900">{feedback.learnerName}</span>
                            <span className="text-gray-500 mx-2">→</span>
                            <span className="text-gray-700">{feedback.mentorName}</span>
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
                          <p className="text-sm text-gray-700 mb-2">"{feedback.comment}"</p>
                          <p className="text-xs text-gray-500">{formatDate(feedback.date)}</p>
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

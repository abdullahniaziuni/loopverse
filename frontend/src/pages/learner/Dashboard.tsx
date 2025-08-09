import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Users,
  BookOpen,
  TrendingUp,
  Clock,
  Star,
  Video,
  Brain,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Layout } from "../../components/layout";
import { Button } from "../../components/ui";
import { LearningPathGenerator } from "../../components/ai/LearningPathGenerator";
import { SmartMentorRecommendations } from "../../components/ai/SmartMentorRecommendations";
import { generateMockSessions, formatDate, formatTime } from "../../utils";

export const LearnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [isLearningPathOpen, setIsLearningPathOpen] = useState(false);
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);

  // Mock data for MVP
  const upcomingSessions = generateMockSessions().filter(
    (session) =>
      session.status === "confirmed" && new Date(session.date) >= new Date()
  );

  const recentSessions = generateMockSessions()
    .filter((session) => session.status === "completed")
    .slice(0, 3);

  const suggestedTopics = [
    "Advanced React Patterns",
    "System Design Fundamentals",
    "Data Structures & Algorithms",
    "Machine Learning Basics",
    "UI/UX Design Principles",
  ];

  const stats = {
    totalSessions: 12,
    hoursLearned: 18,
    averageRating: 4.8,
    activeMentors: 5,
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Clean Welcome Section */}
        <div className="mb-8">
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome back, {user?.name}! 👋
                </h1>
                <p className="text-gray-600 text-lg">
                  Ready to continue your learning journey? Here's what's
                  happening today.
                </p>
              </div>
              <div className="hidden lg:block">
                <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🚀</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-600 rounded-lg">
                <BookOpen className="h-6 w-6 text-white" />
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

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-600 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Hours Learned
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.hoursLearned}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-600 rounded-lg">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.averageRating}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-purple-600 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Active Mentors
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.activeMentors}
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
                <Link to="/mentors">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Browse Mentors
                  </Button>
                </Link>
                <Link to="/bookings">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    My Bookings
                  </Button>
                </Link>
                <Link to="/history">
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Session History
                  </Button>
                </Link>
                {/* Debug Video Call Button */}
                <Link to="/video-call/demo-session-123">
                  <Button className="w-full justify-start bg-orange-600 hover:bg-orange-700 text-white">
                    <Video className="h-4 w-4 mr-2" />
                    🧪 Test Video Call
                  </Button>
                </Link>
                {/* AI Learning Path Generator */}
                <Button
                  onClick={() => setIsLearningPathOpen(true)}
                  className="w-full justify-start bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  🤖 AI Learning Path
                </Button>
                {/* AI Mentor Recommendations */}
                <Button
                  onClick={() =>
                    setShowAIRecommendations(!showAIRecommendations)
                  }
                  variant={showAIRecommendations ? "primary" : "outline"}
                  className="w-full justify-start"
                >
                  <Sparkles className="h-4 w-4 mr-2" />✨ Smart Mentor Match
                </Button>
              </div>
            </div>

            {/* AI Suggested Topics */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                AI Suggested Topics
              </h2>
              <div className="space-y-2">
                {suggestedTopics.map((topic, index) => (
                  <div
                    key={index}
                    className="p-3 bg-blue-50 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors"
                  >
                    <p className="text-sm text-blue-800">{topic}</p>
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-4">
                View All Suggestions
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Sessions */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
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
                  {upcomingSessions.map((session) => (
                    <div
                      key={session.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {session.topic}
                          </h3>
                          <p className="text-sm text-gray-600">
                            with {session.mentorName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(session.date)} at{" "}
                            {formatTime(session.startTime)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            {session.status}
                          </span>
                          <Button size="sm">Join Session</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No upcoming sessions</p>
                  <Link to="/mentors">
                    <Button className="mt-4">Book a Session</Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Sessions */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
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
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {session.topic}
                          </h3>
                          <p className="text-sm text-gray-600">
                            with {session.mentorName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(session.date)}
                          </p>
                          {session.aiSummary && (
                            <p className="text-sm text-gray-700 mt-2 italic">
                              "{session.aiSummary}"
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {session.feedback && (
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-600 ml-1">
                                {session.feedback.rating}
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
                  <p className="text-gray-600">No recent sessions</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Mentor Recommendations Section */}
        {showAIRecommendations && (
          <div className="mt-8">
            <SmartMentorRecommendations
              userProfile={{
                skills: ["JavaScript", "React", "HTML", "CSS"],
                goals: [
                  "Learn React Hooks",
                  "Build Full-Stack Apps",
                  "Master State Management",
                ],
                experience: "intermediate",
                preferences: [
                  "Hands-on learning",
                  "Project-based",
                  "Interactive sessions",
                ],
              }}
              availableMentors={[
                {
                  id: "1",
                  name: "Sarah Johnson",
                  skills: ["React", "JavaScript", "Node.js", "TypeScript"],
                  experience: "Senior Developer with 8+ years",
                  specialties: [
                    "Frontend Architecture",
                    "React Ecosystem",
                    "Performance Optimization",
                  ],
                  rating: 4.9,
                  totalSessions: 150,
                  hourlyRate: 75,
                  bio: "Passionate about teaching modern web development with React and JavaScript.",
                },
                {
                  id: "2",
                  name: "Mike Chen",
                  skills: ["Full-Stack", "React", "Node.js", "MongoDB"],
                  experience: "Lead Developer with 10+ years",
                  specialties: [
                    "System Design",
                    "Database Architecture",
                    "API Development",
                  ],
                  rating: 4.8,
                  totalSessions: 200,
                  hourlyRate: 85,
                  bio: "Expert in building scalable web applications from frontend to backend.",
                },
                {
                  id: "3",
                  name: "Emily Rodriguez",
                  skills: ["React", "JavaScript", "UI/UX", "CSS"],
                  experience: "Senior Frontend Developer with 6+ years",
                  specialties: [
                    "Component Design",
                    "State Management",
                    "User Experience",
                  ],
                  rating: 4.9,
                  totalSessions: 120,
                  hourlyRate: 70,
                  bio: "Focused on creating beautiful, functional user interfaces with React.",
                },
              ]}
              onMentorSelect={(mentorId) => {
                console.log("Selected mentor:", mentorId);
                // Navigate to mentor profile or booking
              }}
            />
          </div>
        )}
      </div>

      {/* AI Learning Path Generator Modal */}
      <LearningPathGenerator
        isOpen={isLearningPathOpen}
        onClose={() => setIsLearningPathOpen(false)}
        onPathGenerated={(path) => {
          console.log("Generated learning path:", path);
          // Handle the generated learning path
        }}
      />
    </Layout>
  );
};

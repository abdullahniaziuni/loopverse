import React, { useState, useEffect } from "react";
import { MessageCircle, Users, Clock, Bell } from "lucide-react";
import { Layout } from "../../components/layout";
import { MessageCenter } from "../../components/messaging";
import { useAuth } from "../../contexts/AuthContext";
import { apiService } from "../../services/api";

export const Messages: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeStudents: 0,
    upcomingSessions: 0,
    remindersSent: 0,
  });

  // Fetch real stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log("📊 Messages - Fetching stats");

        // TODO: Replace with real API calls when available
        // For now, we'll use placeholder values
        setStats({
          activeStudents: 0,
          upcomingSessions: 0,
          remindersSent: 0,
        });

        console.log("✅ Messages - Stats loaded");
      } catch (error) {
        console.error("💥 Messages - Error fetching stats:", error);
      }
    };

    fetchStats();
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
    </Layout>
  );
};

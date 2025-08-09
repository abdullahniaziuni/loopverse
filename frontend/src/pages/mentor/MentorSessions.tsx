import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  User,
  Video,
  MessageSquare,
  Star,
  Filter,
  Search,
  ChevronRight,
} from "lucide-react";
import { Layout } from "../../components/layout/Layout";
import { Button, Input } from "../../components/ui";
import { apiService } from "../../services/api";

interface Session {
  id: string;
  learnerName: string;
  learnerAvatar?: string;
  topic: string;
  date: string;
  time: string;
  duration: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  type: "video" | "chat";
  rating?: number;
  feedback?: string;
}

// Mock sessions removed - now using real API data

export const MentorSessions: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch mentor sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.getMentorSessions();
        if (response.success && response.data) {
          setSessions(response.data);
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.learnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || session.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Session["status"]) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "ongoing":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: Session["status"]) => {
    switch (status) {
      case "upcoming":
        return <Calendar className="h-4 w-4" />;
      case "ongoing":
        return <Video className="h-4 w-4" />;
      case "completed":
        return <Star className="h-4 w-4" />;
      case "cancelled":
        return <Clock className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Sessions</h1>
          <p className="mt-2 text-gray-600">
            Manage your mentoring sessions and track your impact
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by learner name or topic..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="all">All Sessions</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {filteredSessions.length === 0 ? (
            <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No sessions found
              </h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filters."
                  : "You don't have any sessions yet."}
              </p>
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.id}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <img
                        className="h-12 w-12 rounded-lg object-cover"
                        src={
                          session.learnerAvatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            session.learnerName
                          )}&background=3B82F6&color=fff`
                        }
                        alt={session.learnerName}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {session.topic}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            session.status
                          )}`}
                        >
                          {getStatusIcon(session.status)}
                          <span className="ml-1 capitalize">
                            {session.status}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{session.learnerName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(session.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {session.time} ({session.duration} min)
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {session.type === "video" ? (
                            <Video className="h-4 w-4" />
                          ) : (
                            <MessageSquare className="h-4 w-4" />
                          )}
                          <span className="capitalize">{session.type}</span>
                        </div>
                      </div>
                      {session.rating && (
                        <div className="flex items-center space-x-2 mt-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < session.rating!
                                    ? "text-yellow-400 fill-current"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            ({session.rating}/5)
                          </span>
                        </div>
                      )}
                      {session.feedback && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          "{session.feedback}"
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {session.status === "upcoming" && (
                      <Link to={`/video-call/${session.id}`}>
                        <Button size="sm">
                          <Video className="h-4 w-4 mr-2" />
                          Join Call
                        </Button>
                      </Link>
                    )}
                    {session.status === "ongoing" && (
                      <Link to={`/video-call/${session.id}`}>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Video className="h-4 w-4 mr-2" />
                          Rejoin
                        </Button>
                      </Link>
                    )}
                    <Button variant="ghost" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-blue-600 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Sessions
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {sessions.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-green-600 rounded-lg">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {sessions.filter((s) => s.status === "completed").length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-600 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(
                    sessions
                      .filter((s) => s.rating)
                      .reduce((acc, s) => acc + (s.rating || 0), 0) /
                      sessions.filter((s) => s.rating).length || 0
                  ).toFixed(1)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-purple-600 rounded-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Unique Learners
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(sessions.map((s) => s.learnerName)).size}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

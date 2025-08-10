import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Video, Users, ArrowLeft } from "lucide-react";
import { GlobalVideoCall } from "../components/video/GlobalVideoCall";
import { CallParticipant } from "../services/globalWebRTC";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../hooks/useToast";

export const GlobalVideoCallPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const [showCall, setShowCall] = useState(false);

  const userData: CallParticipant = {
    userId: user?.id || "",
    name: user?.name || "Unknown User",
    role: user?.role || "user",
    isVideoEnabled: false, // Camera disabled by default
    isAudioEnabled: true,
    isScreenSharing: false,
  };

  useEffect(() => {
    if (!user) {
      showError("Please log in to join video calls");
      navigate("/login");
    }
  }, [user, navigate, showError]);

  const handleStartCall = () => {
    setShowCall(true);
  };

  const handleCloseCall = () => {
    setShowCall(false);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleGoBack}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Video className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    Global Video Call
                  </h1>
                  <p className="text-sm text-gray-600">
                    Connect with everyone in one call
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>Join the global conversation</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showCall ? (
          <div className="max-w-2xl mx-auto">
            {/* Welcome Card */}
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Video className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to Global Video Call
              </h2>

              <p className="text-gray-600 mb-8 leading-relaxed">
                Join a single video call where all users can connect regardless
                of their session or room. Perfect for community discussions,
                group meetings, and collaborative sessions.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Global Connection
                  </h3>
                  <p className="text-sm text-gray-600">
                    Connect with all users in one unified call
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Video className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    HD Video & Audio
                  </h3>
                  <p className="text-sm text-gray-600">
                    Crystal clear video and audio quality
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-6 h-6 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    File Sharing
                  </h3>
                  <p className="text-sm text-gray-600">
                    Share files instantly with all participants
                  </p>
                </div>
              </div>

              <button
                onClick={handleStartCall}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Join Global Call
              </button>
            </div>

            {/* Features */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Real-time Communication
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>Instant video and audio connection</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>Screen sharing capabilities</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>Participant management</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-3">
                  File Sharing
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>Drag and drop file sharing</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>Support for all file types</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>Instant download for participants</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* User Info */}
            <div className="mt-8 bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                Your Information
              </h3>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {userData.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{userData.name}</p>
                  <p className="text-sm text-gray-600 capitalize">
                    {userData.role}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[calc(100vh-12rem)]">
            <GlobalVideoCall userData={userData} onClose={handleCloseCall} />
          </div>
        )}
      </div>
    </div>
  );
};

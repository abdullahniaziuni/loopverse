import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SessionCallManager } from "./components/notifications/SessionCallNotification";

// Auth pages
import { Login } from "./pages/auth/Login";
import { Signup } from "./pages/auth/Signup";
import { ForgotPassword } from "./pages/auth/ForgotPassword";

// Dashboard pages
import { LearnerDashboard } from "./pages/learner/Dashboard";
import { MentorListing } from "./pages/learner/MentorListing";
import { MentorProfile } from "./pages/learner/MentorProfile";
import { MyBookings } from "./pages/learner/MyBookings";
import { SessionHistory } from "./pages/learner/SessionHistory";
import { MentorDashboard } from "./pages/mentor/Dashboard";
import { Availability } from "./pages/mentor/Availability";
import { BookingRequests } from "./pages/mentor/BookingRequests";
import { MentorSessions } from "./pages/mentor/MentorSessions";
import { Messages } from "./pages/mentor/Messages";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { MentorApprovals } from "./pages/admin/MentorApprovals";
import { FeedbackManagement } from "./pages/admin/FeedbackManagement";
import { VideoCall } from "./pages/VideoCall";

import { Settings } from "./pages/Settings";
import { NotFound } from "./pages/NotFound";
import { SessionRoom } from "./pages/SessionRoom";
import { PublicMentorProfile } from "./pages/PublicMentorProfile";

// Component to handle session call notifications
const AppWithNotifications: React.FC = () => {
  const { user } = useAuth();

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <ProtectedRoute requireAuth={false}>
              <Login />
            </ProtectedRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <ProtectedRoute requireAuth={false}>
              <Signup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <ProtectedRoute requireAuth={false}>
              <ForgotPassword />
            </ProtectedRoute>
          }
        />

        {/* Protected routes */}
        <Route
          path="/learner/dashboard"
          element={
            <ProtectedRoute>
              <LearnerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/learner/mentors"
          element={
            <ProtectedRoute>
              <MentorListing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/learner/mentors/:mentorId"
          element={
            <ProtectedRoute>
              <MentorProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/learner/bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/learner/sessions"
          element={
            <ProtectedRoute>
              <SessionHistory />
            </ProtectedRoute>
          }
        />

        {/* Mentor routes */}
        <Route
          path="/mentor/dashboard"
          element={
            <ProtectedRoute>
              <MentorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mentor/availability"
          element={
            <ProtectedRoute>
              <Availability />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mentor/bookings"
          element={
            <ProtectedRoute>
              <BookingRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mentor/requests"
          element={
            <ProtectedRoute>
              <BookingRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mentor/sessions"
          element={
            <ProtectedRoute>
              <MentorSessions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mentor/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/mentor-approvals"
          element={
            <ProtectedRoute>
              <MentorApprovals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/feedback"
          element={
            <ProtectedRoute>
              <FeedbackManagement />
            </ProtectedRoute>
          }
        />

        {/* Video call routes */}
        <Route
          path="/video-call/:sessionId"
          element={
            <ProtectedRoute>
              <VideoCall />
            </ProtectedRoute>
          }
        />

        {/* Session routes */}
        <Route
          path="/session/:sessionId"
          element={
            <ProtectedRoute>
              <SessionRoom />
            </ProtectedRoute>
          }
        />

        {/* Settings */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Public mentor profile */}
        <Route
          path="/mentor/:mentorId/profile"
          element={<PublicMentorProfile />}
        />

        {/* Default redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/dashboard"
          element={<Navigate to="/learner/dashboard" replace />}
        />
        <Route
          path="/mentors"
          element={<Navigate to="/learner/mentors" replace />}
        />
        <Route
          path="/bookings"
          element={<Navigate to="/learner/bookings" replace />}
        />
        <Route
          path="/history"
          element={<Navigate to="/learner/sessions" replace />}
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Global Session Call Manager */}
      {user && (
        <SessionCallManager
          userId={user.id}
          userName={user.name || "Unknown"}
          userRole={user.role || "user"}
        />
      )}
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppWithNotifications />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

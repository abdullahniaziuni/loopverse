import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

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

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
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

            {/* Public mentor profile */}
            <Route
              path="/mentor/:mentorId/public"
              element={
                <ProtectedRoute requireAuth={false}>
                  <PublicMentorProfile />
                </ProtectedRoute>
              }
            />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["learner"]}>
                  <LearnerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mentors"
              element={
                <ProtectedRoute allowedRoles={["learner"]}>
                  <MentorListing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mentors/:mentorId"
              element={
                <ProtectedRoute allowedRoles={["learner"]}>
                  <MentorProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute allowedRoles={["learner"]}>
                  <MyBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute allowedRoles={["learner"]}>
                  <SessionHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mentor/dashboard"
              element={
                <ProtectedRoute allowedRoles={["mentor"]}>
                  <MentorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mentor/availability"
              element={
                <ProtectedRoute allowedRoles={["mentor"]}>
                  <Availability />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mentor/requests"
              element={
                <ProtectedRoute allowedRoles={["mentor"]}>
                  <BookingRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mentor/sessions"
              element={
                <ProtectedRoute allowedRoles={["mentor"]}>
                  <MentorSessions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mentor/messages"
              element={
                <ProtectedRoute allowedRoles={["mentor"]}>
                  <Messages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/mentors"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <MentorApprovals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/feedback"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <FeedbackManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/video-call/:sessionId"
              element={
                <ProtectedRoute allowedRoles={["learner", "mentor"]}>
                  <VideoCall />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={["learner", "mentor", "admin"]}>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/session/:sessionId"
              element={
                <ProtectedRoute allowedRoles={["learner", "mentor"]}>
                  <SessionRoom />
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { UserRole } from "../types";
import { LoadingPage } from "./ui/Loading";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireAuth = true,
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  console.log("🛡️ ProtectedRoute - Checking access");
  console.log("📍 Current path:", location.pathname);
  console.log("⏳ Is loading:", isLoading);
  console.log("👤 User:", user);
  console.log("🏷️ User role:", user?.role);
  console.log("🔐 Required auth:", requireAuth);
  console.log("👥 Allowed roles:", allowedRoles);

  if (isLoading) {
    console.log("⏳ ProtectedRoute - Showing loading page");
    return <LoadingPage text="Loading..." />;
  }

  // If authentication is required but user is not logged in
  if (requireAuth && !user) {
    console.log("❌ ProtectedRoute - No user, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is logged in but trying to access auth pages
  if (!requireAuth && user) {
    console.log(
      "🔄 ProtectedRoute - User logged in, redirecting from auth page"
    );
    const redirectPath = getRoleBasedRedirect(user.role);
    console.log("🎯 Redirect path:", redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  // If specific roles are required and user doesn't have the right role
  if (allowedRoles && user) {
    console.log("🔍 ProtectedRoute - Checking role permissions");

    // Normalize role comparison (handle case sensitivity and whitespace)
    const userRole = user.role?.toString().toLowerCase().trim();
    const normalizedAllowedRoles = allowedRoles.map((role) =>
      role.toLowerCase().trim()
    );

    console.log("🏷️ Raw user role:", user.role);
    console.log("🏷️ Normalized user role:", userRole);
    console.log("👥 Raw allowed roles:", allowedRoles);
    console.log("👥 Normalized allowed roles:", normalizedAllowedRoles);

    const roleMatches = normalizedAllowedRoles.includes(userRole);
    console.log("✅ Role check result:", roleMatches);
    console.log("🔍 Detailed check:", {
      userRole,
      normalizedAllowedRoles,
      includes: normalizedAllowedRoles.includes(userRole),
      indexOf: normalizedAllowedRoles.indexOf(userRole),
    });

    if (!roleMatches) {
      console.log("❌ ProtectedRoute - User role not allowed, redirecting");
      console.log("🔍 Debug info:");
      console.log("  - User role type:", typeof user.role);
      console.log("  - User role length:", userRole.length);
      console.log("  - Allowed roles:", normalizedAllowedRoles);
      console.log(
        "  - Each allowed role:",
        normalizedAllowedRoles.map((r) => `"${r}" (${r.length})`)
      );

      const redirectPath = getRoleBasedRedirect(user.role);
      console.log("🎯 Redirect path:", redirectPath);
      return <Navigate to={redirectPath} replace />;
    }
  }

  console.log("✅ ProtectedRoute - Access granted, rendering children");
  return <>{children}</>;
};

const getRoleBasedRedirect = (role: UserRole): string => {
  switch (role) {
    case "learner":
      return "/dashboard";
    case "mentor":
      return "/mentor/dashboard";
    case "admin":
      return "/admin/dashboard";
    default:
      return "/dashboard";
  }
};

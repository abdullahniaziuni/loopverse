import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'learner':
        return '/dashboard';
      case 'mentor':
        return '/mentor/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/login';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          {/* 404 Illustration */}
          <div className="mx-auto h-32 w-32 text-gray-400 mb-8">
            <svg
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="w-full h-full"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 20a7.962 7.962 0 01-5.657-2.343m0-11.314A7.962 7.962 0 0112 4a7.962 7.962 0 015.657 2.343M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>

          {/* Error Message */}
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or you might have entered the wrong URL.
          </p>

          {/* Action Buttons */}
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="w-full sm:w-auto flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            
            <Link to={getDashboardPath()}>
              <Button className="w-full sm:w-auto flex items-center justify-center">
                <Home className="h-4 w-4 mr-2" />
                {user ? 'Go to Dashboard' : 'Go to Login'}
              </Button>
            </Link>
          </div>

          {/* Additional Links */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              Looking for something specific?
            </p>
            <div className="space-y-2">
              {user ? (
                <>
                  {user.role === 'learner' && (
                    <>
                      <Link
                        to="/mentors"
                        className="block text-sm text-blue-600 hover:text-blue-800"
                      >
                        Browse Mentors
                      </Link>
                      <Link
                        to="/bookings"
                        className="block text-sm text-blue-600 hover:text-blue-800"
                      >
                        My Bookings
                      </Link>
                    </>
                  )}
                  {user.role === 'mentor' && (
                    <>
                      <Link
                        to="/mentor/availability"
                        className="block text-sm text-blue-600 hover:text-blue-800"
                      >
                        Manage Availability
                      </Link>
                      <Link
                        to="/mentor/requests"
                        className="block text-sm text-blue-600 hover:text-blue-800"
                      >
                        Booking Requests
                      </Link>
                    </>
                  )}
                  {user.role === 'admin' && (
                    <>
                      <Link
                        to="/admin/mentors"
                        className="block text-sm text-blue-600 hover:text-blue-800"
                      >
                        Mentor Approvals
                      </Link>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block text-sm text-blue-600 hover:text-blue-800"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="block text-sm text-blue-600 hover:text-blue-800"
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Brand */}
          <div className="mt-8">
            <Link to="/" className="text-blue-600 font-semibold text-lg">
              SkillSphere
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

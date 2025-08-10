import React, { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import {
  Star,
  Calendar,
  Clock,
  MapPin,
  Award,
  MessageCircle,
  Share2,
} from "lucide-react";
import { Layout } from "../../components/layout";
import { Button, Modal } from "../../components/ui";
import { formatDate, formatTime } from "../../utils";
import { useToast } from "../../hooks/useToast";
import { apiService } from "../../services/api";
import { Mentor } from "../../types";
import { RatingDisplay, FeedbackSummary } from "../../components/feedback";
import { ChatWindow } from "../../components/messaging/ChatWindow";
import { useAuth } from "../../contexts/AuthContext";

export const MentorProfile: React.FC = () => {
  const { mentorId } = useParams<{ mentorId: string }>();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { success: showSuccess, error: showError } = useToast();
  const { user } = useAuth();

  // Chat functionality
  const [showChat, setShowChat] = useState(false);
  const [chatParticipant, setChatParticipant] = useState<{
    id: string;
    name: string;
    role: string;
    avatar: string;
    isOnline: boolean;
  } | null>(null);

  const shareProfile = async () => {
    const publicUrl = `${window.location.origin}/mentor/${mentorId}/public`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${mentor?.name} - SkillSphere Mentor`,
          text: `Check out ${mentor?.name}'s mentor profile on SkillSphere`,
          url: publicUrl,
        });
      } else {
        await navigator.clipboard.writeText(publicUrl);
        showSuccess("Public profile link copied to clipboard!");
      }
    } catch (err) {
      console.error("Error sharing profile:", err);
      showError("Failed to share profile");
    }
  };

  // State for real availability
  const [availableSlots, setAvailableSlots] = React.useState<
    {
      id: string;
      date: string;
      startTime: string;
      endTime: string;
    }[]
  >([]);

  // Fetch real availability from the API
  React.useEffect(() => {
    const fetchAvailability = async () => {
      if (!mentorId) return;

      try {
        const response = await apiService.request(
          `/availability/mentor/${mentorId}`
        );
        if (response.success && response.data) {
          const slots: {
            id: string;
            date: string;
            startTime: string;
            endTime: string;
          }[] = [];

          response.data.availabilityDates?.forEach((dateObj: any) => {
            const dateString = new Date(dateObj.date)
              .toISOString()
              .split("T")[0];

            dateObj.timeSlots.forEach((slot: any) => {
              if (!slot.isBooked) {
                // Only show available slots
                slots.push({
                  id: slot._id || `${dateObj._id}-${slot.startTime}`,
                  date: dateString,
                  startTime: slot.startTime,
                  endTime: slot.endTime,
                });
              }
            });
          });

          // Sort by date and time
          slots.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.startTime.localeCompare(b.startTime);
          });

          setAvailableSlots(slots.slice(0, 12)); // Show first 12 slots
        }
      } catch (error) {
        console.error("Failed to fetch mentor availability:", error);
        // Fallback to empty array
        setAvailableSlots([]);
      }
    };

    fetchAvailability();
  }, [mentorId]);

  // Fetch mentor data
  useEffect(() => {
    const fetchMentor = async () => {
      if (!mentorId) return;

      try {
        setIsLoading(true);
        const response = await apiService.getMentorById(mentorId);
        if (response.success && response.data) {
          setMentor(response.data);
        } else {
          setError(response.error || "Mentor not found");
        }
      } catch (err) {
        setError("Failed to fetch mentor profile");
        console.error("Error fetching mentor:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMentor();
  }, [mentorId]);

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-4"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !mentor) {
    return <Navigate to="/mentors" replace />;
  }

  const handleBookSession = (slot: any) => {
    setSelectedSlot(slot);
    setIsBookingModalOpen(true);
  };

  const confirmBooking = async () => {
    if (!selectedSlot || !mentor) return;

    try {
      console.log("📅 MentorProfile - Creating booking");
      console.log("📝 Booking data:", {
        mentorId: mentor.id,
        startTime: `${selectedSlot.date}T${selectedSlot.startTime}:00.000Z`,
        duration: 60,
        title: `Session with ${mentor.name}`,
        description: "Mentoring session",
        timezone: "UTC",
      });

      const bookingData = {
        mentorId: mentor.id || mentor._id,
        startTime: `${selectedSlot.date}T${selectedSlot.startTime}:00.000Z`,
        duration: 60, // 1 hour default
        title: `Session with ${mentor.name}`,
        description: "Mentoring session",
      };

      const response = await apiService.createBookingRequest(bookingData);

      console.log("📅 MentorProfile - Booking response:", response);

      if (response.success) {
        showSuccess(
          "Session booked successfully! You will receive a confirmation email shortly."
        );
        setIsBookingModalOpen(false);
        setSelectedSlot(null);
      } else {
        showError(response.error || "Failed to book session");
      }
    } catch (error) {
      console.error("💥 MentorProfile - Booking error:", error);
      showError("Failed to book session. Please try again.");
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <div className="flex-shrink-0">
              <img
                className="h-24 w-24 rounded-full object-cover"
                src={
                  mentor.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    mentor.name
                  )}&background=3B82F6&color=fff&size=96`
                }
                alt={mentor.name}
              />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                {mentor.name}
              </h1>
              <div className="flex items-center mt-2">
                <RatingDisplay
                  rating={mentor.rating || 0}
                  size="lg"
                  showText={true}
                  className="mr-4"
                />
                <span className="text-gray-600">
                  ({mentor.totalSessions} sessions completed)
                </span>
              </div>
              <div className="flex items-center mt-2 text-gray-600">
                <Award className="h-4 w-4 mr-1" />
                <span className="text-sm">Verified Mentor</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">
                ${mentor.hourlyRate}
              </div>
              <div className="text-sm text-gray-600">per hour</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
            <Button className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Book Session
            </Button>
            <Button
              variant="outline"
              className="flex items-center"
              onClick={() => {
                if (mentor) {
                  setChatParticipant({
                    id: mentor.id,
                    name: mentor.name,
                    role: "mentor",
                    avatar: mentor.profilePicture || "",
                    isOnline: true,
                  });
                  setShowChat(true);
                }
              }}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </Button>
            <Button
              variant="outline"
              onClick={shareProfile}
              className="flex items-center"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Profile
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                About
              </h2>
              <p className="text-gray-700 leading-relaxed">{mentor.bio}</p>
            </div>

            {/* Skills */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Skills & Expertise
              </h2>
              <div className="flex flex-wrap gap-3">
                {mentor.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Student Feedback
              </h2>

              {/* Feedback Summary */}
              <FeedbackSummary
                averageRating={mentor.rating || 0}
                totalReviews={mentor.totalSessions || 0}
                className="mb-6"
              />

              {/* Recent Reviews */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Recent Reviews
                </h3>
                {(mentor.reviews || [])
                  .slice(0, 3)
                  .map((rev: any, idx: number) => (
                    <div
                      key={idx}
                      className="border-b border-gray-200 pb-4 last:border-b-0"
                    >
                      <div className="flex items-center mb-2">
                        <RatingDisplay
                          rating={rev.rating || 5}
                          size="sm"
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-600">
                          {rev.learnerName || "Anonymous"} •{" "}
                          {formatDate(rev.date || new Date().toISOString())}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm">
                        {rev.comment ||
                          "Great session! Very helpful and knowledgeable mentor."}
                      </p>
                    </div>
                  ))}

                {(!mentor.reviews || mentor.reviews.length === 0) && (
                  <p className="text-gray-500 text-center py-4">
                    No reviews yet. Be the first to book a session!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Available Slots */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Available Times
              </h3>
              <div className="space-y-3">
                {availableSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {formatDate(slot.date)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatTime(slot.startTime)} -{" "}
                        {formatTime(slot.endTime)}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleBookSession(slot)}>
                      Book
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Contact
              </h3>
              <Button
                variant="outline"
                className="w-full mb-3"
                onClick={() => {
                  if (mentor) {
                    setChatParticipant({
                      id: mentor.id,
                      name: mentor.name,
                      role: "mentor",
                      avatar: mentor.profilePicture || "",
                      isOnline: true,
                    });
                    setShowChat(true);
                  }
                }}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Send Message
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Response time: Usually within 2 hours
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Confirmation Modal */}
      <Modal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        title="Confirm Booking"
      >
        {selectedSlot && (
          <div>
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">
                Session Details
              </h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mentor:</span>
                  <span className="font-medium">{mentor.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">
                    {formatDate(selectedSlot.date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">
                    {formatTime(selectedSlot.startTime)} -{" "}
                    {formatTime(selectedSlot.endTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">1 hour</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-bold text-lg">
                    ${mentor.hourlyRate}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsBookingModalOpen(false)}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={confirmBooking}>
                Confirm Booking
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Chat Window */}
      {showChat && chatParticipant && (
        <ChatWindow
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          participant={chatParticipant}
          onStartVideoCall={() => {
            // Start video call with the mentor
            const sessionId = `session_${Date.now()}`;
            window.open(`/video-call/${sessionId}`, "_blank");
          }}
        />
      )}
    </Layout>
  );
};

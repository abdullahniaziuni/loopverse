import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Star, Calendar, Clock, MapPin, Award, MessageCircle } from 'lucide-react';
import { Layout } from '../../components/layout';
import { Button, Modal } from '../../components/ui';
import { generateMockMentors, formatDate, formatTime } from '../../utils';
import { useToast } from '../../hooks/useToast';

export const MentorProfile: React.FC = () => {
  const { mentorId } = useParams<{ mentorId: string }>();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  
  const { success: showSuccess } = useToast();
  
  const mentor = generateMockMentors().find(m => m.id === mentorId);
  
  if (!mentor) {
    return <Navigate to="/mentors" replace />;
  }

  // Mock available slots
  const availableSlots = [
    { id: '1', date: '2024-08-15', startTime: '14:00', endTime: '15:00' },
    { id: '2', date: '2024-08-16', startTime: '10:00', endTime: '11:00' },
    { id: '3', date: '2024-08-17', startTime: '16:00', endTime: '17:00' },
    { id: '4', date: '2024-08-18', startTime: '11:00', endTime: '12:00' },
  ];

  const handleBookSession = (slot: any) => {
    setSelectedSlot(slot);
    setIsBookingModalOpen(true);
  };

  const confirmBooking = () => {
    // Mock booking confirmation
    showSuccess('Session booked successfully! You will receive a confirmation email shortly.');
    setIsBookingModalOpen(false);
    setSelectedSlot(null);
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
                src={mentor.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.name)}&background=3B82F6&color=fff&size=96`}
                alt={mentor.name}
              />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{mentor.name}</h1>
              <div className="flex items-center mt-2">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="text-lg font-medium text-gray-900 ml-1">
                    {mentor.rating}
                  </span>
                  <span className="text-gray-600 ml-2">
                    ({mentor.totalSessions} sessions completed)
                  </span>
                </div>
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
              <p className="text-gray-700 leading-relaxed">{mentor.bio}</p>
            </div>

            {/* Skills */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills & Expertise</h2>
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
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Reviews</h2>
              <div className="space-y-4">
                {/* Mock reviews */}
                <div className="border-b border-gray-200 pb-4">
                  <div className="flex items-center mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 ml-2">2 days ago</span>
                  </div>
                  <p className="text-gray-700">
                    "Excellent session! {mentor.name} explained complex concepts very clearly and provided practical examples."
                  </p>
                  <p className="text-sm text-gray-500 mt-1">- Sarah K.</p>
                </div>
                <div className="border-b border-gray-200 pb-4">
                  <div className="flex items-center mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 ml-2">1 week ago</span>
                  </div>
                  <p className="text-gray-700">
                    "Great mentor with deep knowledge. Very patient and helpful throughout the session."
                  </p>
                  <p className="text-sm text-gray-500 mt-1">- Mike R.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Available Slots */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Times</h3>
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
                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleBookSession(slot)}
                    >
                      Book
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact</h3>
              <Button variant="outline" className="w-full mb-3">
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
              <h4 className="font-medium text-gray-900 mb-2">Session Details</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mentor:</span>
                  <span className="font-medium">{mentor.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{formatDate(selectedSlot.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">
                    {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">1 hour</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-bold text-lg">${mentor.hourlyRate}</span>
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
              <Button
                className="flex-1"
                onClick={confirmBooking}
              >
                Confirm Booking
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

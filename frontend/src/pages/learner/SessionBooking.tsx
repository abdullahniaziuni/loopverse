import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, MapPin, DollarSign, MessageSquare } from 'lucide-react';
import { Layout } from '../../components/layout';
import { Button, Input, Modal } from '../../components/ui';
import { useForm } from '../../hooks/useForm';
import { useMentor, useMentorAvailability, useCreateBooking } from '../../hooks/useApi';
import { useAuthStore } from '../../store';

interface BookingForm {
  selectedSlot: string;
  message: string;
  duration: number;
}

export const SessionBooking: React.FC = () => {
  const { mentorId } = useParams<{ mentorId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedSlotDetails, setSelectedSlotDetails] = useState<any>(null);

  // Fetch mentor data
  const { data: mentor, isLoading: mentorLoading } = useMentor(mentorId!);
  const { data: availability, isLoading: availabilityLoading } = useMentorAvailability(
    mentorId!,
    selectedDate
  );

  // Booking mutation
  const { mutate: createBooking, isLoading: bookingLoading } = useCreateBooking();

  // Form handling
  const {
    values,
    errors,
    handleSubmit,
    getFieldProps,
    setValue,
  } = useForm<BookingForm>({
    initialValues: {
      selectedSlot: '',
      message: '',
      duration: 60,
    },
    validationRules: {
      selectedSlot: { required: true },
      duration: { required: true, min: 30, max: 180 },
    },
    onSubmit: async (formData) => {
      try {
        await createBooking({
          mentorId: mentorId!,
          slotId: formData.selectedSlot,
          message: formData.message,
        });
        
        setShowConfirmModal(false);
        navigate('/bookings', { 
          state: { message: 'Booking request sent successfully!' }
        });
      } catch (error) {
        console.error('Booking failed:', error);
      }
    },
  });

  const handleSlotSelect = (slot: any) => {
    setValue('selectedSlot', slot.id);
    setSelectedSlotDetails(slot);
  };

  const handleBookingConfirm = () => {
    if (!values.selectedSlot) return;
    setShowConfirmModal(true);
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateEndTime = (startTime: string, duration: number) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(start.getTime() + duration * 60000);
    return end.toTimeString().slice(0, 5);
  };

  if (mentorLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!mentor) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Mentor not found</h2>
          <Button onClick={() => navigate('/mentors')} className="mt-4">
            Back to Mentors
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Book a Session</h1>
          <p className="text-gray-600 mt-2">
            Schedule a learning session with {mentor.name}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mentor Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-4 mb-4">
                <img
                  className="h-16 w-16 rounded-xl object-cover"
                  src={mentor.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.name)}&background=3B82F6&color=fff`}
                  alt={mentor.name}
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{mentor.name}</h3>
                  <div className="flex items-center mt-1">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-sm ${
                          i < mentor.rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                    <span className="text-sm text-gray-600 ml-2">
                      {mentor.rating} ({mentor.totalSessions} sessions)
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign className="h-4 w-4 mr-2" />
                  ${mentor.hourlyRate}/hour
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  Online Session
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {mentor.skills.slice(0, 4).map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {skill}
                    </span>
                  ))}
                  {mentor.skills.length > 4 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      +{mentor.skills.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Select Date & Time</h2>

              {/* Date Picker */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Duration Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Duration
                </label>
                <select
                  {...getFieldProps('duration')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
                {errors.duration && (
                  <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
                )}
              </div>

              {/* Available Time Slots */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Time Slots
                </label>
                
                {availabilityLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : availability && availability.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availability.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => handleSlotSelect(slot)}
                        disabled={slot.isBooked}
                        className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                          values.selectedSlot === slot.id
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : slot.isBooked
                            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatTime(slot.startTime)} - {formatTime(calculateEndTime(slot.startTime, values.duration))}
                        </div>
                        {slot.isBooked && (
                          <div className="text-xs text-gray-400 mt-1">Booked</div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No available slots for this date
                  </div>
                )}
                
                {errors.selectedSlot && (
                  <p className="mt-2 text-sm text-red-600">{errors.selectedSlot}</p>
                )}
              </div>

              {/* Message */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message to Mentor (Optional)
                </label>
                <textarea
                  {...getFieldProps('message')}
                  rows={3}
                  placeholder="Let the mentor know what you'd like to learn or any specific topics you want to cover..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Book Button */}
              <Button
                onClick={handleBookingConfirm}
                disabled={!values.selectedSlot || bookingLoading}
                className="w-full"
              >
                {bookingLoading ? 'Sending Request...' : 'Send Booking Request'}
              </Button>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        <Modal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="Confirm Booking"
        >
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Booking Details</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Mentor:</span>
                  <span className="font-medium">{mentor.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span className="font-medium">
                    {new Date(selectedDate).toLocaleDateString()}
                  </span>
                </div>
                {selectedSlotDetails && (
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <span className="font-medium">
                      {formatTime(selectedSlotDetails.startTime)} - {formatTime(calculateEndTime(selectedSlotDetails.startTime, values.duration))}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-medium">{values.duration} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Cost:</span>
                  <span className="font-medium">
                    ${((mentor.hourlyRate * values.duration) / 60).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {values.message && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Your Message</h4>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  {values.message}
                </p>
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={bookingLoading}
                className="flex-1"
              >
                {bookingLoading ? 'Sending...' : 'Confirm Booking'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
};

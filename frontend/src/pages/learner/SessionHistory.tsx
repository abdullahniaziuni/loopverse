import React, { useState } from 'react';
import { Calendar, Clock, User, Star, MessageCircle, Download } from 'lucide-react';
import { Layout } from '../../components/layout';
import { Button, Modal, Textarea } from '../../components/ui';
import { generateMockSessions, formatDate, formatTime } from '../../utils';
import { useToast } from '../../hooks/useToast';
import { Session } from '../../types';

export const SessionHistory: React.FC = () => {
  const [feedbackSession, setFeedbackSession] = useState<Session | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  
  const { success: showSuccess } = useToast();
  
  const completedSessions = generateMockSessions().filter(session => 
    session.status === 'completed'
  );

  const handleLeaveFeedback = (session: Session) => {
    setFeedbackSession(session);
    setRating(session.feedback?.rating || 0);
    setComment(session.feedback?.comment || '');
  };

  const submitFeedback = async () => {
    if (rating === 0) {
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showSuccess('Feedback submitted successfully!');
      setFeedbackSession(null);
      setRating(0);
      setComment('');
    } catch (error) {
      // Error handling would go here
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const downloadNotes = (session: Session) => {
    // Mock download functionality
    showSuccess('Session notes downloaded successfully!');
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Session History</h1>
          <p className="text-gray-600 mt-2">
            Review your completed mentoring sessions and leave feedback.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">{completedSessions.length}</div>
            <div className="text-sm text-gray-600">Total Sessions</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">{completedSessions.length}</div>
            <div className="text-sm text-gray-600">Hours Learned</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">
              {completedSessions.filter(s => s.feedback).length}
            </div>
            <div className="text-sm text-gray-600">Feedback Given</div>
          </div>
        </div>

        {/* Sessions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            {completedSessions.length > 0 ? (
              <div className="space-y-6">
                {completedSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onLeaveFeedback={handleLeaveFeedback}
                    onDownloadNotes={downloadNotes}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No completed sessions yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Your completed mentoring sessions will appear here.
                </p>
                <Button>
                  <a href="/mentors">Book Your First Session</a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      <Modal
        isOpen={!!feedbackSession}
        onClose={() => setFeedbackSession(null)}
        title="Leave Feedback"
        size="md"
      >
        {feedbackSession && (
          <div>
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900">{feedbackSession.topic}</h4>
                <p className="text-sm text-gray-600">with {feedbackSession.mentorName}</p>
                <p className="text-sm text-gray-600">
                  {formatDate(feedbackSession.date)} at {formatTime(feedbackSession.startTime)}
                </p>
              </div>

              {/* Rating */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How would you rate this session?
                </label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`p-1 ${
                        star <= rating ? 'text-yellow-400' : 'text-gray-300'
                      } hover:text-yellow-400 transition-colors`}
                    >
                      <Star className="h-6 w-6 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div className="mb-4">
                <Textarea
                  label="Additional Comments (Optional)"
                  placeholder="Share your thoughts about the session..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setFeedbackSession(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={submitFeedback}
                isLoading={isSubmittingFeedback}
                disabled={rating === 0}
              >
                Submit Feedback
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

interface SessionCardProps {
  session: Session;
  onLeaveFeedback: (session: Session) => void;
  onDownloadNotes: (session: Session) => void;
}

const SessionCard: React.FC<SessionCardProps> = ({ 
  session, 
  onLeaveFeedback, 
  onDownloadNotes 
}) => {
  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {session.topic || 'Mentoring Session'}
            </h3>
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
              Completed
            </span>
          </div>
          
          <div className="flex items-center text-gray-600 mb-2">
            <User className="h-4 w-4 mr-2" />
            <span>with {session.mentorName}</span>
          </div>
          
          <div className="flex items-center text-gray-600 mb-2">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{formatDate(session.date)}</span>
          </div>
          
          <div className="flex items-center text-gray-600 mb-3">
            <Clock className="h-4 w-4 mr-2" />
            <span>{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
          </div>

          {/* AI Summary */}
          {session.aiSummary && (
            <div className="mb-3 p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-1">AI Session Summary</h4>
              <p className="text-sm text-blue-800">{session.aiSummary}</p>
            </div>
          )}

          {/* Existing Feedback */}
          {session.feedback && (
            <div className="mb-3 p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center mb-1">
                <span className="text-sm font-medium text-yellow-900 mr-2">Your Rating:</span>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < session.feedback!.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {session.feedback.comment && (
                <p className="text-sm text-yellow-800">"{session.feedback.comment}"</p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-2 ml-6">
          {!session.feedback && (
            <Button
              size="sm"
              onClick={() => onLeaveFeedback(session)}
              className="flex items-center"
            >
              <Star className="h-4 w-4 mr-2" />
              Leave Feedback
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Message Mentor
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownloadNotes(session)}
            className="flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Notes
          </Button>
        </div>
      </div>
    </div>
  );
};

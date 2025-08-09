import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, MessageCircle, FileText, Users, Clock, ArrowLeft } from 'lucide-react';
import { Layout } from '../components/layout';
import { Button, Modal } from '../components/ui';
import { VideoCallManager } from '../components/video';
import { MessageCenter } from '../components/messaging';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { apiService } from '../services/api';
import { SessionFeedback } from '../components/feedback';

interface SessionData {
  id: string;
  title: string;
  description: string;
  mentor: {
    id: string;
    name: string;
    profilePicture?: string;
  };
  learner: {
    id: string;
    name: string;
    profilePicture?: string;
  };
  startTime: string;
  endTime: string;
  status: string;
  meetingLink?: string;
}

export const SessionRoom: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();

  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'video' | 'chat' | 'notes'>('video');
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Fetch session data
  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) return;

      try {
        console.log('🎯 SessionRoom - Fetching session data:', sessionId);
        setIsLoading(true);

        // Fetch real session data from API
        const response = await apiService.getSessionById(sessionId);
        if (response.success && response.data) {
          const sessionData = response.data;
          const mockSession: SessionData = {
            id: sessionData.id || sessionData._id,
            title: sessionData.title || 'Session',
            description: sessionData.description || 'Learning session',
            mentor: {
              id: sessionData.mentorId?._id || sessionData.mentorId,
              name: sessionData.mentorId?.firstName && sessionData.mentorId?.lastName
                ? `${sessionData.mentorId.firstName} ${sessionData.mentorId.lastName}`
                : 'Mentor',
              profilePicture: sessionData.mentorId?.profilePicture || '/api/placeholder/40/40',
            },
            learner: {
              id: sessionData.learnerId?._id || sessionData.learnerId,
              name: sessionData.learnerId?.firstName && sessionData.learnerId?.lastName
                ? `${sessionData.learnerId.firstName} ${sessionData.learnerId.lastName}`
                : 'Learner',
              profilePicture: sessionData.learnerId?.profilePicture || '/api/placeholder/40/40',
            },
            startTime: sessionData.startTime,
            endTime: sessionData.endTime,
            status: sessionData.status || 'confirmed',
          };

        setSession(mockSession);
        console.log('✅ SessionRoom - Session data loaded:', mockSession);
      } catch (error) {
        console.error('💥 SessionRoom - Error fetching session:', error);
        showError('Failed to load session data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [sessionId, showError]);

  const handleEndSession = async () => {
    try {
      console.log('🏁 SessionRoom - Ending session:', sessionId);

      // Update session status to completed
      await updateSessionStatus('completed');

      showSuccess('Session ended successfully');
      setShowEndSessionModal(false);

      // Show feedback modal for learners
      if (user?.role === 'learner') {
        setShowFeedbackModal(true);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('💥 SessionRoom - Error ending session:', error);
      showError('Failed to end session');
    }
  };

  const handleFeedbackSubmitted = () => {
    setShowFeedbackModal(false);
    navigate('/dashboard');
  };

  const updateSessionStatus = async (status: string) => {
    if (!sessionId) return;

    try {
      const response = await apiService.updateSessionStatus(sessionId, status);
      if (response.success) {
        console.log(`✅ Session status updated to: ${status}`);
      } else {
        console.error('❌ Failed to update session status:', response.error);
      }
    } catch (error) {
      console.error('❌ Error updating session status:', error);
    }
  };

  const handleLeaveSession = () => {
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-4"></div>
            <div className="h-96 bg-gray-300 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!session || !user) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-500">Session not found or access denied.</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Go to Dashboard
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const isUserMentor = user.role === 'mentor';
  const otherParticipant = isUserMentor ? session.learner : session.mentor;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleLeaveSession}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Leave Session</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
                <p className="text-gray-600">{session.description}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img
                  src={otherParticipant.profilePicture || '/api/placeholder/32/32'}
                  alt={otherParticipant.name}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-medium text-gray-700">
                  {otherParticipant.name}
                </span>
              </div>
              
              {isUserMentor && (
                <Button
                  onClick={() => setShowEndSessionModal(true)}
                  variant="destructive"
                  size="sm"
                >
                  End Session
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('video')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'video'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Video className="h-4 w-4" />
                  <span>Video Call</span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('chat')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'chat'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>Chat</span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('notes')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'notes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Notes</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'video' && (
            <div className="h-96 p-6">
              <div className="bg-gray-100 rounded-lg h-full flex items-center justify-center">
                <div className="text-center">
                  <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Ready to start the video call?
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Click the button below to join the video session
                  </p>
                  <Button
                    onClick={() => {
                      updateSessionStatus('started');
                      window.open(`/video-call/${sessionId}`, '_blank');
                    }}
                    className="px-6 py-2"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Join Video Call
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'chat' && (
            <div className="p-6">
              <MessageCenter
                currentUserId={user.id}
                currentUserRole={user.role as 'mentor' | 'learner'}
                currentUserName={user.name}
              />
            </div>
          )}
          
          {activeTab === 'notes' && (
            <div className="p-6">
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Session Notes
                </h3>
                <p className="text-gray-600 mb-4">
                  Take notes during your session. They will be saved automatically.
                </p>
                <textarea
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Start typing your notes here..."
                />
              </div>
            </div>
          )}
        </div>

        {/* End Session Modal */}
        <Modal
          isOpen={showEndSessionModal}
          onClose={() => setShowEndSessionModal(false)}
          title="End Session"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to end this session? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowEndSessionModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleEndSession}
              >
                End Session
              </Button>
            </div>
          </div>
        </Modal>

        {/* Feedback Modal */}
        {session && (
          <SessionFeedback
            sessionId={sessionId!}
            mentorName={session.mentor.name}
            isOpen={showFeedbackModal}
            onClose={() => setShowFeedbackModal(false)}
            onSubmitted={handleFeedbackSubmitted}
          />
        )}
      </div>
    </Layout>
  );
};

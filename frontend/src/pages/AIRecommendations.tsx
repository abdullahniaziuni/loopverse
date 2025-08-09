import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Star, Clock, TrendingUp, Target, Users, Sparkles } from 'lucide-react';
import { Layout } from '../components/layout';
import { Button } from '../components/ui';
import { useAuthStore } from '../store';
import { aiService } from '../services/aiService';

interface AIRecommendation {
  id: string;
  type: 'mentor' | 'topic' | 'session';
  title: string;
  description: string;
  confidence: number;
  reasoning: string;
  data: any;
  isViewed: boolean;
}

export const AIRecommendations: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'mentors' | 'topics' | 'all'>('all');

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      // Generate AI recommendations based on user profile
      const userProfile = {
        skills: ['JavaScript', 'React', 'HTML', 'CSS'],
        goals: ['Learn React Hooks', 'Build Full-Stack Apps', 'Master State Management'],
        experience: 'intermediate',
        preferences: ['Hands-on learning', 'Project-based', 'Interactive sessions']
      };

      // Mock AI recommendations - in real app, this would come from backend
      const mockRecommendations: AIRecommendation[] = [
        {
          id: '1',
          type: 'mentor',
          title: 'Sarah Johnson - React Expert',
          description: 'Perfect match for your React learning goals with 8+ years experience',
          confidence: 0.95,
          reasoning: 'High skill alignment in React, JavaScript, and TypeScript. Excellent ratings for teaching React Hooks and state management.',
          data: {
            mentorId: '1',
            rating: 4.9,
            totalSessions: 150,
            hourlyRate: 75,
            skills: ['React', 'JavaScript', 'TypeScript', 'Node.js']
          },
          isViewed: false
        },
        {
          id: '2',
          type: 'topic',
          title: 'Advanced React Hooks',
          description: 'Master useEffect, useContext, and custom hooks',
          confidence: 0.88,
          reasoning: 'Based on your current React knowledge and learning goals, this topic will help you advance to the next level.',
          data: {
            difficulty: 'intermediate',
            estimatedTime: '4-6 hours',
            prerequisites: ['Basic React', 'JavaScript ES6'],
            outcomes: ['Custom hooks', 'Performance optimization', 'Advanced patterns']
          },
          isViewed: false
        },
        {
          id: '3',
          type: 'mentor',
          title: 'Mike Chen - Full-Stack Developer',
          description: 'Ideal for building complete applications from frontend to backend',
          confidence: 0.82,
          reasoning: 'Strong match for your full-stack development goals. Specializes in React + Node.js applications.',
          data: {
            mentorId: '2',
            rating: 4.8,
            totalSessions: 200,
            hourlyRate: 85,
            skills: ['React', 'Node.js', 'MongoDB', 'Express']
          },
          isViewed: false
        },
        {
          id: '4',
          type: 'topic',
          title: 'State Management with Redux Toolkit',
          description: 'Learn modern Redux patterns and best practices',
          confidence: 0.79,
          reasoning: 'Complements your React skills and addresses your state management learning goal.',
          data: {
            difficulty: 'intermediate',
            estimatedTime: '3-4 hours',
            prerequisites: ['React basics', 'JavaScript'],
            outcomes: ['Redux Toolkit', 'Async actions', 'State normalization']
          },
          isViewed: false
        },
        {
          id: '5',
          type: 'session',
          title: 'React Performance Optimization Workshop',
          description: 'Hands-on session to optimize React app performance',
          confidence: 0.85,
          reasoning: 'Perfect for your intermediate level and preference for hands-on learning.',
          data: {
            duration: 90,
            format: 'workshop',
            maxParticipants: 5,
            nextAvailable: '2024-01-15T14:00:00Z'
          },
          isViewed: false
        }
      ];

      setRecommendations(mockRecommendations);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRecommendations = recommendations.filter(rec => 
    activeTab === 'all' || rec.type === activeTab || (activeTab === 'mentors' && rec.type === 'mentor')
  );

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-100';
    if (confidence >= 0.8) return 'text-blue-600 bg-blue-100';
    if (confidence >= 0.7) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'mentor': return <Users className="h-5 w-5" />;
      case 'topic': return <Target className="h-5 w-5" />;
      case 'session': return <Clock className="h-5 w-5" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  const handleRecommendationClick = (recommendation: AIRecommendation) => {
    // Mark as viewed
    setRecommendations(prev => 
      prev.map(rec => 
        rec.id === recommendation.id ? { ...rec, isViewed: true } : rec
      )
    );

    // Navigate based on type
    switch (recommendation.type) {
      case 'mentor':
        navigate(`/mentors/${recommendation.data.mentorId}`);
        break;
      case 'topic':
        // Could navigate to a learning path or course page
        navigate('/mentors', { state: { searchTopic: recommendation.title } });
        break;
      case 'session':
        // Could navigate to session booking
        navigate('/mentors');
        break;
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">AI is analyzing your profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Recommendations</h1>
              <p className="text-gray-600">Personalized suggestions to accelerate your learning</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'all', label: 'All Recommendations' },
              { key: 'mentors', label: 'Mentors' },
              { key: 'topics', label: 'Topics' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8 border border-blue-200">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">AI Analysis</h3>
              <p className="text-blue-800 text-sm mb-3">
                Based on your profile, learning goals, and session history, I've identified {recommendations.length} personalized recommendations to help you achieve your objectives faster.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-center mb-1">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
                    <span className="font-medium text-gray-900">Skill Level</span>
                  </div>
                  <p className="text-gray-600">Intermediate React Developer</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-center mb-1">
                    <Target className="h-4 w-4 text-purple-600 mr-2" />
                    <span className="font-medium text-gray-900">Focus Areas</span>
                  </div>
                  <p className="text-gray-600">Hooks, State Management, Full-Stack</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-center mb-1">
                    <Clock className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="font-medium text-gray-900">Learning Style</span>
                  </div>
                  <p className="text-gray-600">Hands-on, Project-based</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-6">
          {filteredRecommendations.map((recommendation, index) => (
            <div
              key={recommendation.id}
              className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer ${
                !recommendation.isViewed ? 'ring-2 ring-blue-100' : ''
              }`}
              onClick={() => handleRecommendationClick(recommendation)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    {getTypeIcon(recommendation.type)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {recommendation.title}
                      </h3>
                      {!recommendation.isViewed && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mt-1">
                      {recommendation.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">#{index + 1}</div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${getConfidenceColor(recommendation.confidence)}`}>
                    {Math.round(recommendation.confidence * 100)}% match
                  </div>
                </div>
              </div>

              {/* AI Reasoning */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <Brain className="h-4 w-4 mr-2 text-blue-600" />
                  Why AI Recommends This
                </h4>
                <p className="text-gray-700 text-sm">{recommendation.reasoning}</p>
              </div>

              {/* Type-specific data */}
              {recommendation.type === 'mentor' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Rating:</span>
                    <div className="flex items-center mt-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="ml-1 font-medium">{recommendation.data.rating}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Sessions:</span>
                    <p className="font-medium">{recommendation.data.totalSessions}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Rate:</span>
                    <p className="font-medium">${recommendation.data.hourlyRate}/hr</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Skills:</span>
                    <p className="font-medium">{recommendation.data.skills.slice(0, 2).join(', ')}</p>
                  </div>
                </div>
              )}

              {recommendation.type === 'topic' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Difficulty:</span>
                    <p className="font-medium capitalize">{recommendation.data.difficulty}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Time:</span>
                    <p className="font-medium">{recommendation.data.estimatedTime}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Outcomes:</span>
                    <p className="font-medium">{recommendation.data.outcomes.length} skills</p>
                  </div>
                </div>
              )}

              {recommendation.type === 'session' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <p className="font-medium">{recommendation.data.duration} minutes</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Format:</span>
                    <p className="font-medium capitalize">{recommendation.data.format}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Max Participants:</span>
                    <p className="font-medium">{recommendation.data.maxParticipants}</p>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRecommendationClick(recommendation);
                  }}
                >
                  {recommendation.type === 'mentor' ? 'View Mentor Profile' : 
                   recommendation.type === 'topic' ? 'Find Mentors for This Topic' : 
                   'Book This Session'}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredRecommendations.length === 0 && (
          <div className="text-center py-12">
            <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations yet</h3>
            <p className="text-gray-600 mb-4">
              Complete more sessions to get personalized AI recommendations
            </p>
            <Button onClick={() => navigate('/mentors')}>
              Browse Mentors
            </Button>
          </div>
        )}

        {/* Refresh Button */}
        <div className="text-center mt-8">
          <Button
            variant="outline"
            onClick={fetchRecommendations}
            disabled={isLoading}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Refresh Recommendations
          </Button>
        </div>
      </div>
    </Layout>
  );
};

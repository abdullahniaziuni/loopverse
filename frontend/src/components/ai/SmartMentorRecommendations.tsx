import React, { useState, useEffect } from 'react';
import { Brain, Star, Users, Target, TrendingUp, Loader, Sparkles } from 'lucide-react';
import { Button } from '../ui';
import { aiService, MentorRecommendation } from '../../services/aiService';

interface Mentor {
  id: string;
  name: string;
  avatar?: string;
  skills: string[];
  experience: string;
  specialties: string[];
  rating: number;
  totalSessions: number;
  hourlyRate: number;
  bio: string;
}

interface SmartMentorRecommendationsProps {
  userProfile: {
    skills: string[];
    goals: string[];
    experience: string;
    preferences: string[];
  };
  availableMentors: Mentor[];
  onMentorSelect?: (mentorId: string) => void;
}

export const SmartMentorRecommendations: React.FC<SmartMentorRecommendationsProps> = ({
  userProfile,
  availableMentors,
  onMentorSelect
}) => {
  const [recommendations, setRecommendations] = useState<MentorRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);

  useEffect(() => {
    generateRecommendations();
  }, [userProfile, availableMentors]);

  const generateRecommendations = async () => {
    if (availableMentors.length === 0) return;
    
    setIsLoading(true);
    try {
      const aiRecommendations = await aiService.recommendMentors(
        userProfile,
        availableMentors.map(mentor => ({
          id: mentor.id,
          name: mentor.name,
          skills: mentor.skills,
          experience: mentor.experience,
          specialties: mentor.specialties,
          rating: mentor.rating
        }))
      );
      
      setRecommendations(aiRecommendations);
    } catch (error) {
      console.error('Failed to generate mentor recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMentorById = (id: string): Mentor | undefined => {
    return availableMentors.find(mentor => mentor.id === id);
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 75) return 'text-blue-600 bg-blue-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="h-8 w-8 text-white animate-pulse" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            AI is analyzing mentors for you...
          </h3>
          <p className="text-gray-600 mb-4">
            Finding the perfect matches based on your skills and goals
          </p>
          <Loader className="h-6 w-6 animate-spin mx-auto text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center">
              <Sparkles className="h-6 w-6 mr-2" />
              AI-Powered Mentor Recommendations
            </h2>
            <p className="text-purple-100">
              Personalized matches based on your skills, goals, and learning preferences
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowAIInsights(!showAIInsights)}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Brain className="h-4 w-4 mr-2" />
            {showAIInsights ? 'Hide' : 'Show'} AI Insights
          </Button>
        </div>
      </div>

      {/* AI Insights Panel */}
      {showAIInsights && (
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            How AI Selected These Mentors
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Target className="h-4 w-4 text-blue-600 mr-2" />
                <span className="font-medium text-gray-900">Skill Alignment</span>
              </div>
              <p className="text-gray-600">
                Matched mentors with expertise in your target skills: {userProfile.skills.join(', ')}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center mb-2">
                <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
                <span className="font-medium text-gray-900">Goal Compatibility</span>
              </div>
              <p className="text-gray-600">
                Prioritized mentors who can help achieve: {userProfile.goals.join(', ')}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Users className="h-4 w-4 text-purple-600 mr-2" />
                <span className="font-medium text-gray-900">Experience Match</span>
              </div>
              <p className="text-gray-600">
                Selected mentors suitable for {userProfile.experience} level learners
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="space-y-4">
        {recommendations.length === 0 ? (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations yet</h3>
            <p className="text-gray-600">
              Update your profile with skills and goals to get AI-powered mentor recommendations
            </p>
          </div>
        ) : (
          recommendations.map((recommendation, index) => {
            const mentor = getMentorById(recommendation.mentorId);
            if (!mentor) return null;

            return (
              <div
                key={recommendation.mentorId}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img
                        className="h-16 w-16 rounded-xl object-cover"
                        src={
                          mentor.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            mentor.name
                          )}&background=3B82F6&color=fff`
                        }
                        alt={mentor.name}
                      />
                      <div className="absolute -top-2 -right-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${getMatchScoreColor(recommendation.matchScore)}`}>
                          {recommendation.matchScore}% match
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{mentor.name}</h3>
                      <div className="flex items-center mt-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < mentor.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 ml-2">
                          {mentor.rating} ({mentor.totalSessions} sessions)
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mt-1">{mentor.experience} • ${mentor.hourlyRate}/hour</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">#{index + 1}</div>
                    <div className="text-sm text-gray-500">AI Pick</div>
                  </div>
                </div>

                {/* AI Reasoning */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Brain className="h-4 w-4 mr-2 text-blue-600" />
                    Why AI Recommends {mentor.name}
                  </h4>
                  <p className="text-gray-700 text-sm">{recommendation.reason}</p>
                </div>

                {/* Suggested Topics */}
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Suggested Discussion Topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {recommendation.suggestedTopics.map((topic, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Expertise</h4>
                  <div className="flex flex-wrap gap-2">
                    {mentor.skills.slice(0, 5).map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                      >
                        {skill}
                      </span>
                    ))}
                    {mentor.skills.length > 5 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                        +{mentor.skills.length - 5} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Action */}
                <div className="flex justify-end">
                  <Button
                    onClick={() => onMentorSelect?.(mentor.id)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Book Session with {mentor.name}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Refresh Button */}
      {recommendations.length > 0 && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={generateRecommendations}
            disabled={isLoading}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Get New AI Recommendations
          </Button>
        </div>
      )}
    </div>
  );
};

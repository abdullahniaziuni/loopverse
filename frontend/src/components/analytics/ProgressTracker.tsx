import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, Clock, Award, BookOpen, Users, Calendar, BarChart3 } from 'lucide-react';
import { Button } from '../ui';
import { apiService } from '../../services/api';
import { formatDate } from '../../utils';

interface ProgressData {
  totalSessions: number;
  totalHours: number;
  skillsLearned: string[];
  averageRating: number;
  completionRate: number;
  streakDays: number;
  monthlyProgress: Array<{
    month: string;
    sessions: number;
    hours: number;
  }>;
  skillProgress: Array<{
    skill: string;
    level: number;
    progress: number;
    sessionsCount: number;
  }>;
  recentAchievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    earnedAt: string;
  }>;
  upcomingSessions: Array<{
    id: string;
    mentorName: string;
    topic: string;
    date: string;
    time: string;
  }>;
}

interface ProgressTrackerProps {
  userId?: string;
  timeRange?: '7d' | '30d' | '90d' | '1y';
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  userId,
  timeRange = '30d'
}) => {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProgressData();
  }, [userId, selectedTimeRange]);

  const fetchProgressData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.getUserProgress(userId, selectedTimeRange);
      
      if (response.success && response.data) {
        setProgressData(response.data);
      } else {
        setError(response.error || 'Failed to load progress data');
      }
    } catch (err) {
      console.error('Error fetching progress data:', err);
      setError('Failed to load progress data');
    } finally {
      setIsLoading(false);
    }
  };

  const getSkillLevelColor = (level: number) => {
    if (level >= 80) return 'bg-green-500';
    if (level >= 60) return 'bg-blue-500';
    if (level >= 40) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getSkillLevelText = (level: number) => {
    if (level >= 80) return 'Expert';
    if (level >= 60) return 'Advanced';
    if (level >= 40) return 'Intermediate';
    return 'Beginner';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-6 bg-gray-300 rounded mb-4 w-1/3"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !progressData) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-red-600 mb-4">{error || 'No progress data available'}</p>
        <Button onClick={fetchProgressData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Learning Progress</h2>
        <div className="flex space-x-2">
          {[
            { value: '7d', label: '7 Days' },
            { value: '30d', label: '30 Days' },
            { value: '90d', label: '90 Days' },
            { value: '1y', label: '1 Year' },
          ].map((option) => (
            <Button
              key={option.value}
              variant={selectedTimeRange === option.value ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeRange(option.value as any)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{progressData.totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Learning Hours</p>
              <p className="text-2xl font-bold text-gray-900">{progressData.totalHours}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Skills Learned</p>
              <p className="text-2xl font-bold text-gray-900">{progressData.skillsLearned.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Streak Days</p>
              <p className="text-2xl font-bold text-gray-900">{progressData.streakDays}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Skills Progress */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Progress</h3>
        <div className="space-y-4">
          {progressData.skillProgress.map((skill, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{skill.skill}</span>
                  <span className="text-sm text-gray-500">
                    {getSkillLevelText(skill.level)} • {skill.sessionsCount} sessions
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getSkillLevelColor(skill.level)}`}
                    style={{ width: `${skill.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Progress Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Progress</h3>
        <div className="space-y-4">
          {progressData.monthlyProgress.map((month, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 text-blue-500 mr-3" />
                <span className="font-medium text-gray-900">{month.month}</span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{month.sessions} sessions</span>
                <span>{month.hours} hours</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Achievements */}
      {progressData.recentAchievements.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Achievements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {progressData.recentAchievements.map((achievement) => (
              <div key={achievement.id} className="flex items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <Award className="h-8 w-8 text-yellow-500 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">{achievement.title}</p>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(achievement.earnedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Sessions */}
      {progressData.upcomingSessions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Sessions</h3>
          <div className="space-y-3">
            {progressData.upcomingSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-blue-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">{session.topic}</p>
                    <p className="text-sm text-gray-600">with {session.mentorName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{session.date}</p>
                  <p className="text-sm text-gray-600">{session.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

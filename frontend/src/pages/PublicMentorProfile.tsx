import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Star, 
  Calendar, 
  Clock, 
  MapPin, 
  Globe, 
  Share2, 
  ExternalLink,
  Award,
  BookOpen,
  Users,
  MessageCircle
} from 'lucide-react';
import { Button } from '../components/ui';
import { useToast } from '../hooks/useToast';
import { apiService } from '../services/api';
import { formatDate } from '../utils';

interface PublicMentorData {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatar?: string;
  rating: number;
  totalSessions: number;
  totalStudents: number;
  skills: string[];
  languages: string[];
  timezone: string;
  hourlyRate?: number;
  experience: string;
  education: string[];
  certifications: string[];
  portfolio: Array<{
    title: string;
    description: string;
    url?: string;
    image?: string;
  }>;
  testimonials: Array<{
    id: string;
    studentName: string;
    rating: number;
    comment: string;
    date: string;
  }>;
  availability: Array<{
    day: string;
    slots: string[];
  }>;
}

export const PublicMentorProfile: React.FC = () => {
  const { mentorId } = useParams<{ mentorId: string }>();
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();

  const [mentor, setMentor] = useState<PublicMentorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMentorProfile = async () => {
      if (!mentorId) return;

      try {
        setIsLoading(true);
        const response = await apiService.getMentorProfile(mentorId);
        
        if (response.success && response.data) {
          setMentor(response.data);
        } else {
          setError(response.error || 'Mentor not found');
        }
      } catch (err) {
        console.error('Error fetching mentor profile:', err);
        setError('Failed to load mentor profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMentorProfile();
  }, [mentorId]);

  const shareProfile = async () => {
    const url = window.location.href;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${mentor?.name} - SkillSphere Mentor`,
          text: `Check out ${mentor?.name}'s mentor profile on SkillSphere`,
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        showSuccess('Profile link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing profile:', err);
      showError('Failed to share profile');
    }
  };

  const bookSession = () => {
    if (mentor) {
      navigate(`/mentors/${mentor.id}/book`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading mentor profile...</p>
        </div>
      </div>
    );
  }

  if (error || !mentor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Mentor Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The mentor profile you are looking for does not exist.'}</p>
          <Button onClick={() => navigate('/')}>
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/')}>
                ← Back to SkillSphere
              </Button>
            </div>
            <Button variant="outline" onClick={shareProfile} className="flex items-center">
              <Share2 className="h-4 w-4 mr-2" />
              Share Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {mentor.name.charAt(0)}
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{mentor.name}</h1>
              <p className="text-xl text-gray-600 mt-1">{mentor.title}</p>
              
              <div className="flex items-center space-x-4 mt-4">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="ml-1 font-medium">{mentor.rating}</span>
                  <span className="text-gray-500 ml-1">rating</span>
                </div>
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 text-gray-400" />
                  <span className="ml-1">{mentor.totalSessions} sessions</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-400" />
                  <span className="ml-1">{mentor.totalStudents} students</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-2">
              <Button onClick={bookSession} className="px-6 py-2">
                Book a Session
              </Button>
              <Button variant="outline" className="flex items-center">
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Button>
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
              <div className="flex flex-wrap gap-2">
                {mentor.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Portfolio */}
            {mentor.portfolio.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Portfolio</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mentor.portfolio.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                        >
                          View Project <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Testimonials */}
            {mentor.testimonials.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Student Testimonials</h2>
                <div className="space-y-4">
                  {mentor.testimonials.slice(0, 3).map((testimonial) => (
                    <div key={testimonial.id} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-center mb-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < testimonial.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">
                          by {testimonial.studentName}
                        </span>
                      </div>
                      <p className="text-gray-700 italic">"{testimonial.comment}"</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDate(testimonial.date)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Info</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">{mentor.timezone}</span>
                </div>
                <div className="flex items-center">
                  <Globe className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">
                    {mentor.languages.join(', ')}
                  </span>
                </div>
                {mentor.hourlyRate && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      ${mentor.hourlyRate}/hour
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Availability */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Availability</h3>
              <div className="space-y-2">
                {mentor.availability.map((day, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">{day.day}</span>
                    <span className="text-sm text-gray-600">
                      {day.slots.length > 0 ? `${day.slots.length} slots` : 'Not available'}
                    </span>
                  </div>
                ))}
              </div>
              <Button onClick={bookSession} className="w-full mt-4">
                View Available Times
              </Button>
            </div>

            {/* Powered by SkillSphere */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-6 text-white text-center">
              <h3 className="text-lg font-semibold mb-2">Powered by SkillSphere</h3>
              <p className="text-sm opacity-90 mb-4">
                Connect with expert mentors for personalized learning
              </p>
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                Join SkillSphere
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

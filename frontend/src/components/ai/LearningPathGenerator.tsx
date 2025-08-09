import React, { useState } from 'react';
import { Brain, Clock, Target, BookOpen, ChevronRight, Loader, Sparkles } from 'lucide-react';
import { Button, Input, Modal } from '../ui';
import { aiService, LearningPath } from '../../services/aiService';

interface LearningPathGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onPathGenerated?: (path: LearningPath) => void;
}

export const LearningPathGenerator: React.FC<LearningPathGeneratorProps> = ({
  isOpen,
  onClose,
  onPathGenerated
}) => {
  const [formData, setFormData] = useState({
    skills: '',
    goals: '',
    experience: 'beginner',
    timeCommitment: '1-2 hours per day'
  });
  const [generatedPath, setGeneratedPath] = useState<LearningPath | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState<'form' | 'result'>('form');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGeneratePath = async () => {
    if (!formData.skills.trim() || !formData.goals.trim()) {
      return;
    }

    setIsGenerating(true);
    
    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);
      const goalsArray = formData.goals.split(',').map(g => g.trim()).filter(g => g);
      
      const path = await aiService.generateLearningPath(
        skillsArray,
        goalsArray,
        formData.experience,
        formData.timeCommitment
      );

      if (path) {
        setGeneratedPath(path);
        setStep('result');
        onPathGenerated?.(path);
      }
    } catch (error) {
      console.error('Failed to generate learning path:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setStep('form');
    setGeneratedPath(null);
    setFormData({
      skills: '',
      goals: '',
      experience: 'beginner',
      timeCommitment: '1-2 hours per day'
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Learning Path Generator" size="lg">
      <div className="space-y-6">
        {step === 'form' && (
          <>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Create Your Personalized Learning Path
              </h3>
              <p className="text-gray-600">
                Let AI analyze your skills and goals to create a customized learning journey
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Skills
                </label>
                <Input
                  placeholder="e.g., JavaScript, React, HTML, CSS (separate with commas)"
                  value={formData.skills}
                  onChange={(e) => handleInputChange('skills', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  List your current technical skills separated by commas
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Learning Goals
                </label>
                <Input
                  placeholder="e.g., Build full-stack apps, Learn Node.js, Master React (separate with commas)"
                  value={formData.goals}
                  onChange={(e) => handleInputChange('goals', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  What do you want to achieve? List your goals separated by commas
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Experience Level
                </label>
                <select
                  value={formData.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="beginner">Beginner - Just starting out</option>
                  <option value="intermediate">Intermediate - Some experience</option>
                  <option value="advanced">Advanced - Experienced developer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Commitment
                </label>
                <select
                  value={formData.timeCommitment}
                  onChange={(e) => handleInputChange('timeCommitment', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="30 minutes per day">30 minutes per day</option>
                  <option value="1-2 hours per day">1-2 hours per day</option>
                  <option value="3-4 hours per day">3-4 hours per day</option>
                  <option value="5+ hours per day">5+ hours per day</option>
                  <option value="Weekends only">Weekends only</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleGeneratePath}
                disabled={!formData.skills.trim() || !formData.goals.trim() || isGenerating}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isGenerating ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Learning Path
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {step === 'result' && generatedPath && (
          <>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {generatedPath.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {generatedPath.description}
              </p>
              <div className="flex items-center justify-center space-x-4 text-sm">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(generatedPath.difficulty)}`}>
                  {generatedPath.difficulty}
                </span>
                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  {generatedPath.estimatedDuration}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Learning Steps
              </h4>
              
              {generatedPath.steps.map((step, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900 mb-1">{step.title}</h5>
                      <p className="text-gray-600 text-sm mb-2">{step.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          {step.estimatedTime}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {step.resources.map((resource, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                            >
                              {resource}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleReset}>
                Generate New Path
              </Button>
              <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
                Start Learning Journey
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

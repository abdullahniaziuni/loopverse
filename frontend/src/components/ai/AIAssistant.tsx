import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader, Lightbulb, MessageSquare, X } from 'lucide-react';
import { Button } from '../ui';
import { aiService } from '../../services/aiService';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  context?: {
    sessionTopic?: string;
    mentorExpertise?: string[];
    learnerGoals?: string[];
    userRole?: 'learner' | 'mentor';
  };
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ 
  isOpen, 
  onClose, 
  context 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Generate initial suggestions when opened
      generateInitialSuggestions();
      // Add welcome message
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: `Hi! I'm your AI assistant. I can help you with session planning, generate questions, provide learning insights, and more. How can I assist you today?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, context]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateInitialSuggestions = async () => {
    if (context?.sessionTopic && context?.mentorExpertise && context?.learnerGoals) {
      try {
        const conversationStarters = await aiService.generateConversationStarters(
          context.mentorExpertise,
          context.learnerGoals,
          context.sessionTopic
        );
        setSuggestions(conversationStarters.slice(0, 3));
      } catch (error) {
        console.error('Failed to generate suggestions:', error);
      }
    } else {
      // Default suggestions
      setSuggestions([
        "Help me prepare questions for this session",
        "Generate a learning plan for this topic",
        "What should I focus on during this session?"
      ]);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      let aiResponse = '';

      // Determine the type of request and route to appropriate AI service
      const lowerContent = content.toLowerCase();
      
      if (lowerContent.includes('question') || lowerContent.includes('ask')) {
        if (context?.sessionTopic) {
          const questions = await aiService.generateSmartQuestions(
            context.sessionTopic,
            context.userRole === 'learner' ? 'beginner' : 'intermediate',
            content
          );
          aiResponse = `Here are some thoughtful questions you could ask:\n\n${questions.map((q, i) => `${i + 1}. ${q}`).join('\n\n')}`;
        }
      } else if (lowerContent.includes('plan') || lowerContent.includes('study')) {
        if (context?.sessionTopic) {
          aiResponse = await aiService.generateStudyPlan(
            context.sessionTopic,
            '1 hour per day',
            'intermediate',
            'hands-on practice'
          );
        }
      } else if (lowerContent.includes('conversation') || lowerContent.includes('starter')) {
        if (context?.mentorExpertise && context?.learnerGoals && context?.sessionTopic) {
          const starters = await aiService.generateConversationStarters(
            context.mentorExpertise,
            context.learnerGoals,
            context.sessionTopic
          );
          aiResponse = `Here are some great conversation starters:\n\n${starters.map((s, i) => `${i + 1}. ${s}`).join('\n\n')}`;
        }
      } else {
        // General AI response
        const prompt = `
        You are an AI assistant helping with a mentoring session. 
        Context: ${context?.sessionTopic ? `Session topic: ${context.sessionTopic}` : 'General mentoring session'}
        User role: ${context?.userRole || 'learner'}
        
        User message: ${content}
        
        Provide a helpful, concise response that assists with their mentoring session.
        `;
        
        const response = await aiService['generateContent'](prompt);
        aiResponse = response.success ? response.data || 'I apologize, but I encountered an issue. Please try again.' : 'I apologize, but I encountered an issue. Please try again.';
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI Assistant Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
    setSuggestions([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
              <p className="text-sm text-gray-600">Your mentoring companion</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Loader className="h-4 w-4 animate-spin" />
                  <span className="text-sm">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-100">
            <div className="flex items-center space-x-2 mb-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">Suggestions:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your session..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isLoading}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { FileText, Download, Save, Sparkles, Clock, Users, MessageSquare, Target } from 'lucide-react';
import { Button } from '../ui';
import { aiService } from '../../services/aiService';

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  isOwn: boolean;
}

interface SessionNotesManagerProps {
  sessionData: {
    topic: string;
    duration: number;
    participants: Array<{ name: string; role: string }>;
  };
  chatMessages: ChatMessage[];
  onSaveNotes?: (notes: any) => void;
}

export const SessionNotesManager: React.FC<SessionNotesManagerProps> = ({
  sessionData,
  chatMessages,
  onSaveNotes
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionNotes, setSessionNotes] = useState<any>(null);
  const [chatSummary, setChatSummary] = useState<any>(null);
  const [importantMessages, setImportantMessages] = useState<any[]>([]);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Auto-generate notes when session ends or periodically
  useEffect(() => {
    if (autoSaveEnabled && chatMessages.length > 5) {
      const interval = setInterval(() => {
        generateLiveInsights();
      }, 60000); // Every minute

      return () => clearInterval(interval);
    }
  }, [chatMessages, autoSaveEnabled]);

  const generateLiveInsights = async () => {
    if (chatMessages.length === 0) return;

    try {
      // Identify important messages in real-time
      const important = await aiService.identifyImportantMessages(
        chatMessages.map(msg => ({
          sender: msg.sender,
          content: msg.content,
          timestamp: msg.timestamp
        }))
      );
      setImportantMessages(important);

      // Generate chat summary
      const summary = await aiService.summarizeChatMessages(
        chatMessages.map(msg => ({
          sender: msg.sender,
          content: msg.content,
          timestamp: msg.timestamp
        })),
        sessionData.topic
      );
      setChatSummary(summary);
    } catch (error) {
      console.error('Failed to generate live insights:', error);
    }
  };

  const generateFullSessionNotes = async () => {
    setIsGenerating(true);
    
    try {
      const notes = await aiService.generateSessionNotes({
        topic: sessionData.topic,
        duration: sessionData.duration,
        participants: sessionData.participants,
        chatMessages: chatMessages.map(msg => ({
          sender: msg.sender,
          content: msg.content,
          timestamp: msg.timestamp
        })),
        keyDiscussions: chatSummary?.keyPoints || [],
        learnerQuestions: chatSummary?.importantQuestions || []
      });

      setSessionNotes(notes);
      onSaveNotes?.(notes);
    } catch (error) {
      console.error('Failed to generate session notes:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadNotes = () => {
    if (!sessionNotes) return;

    const notesContent = `
# Session Notes: ${sessionData.topic}

**Date:** ${new Date().toLocaleDateString()}
**Duration:** ${sessionData.duration} minutes
**Participants:** ${sessionData.participants.map(p => `${p.name} (${p.role})`).join(', ')}

## Session Summary
${sessionNotes.sessionSummary}

## Learning Objectives
${sessionNotes.learningObjectives.map((obj: string) => `• ${obj}`).join('\n')}

## Key Takeaways
${sessionNotes.keyTakeaways.map((takeaway: string) => `• ${takeaway}`).join('\n')}

## Next Steps
${sessionNotes.nextSteps.map((step: string) => `• ${step}`).join('\n')}

## Mentor Insights
${sessionNotes.mentorInsights.map((insight: string) => `• ${insight}`).join('\n')}

## Recommended Follow-up
${sessionNotes.recommendedFollowUp.map((followup: string) => `• ${followup}`).join('\n')}

## Important Chat Messages
${importantMessages.map(msg => `**${msg.sender}:** ${msg.message} _(${msg.category})_`).join('\n\n')}
    `;

    const blob = new Blob([notesContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-notes-${sessionData.topic.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'question': return '❓';
      case 'answer': return '💡';
      case 'insight': return '🎯';
      case 'resource': return '📚';
      case 'action': return '✅';
      default: return '💬';
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Session Notes</h3>
            <p className="text-sm text-gray-600">Automatically generated insights and summaries</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoSaveEnabled}
              onChange={(e) => setAutoSaveEnabled(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Auto-save</span>
          </label>
          
          <Button
            onClick={generateFullSessionNotes}
            disabled={isGenerating || chatMessages.length === 0}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isGenerating ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Notes
              </>
            )}
          </Button>
          
          {sessionNotes && (
            <Button variant="outline" onClick={downloadNotes}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          )}
        </div>
      </div>

      {/* Live Chat Summary */}
      {chatSummary && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
            <MessageSquare className="h-4 w-4 mr-2" />
            Live Chat Summary
          </h4>
          <p className="text-blue-800 text-sm mb-3">{chatSummary.summary}</p>
          
          {chatSummary.keyPoints.length > 0 && (
            <div className="mb-2">
              <span className="text-xs font-medium text-blue-700">Key Points:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {chatSummary.keyPoints.map((point: string, index: number) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    {point}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Important Messages */}
      {importantMessages.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Target className="h-4 w-4 mr-2" />
            Important Messages ({importantMessages.length})
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {importantMessages.slice(0, 10).map((msg, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getImportanceColor(msg.importance)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs">{getCategoryIcon(msg.category)}</span>
                      <span className="font-medium text-sm">{msg.sender}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getImportanceColor(msg.importance)}`}>
                        {msg.importance}
                      </span>
                    </div>
                    <p className="text-sm mb-1">{msg.message}</p>
                    <p className="text-xs opacity-75">{msg.reason}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Session Notes */}
      {sessionNotes && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Complete Session Notes
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h5 className="font-medium text-gray-900 mb-2">Learning Objectives</h5>
              <ul className="text-sm text-gray-700 space-y-1">
                {sessionNotes.learningObjectives.map((obj: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    {obj}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h5 className="font-medium text-gray-900 mb-2">Next Steps</h5>
              <ul className="text-sm text-gray-700 space-y-1">
                {sessionNotes.nextSteps.map((step: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg">
            <h5 className="font-medium text-purple-900 mb-2">Key Takeaways</h5>
            <ul className="text-sm text-purple-800 space-y-1">
              {sessionNotes.keyTakeaways.map((takeaway: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  {takeaway}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Session Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {sessionData.duration} min
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {sessionData.participants.length} participants
            </div>
            <div className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-1" />
              {chatMessages.length} messages
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

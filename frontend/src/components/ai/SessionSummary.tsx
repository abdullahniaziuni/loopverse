import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Share,
  Clock,
  Users,
  Target,
  CheckCircle,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "../ui";
import { useToast } from "../../hooks/useToast";
import { aiService } from "../../services/aiService";

interface SessionSummaryProps {
  sessionId: string;
  sessionData?: {
    title: string;
    duration: number;
    participants: Array<{ name: string; role: string }>;
    topic?: string;
  };
  chatMessages?: Array<{ sender: string; content: string; timestamp: Date }>;
  onClose?: () => void;
}

interface SummaryData {
  id: string;
  sessionId: string;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  nextSteps: string[];
  skillsCovered: string[];
  duration: number;
  createdAt: string;
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({
  sessionId,
  sessionData,
  chatMessages = [],
  onClose,
}) => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { showSuccess, showError } = useToast();

  // Auto-generate summary when component loads
  useEffect(() => {
    if (sessionData && chatMessages.length > 0) {
      generateSummary();
    }
  }, [sessionId, sessionData, chatMessages]);

  // Generate new summary
  const generateSummary = async () => {
    if (!sessionData) return;

    try {
      setIsGenerating(true);
      setError(null);

      const aiResponse = await aiService.generateSessionNotes({
        topic: sessionData.topic || sessionData.title,
        duration: sessionData.duration,
        participants: sessionData.participants,
        chatMessages: chatMessages,
        keyDiscussions: [],
        learnerQuestions: [],
      });

      if (aiResponse) {
        const summaryData: SummaryData = {
          id: `summary_${sessionId}_${Date.now()}`,
          sessionId,
          summary: aiResponse.sessionSummary,
          keyPoints: aiResponse.keyTakeaways,
          actionItems: aiResponse.nextSteps,
          nextSteps: aiResponse.recommendedFollowUp,
          skillsCovered: aiResponse.learningObjectives,
          duration: sessionData.duration,
          createdAt: new Date().toISOString(),
        };

        setSummary(summaryData);
        showSuccess("Session summary generated successfully!");
      } else {
        setError("Failed to generate summary");
        showError("Failed to generate session summary");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate summary";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  // Download summary as PDF
  const downloadSummary = async () => {
    if (!summary) return;

    try {
      // Create a simple text version for download
      const content = `
SESSION SUMMARY
===============

Session: ${sessionData?.title || "Learning Session"}
Duration: ${sessionData?.duration || 0} minutes
Date: ${new Date(summary.createdAt).toLocaleDateString()}

OVERVIEW
--------
${summary.summary}

KEY POINTS
----------
${summary.keyPoints.map((point) => `• ${point}`).join("\n")}

ACTION ITEMS
------------
${summary.actionItems.map((item) => `• ${item}`).join("\n")}

NEXT STEPS
----------
${summary.nextSteps.map((step) => `• ${step}`).join("\n")}

SKILLS COVERED
--------------
${summary.skillsCovered.map((skill) => `• ${skill}`).join("\n")}
      `;

      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `session-summary-${sessionId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showSuccess("Summary downloaded successfully!");
    } catch (err) {
      showError("Failed to download summary");
    }
  };

  // Share summary
  const shareSummary = async () => {
    if (!summary) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Session Summary - ${
            sessionData?.title || "Learning Session"
          }`,
          text: summary.summary,
          url: window.location.href,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(summary.summary);
        showSuccess("Summary copied to clipboard!");
      }
    } catch (err) {
      showError("Failed to share summary");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Session Summary
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            {summary && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadSummary}
                  className="flex items-center"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={shareSummary}
                  className="flex items-center"
                >
                  <Share className="h-4 w-4 mr-1" />
                  Share
                </Button>
              </>
            )}
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {!summary && !error && (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              No Summary Available
            </h4>
            <p className="text-gray-600 mb-4">
              Generate an AI-powered summary of this session to capture key
              insights and action items.
            </p>
            <Button
              onClick={generateSummary}
              disabled={isGenerating}
              className="px-6 py-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Summary
                </>
              )}
            </Button>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">Failed to generate summary</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={generateSummary} disabled={isGenerating}>
              Try Again
            </Button>
          </div>
        )}

        {summary && (
          <div className="space-y-6">
            {/* Session Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-600">Duration:</span>
                  <span className="ml-1 font-medium">
                    {sessionData?.duration || 0} min
                  </span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-600">Participants:</span>
                  <span className="ml-1 font-medium">
                    {sessionData?.participants?.length || 2}
                  </span>
                </div>
                <div className="flex items-center">
                  <Target className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-600">Topic:</span>
                  <span className="ml-1 font-medium">
                    {sessionData?.topic || "General"}
                  </span>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">
                Overview
              </h4>
              <p className="text-gray-700 leading-relaxed">{summary.summary}</p>
            </div>

            {/* Key Points */}
            {summary.keyPoints.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">
                  Key Points
                </h4>
                <ul className="space-y-2">
                  {summary.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Items */}
            {summary.actionItems.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">
                  Action Items
                </h4>
                <ul className="space-y-2">
                  {summary.actionItems.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-4 h-4 border-2 border-blue-500 rounded mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Steps */}
            {summary.nextSteps.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">
                  Recommended Next Steps
                </h4>
                <ul className="space-y-2">
                  {summary.nextSteps.map((step, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-4 h-4 bg-blue-500 rounded-full mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skills Covered */}
            {summary.skillsCovered.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">
                  Skills Covered
                </h4>
                <div className="flex flex-wrap gap-2">
                  {summary.skillsCovered.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Regenerate Button */}
            <div className="pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={generateSummary}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Regenerate Summary
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

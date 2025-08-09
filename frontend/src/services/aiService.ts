import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error(
    "Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file."
  );
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Get the generative model
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface AIResponse {
  success: boolean;
  data?: string;
  error?: string;
}

export interface MentorRecommendation {
  mentorId: string;
  reason: string;
  matchScore: number;
  suggestedTopics: string[];
}

export interface LearningPath {
  title: string;
  description: string;
  steps: Array<{
    step: number;
    title: string;
    description: string;
    estimatedTime: string;
    resources: string[];
  }>;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedDuration: string;
}

export interface SessionSummary {
  keyTopics: string[];
  learningOutcomes: string[];
  nextSteps: string[];
  mentorFeedback: string;
  improvementAreas: string[];
}

class AIService {
  private async generateContent(prompt: string): Promise<AIResponse> {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        data: text,
      };
    } catch (error) {
      console.error("AI Service Error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Generate personalized learning path
  async generateLearningPath(
    userSkills: string[],
    goals: string[],
    experience: string,
    timeCommitment: string
  ): Promise<LearningPath | null> {
    const prompt = `
    Create a personalized learning path for a ${experience} level learner with the following details:
    
    Current Skills: ${userSkills.join(", ")}
    Learning Goals: ${goals.join(", ")}
    Time Commitment: ${timeCommitment}
    
    Please provide a structured learning path in JSON format with:
    - title: A compelling title for the learning path
    - description: Brief overview of what they'll achieve
    - steps: Array of learning steps (max 8 steps) with:
      - step: number
      - title: step title
      - description: what they'll learn
      - estimatedTime: time needed
      - resources: suggested resource types
    - difficulty: beginner/intermediate/advanced
    - estimatedDuration: total time needed
    
    Focus on practical, actionable steps that build upon each other.
    `;

    const response = await this.generateContent(prompt);

    if (response.success && response.data) {
      try {
        // Extract JSON from the response
        const jsonMatch = response.data.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (error) {
        console.error("Failed to parse learning path JSON:", error);
      }
    }

    return null;
  }

  // Generate mentor recommendations
  async recommendMentors(
    userProfile: {
      skills: string[];
      goals: string[];
      experience: string;
      preferences: string[];
    },
    availableMentors: Array<{
      id: string;
      name: string;
      skills: string[];
      experience: string;
      specialties: string[];
      rating: number;
    }>
  ): Promise<MentorRecommendation[]> {
    const prompt = `
    Based on the learner profile and available mentors, recommend the top 3 mentors with explanations:
    
    Learner Profile:
    - Skills: ${userProfile.skills.join(", ")}
    - Goals: ${userProfile.goals.join(", ")}
    - Experience: ${userProfile.experience}
    - Preferences: ${userProfile.preferences.join(", ")}
    
    Available Mentors:
    ${availableMentors
      .map(
        (mentor) => `
    - ${mentor.name} (ID: ${mentor.id})
      Skills: ${mentor.skills.join(", ")}
      Specialties: ${mentor.specialties.join(", ")}
      Experience: ${mentor.experience}
      Rating: ${mentor.rating}/5
    `
      )
      .join("\n")}
    
    Provide recommendations in JSON format as an array with:
    - mentorId: mentor ID
    - reason: why this mentor is recommended
    - matchScore: score from 1-100
    - suggestedTopics: array of topics to discuss
    
    Consider skill alignment, experience level compatibility, and learning goals.
    `;

    const response = await this.generateContent(prompt);

    if (response.success && response.data) {
      try {
        const jsonMatch = response.data.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (error) {
        console.error("Failed to parse mentor recommendations JSON:", error);
      }
    }

    return [];
  }

  // Generate session summary and insights
  async generateSessionSummary(sessionData: {
    topic: string;
    duration: number;
    mentorNotes: string;
    learnerQuestions: string[];
    discussedTopics: string[];
  }): Promise<SessionSummary | null> {
    const prompt = `
    Generate a comprehensive session summary based on the following mentoring session:
    
    Topic: ${sessionData.topic}
    Duration: ${sessionData.duration} minutes
    Mentor Notes: ${sessionData.mentorNotes}
    Learner Questions: ${sessionData.learnerQuestions.join(", ")}
    Topics Discussed: ${sessionData.discussedTopics.join(", ")}
    
    Provide a summary in JSON format with:
    - keyTopics: array of main topics covered
    - learningOutcomes: what the learner achieved
    - nextSteps: recommended actions for the learner
    - mentorFeedback: synthesized feedback from mentor
    - improvementAreas: areas for the learner to focus on
    
    Make it actionable and encouraging.
    `;

    const response = await this.generateContent(prompt);

    if (response.success && response.data) {
      try {
        const jsonMatch = response.data.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (error) {
        console.error("Failed to parse session summary JSON:", error);
      }
    }

    return null;
  }

  // Generate smart questions for learners
  async generateSmartQuestions(
    topic: string,
    learnerLevel: string,
    context?: string
  ): Promise<string[]> {
    const prompt = `
    Generate 5 thoughtful questions that a ${learnerLevel} level learner should ask about ${topic}.
    ${context ? `Context: ${context}` : ""}
    
    Questions should be:
    - Specific and actionable
    - Appropriate for the learner's level
    - Designed to deepen understanding
    - Practical and applicable
    
    Return as a JSON array of strings.
    `;

    const response = await this.generateContent(prompt);

    if (response.success && response.data) {
      try {
        const jsonMatch = response.data.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (error) {
        console.error("Failed to parse questions JSON:", error);
      }
    }

    return [];
  }

  // Generate conversation starters for video calls
  async generateConversationStarters(
    mentorExpertise: string[],
    learnerGoals: string[],
    sessionTopic: string
  ): Promise<string[]> {
    const prompt = `
    Generate 5 engaging conversation starters for a mentoring session:
    
    Mentor Expertise: ${mentorExpertise.join(", ")}
    Learner Goals: ${learnerGoals.join(", ")}
    Session Topic: ${sessionTopic}
    
    Conversation starters should:
    - Break the ice naturally
    - Lead to productive discussions
    - Be relevant to both parties
    - Encourage knowledge sharing
    
    Return as a JSON array of strings.
    `;

    const response = await this.generateContent(prompt);

    if (response.success && response.data) {
      try {
        const jsonMatch = response.data.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (error) {
        console.error("Failed to parse conversation starters JSON:", error);
      }
    }

    return [];
  }

  // Analyze feedback sentiment and generate insights
  async analyzeFeedback(feedback: string): Promise<{
    sentiment: "positive" | "negative" | "neutral";
    keyInsights: string[];
    actionableItems: string[];
    score: number;
  } | null> {
    const prompt = `
    Analyze the following feedback and provide insights:
    
    Feedback: "${feedback}"
    
    Provide analysis in JSON format with:
    - sentiment: positive/negative/neutral
    - keyInsights: array of key insights from the feedback
    - actionableItems: specific actions that can be taken
    - score: numerical score from 1-10 representing overall satisfaction
    
    Focus on constructive analysis and actionable recommendations.
    `;

    const response = await this.generateContent(prompt);

    if (response.success && response.data) {
      try {
        const jsonMatch = response.data.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (error) {
        console.error("Failed to parse feedback analysis JSON:", error);
      }
    }

    return null;
  }

  // Generate personalized study plan
  async generateStudyPlan(
    topic: string,
    timeAvailable: string,
    currentLevel: string,
    preferredLearningStyle: string
  ): Promise<string> {
    const prompt = `
    Create a personalized study plan for learning ${topic}:
    
    Available Time: ${timeAvailable}
    Current Level: ${currentLevel}
    Learning Style: ${preferredLearningStyle}
    
    Provide a detailed, actionable study plan that includes:
    - Daily/weekly schedule
    - Specific learning activities
    - Practice exercises
    - Progress milestones
    - Resource recommendations
    
    Make it practical and achievable.
    `;

    const response = await this.generateContent(prompt);
    return response.success ? response.data || "" : "";
  }

  // Generate skill assessment questions
  async generateSkillAssessment(
    skill: string,
    difficulty: string
  ): Promise<
    Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }>
  > {
    const prompt = `
    Generate 5 ${difficulty} level assessment questions for ${skill}:
    
    Each question should have:
    - A clear, specific question
    - 4 multiple choice options
    - The correct answer index (0-3)
    - An explanation of why the answer is correct
    
    Return as JSON array with objects containing: question, options, correctAnswer, explanation
    `;

    const response = await this.generateContent(prompt);

    if (response.success && response.data) {
      try {
        const jsonMatch = response.data.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (error) {
        console.error("Failed to parse skill assessment JSON:", error);
      }
    }

    return [];
  }
}

export const aiService = new AIService();

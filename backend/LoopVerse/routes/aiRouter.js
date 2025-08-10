const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const auth = require("../middleware/auth");
const Session = require("../Models/session");
const Learner = require("../Models/learner");
const Mentor = require("../Models/mentor");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * AI Integration Routes
 * Handles AI-powered features like recommendations and summaries
 */

/**
 * @route POST /api/ai/sessions/:sessionId/summary
 * @desc Generate AI summary for a completed session
 * @access Private
 */
router.post("/sessions/:sessionId/summary", auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { notes, topics, duration } = req.body;

    // Get session details
    const session = await Session.findById(sessionId)
      .populate("mentorId", "firstName lastName skills")
      .populate("learnerId", "firstName lastName interests");

    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Session not found",
      });
    }

    // Verify user has access to this session
    if (
      session.mentorId._id.toString() !== req.user.id &&
      session.learnerId._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    // Generate AI summary
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
    Generate a concise session summary for a mentoring session with the following details:
    
    Session Title: ${session.title}
    Duration: ${session.duration} minutes
    Mentor: ${session.mentorId.firstName} ${session.mentorId.lastName}
    Learner: ${session.learnerId.firstName} ${session.learnerId.lastName}
    Topics Covered: ${topics || "General mentoring"}
    Session Notes: ${notes || "No specific notes provided"}
    
    Please provide:
    1. A brief summary of what was covered
    2. Key learning outcomes
    3. Suggested next steps for the learner
    4. Recommended follow-up topics
    
    Keep the response professional and constructive.
    `;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    res.json({
      success: true,
      data: { summary },
      message: "Session summary generated successfully",
    });
  } catch (error) {
    console.error("AI summary error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate session summary",
    });
  }
});

/**
 * @route POST /api/ai/recommendations
 * @desc Get AI-powered recommendations for mentors or topics
 * @access Private
 */
router.post("/recommendations", auth, async (req, res) => {
  try {
    const { type } = req.body; // 'mentors' or 'topics'

    // Get user profile
    let user;
    if (req.user.userType === "learner") {
      user = await Learner.findById(req.user.id);
    } else {
      return res.status(403).json({
        success: false,
        error: "Only learners can get recommendations",
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    let prompt;
    if (type === "mentors") {
      // Get available mentors
      const mentors = await Mentor.find({ isVerified: true, isActive: true })
        .select("firstName lastName skills expertise ratings biography")
        .limit(20);

      prompt = `
      Based on the learner's profile, recommend the top 5 mentors from the following list:
      
      Learner Profile:
      - Interests: ${user.interests.join(", ")}
      - Goals: ${user.goals.map((g) => g.description).join(", ")}
      
      Available Mentors:
      ${mentors
        .map(
          (m) => `
      - ${m.firstName}${m.lastName ? " " + m.lastName : ""}
        Skills: ${m.skills.map((s) => s.name).join(", ")}
        Expertise: ${m.expertise.join(", ")}
        Rating: ${m.ratings.averageRating}/5
        Bio: ${m.biography}
      `
        )
        .join("\n")}
      
      Please recommend mentors that best match the learner's interests and goals.
      Return only the mentor names and brief reasons for recommendation.
      `;
    } else if (type === "topics") {
      prompt = `
      Based on the learner's profile, suggest 5 relevant learning topics:
      
      Learner Profile:
      - Interests: ${user.interests.join(", ")}
      - Goals: ${user.goals.map((g) => g.description).join(", ")}
      
      Please suggest specific, actionable learning topics that would help achieve their goals.
      Format as a simple list with brief explanations.
      `;
    }

    const result = await model.generateContent(prompt);
    const recommendations = result.response.text();

    res.json({
      success: true,
      data: { recommendations, type },
      message: "Recommendations generated successfully",
    });
  } catch (error) {
    console.error("AI recommendations error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate recommendations",
    });
  }
});

/**
 * @route POST /api/ai/learning-path
 * @desc Generate personalized learning path
 * @access Private
 */
router.post("/learning-path", auth, async (req, res) => {
  try {
    const { goals, currentSkills, timeCommitment } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
    Create a personalized learning path based on:
    
    Goals: ${goals}
    Current Skills: ${currentSkills}
    Time Commitment: ${timeCommitment} hours per week
    
    Please provide:
    1. A structured learning path with milestones
    2. Recommended sequence of topics
    3. Estimated timeline
    4. Skills to focus on first
    
    Format as a clear, actionable plan.
    `;

    const result = await model.generateContent(prompt);
    const learningPath = result.response.text();

    res.json({
      success: true,
      data: { learningPath },
      message: "Learning path generated successfully",
    });
  } catch (error) {
    console.error("AI learning path error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate learning path",
    });
  }
});

/**
 * @route POST /api/ai/mentor-match
 * @desc Find best mentor matches using AI
 * @access Private
 */
router.post("/mentor-match", auth, async (req, res) => {
  try {
    const { requirements, preferences } = req.body;

    // Get available mentors
    const mentors = await Mentor.find({ isVerified: true, isActive: true })
      .select(
        "firstName lastName skills expertise ratings biography hourlyRate"
      )
      .limit(50);

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
    Find the best mentor matches based on:
    
    Requirements: ${requirements}
    Preferences: ${preferences}
    
    Available Mentors:
    ${mentors
      .map(
        (m) => `
    - ${m.firstName}${m.lastName ? " " + m.lastName : ""}
      Skills: ${m.skills.map((s) => s.name).join(", ")}
      Expertise: ${m.expertise.join(", ")}
      Rating: ${m.ratings.averageRating}/5
      Rate: $${m.hourlyRate}/hour
      Bio: ${m.biography}
    `
      )
      .join("\n")}
    
    Rank the top 3 mentors and explain why they're good matches.
    `;

    const result = await model.generateContent(prompt);
    const matches = result.response.text();

    res.json({
      success: true,
      data: { matches },
      message: "Mentor matches generated successfully",
    });
  } catch (error) {
    console.error("AI mentor match error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate mentor matches",
    });
  }
});

module.exports = router;

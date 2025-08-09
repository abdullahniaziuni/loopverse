const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auth = require("../middleware/auth");
const Session = require("../Models/session");
const Mentor = require("../Models/mentor");
const Learner = require("../Models/learner");

/**
 * Booking Routes
 * Handles session booking requests and responses
 */

/**
 * @route POST /api/bookings
 * @desc Create a new booking request
 * @access Private (Learner)
 */
router.post(
  "/",
  [
    auth,
    check("mentorId", "Mentor ID is required").notEmpty(),
    check("startTime", "Start time is required").isISO8601(),
    check("duration", "Duration is required").isNumeric(),
    check("title", "Session title is required").notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          errors: errors.array(),
        });
      }

      const { mentorId, startTime, duration, title, description, message } =
        req.body;

      console.log("📅 Booking creation request:", {
        mentorId,
        startTime,
        duration,
        title,
        learnerId: req.user.id,
      });

      // Verify mentor exists and is verified
      const mentor = await Mentor.findById(mentorId);
      if (!mentor || !mentor.isVerified || !mentor.isActive) {
        return res.status(404).json({
          success: false,
          error: "Mentor not found or not available",
        });
      }

      // Calculate end time
      const startDate = new Date(startTime);
      const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

      console.log("⏰ Time calculation:", {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        duration: duration,
      });

      // Check for conflicts
      const conflictingSession = await Session.findOne({
        mentorId: mentorId,
        $or: [
          {
            startTime: { $lt: endDate },
            endTime: { $gt: startDate },
          },
        ],
        status: { $in: ["pending", "confirmed"] },
      });

      console.log("🔍 Conflict check:", {
        mentorId,
        searchCriteria: {
          startTime: { $lt: endDate },
          endTime: { $gt: startDate },
        },
        conflictFound: !!conflictingSession,
      });

      if (conflictingSession) {
        console.log("❌ Conflicting session found:", {
          id: conflictingSession._id,
          startTime: conflictingSession.startTime,
          endTime: conflictingSession.endTime,
          status: conflictingSession.status,
        });

        return res.status(409).json({
          success: false,
          error: "Time slot is not available",
          conflictingSession: {
            startTime: conflictingSession.startTime,
            endTime: conflictingSession.endTime,
            status: conflictingSession.status,
          },
        });
      }

      // Create session as pending
      const session = new Session({
        title,
        description,
        mentorId,
        learnerId: req.user.id,
        startTime: startDate,
        endTime: endDate,
        duration,
        status: "pending",
        price: mentor.hourlyRate * (duration / 60),
        mentorTimeZone: mentor.timezone,
        learnerTimeZone: req.body.timezone || "UTC",
      });

      await session.save();

      // Populate session data for response
      await session.populate([
        { path: "mentorId", select: "firstName lastName profilePicture" },
        { path: "learnerId", select: "firstName lastName profilePicture" },
      ]);

      res.status(201).json({
        success: true,
        data: {
          id: session._id,
          title: session.title,
          description: session.description,
          mentor: {
            id: session.mentorId._id,
            name: `${session.mentorId.firstName} ${session.mentorId.lastName}`,
            profilePicture: session.mentorId.profilePicture,
          },
          learner: {
            id: session.learnerId._id,
            name: `${session.learnerId.firstName} ${session.learnerId.lastName}`,
            profilePicture: session.learnerId.profilePicture,
          },
          startTime: session.startTime,
          endTime: session.endTime,
          duration: session.duration,
          status: session.status,
          price: session.price,
          createdAt: session.createdAt,
        },
        message: "Booking request created successfully",
      });
    } catch (error) {
      console.error("Booking creation error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create booking request",
      });
    }
  }
);

/**
 * @route GET /api/bookings
 * @desc Get booking requests
 * @access Private
 */
router.get("/", auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let query = {};

    // Filter by user role
    if (req.user.userType === "learner") {
      query.learnerId = req.user.id;
    } else if (req.user.userType === "mentor") {
      query.mentorId = req.user.id;
    } else {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const sessions = await Session.find(query)
      .populate("mentorId", "firstName lastName profilePicture skills")
      .populate("learnerId", "firstName lastName profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Session.countDocuments(query);

    const transformedSessions = sessions.map((session) => ({
      id: session._id,
      title: session.title,
      description: session.description,
      mentor: {
        id: session.mentorId._id,
        name: `${session.mentorId.firstName} ${session.mentorId.lastName}`,
        profilePicture: session.mentorId.profilePicture,
        skills: session.mentorId.skills,
      },
      learner: {
        id: session.learnerId._id,
        name: `${session.learnerId.firstName} ${session.learnerId.lastName}`,
        profilePicture: session.learnerId.profilePicture,
      },
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.duration,
      status: session.status,
      price: session.price,
      meetingLink: session.meetingLink,
      createdAt: session.createdAt,
    }));

    res.json({
      success: true,
      data: transformedSessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
        hasNext: skip + parseInt(limit) < total,
        hasPrev: parseInt(page) > 1,
      },
      message: "Booking requests retrieved successfully",
    });
  } catch (error) {
    console.error("Get bookings error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve booking requests",
    });
  }
});

/**
 * @route PUT /api/bookings/:id/respond
 * @desc Respond to a booking request (accept/reject)
 * @access Private (Mentor)
 */
router.put(
  "/:id/respond",
  [
    auth,
    check("action", "Action must be accept or reject").isIn([
      "accept",
      "reject",
    ]),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const { action, message } = req.body;

      // Find the session
      const session = await Session.findById(id)
        .populate("mentorId", "firstName lastName")
        .populate("learnerId", "firstName lastName");

      if (!session) {
        return res.status(404).json({
          success: false,
          error: "Booking request not found",
        });
      }

      // Verify mentor owns this session
      if (session.mentorId._id.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }

      // Update session status
      if (action === "accept") {
        session.status = "confirmed";
      } else {
        session.status = "cancelled";
        session.cancelledBy = "mentor";
        session.cancellationReason = message || "Declined by mentor";
      }

      await session.save();

      console.log(`Booking ${action}ed:`, {
        sessionId: session._id,
        status: session.status,
        mentorId: session.mentorId._id,
        learnerId: session.learnerId._id,
      });

      res.json({
        success: true,
        data: {
          id: session._id,
          status: session.status,
          action: action,
          message: message,
        },
        message: `Booking request ${action}ed successfully`,
      });
    } catch (error) {
      console.error("Booking response error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to respond to booking request",
      });
    }
  }
);

module.exports = router;

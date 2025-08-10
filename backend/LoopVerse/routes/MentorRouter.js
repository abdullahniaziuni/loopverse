const express = require("express");
const router = express.Router();
const mentorController = require("../controllers/mentorController");
const { check } = require("express-validator");
const auth = require("../middleware/auth");
const Mentor = require("../Models/mentor");

/**
 * Mentor Routes
 * Contains all endpoints related to mentor operations
 */

// Authentication Routes
/**
 * @route POST /api/mentors/register
 * @desc Register a new mentor
 * @access Public
 */
router.post(
  "/register",
  [
    // Validation middleware
    check("firstName", "First name is required").notEmpty(),
    check("lastName", "Last name is required").notEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password must be at least 6 characters long").isLength({
      min: 6,
    }),
  ],
  mentorController.register
);

/**
 * @route POST /api/mentors/login
 * @desc Authenticate mentor & get token
 * @access Public
 */
router.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  mentorController.login
);

// Profile Routes
/**
 * @route GET /api/mentors
 * @desc Get all verified mentors (public listing)
 * @access Public
 */
router.get("/", mentorController.getAllMentors);

/**
 * @route GET /api/mentors/profile
 * @desc Get current mentor profile
 * @access Private
 */
router.get("/profile", auth, mentorController.getProfile);

/**
 * @route GET /api/mentors/profile/:id
 * @desc Get mentor profile by ID
 * @access Private
 */
router.get("/profile/:id", auth, mentorController.getProfile);

/**
 * @route PUT /api/mentors/profile
 * @desc Update mentor profile
 * @access Private
 */
router.put("/profile", auth, mentorController.updateProfile);

/**
 * @route PUT /api/mentors/change-password
 * @desc Change mentor password
 * @access Private
 */
router.put(
  "/change-password",
  [
    auth,
    check("currentPassword", "Current password is required").notEmpty(),
    check(
      "newPassword",
      "New password must be at least 6 characters long"
    ).isLength({ min: 6 }),
  ],
  mentorController.changePassword
);

// Skills and Expertise Routes
/**
 * @route PUT /api/mentors/skills
 * @desc Update mentor skills
 * @access Private
 */
router.put(
  "/skills",
  [auth, check("skills", "Skills information is required").isArray()],
  mentorController.manageSkills
);

/**
 * @route PUT /api/mentors/expertise
 * @desc Update mentor expertise areas
 * @access Private
 */
router.put(
  "/expertise",
  [auth, check("expertise", "Expertise information is required").isArray()],
  mentorController.manageExpertise
);

// Portfolio Routes
/**
 * @route POST /api/mentors/portfolio
 * @desc Add a portfolio item
 * @access Private
 */
router.post(
  "/portfolio",
  [auth, check("title", "Title is required").notEmpty()],
  mentorController.addPortfolioItem
);

/**
 * @route PUT /api/mentors/portfolio/:itemId
 * @desc Update a portfolio item
 * @access Private
 */
router.put("/portfolio/:itemId", auth, mentorController.updatePortfolioItem);

/**
 * @route DELETE /api/mentors/portfolio/:itemId
 * @desc Delete a portfolio item
 * @access Private
 */
router.delete("/portfolio/:itemId", auth, mentorController.deletePortfolioItem);

// Availability Routes
/**
 * @route PUT /api/mentors/availability
 * @desc Update mentor availability
 * @access Private
 */
router.put(
  "/availability",
  [
    auth,
    check("availability", "Availability information is required").isArray(),
  ],
  mentorController.manageAvailability
);

// Education Routes
/**
 * @route POST /api/mentors/education
 * @desc Add education record
 * @access Private
 */
router.post(
  "/education",
  [
    auth,
    check("institution", "Institution name is required").notEmpty(),
    check("degree", "Degree is required").notEmpty(),
    check("fieldOfStudy", "Field of study is required").notEmpty(),
    check("startYear", "Start year is required").isNumeric(),
  ],
  mentorController.addEducation
);

/**
 * @route PUT /api/mentors/education/:eduId
 * @desc Update education record
 * @access Private
 */
router.put("/education/:eduId", auth, mentorController.updateEducation);

/**
 * @route DELETE /api/mentors/education/:eduId
 * @desc Delete education record
 * @access Private
 */
router.delete("/education/:eduId", auth, mentorController.deleteEducation);

// Certification Routes
/**
 * @route POST /api/mentors/certification
 * @desc Add certification
 * @access Private
 */
router.post(
  "/certification",
  [
    auth,
    check("title", "Certification title is required").notEmpty(),
    check("issuingOrganization", "Issuing organization is required").notEmpty(),
  ],
  mentorController.addCertification
);

/**
 * @route DELETE /api/mentors/certification/:certId
 * @desc Delete certification
 * @access Private
 */
router.delete(
  "/certification/:certId",
  auth,
  mentorController.deleteCertification
);

// Sessions Routes
/**
 * @route GET /api/mentors/sessions
 * @desc Get all mentor sessions
 * @access Private
 */
router.get("/sessions", auth, mentorController.getSessions);

/**
 * @route PUT /api/mentors/complete-session
 * @desc Mark a session as completed
 * @access Private
 */
router.put(
  "/complete-session",
  [auth, check("sessionId", "Session ID is required").notEmpty()],
  mentorController.completeSession
);

// Reviews Routes
/**
 * @route GET /api/mentors/reviews
 * @desc Get mentor reviews
 * @access Private
 */
router.get("/reviews", auth, mentorController.getReviews);

/**
 * @route GET /api/mentors/:id/reviews
 * @desc Get mentor reviews by ID (public)
 * @access Public
 */
router.get("/:id/reviews", mentorController.getReviews);

// Booking Routes
/**
 * @route GET /api/mentors/bookings/pending
 * @desc Get pending booking requests for mentor
 * @access Private (Mentor)
 */
router.get("/bookings/pending", auth, async (req, res) => {
  try {
    const Session = require("../Models/session");

    const pendingBookings = await Session.find({
      mentorId: req.user.id,
      status: "pending",
    })
      .populate("learnerId", "firstName lastName profilePicture")
      .sort({ createdAt: -1 });

    const transformedBookings = pendingBookings.map((session) => ({
      id: session._id,
      learnerId: session.learnerId._id,
      learnerName: `${session.learnerId.firstName} ${session.learnerId.lastName}`,
      learnerAvatar: session.learnerId.profilePicture,
      title: session.title,
      description: session.description,
      date: session.startTime.toISOString().split("T")[0],
      startTime: session.startTime.toTimeString().slice(0, 5),
      endTime: session.endTime.toTimeString().slice(0, 5),
      status: session.status,
      createdAt: session.createdAt,
    }));

    res.json({
      success: true,
      data: transformedBookings,
    });
  } catch (error) {
    console.error("Get pending bookings error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch pending bookings",
    });
  }
});

// Verification Routes
/**
 * @route POST /api/mentors/request-verification
 * @desc Request account verification
 * @access Private
 */
router.post(
  "/request-verification",
  auth,
  mentorController.requestVerification
);

// Account Management Routes
/**
 * @route PUT /api/mentors/deactivate
 * @desc Deactivate mentor account
 * @access Private
 */
router.put("/deactivate", auth, mentorController.deactivateAccount);

// Public Routes

/**
 * @route GET /api/mentors/search
 * @desc Search for mentors with advanced filtering
 * @access Public
 */
router.get("/search", mentorController.searchMentors);

module.exports = router;

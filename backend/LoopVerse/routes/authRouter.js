const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { check, validationResult } = require("express-validator");
const auth = require("../middleware/auth");

// Import models
const Learner = require("../Models/learner");
const Mentor = require("../Models/mentor");
const Admin = require("../Models/admin");

/**
 * Unified Authentication Routes
 * Handles authentication for all user types (learner, mentor, admin)
 */

/**
 * @route POST /api/auth/login
 * @desc Authenticate user & get token
 * @access Public
 */
router.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
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

      const { email, password } = req.body;

      // Try to find user in all collections
      let user = await Learner.findOne({ email });
      let userType = "learner";

      if (!user) {
        user = await Mentor.findOne({ email });
        userType = "mentor";
      }

      if (!user) {
        user = await Admin.findOne({ email });
        userType = "admin";
      }

      if (!user) {
        return res.status(400).json({
          success: false,
          error: "Invalid credentials",
        });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          error: "Invalid credentials",
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(400).json({
          success: false,
          error: "Account is deactivated",
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user._id,
          role: userType, // Use normalized userType
          userType: userType,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
      );

      // Update last active
      user.lastActive = new Date();
      await user.save();

      // Transform user data for frontend
      const userData = {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: userType, // Always use the normalized userType instead of user.role
        profilePicture: user.profilePicture,
        timezone: user.timezone,
        isVerified: user.isVerified || false,
        createdAt: user.createdAt,
      };

      res.json({
        success: true,
        data: {
          user: userData,
          token: token,
        },
        message: "Login successful",
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        error: "Server error during login",
      });
    }
  }
);

/**
 * @route POST /api/auth/signup
 * @desc Register a new user
 * @access Public
 */
router.post(
  "/signup",
  [
    check("firstName", "First name is required").notEmpty(),
    // check("lastName", "Last name is required").notEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password must be at least 6 characters long").isLength({
      min: 6,
    }),
    check("role", "Role must be either learner or mentor").isIn([
      "learner",
      "mentor",
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

      const {
        firstName,
        // lastName,
        email,
        password,
        role,
        interests,
        timezone,
      } = req.body;

      // Check if user already exists in any collection
      const existingLearner = await Learner.findOne({ email });
      const existingMentor = await Mentor.findOne({ email });
      const existingAdmin = await Admin.findOne({ email });

      if (existingLearner || existingMentor || existingAdmin) {
        return res.status(400).json({
          success: false,
          error: "Email already in use",
        });
      }

      let user;
      const userData = {
        firstName,
        // lastName,
        email,
        password,
        interests: interests || [],
        timezone: timezone || "UTC",
      };

      // Create user based on role
      if (role === "learner") {
        user = new Learner(userData);
      } else if (role === "mentor") {
        user = new Mentor({
          ...userData,
          isVerified: false, // Mentors need approval
        });
      } else {
        return res.status(400).json({
          success: false,
          error: "Invalid role specified",
        });
      }

      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user._id,
          role: role, // Use normalized role
          userType: role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
      );

      // Transform user data for frontend
      const responseUser = {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        // lastName: user.lastName,
        email: user.email,
        role: role, // Use normalized role
        profilePicture: user.profilePicture,
        timezone: user.timezone,
        isVerified: user.isVerified || false,
        createdAt: user.createdAt,
      };

      res.status(201).json({
        success: true,
        data: {
          user: responseUser,
          token: token,
        },
        message: "Registration successful",
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({
        success: false,
        error: "Server error during registration",
      });
    }
  }
);

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get("/me", auth, async (req, res) => {
  try {
    let user;
    
    // Log what we received from auth middleware
    console.log("User from auth middleware:", req.user);

    // Find user based on their role/userType
    // Use either userType or role property, whichever is available
    const userType = req.user.userType || req.user.role;
    
    if (userType === "learner") {
      user = await Learner.findById(req.user.id).select("-password");
    } else if (userType === "mentor") {
      user = await Mentor.findById(req.user.id).select("-password");
    } else if (userType === "admin") {
      user = await Admin.findById(req.user.id).select("-password");
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Transform user data for frontend
    const userData = {
      id: user._id,
      name: `${user.firstName} ${user.lastName || ''}`,
      firstName: user.firstName,
      lastName: user.lastName || '',
      email: user.email,
      role: userType,
      profilePicture: user.profilePicture,
      timezone: user.timezone,
      isVerified: user.isVerified || false,
      createdAt: user.createdAt,
      interests: user.interests,
      goals: user.goals,
    };

    res.json({
      success: true,
      data: userData,
      message: "User profile retrieved successfully",
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      error: "Server error retrieving user profile",
    });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Private
 */
router.post("/logout", auth, async (req, res) => {
  try {
    // In a more sophisticated setup, you might want to blacklist the token
    // For now, we'll just send a success response
    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      error: "Server error during logout",
    });
  }
});

/**
 * @route POST /api/auth/refresh
 * @desc Refresh JWT token
 * @access Private
 */
router.post("/refresh", auth, async (req, res) => {
  try {
    // Generate new token
    const token = jwt.sign(
      {
        id: req.user.id,
        role: req.user.role,
        userType: req.user.userType,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

    res.json({
      success: true,
      data: { token },
      message: "Token refreshed successfully",
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({
      success: false,
      error: "Server error refreshing token",
    });
  }
});

module.exports = router;

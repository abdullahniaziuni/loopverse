const Learner = require('../Models/learner');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');

/**
 * Learner Controller
 * Handles all operations related to learner accounts and profiles
 */
const learnerController = {
  /**
   * Register a new learner
   * @route POST /api/learners/register
   */
  register: async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { firstName, lastName, email, password, interests, timezone } = req.body;

      // Check if learner already exists
      const existingLearner = await Learner.findOne({ email });
      if (existingLearner) {
        return res.status(400).json({ message: 'Email already in use' });
      }

      // Create new learner
      const learner = new Learner({
        firstName,
        lastName,
        email,
        password,
        interests: interests || [],
        timezone: timezone || 'UTC'
      });

      // Save learner
      await learner.save();

      // Generate JWT token
      const token = jwt.sign(
        { id: learner._id, role: learner.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'Learner registered successfully',
        token,
        learner: {
          id: learner._id,
          firstName: learner.firstName,
          lastName: learner.lastName,
          email: learner.email,
          role: learner.role
        }
      });
    } catch (error) {
      console.error('Error registering learner:', error);
      res.status(500).json({ message: 'Server error during registration' });
    }
  },

  /**
   * Login a learner
   * @route POST /api/learners/login
   */
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find learner by email
      const learner = await Learner.findOne({ email });
      if (!learner) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify password
      const isMatch = await learner.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check if account is active
      if (!learner.isActive) {
        return res.status(403).json({ message: 'Account is inactive' });
      }

      // Record login information
      const loginInfo = {
        ipAddress: req.ip,
        device: req.headers['user-agent'],
        location: req.body.location || 'Unknown'
      };

      learner.loginHistory.push(loginInfo);
      learner.lastActive = Date.now();
      await learner.save();

      // Generate JWT token
      const token = jwt.sign(
        { id: learner._id, role: learner.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login successful',
        token,
        learner: {
          id: learner._id,
          firstName: learner.firstName,
          lastName: learner.lastName,
          email: learner.email,
          role: learner.role,
          profilePicture: learner.profilePicture
        }
      });
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ message: 'Server error during login' });
    }
  },

  /**
   * Get learner profile
   * @route GET /api/learners/profile/:id
   */
  getProfile: async (req, res) => {
    try {
      const learnerId = req.params.id || req.user.id;

      const learner = await Learner.findById(learnerId)
        .select('-password -loginHistory -__v');

      if (!learner) {
        return res.status(404).json({ message: 'Learner not found' });
      }

      res.json({ learner });
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ message: 'Server error while fetching profile' });
    }
  },

  /**
   * Update learner profile
   * @route PUT /api/learners/profile
   */
  updateProfile: async (req, res) => {
    try {
      const { 
        firstName, lastName, interests, goals, 
        timezone, profilePicture 
      } = req.body;

      const learnerId = req.user.id;

      // Find and update learner
      const learner = await Learner.findById(learnerId);
      if (!learner) {
        return res.status(404).json({ message: 'Learner not found' });
      }

      // Update fields if provided
      if (firstName) learner.firstName = firstName;
      if (lastName) learner.lastName = lastName;
      if (interests) learner.interests = interests;
      if (goals) learner.goals = goals;
      if (timezone) learner.timezone = timezone;
      if (profilePicture) learner.profilePicture = profilePicture;

      await learner.save();

      res.json({ 
        message: 'Profile updated successfully',
        learner: {
          id: learner._id,
          firstName: learner.firstName,
          lastName: learner.lastName,
          interests: learner.interests,
          goals: learner.goals,
          timezone: learner.timezone,
          profilePicture: learner.profilePicture
        }
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: 'Server error while updating profile' });
    }
  },

  /**
   * Change password
   * @route PUT /api/learners/change-password
   */
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      // Find learner
      const learner = await Learner.findById(req.user.id);
      if (!learner) {
        return res.status(404).json({ message: 'Learner not found' });
      }

      // Verify current password
      const isMatch = await learner.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      // Update password
      learner.password = newPassword;
      await learner.save();

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ message: 'Server error while changing password' });
    }
  },

  /**
   * Enroll in a course
   * @route POST /api/learners/enroll
   */
  enrollCourse: async (req, res) => {
    try {
      const { courseId } = req.body;
      const learnerId = req.user.id;

      const learner = await Learner.findById(learnerId);
      if (!learner) {
        return res.status(404).json({ message: 'Learner not found' });
      }

      // Check if already enrolled
      const isEnrolled = learner.enrolledCourses.some(
        course => course.courseId.toString() === courseId
      );

      if (isEnrolled) {
        return res.status(400).json({ message: 'Already enrolled in this course' });
      }

      // Add course to enrolled courses
      learner.enrolledCourses.push({
        courseId,
        enrollmentDate: Date.now(),
        progress: 0
      });

      await learner.save();

      res.json({ 
        message: 'Enrolled successfully',
        enrolledCourse: learner.enrolledCourses[learner.enrolledCourses.length - 1]
      });
    } catch (error) {
      console.error('Error enrolling in course:', error);
      res.status(500).json({ message: 'Server error while enrolling in course' });
    }
  },

  /**
   * Update course progress
   * @route PUT /api/learners/progress
   */
  updateProgress: async (req, res) => {
    try {
      const { courseId, progress, completionDate } = req.body;
      const learnerId = req.user.id;

      const learner = await Learner.findById(learnerId);
      if (!learner) {
        return res.status(404).json({ message: 'Learner not found' });
      }

      // Find the enrolled course
      const courseIndex = learner.enrolledCourses.findIndex(
        course => course.courseId.toString() === courseId
      );

      if (courseIndex === -1) {
        return res.status(404).json({ message: 'Course not found in enrolled courses' });
      }

      // Update progress
      learner.enrolledCourses[courseIndex].progress = progress;
      
      // If course is completed
      if (progress === 100 && !learner.enrolledCourses[courseIndex].completionDate) {
        learner.enrolledCourses[courseIndex].completionDate = completionDate || Date.now();
        learner.progressStats.coursesCompleted += 1;
      }

      await learner.save();

      res.json({ 
        message: 'Progress updated successfully',
        updatedCourse: learner.enrolledCourses[courseIndex]
      });
    } catch (error) {
      console.error('Error updating progress:', error);
      res.status(500).json({ message: 'Server error while updating progress' });
    }
  },

  /**
   * Add or update a goal
   * @route POST /api/learners/goals
   */
  manageGoal: async (req, res) => {
    try {
      const { goalId, description, targetDate, completed } = req.body;
      const learnerId = req.user.id;

      const learner = await Learner.findById(learnerId);
      if (!learner) {
        return res.status(404).json({ message: 'Learner not found' });
      }

      // If goalId provided, update existing goal
      if (goalId) {
        const goalIndex = learner.goals.findIndex(
          goal => goal._id.toString() === goalId
        );

        if (goalIndex === -1) {
          return res.status(404).json({ message: 'Goal not found' });
        }

        if (description) learner.goals[goalIndex].description = description;
        if (targetDate) learner.goals[goalIndex].targetDate = targetDate;
        if (completed !== undefined) learner.goals[goalIndex].completed = completed;

        await learner.save();

        return res.json({ 
          message: 'Goal updated successfully',
          goal: learner.goals[goalIndex]
        });
      }

      // Create new goal
      const newGoal = {
        description,
        targetDate,
        completed: completed || false
      };

      learner.goals.push(newGoal);
      await learner.save();

      res.status(201).json({ 
        message: 'Goal added successfully',
        goal: learner.goals[learner.goals.length - 1]
      });
    } catch (error) {
      console.error('Error managing goal:', error);
      res.status(500).json({ message: 'Server error while managing goal' });
    }
  },

  /**
   * Delete a goal
   * @route DELETE /api/learners/goals/:goalId
   */
  deleteGoal: async (req, res) => {
    try {
      const { goalId } = req.params;
      const learnerId = req.user.id;

      const learner = await Learner.findById(learnerId);
      if (!learner) {
        return res.status(404).json({ message: 'Learner not found' });
      }

      const goalIndex = learner.goals.findIndex(
        goal => goal._id.toString() === goalId
      );

      if (goalIndex === -1) {
        return res.status(404).json({ message: 'Goal not found' });
      }

      // Remove goal
      learner.goals.splice(goalIndex, 1);
      await learner.save();

      res.json({ message: 'Goal deleted successfully' });
    } catch (error) {
      console.error('Error deleting goal:', error);
      res.status(500).json({ message: 'Server error while deleting goal' });
    }
  },

  /**
   * Get all enrolled courses
   * @route GET /api/learners/courses
   */
  getEnrolledCourses: async (req, res) => {
    try {
      const learnerId = req.user.id;

      const learner = await Learner.findById(learnerId)
        .populate({
          path: 'enrolledCourses.courseId',
          select: 'title description instructor duration level'
        });

      if (!learner) {
        return res.status(404).json({ message: 'Learner not found' });
      }

      res.json({ enrolledCourses: learner.enrolledCourses });
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      res.status(500).json({ message: 'Server error while fetching courses' });
    }
  },

  /**
   * Get learner progress statistics
   * @route GET /api/learners/stats
   */
  getProgressStats: async (req, res) => {
    try {
      const learnerId = req.user.id;

      const learner = await Learner.findById(learnerId)
        .select('progressStats');

      if (!learner) {
        return res.status(404).json({ message: 'Learner not found' });
      }

      res.json({ progressStats: learner.progressStats });
    } catch (error) {
      console.error('Error fetching progress stats:', error);
      res.status(500).json({ message: 'Server error while fetching stats' });
    }
  },

  /**
   * Deactivate learner account
   * @route PUT /api/learners/deactivate
   */
  deactivateAccount: async (req, res) => {
    try {
      const learnerId = req.user.id;

      const learner = await Learner.findById(learnerId);
      if (!learner) {
        return res.status(404).json({ message: 'Learner not found' });
      }

      learner.isActive = false;
      await learner.save();

      res.json({ message: 'Account deactivated successfully' });
    } catch (error) {
      console.error('Error deactivating account:', error);
      res.status(500).json({ message: 'Server error while deactivating account' });
    }
  }
};

module.exports = learnerController;
const Admin = require('../Models/admin');
const Learner = require('../Models/learner');
const Mentor = require('../Models/mentor');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');

/**
 * Admin Controller
 * Handles all operations related to admin accounts and administrative functions
 */
const adminController = {
  /**
   * Login an admin
   * @route POST /api/admin/login
   */
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find admin by email
      const admin = await Admin.findOne({ email });
      if (!admin) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify password
      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check if account is active
      if (!admin.isActive) {
        return res.status(403).json({ message: 'Account is inactive' });
      }

      // Record login information
      const loginInfo = {
        ipAddress: req.ip,
        device: req.headers['user-agent'],
        location: req.body.location || 'Unknown'
      };

      admin.loginHistory.push(loginInfo);
      admin.lastActive = Date.now();
      await admin.save();

      // Generate JWT token
      const token = jwt.sign(
        { id: admin._id, role: admin.role, adminLevel: admin.adminLevel },
        process.env.JWT_SECRET,
        { expiresIn: '8h' } // Shorter expiry for admin accounts
      );

      res.json({
        message: 'Login successful',
        token,
        admin: {
          id: admin._id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          role: admin.role,
          department: admin.department,
          adminLevel: admin.adminLevel,
          permissions: admin.permissions
        }
      });
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ message: 'Server error during login' });
    }
  },

  /**
   * Create a new admin (super admin only)
   * @route POST /api/admin/create
   */
  createAdmin: async (req, res) => {
    try {
      // Check if requesting user is a super admin
      if (req.user.role !== 'SuperAdmin' && req.user.adminLevel < 5) {
        return res.status(403).json({ message: 'Not authorized to create admin accounts' });
      }

      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { 
        firstName, lastName, email, password, 
        department, permissions, adminLevel 
      } = req.body;

      // Check if admin already exists
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({ message: 'Email already in use' });
      }

      // Create new admin
      const admin = new Admin({
        firstName,
        lastName,
        email,
        password,
        department: department || 'General',
        permissions: permissions || {},
        adminLevel: adminLevel || 1,
        createdBy: req.user.id,
        resetPasswordRequired: true // Force password change on first login
      });

      // Save admin
      await admin.save();

      // Log action
      const currentAdmin = await Admin.findById(req.user.id);
      currentAdmin.logAction('Create', 'Admin', admin._id, `Created admin account for ${firstName} ${lastName}`);

      res.status(201).json({
        message: 'Admin account created successfully',
        admin: {
          id: admin._id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          role: admin.role,
          department: admin.department,
          adminLevel: admin.adminLevel
        }
      });
    } catch (error) {
      console.error('Error creating admin:', error);
      res.status(500).json({ message: 'Server error during admin creation' });
    }
  },

  /**
   * Get admin profile
   * @route GET /api/admin/profile
   */
  getProfile: async (req, res) => {
    try {
      const admin = await Admin.findById(req.user.id)
        .select('-password -loginHistory -__v');

      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }

      res.json({ admin });
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ message: 'Server error while fetching profile' });
    }
  },

  /**
   * Update admin profile
   * @route PUT /api/admin/profile
   */
  updateProfile: async (req, res) => {
    try {
      const { firstName, lastName, phoneNumber, emergencyContact } = req.body;

      const admin = await Admin.findById(req.user.id);
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }

      // Update fields if provided
      if (firstName) admin.firstName = firstName;
      if (lastName) admin.lastName = lastName;
      if (phoneNumber) admin.phoneNumber = phoneNumber;
      if (emergencyContact) admin.emergencyContact = emergencyContact;

      await admin.save();

      // Log action
      admin.logAction('Update', 'Admin', admin._id, 'Updated own profile');

      res.json({ 
        message: 'Profile updated successfully',
        admin: {
          id: admin._id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          phoneNumber: admin.phoneNumber,
          emergencyContact: admin.emergencyContact
        }
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: 'Server error while updating profile' });
    }
  },

  /**
   * Change password
   * @route PUT /api/admin/change-password
   */
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const admin = await Admin.findById(req.user.id);
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }

      // Verify current password unless it's a reset
      if (!admin.resetPasswordRequired) {
        const isMatch = await admin.comparePassword(currentPassword);
        if (!isMatch) {
          return res.status(401).json({ message: 'Current password is incorrect' });
        }
      }

      // Update password
      admin.password = newPassword;
      admin.resetPasswordRequired = false;
      await admin.save();

      // Log action
      admin.logAction('Update', 'Admin', admin._id, 'Changed password');

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ message: 'Server error while changing password' });
    }
  },

  /**
   * Get all users (paginated)
   * @route GET /api/admin/users
   */
  getAllUsers: async (req, res) => {
    try {
      const { role, page = 1, limit = 10, search } = req.query;
      
      // Check permissions
      const admin = await Admin.findById(req.user.id);
      if (!admin.permissions.userManagement) {
        return res.status(403).json({ message: 'Not authorized to access user management' });
      }

      // Build query
      let query = {};
      
      if (role && ['Learner', 'Mentor', 'Admin'].includes(role)) {
        query.role = role;
      }
      
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      // Determine which model to query
      let Model;
      if (role === 'Learner') {
        Model = Learner;
      } else if (role === 'Mentor') {
        Model = Mentor;
      } else if (role === 'Admin') {
        // Check if admin level allows viewing other admins
        if (admin.adminLevel < 3) {
          return res.status(403).json({ message: 'Not authorized to view admin accounts' });
        }
        Model = Admin;
      } else {
        // Query all models and combine results
        const learners = await Learner.find(query)
          .select('firstName lastName email role isActive createdAt')
          .limit(limit)
          .skip((page - 1) * limit);
          
        const mentors = await Mentor.find(query)
          .select('firstName lastName email role isVerified isActive createdAt')
          .limit(limit)
          .skip((page - 1) * limit);
          
        const admins = admin.adminLevel >= 3 ? await Admin.find(query)
          .select('firstName lastName email role department adminLevel isActive createdAt')
          .limit(limit)
          .skip((page - 1) * limit) : [];
        
        // Count total documents
        const totalLearners = await Learner.countDocuments(query);
        const totalMentors = await Mentor.countDocuments(query);
        const totalAdmins = admin.adminLevel >= 3 ? await Admin.countDocuments(query) : 0;
        
        return res.json({
          users: [...learners, ...mentors, ...admins],
          totalPages: Math.ceil((totalLearners + totalMentors + totalAdmins) / limit),
          currentPage: page,
          totalUsers: totalLearners + totalMentors + totalAdmins
        });
      }
      
      // Query specific model
      const users = await Model.find(query)
        .select('firstName lastName email role isActive createdAt')
        .limit(limit)
        .skip((page - 1) * limit);
      
      // Count total documents
      const totalUsers = await Model.countDocuments(query);
      
      res.json({
        users,
        totalPages: Math.ceil(totalUsers / limit),
        currentPage: page,
        totalUsers
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Server error while fetching users' });
    }
  },

  /**
   * Get user details
   * @route GET /api/admin/users/:userId
   */
  getUserDetails: async (req, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.query;
      
      // Check permissions
      const admin = await Admin.findById(req.user.id);
      if (!admin.permissions.userManagement) {
        return res.status(403).json({ message: 'Not authorized to access user details' });
      }
      
      // Determine which model to query
      let user;
      if (role === 'Learner') {
        user = await Learner.findById(userId).select('-password -__v');
      } else if (role === 'Mentor') {
        user = await Mentor.findById(userId).select('-password -__v');
      } else if (role === 'Admin') {
        // Check if admin level allows viewing admin details
        if (admin.adminLevel < 3) {
          return res.status(403).json({ message: 'Not authorized to view admin details' });
        }
        user = await Admin.findById(userId).select('-password -__v');
      } else {
        // Try to find user in any model
        user = await Learner.findById(userId).select('-password -__v');
        if (!user) {
          user = await Mentor.findById(userId).select('-password -__v');
        }
        if (!user && admin.adminLevel >= 3) {
          user = await Admin.findById(userId).select('-password -__v');
        }
      }
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Log action
      admin.logAction('Read', user.role, userId, `Viewed ${user.role.toLowerCase()} details`);
      
      res.json({ user });
    } catch (error) {
      console.error('Error fetching user details:', error);
      res.status(500).json({ message: 'Server error while fetching user details' });
    }
  },

  /**
   * Update user status (activate/deactivate)
   * @route PUT /api/admin/users/:userId/status
   */
  updateUserStatus: async (req, res) => {
    try {
      const { userId } = req.params;
      const { role, isActive } = req.body;
      
      // Check permissions
      const admin = await Admin.findById(req.user.id);
      if (!admin.moderationFlags.canManageUsers) {
        return res.status(403).json({ message: 'Not authorized to manage users' });
      }
      
      // Determine which model to query
      let Model;
      let actionName = isActive ? 'activate' : 'deactivate';
      
      if (role === 'Learner') {
        Model = Learner;
      } else if (role === 'Mentor') {
        Model = Mentor;
      } else if (role === 'Admin') {
        // Only super admins can modify admin accounts
        if (req.user.role !== 'SuperAdmin' && req.user.adminLevel < 4) {
          return res.status(403).json({ message: 'Not authorized to modify admin accounts' });
        }
        Model = Admin;
      } else {
        return res.status(400).json({ message: 'Invalid role specified' });
      }
      
      const user = await Model.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Update status
      user.isActive = isActive;
      await user.save();
      
      // Log action
      admin.logAction(
        isActive ? 'Unban' : 'Ban',
        role,
        userId,
        `${actionName}d ${role.toLowerCase()} account`
      );
      
      res.json({ 
        message: `User ${actionName}d successfully`,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive
        }
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ message: 'Server error while updating user status' });
    }
  },

  /**
   * Verify mentor
   * @route PUT /api/admin/mentors/:mentorId/verify
   */
  verifyMentor: async (req, res) => {
    try {
      const { mentorId } = req.params;
      const { isVerified } = req.body;
      
      // Check permissions
      const admin = await Admin.findById(req.user.id);
      if (!admin.moderationFlags.canApproveMentors) {
        return res.status(403).json({ message: 'Not authorized to verify mentors' });
      }
      
      const mentor = await Mentor.findById(mentorId);
      if (!mentor) {
        return res.status(404).json({ message: 'Mentor not found' });
      }
      
      // Update verification status
      mentor.isVerified = isVerified;
      await mentor.save();
      
      // Log action
      const actionType = isVerified ? 'Approve' : 'Reject';
      admin.logAction(
        actionType,
        'Mentor',
        mentorId,
        `${isVerified ? 'Verified' : 'Unverified'} mentor account`
      );
      
      res.json({ 
        message: `Mentor ${isVerified ? 'verified' : 'unverified'} successfully`,
        mentor: {
          id: mentor._id,
          firstName: mentor.firstName,
          lastName: mentor.lastName,
          isVerified: mentor.isVerified
        }
      });
    } catch (error) {
      console.error('Error verifying mentor:', error);
      res.status(500).json({ message: 'Server error while verifying mentor' });
    }
  },

  /**
   * Get pending mentor verifications
   * @route GET /api/admin/mentors/pending
   */
  getPendingMentors: async (req, res) => {
    try {
      // Check permissions
      const admin = await Admin.findById(req.user.id);
      if (!admin.moderationFlags.canApproveMentors) {
        return res.status(403).json({ message: 'Not authorized to view pending mentors' });
      }
      
      const pendingMentors = await Mentor.find({ 
        isVerified: false,
        isActive: true
      }).select('firstName lastName email biography skills expertise yearsOfExperience createdAt');
      
      res.json({ pendingMentors, count: pendingMentors.length });
    } catch (error) {
      console.error('Error fetching pending mentors:', error);
      res.status(500).json({ message: 'Server error while fetching pending mentors' });
    }
  },

  /**
   * Get system dashboard statistics
   * @route GET /api/admin/dashboard
   */
  getDashboardStats: async (req, res) => {
    try {
      // Check permissions
      const admin = await Admin.findById(req.user.id);
      if (!admin.permissions.analytics) {
        return res.status(403).json({ message: 'Not authorized to access analytics' });
      }
      
      // Get counts
      const learnersCount = await Learner.countDocuments();
      const activeLearners = await Learner.countDocuments({ isActive: true });
      
      const mentorsCount = await Mentor.countDocuments();
      const verifiedMentors = await Mentor.countDocuments({ isVerified: true });
      const pendingMentors = await Mentor.countDocuments({ isVerified: false, isActive: true });
      
      const adminsCount = await Admin.countDocuments();
      
      // Get recent registrations
      const recentLearners = await Learner.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('firstName lastName email createdAt');
        
      const recentMentors = await Mentor.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('firstName lastName email isVerified createdAt');
      
      res.json({
        userCounts: {
          totalLearners: learnersCount,
          activeLearners,
          totalMentors: mentorsCount,
          verifiedMentors,
          pendingMentors,
          totalAdmins: adminsCount
        },
        recentActivity: {
          recentLearners,
          recentMentors
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ message: 'Server error while fetching dashboard statistics' });
    }
  },

  /**
   * Get enhanced dashboard statistics
   * @route GET /api/admin/dashboard/enhanced
   */
  getDashboardEnhanced: async (req, res) => {
    try {
      // Check permissions
      const admin = await Admin.findById(req.user.id);
      if (!admin.permissions.analytics) {
        return res.status(403).json({ message: 'Not authorized to access analytics' });
      }
      
      // Get basic stats from existing method
      const basicStats = await adminController.getDashboardStats(req, res, true);
      
      // Add additional stats (sessions and ratings)
      // This would require Session model - assuming it exists
      const Session = require('../Models/session');
      
      // Session stats
      const totalSessions = await Session.countDocuments();
      const completedSessions = await Session.countDocuments({ status: 'completed' });
      const upcomingSessions = await Session.countDocuments({ 
        startTime: { $gt: new Date() },
        status: 'scheduled'
      });
      
      // Rating stats
      const mentors = await Mentor.find({ isVerified: true });
      let totalRatings = 0;
      let ratingSum = 0;
      
      mentors.forEach(mentor => {
        totalRatings += mentor.ratings.totalRatings;
        ratingSum += (mentor.ratings.averageRating * mentor.ratings.totalRatings);
      });
      
      const platformAverageRating = totalRatings > 0 ? (ratingSum / totalRatings).toFixed(2) : 0;
      
      // Recent activities
      const recentSessions = await Session.find()
        .sort({ startTime: -1 })
        .limit(10)
        .populate('mentorId', 'firstName lastName')
        .populate('learnerId', 'firstName lastName')
        .select('title startTime status');
    
      if (basicStats) {
        return res.json({
          ...basicStats,
          sessionStats: {
            totalSessions,
            completedSessions,
            upcomingSessions,
            completionRate: totalSessions > 0 ? 
              ((completedSessions / totalSessions) * 100).toFixed(2) + '%' : '0%'
          },
          ratingStats: {
            totalRatings,
            platformAverageRating,
            fiveStarPercentage: totalRatings > 0 ? 
              ((mentors.reduce((acc, m) => acc + m.reviews.filter(r => r.rating === 5).length, 0) / totalRatings) * 100).toFixed(2) + '%' : '0%'
          },
          recentActivity: {
            ...basicStats.recentActivity,
            recentSessions
          }
        });
      }
      
      // Fallback in case the getDashboardStats doesn't return properly
      res.json({
        sessionStats: {
          totalSessions,
          completedSessions,
          upcomingSessions
        },
        ratingStats: {
          totalRatings,
          platformAverageRating
        }
      });
    } catch (error) {
      console.error('Error fetching enhanced dashboard stats:', error);
      res.status(500).json({ message: 'Server error while fetching dashboard statistics' });
    }
  },

  /**
   * Moderate review
   * @route PUT /api/admin/reviews/:reviewId/moderate
   */
  moderateReview: async (req, res) => {
    try {
      const { reviewId } = req.params;
      const { action, reason } = req.body;
      
      // Check permissions
      const admin = await Admin.findById(req.user.id);
      if (!admin.moderationFlags.canApproveContent) {
        return res.status(403).json({ message: 'Not authorized to moderate content' });
      }
      
      // Find the review - first need to find which mentor has this review
      const mentor = await Mentor.findOne({ 'reviews._id': reviewId });
      
      if (!mentor) {
        return res.status(404).json({ message: 'Review not found' });
      }
      
      // Find the review index
      const reviewIndex = mentor.reviews.findIndex(r => r._id.toString() === reviewId);
      
      if (reviewIndex === -1) {
        return res.status(404).json({ message: 'Review not found' });
      }
      
      // Take action
      if (action === 'approve') {
        mentor.reviews[reviewIndex].isApproved = true;
        mentor.reviews[reviewIndex].moderatedBy = admin._id;
        mentor.reviews[reviewIndex].moderatedAt = Date.now();
      } else if (action === 'reject') {
        mentor.reviews[reviewIndex].isApproved = false;
        mentor.reviews[reviewIndex].isHidden = true;
        mentor.reviews[reviewIndex].moderationReason = reason || 'Violated platform guidelines';
        mentor.reviews[reviewIndex].moderatedBy = admin._id;
        mentor.reviews[reviewIndex].moderatedAt = Date.now();
      } else if (action === 'delete') {
        mentor.reviews.splice(reviewIndex, 1);
      } else {
        return res.status(400).json({ message: 'Invalid action specified' });
      }
      
      // Recalculate mentor ratings if review was approved/rejected/deleted
      if (action === 'approve' || action === 'reject' || action === 'delete') {
        const approvedReviews = mentor.reviews.filter(r => r.isApproved);
        const totalRatings = approvedReviews.length;
        
        if (totalRatings > 0) {
          const ratingSum = approvedReviews.reduce((sum, review) => sum + review.rating, 0);
          mentor.ratings.averageRating = (ratingSum / totalRatings).toFixed(1);
          mentor.ratings.totalRatings = totalRatings;
        } else {
          mentor.ratings.averageRating = 0;
          mentor.ratings.totalRatings = 0;
        }
      }
      
      await mentor.save();
      
      // Log action
      admin.logAction(
        action.charAt(0).toUpperCase() + action.slice(1),
        'Review',
        reviewId,
        `${action}ed review for mentor ${mentor.firstName} ${mentor.lastName}`
      );
      
      res.json({ 
        message: `Review ${action}ed successfully`,
        review: action === 'delete' ? null : mentor.reviews[reviewIndex]
      });
    } catch (error) {
      console.error('Error moderating review:', error);
      res.status(500).json({ message: 'Server error while moderating review' });
    }
  },

  /**
   * Handle user reports
   * @route GET /api/admin/reports
   */
  getReports: async (req, res) => {
    try {
      // Check permissions
      const admin = await Admin.findById(req.user.id);
      if (!admin.moderationFlags.canApproveContent) {
        return res.status(403).json({ message: 'Not authorized to access reports' });
      }
      
      // Assuming you have a Report model
      const Report = require('../Models/report');
      
      const { status, page = 1, limit = 20 } = req.query;
      
      let query = {};
      if (status) {
        query.status = status;
      }
      
      const reports = await Report.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .populate('reportedBy', 'firstName lastName email')
        .populate('targetId');
        
      const totalReports = await Report.countDocuments(query);
      
      res.json({
        reports,
        totalPages: Math.ceil(totalReports / parseInt(limit)),
        currentPage: parseInt(page),
        totalReports
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ message: 'Server error while fetching reports' });
    }
  },

  /**
   * Handle specific report
   * @route PUT /api/admin/reports/:reportId
   */
  handleReport: async (req, res) => {
    try {
      const { reportId } = req.params;
      const { action, notes } = req.body;
      
      // Check permissions
      const admin = await Admin.findById(req.user.id);
      if (!admin.moderationFlags.canApproveContent) {
        return res.status(403).json({ message: 'Not authorized to handle reports' });
      }
      
      // Assuming you have a Report model
      const Report = require('../Models/report');
      
      const report = await Report.findById(reportId);
      if (!report) {
        return res.status(404).json({ message: 'Report not found' });
      }
      
      // Update report status
      report.status = action;
      report.handledBy = admin._id;
      report.handledAt = Date.now();
      report.adminNotes = notes || '';
      
      await report.save();
      
      // Log action
      admin.logAction(
        'Update',
        'Report',
        reportId,
        `Handled report with action: ${action}`
      );
      
      res.json({ 
        message: `Report marked as ${action}`,
        report
      });
    } catch (error) {
      console.error('Error handling report:', error);
      res.status(500).json({ message: 'Server error while handling report' });
    }
  },

  /**
   * Export users data as CSV
   * @route GET /api/admin/export/users
   */
  exportUsers: async (req, res) => {
    try {
      // Check permissions
      const admin = await Admin.findById(req.user.id);
      if (!admin.permissions.analytics) {
        return res.status(403).json({ message: 'Not authorized to export data' });
      }
      
      const { role, format = 'csv' } = req.query;
      
      let users = [];
      
      // Gather users based on role
      if (role === 'Learner') {
        users = await Learner.find()
          .select('firstName lastName email createdAt isActive');
      } else if (role === 'Mentor') {
        users = await Mentor.find()
          .select('firstName lastName email createdAt isActive isVerified');
      } else if (role === 'Admin' && admin.adminLevel >= 4) {
        users = await Admin.find()
          .select('firstName lastName email createdAt isActive adminLevel');
      } else {
        // Get all users
        const learners = await Learner.find()
          .select('firstName lastName email role createdAt isActive');
        const mentors = await Mentor.find()
          .select('firstName lastName email role createdAt isActive isVerified');
        
        users = [...learners, ...mentors];
        
        if (admin.adminLevel >= 4) {
          const admins = await Admin.find()
            .select('firstName lastName email role createdAt isActive adminLevel');
          users = [...users, ...admins];
        }
      }
      
      // Format the data based on requested format
      if (format === 'csv') {
        const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
        
        const csvStringifier = createCsvStringifier({
          header: [
            { id: 'firstName', title: 'First Name' },
            { id: 'lastName', title: 'Last Name' },
            { id: 'email', title: 'Email' },
            { id: 'role', title: 'Role' },
            { id: 'createdAt', title: 'Created Date' },
            { id: 'isActive', title: 'Active Status' },
          ]
        });
        
        const csvHeader = csvStringifier.getHeaderString();
        const csvBody = csvStringifier.stringifyRecords(users.map(user => ({
          ...user.toObject(),
          createdAt: user.createdAt.toISOString().split('T')[0]
        })));
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=users-${Date.now()}.csv`);
        
        res.write(csvHeader);
        res.write(csvBody);
        res.end();
      } else if (format === 'json') {
        res.json({ users });
      } else {
        return res.status(400).json({ message: 'Unsupported export format' });
      }
      
      // Log action
      admin.logAction(
        'Other',
        'System',
        admin._id,
        `Exported ${users.length} users data in ${format} format`
      );
    } catch (error) {
      console.error('Error exporting users:', error);
      res.status(500).json({ message: 'Server error while exporting users' });
    }
  },

  /**
   * Export sessions data as CSV
   * @route GET /api/admin/export/sessions
   */
  exportSessions: async (req, res) => {
    try {
      // Check permissions
      const admin = await Admin.findById(req.user.id);
      if (!admin.permissions.analytics) {
        return res.status(403).json({ message: 'Not authorized to export data' });
      }
      
      const { status, format = 'csv' } = req.query;
      
      // Assuming you have a Session model
      const Session = require('../Models/session');
      
      let query = {};
      if (status) {
        query.status = status;
      }
      
      const sessions = await Session.find(query)
        .populate('mentorId', 'firstName lastName email')
        .populate('learnerId', 'firstName lastName email');
        
      // Format the data based on requested format
      if (format === 'csv') {
        const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
        
        const csvStringifier = createCsvStringifier({
          header: [
            { id: 'sessionId', title: 'Session ID' },
            { id: 'title', title: 'Title' },
            { id: 'mentorName', title: 'Mentor' },
            { id: 'learnerName', title: 'Learner' },
            { id: 'startTime', title: 'Start Time' },
            { id: 'duration', title: 'Duration (mins)' },
            { id: 'status', title: 'Status' }
          ]
        });
        
        const csvRecords = sessions.map(session => ({
          sessionId: session._id.toString(),
          title: session.title,
          mentorName: `${session.mentorId.firstName} ${session.mentorId.lastName}`,
          learnerName: `${session.learnerId.firstName} ${session.learnerId.lastName}`,
          startTime: new Date(session.startTime).toLocaleString(),
          duration: session.duration,
          status: session.status
        }));
        
        const csvHeader = csvStringifier.getHeaderString();
        const csvBody = csvStringifier.stringifyRecords(csvRecords);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=sessions-${Date.now()}.csv`);
        
        res.write(csvHeader);
        res.write(csvBody);
        res.end();
      } else if (format === 'json') {
        res.json({ sessions });
      } else {
        return res.status(400).json({ message: 'Unsupported export format' });
      }
      
      // Log action
      admin.logAction(
        'Other',
        'System',
        admin._id,
        `Exported ${sessions.length} sessions data in ${format} format`
      );
    } catch (error) {
      console.error('Error exporting sessions:', error);
      res.status(500).json({ message: 'Server error while exporting sessions' });
    }
  },

  /**
   * Update admin permissions
   * @route PUT /api/admin/permissions/:adminId
   */
  updatePermissions: async (req, res) => {
    try {
      const { adminId } = req.params;
      const { permissions, moderationFlags } = req.body;
      
      // Only super admins can modify permissions
      if (req.user.role !== 'SuperAdmin' && req.user.adminLevel < 5) {
        return res.status(403).json({ message: 'Not authorized to modify admin permissions' });
      }
      
      const targetAdmin = await Admin.findById(adminId);
      if (!targetAdmin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      
      // Cannot modify higher level admins
      if (targetAdmin.adminLevel >= req.user.adminLevel && req.user.role !== 'SuperAdmin') {
        return res.status(403).json({ message: 'Cannot modify permissions of equal or higher level admin' });
      }
      
      // Update permissions
      if (permissions) {
        targetAdmin.permissions = {
          ...targetAdmin.permissions,
          ...permissions
        };
      }
      
      // Update moderation flags
      if (moderationFlags) {
        targetAdmin.moderationFlags = {
          ...targetAdmin.moderationFlags,
          ...moderationFlags
        };
      }
      
      await targetAdmin.save();
      
      // Log action
      const admin = await Admin.findById(req.user.id);
      admin.logAction(
        'Update',
        'Admin',
        adminId,
        'Updated admin permissions'
      );
      
      res.json({ 
        message: 'Admin permissions updated successfully',
        permissions: targetAdmin.permissions,
        moderationFlags: targetAdmin.moderationFlags
      });
    } catch (error) {
      console.error('Error updating permissions:', error);
      res.status(500).json({ message: 'Server error while updating permissions' });
    }
  },

  /**
   * Get admin action logs
   * @route GET /api/admin/logs
   */
  getActionLogs: async (req, res) => {
    try {
      // Check permissions
      const admin = await Admin.findById(req.user.id);
      if (!admin.moderationFlags?.canAccessSystemLogs && admin.adminLevel < 4) {
        return res.status(403).json({ message: 'Not authorized to access system logs' });
      }
      
      const { adminId, page = 1, limit = 20, startDate, endDate, actionType } = req.query;
      
      let logs = [];
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitVal = parseInt(limit);
      
      // Build date filter if provided
      let dateFilter = {};
      if (startDate) {
        dateFilter.timestamp = { $gte: new Date(startDate) };
      }
      if (endDate) {
        dateFilter.timestamp = { ...dateFilter.timestamp, $lte: new Date(endDate) };
      }
      
      // Build action type filter
      let actionFilter = {};
      if (actionType) {
        actionFilter.actionType = actionType;
      }
      
      if (adminId) {
        // Get logs for specific admin
        const adminWithLogs = await Admin.findById(adminId)
          .select('actionLogs firstName lastName email')
          .populate({
            path: 'actionLogs.targetId', 
            select: 'firstName lastName email title', // Common fields across models
            options: { 
              limit: limitVal,
              skip: skip,
              sort: { 'timestamp': -1 }
            }
          });
          
        if (!adminWithLogs) {
          return res.status(404).json({ message: 'Admin not found' });
        }
        
        // Filter logs based on query parameters
        let filteredLogs = adminWithLogs.actionLogs;
        
        if (Object.keys(dateFilter).length > 0) {
          filteredLogs = filteredLogs.filter(log => {
            if (dateFilter.timestamp.$gte && log.timestamp < dateFilter.timestamp.$gte) return false;
            if (dateFilter.timestamp.$lte && log.timestamp > dateFilter.timestamp.$lte) return false;
            return true;
          });
        }
        
        if (actionType) {
          filteredLogs = filteredLogs.filter(log => log.actionType === actionType);
        }
        
        // Apply pagination manually since we're filtering in memory
        const totalLogs = filteredLogs.length;
        const paginatedLogs = filteredLogs.slice(skip, skip + limitVal);
        
        logs = paginatedLogs.map(log => ({
          ...log.toObject(),
          adminName: `${adminWithLogs.firstName} ${adminWithLogs.lastName}`,
          adminEmail: adminWithLogs.email
        }));
        
        return res.json({
          logs,
          admin: {
            id: adminWithLogs._id,
            name: `${adminWithLogs.firstName} ${adminWithLogs.lastName}`,
            email: adminWithLogs.email
          },
          pagination: {
            total: totalLogs,
            page: parseInt(page),
            totalPages: Math.ceil(totalLogs / limitVal)
          }
        });
      } else {
        // Get logs from all admins
        // We need to aggregate logs from all admins
        const admins = await Admin.find({}, 'firstName lastName email actionLogs');
        
        // Combine all logs from all admins
        const allLogs = [];
        admins.forEach(admin => {
          admin.actionLogs.forEach(log => {
            // Only add logs that match our filters
            let matchesFilters = true;
            
            if (Object.keys(dateFilter).length > 0) {
              if (dateFilter.timestamp.$gte && log.timestamp < dateFilter.timestamp.$gte) matchesFilters = false;
              if (dateFilter.timestamp.$lte && log.timestamp > dateFilter.timestamp.$lte) matchesFilters = false;
            }
            
            if (actionType && log.actionType !== actionType) matchesFilters = false;
            
            if (matchesFilters) {
              allLogs.push({
                ...log.toObject(),
                adminName: `${admin.firstName} ${admin.lastName}`,
                adminEmail: admin.email,
                adminId: admin._id
              });
            }
          });
        });
        
        // Sort logs by timestamp descending
        allLogs.sort((a, b) => b.timestamp - a.timestamp);
        
        // Apply pagination
        const totalLogs = allLogs.length;
        const paginatedLogs = allLogs.slice(skip, skip + limitVal);
        
        return res.json({
          logs: paginatedLogs,
          pagination: {
            total: totalLogs,
            page: parseInt(page),
            totalPages: Math.ceil(totalLogs / limitVal)
          },
          filters: {
            startDate: startDate || null,
            endDate: endDate || null,
            actionType: actionType || null
          }
        });
      }
    } catch (error) {
      console.error('Error fetching action logs:', error);
      res.status(500).json({ message: 'Server error while fetching action logs' });
    }
  }
};

module.exports = adminController;
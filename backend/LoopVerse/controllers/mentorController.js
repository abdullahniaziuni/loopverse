const Mentor = require('../Models/mentor');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');

/**
 * Mentor Controller
 * Handles all operations related to mentor accounts and profiles
 */
const mentorController = {
  /**
   * Register a new mentor
   * @route POST /api/mentors/register
   */
  register: async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { 
        firstName, lastName, email, password, 
        biography, skills, expertise, timezone 
      } = req.body;

      // Check if mentor already exists
      const existingMentor = await Mentor.findOne({ email });
      if (existingMentor) {
        return res.status(400).json({ message: 'Email already in use' });
      }

      // Create new mentor
      const mentor = new Mentor({
        firstName,
        lastName,
        email,
        password,
        biography: biography || '',
        skills: skills || [],
        expertise: expertise || [],
        timezone: timezone || 'UTC',
        isVerified: false // New mentors start unverified
      });

      // Save mentor
      await mentor.save();

      // Generate JWT token
      const token = jwt.sign(
        { id: mentor._id, role: mentor.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'Mentor registered successfully, pending verification',
        token,
        mentor: {
          id: mentor._id,
          firstName: mentor.firstName,
          lastName: mentor.lastName,
          email: mentor.email,
          role: mentor.role,
          isVerified: mentor.isVerified
        }
      });
    } catch (error) {
      console.error('Error registering mentor:', error);
      res.status(500).json({ message: 'Server error during registration' });
    }
  },

  /**
   * Login a mentor
   * @route POST /api/mentors/login
   */
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find mentor by email
      const mentor = await Mentor.findOne({ email });
      if (!mentor) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify password
      const isMatch = await mentor.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check if account is active
      if (!mentor.isActive) {
        return res.status(403).json({ message: 'Account is inactive' });
      }

      // Record login information
      const loginInfo = {
        ipAddress: req.ip,
        device: req.headers['user-agent'],
        location: req.body.location || 'Unknown'
      };

      mentor.loginHistory.push(loginInfo);
      mentor.lastActive = Date.now();
      await mentor.save();

      // Generate JWT token
      const token = jwt.sign(
        { id: mentor._id, role: mentor.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login successful',
        token,
        mentor: {
          id: mentor._id,
          firstName: mentor.firstName,
          lastName: mentor.lastName,
          email: mentor.email,
          role: mentor.role,
          profilePicture: mentor.profilePicture,
          isVerified: mentor.isVerified
        }
      });
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ message: 'Server error during login' });
    }
  },

  /**
   * Get mentor profile
   * @route GET /api/mentors/profile/:id
   */
  getProfile: async (req, res) => {
    try {
      const mentorId = req.params.id || req.user.id;

      const mentor = await Mentor.findById(mentorId)
        .select('-password -loginHistory -__v');

      if (!mentor) {
        return res.status(404).json({ message: 'Mentor not found' });
      }

      res.json({ mentor });
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ message: 'Server error while fetching profile' });
    }
  },

  /**
   * Update mentor profile
   * @route PUT /api/mentors/profile
   */
  updateProfile: async (req, res) => {
    try {
      const { 
        firstName, lastName, biography, yearsOfExperience, 
        timezone, profilePicture, hourlyRate, languages 
      } = req.body;

      const mentorId = req.user.id;

      // Find and update mentor
      const mentor = await Mentor.findById(mentorId);
      if (!mentor) {
        return res.status(404).json({ message: 'Mentor not found' });
      }

      // Update fields if provided
      if (firstName) mentor.firstName = firstName;
      if (lastName) mentor.lastName = lastName;
      if (biography) mentor.biography = biography;
      if (yearsOfExperience) mentor.yearsOfExperience = yearsOfExperience;
      if (timezone) mentor.timezone = timezone;
      if (profilePicture) mentor.profilePicture = profilePicture;
      if (hourlyRate) mentor.hourlyRate = hourlyRate;
      if (languages) mentor.languages = languages;

      await mentor.save();

      res.json({ 
        message: 'Profile updated successfully',
        mentor: {
          id: mentor._id,
          firstName: mentor.firstName,
          lastName: mentor.lastName,
          biography: mentor.biography,
          yearsOfExperience: mentor.yearsOfExperience,
          timezone: mentor.timezone,
          profilePicture: mentor.profilePicture,
          hourlyRate: mentor.hourlyRate,
          languages: mentor.languages
        }
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: 'Server error while updating profile' });
    }
  },

  /**
   * Change password
   * @route PUT /api/mentors/change-password
   */
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      // Find mentor
      const mentor = await Mentor.findById(req.user.id);
      if (!mentor) {
        return res.status(404).json({ message: 'Mentor not found' });
      }

      // Verify current password
      const isMatch = await mentor.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      // Update password
      mentor.password = newPassword;
      await mentor.save();

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ message: 'Server error while changing password' });
    }
  },

  /**
   * Manage skills
   * @route PUT /api/mentors/skills
   */
  manageSkills: async (req, res) => {
    try {
      const { skills } = req.body;
      const mentorId = req.user.id;

      const mentor = await Mentor.findById(mentorId);
      if (!mentor) {
        return res.status(404).json({ message: 'Mentor not found' });
      }

      // Update skills
      mentor.skills = skills;
      await mentor.save();

      res.json({ 
        message: 'Skills updated successfully',
        skills: mentor.skills
      });
    } catch (error) {
      console.error('Error updating skills:', error);
      res.status(500).json({ message: 'Server error while updating skills' });
    }
  },

  /**
   * Manage expertise
   * @route PUT /api/mentors/expertise
   */
  manageExpertise: async (req, res) => {
    try {
      const { expertise } = req.body;
      const mentorId = req.user.id;

      const mentor = await Mentor.findById(mentorId);
      if (!mentor) {
        return res.status(404).json({ message: 'Mentor not found' });
      }

      // Update expertise
      mentor.expertise = expertise;
      await mentor.save();

      res.json({ 
        message: 'Expertise updated successfully',
        expertise: mentor.expertise
      });
    } catch (error) {
      console.error('Error updating expertise:', error);
      res.status(500).json({ message: 'Server error while updating expertise' });
    }
  },

  /**
   * Add portfolio item
   * @route POST /api/mentors/portfolio
   */
  addPortfolioItem: async (req, res) => {
    try {
      const { title, description, link, fileUrls } = req.body;
      const mentorId = req.user.id;

      const mentor = await Mentor.findById(mentorId);
      if (!mentor) {
        return res.status(404).json({ message: 'Mentor not found' });
      }

      // Create portfolio item
      const portfolioItem = {
        title,
        description: description || '',
        link: link || '',
        fileUrls: fileUrls || [],
        uploadDate: Date.now()
      };

      mentor.portfolio.push(portfolioItem);
      await mentor.save();

      res.status(201).json({ 
        message: 'Portfolio item added successfully',
        portfolioItem: mentor.portfolio[mentor.portfolio.length - 1]
      });
    } catch (error) {
      console.error('Error adding portfolio item:', error);
      res.status(500).json({ message: 'Server error while adding portfolio item' });
    }
  },

  /**
   * Update portfolio item
   * @route PUT /api/mentors/portfolio/:itemId
   */
  updatePortfolioItem: async (req, res) => {
    try {
      const { itemId } = req.params;
      const { title, description, link, fileUrls } = req.body;
      const mentorId = req.user.id;

      const mentor = await Mentor.findById(mentorId);
      if (!mentor) {
        return res.status(404).json({ message: 'Mentor not found' });
      }

      // Find portfolio item
      const itemIndex = mentor.portfolio.findIndex(
        item => item._id.toString() === itemId
      );

      if (itemIndex === -1) {
        return res.status(404).json({ message: 'Portfolio item not found' });
      }

      // Update fields if provided
      if (title) mentor.portfolio[itemIndex].title = title;
      if (description) mentor.portfolio[itemIndex].description = description;
      if (link) mentor.portfolio[itemIndex].link = link;
      if (fileUrls) mentor.portfolio[itemIndex].fileUrls = fileUrls;

      await mentor.save();

      res.json({ 
        message: 'Portfolio item updated successfully',
        portfolioItem: mentor.portfolio[itemIndex]
      });
    } catch (error) {
      console.error('Error updating portfolio item:', error);
      res.status(500).json({ message: 'Server error while updating portfolio item' });
    }
  },

  /**
   * Delete portfolio item
   * @route DELETE /api/mentors/portfolio/:itemId
   */
  deletePortfolioItem: async (req, res) => {
    try {
      const { itemId } = req.params;
      const mentorId = req.user.id;

      const mentor = await Mentor.findById(mentorId);
      if (!mentor) {
        return res.status(404).json({ message: 'Mentor not found' });
      }

      // Find portfolio item
      const itemIndex = mentor.portfolio.findIndex(
        item => item._id.toString() === itemId
      );

      if (itemIndex === -1) {
        return res.status(404).json({ message: 'Portfolio item not found' });
      }

      // Remove portfolio item
      mentor.portfolio.splice(itemIndex, 1);
      await mentor.save();

      res.json({ message: 'Portfolio item deleted successfully' });
    } catch (error) {
      console.error('Error deleting portfolio item:', error);
      res.status(500).json({ message: 'Server error while deleting portfolio item' });
    }
  },

  /**
   * Manage availability
   * @route PUT /api/mentors/availability
   */
  manageAvailability: async (req, res) => {
    try {
      const { availability } = req.body;
      const mentorId = req.user.id;

      const mentor = await Mentor.findById(mentorId);
      if (!mentor) {
        return res.status(404).json({ message: 'Mentor not found' });
      }

      // Update availability
      mentor.availability = availability;
      await mentor.save();

      res.json({ 
        message: 'Availability updated successfully',
        availability: mentor.availability
      });
    } catch (error) {
      console.error('Error updating availability:', error);
      res.status(500).json({ message: 'Server error while updating availability' });
    }
  },

  /**
   * Add education
   * @route POST /api/mentors/education
   */
  addEducation: async (req, res) => {
    try {
      const { institution, degree, fieldOfStudy, startYear, endYear } = req.body;
      const mentorId = req.user.id;

      const mentor = await Mentor.findById(mentorId);
      if (!mentor) {
        return res.status(404).json({ message: 'Mentor not found' });
      }

      // Create education
      const education = {
        institution,
        degree,
        fieldOfStudy,
        startYear,
        endYear: endYear || null
      };

      mentor.education.push(education);
      await mentor.save();

      res.status(201).json({ 
        message: 'Education added successfully',
        education: mentor.education[mentor.education.length - 1]
      });
    } catch (error) {
      console.error('Error adding education:', error);
      res.status(500).json({ message: 'Server error while adding education' });
    }
  },

  /**
   * Update education
   * @route PUT /api/mentors/education/:eduId
   */
  updateEducation: async (req, res) => {
    try {
      const { eduId } = req.params;
      const { institution, degree, fieldOfStudy, startYear, endYear } = req.body;
      const mentorId = req.user.id;

      const mentor = await Mentor.findById(mentorId);
      if (!mentor) {
        return res.status(404).json({ message: 'Mentor not found' });
      }

      // Find education
      const eduIndex = mentor.education.findIndex(
        edu => edu._id.toString() === eduId
      );

      if (eduIndex === -1) {
        return res.status(404).json({ message: 'Education not found' });
      }

      // Update fields if provided
      if (institution) mentor.education[eduIndex].institution = institution;
      if (degree) mentor.education[eduIndex].degree = degree;
      if (fieldOfStudy) mentor.education[eduIndex].fieldOfStudy = fieldOfStudy;
      if (startYear) mentor.education[eduIndex].startYear = startYear;
      if (endYear !== undefined) mentor.education[eduIndex].endYear = endYear;

      await mentor.save();

      res.json({ 
        message: 'Education updated successfully',
        education: mentor.education[eduIndex]
      });
    } catch (error) {
      console.error('Error updating education:', error);
      res.status(500).json({ message: 'Server error while updating education' });
    }
  },

  /**
   * Delete education
   * @route DELETE /api/mentors/education/:eduId
   */
  deleteEducation: async (req, res) => {
    try {
      const { eduId } = req.params;
      const mentorId = req.user.id;

      const mentor = await Mentor.findById(mentorId);
      if (!mentor) {
        return res.status(404).json({ message: 'Mentor not found' });
      }

      // Find education
      const eduIndex = mentor.education.findIndex(
        edu => edu._id.toString() === eduId
      );

      if (eduIndex === -1) {
        return res.status(404).json({ message: 'Education not found' });
      }

      // Remove education
      mentor.education.splice(eduIndex, 1);
      await mentor.save();

      res.json({ message: 'Education deleted successfully' });
    } catch (error) {
      console.error('Error deleting education:', error);
      res.status(500).json({ message: 'Server error while deleting education' });
    }
  },

  /**
   * Add certification
   * @route POST /api/mentors/certification
   */
  addCertification: async (req, res) => {
    try {
      const { title, issuingOrganization, issueDate, expiryDate, credentialURL } = req.body;
      const mentorId = req.user.id;

      const mentor = await Mentor.findById(mentorId);
      if (!mentor) {
        return res.status(404).json({ message: 'Mentor not found' });
      }

      // Create certification
      const certification = {
        title,
        issuingOrganization,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        credentialURL
      };

      mentor.certifications.push(certification);
      await mentor.save();

      res.status(201).json({ 
        message: 'Certification added successfully',
        certification: mentor.certifications[mentor.certifications.length - 1]
      });
    } catch (error) {
      console.error('Error adding certification:', error);
      res.status(500).json({ message: 'Server error while adding certification' });
    }
  },

  /**
   * Delete certification
   * @route DELETE /api/mentors/certification/:certId
   */
  deleteCertification: async (req, res) => {
    try {
      const { certId } = req.params;
      const mentorId = req.user.id;

      const mentor = await Mentor.findById(mentorId);
      if (!mentor) {
        return res.status(404).json({ message: 'Mentor not found' });
      }

      // Find certification
      const certIndex = mentor.certifications.findIndex(
        cert => cert._id.toString() === certId
      );

      if (certIndex === -1) {
        return res.status(404).json({ message: 'Certification not found' });
      }

      // Remove certification
      mentor.certifications.splice(certIndex, 1);
      await mentor.save();

      res.json({ message: 'Certification deleted successfully' });
    } catch (error) {
      console.error('Error deleting certification:', error);
      res.status(500).json({ message: 'Server error while deleting certification' });
    }
  },

  /**
   * Get mentor sessions
   * @route GET /api/mentors/sessions
   */
  getSessions: async (req, res) => {
    try {
      const mentorId = req.user.id;

      const mentor = await Mentor.findById(mentorId)
        .populate('activeSessions')
        .select('activeSessions sessionsCompleted');

      if (!mentor) {
        return res.status(404).json({ message: 'Mentor not found' });
      }

      res.json({ 
        activeSessions: mentor.activeSessions,
        sessionsCompleted: mentor.sessionsCompleted
      });
    } catch (error) {
      console.error('Error fetching sessions:', error);
      res.status(500).json({ message: 'Server error while fetching sessions' });
    }
  },

  /**
   * Update session completion
   * @route PUT /api/mentors/complete-session
   */
  completeSession: async (req, res) => {
    try {
      const { sessionId } = req.body;
      const mentorId = req.user.id;

      const mentor = await Mentor.findById(mentorId);
      if (!mentor) {
        return res.status(404).json({ message: 'Mentor not found' });
      }

      // Find session in active sessions
      const sessionIndex = mentor.activeSessions.indexOf(sessionId);
      if (sessionIndex === -1) {
        return res.status(404).json({ message: 'Session not found in active sessions' });
      }

      // Remove from active sessions and increment completed sessions
      mentor.activeSessions.splice(sessionIndex, 1);
      mentor.sessionsCompleted += 1;
      await mentor.save();

      res.json({ 
        message: 'Session marked as completed',
        sessionsCompleted: mentor.sessionsCompleted
      });
    } catch (error) {
      console.error('Error completing session:', error);
      res.status(500).json({ message: 'Server error while completing session' });
    }
  },

  /**
   * Get mentor reviews
   * @route GET /api/mentors/reviews
   */
  getReviews: async (req, res) => {
    try {
      const mentorId = req.params.id || req.user.id;

      const mentor = await Mentor.findById(mentorId)
        .select('ratings reviews')
        .populate({
          path: 'reviews.reviewerId',
          select: 'firstName lastName profilePicture'
        });

      if (!mentor) {
        return res.status(404).json({ message: 'Mentor not found' });
      }

      res.json({ 
        ratings: mentor.ratings,
        reviews: mentor.reviews
      });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({ message: 'Server error while fetching reviews' });
    }
  },

  /**
   * Request verification
   * @route POST /api/mentors/request-verification
   */
  requestVerification: async (req, res) => {
    try {
      const mentorId = req.user.id;

      const mentor = await Mentor.findById(mentorId);
      if (!mentor) {
        return res.status(404).json({ message: 'Mentor not found' });
      }

      if (mentor.isVerified) {
        return res.status(400).json({ message: 'Mentor is already verified' });
      }

      // Logic to send verification request to admin
      // This would typically involve creating a notification or request record
      
      res.json({ 
        message: 'Verification request submitted successfully',
        status: 'pending'
      });
    } catch (error) {
      console.error('Error requesting verification:', error);
      res.status(500).json({ message: 'Server error while requesting verification' });
    }
  },

  /**
   * Deactivate mentor account
   * @route PUT /api/mentors/deactivate
   */
  deactivateAccount: async (req, res) => {
    try {
      const mentorId = req.user.id;

      const mentor = await Mentor.findById(mentorId);
      if (!mentor) {
        return res.status(404).json({ message: 'Mentor not found' });
      }

      mentor.isActive = false;
      await mentor.save();

      res.json({ message: 'Account deactivated successfully' });
    } catch (error) {
      console.error('Error deactivating account:', error);
      res.status(500).json({ message: 'Server error while deactivating account' });
    }
  },

  /**
   * Get all verified mentors (public endpoint)
   * @route GET /api/mentors
   */
  getAllMentors: async (req, res) => {
    try {
      const { expertise, minRating } = req.query;
      
      // Build query
      let query = { isVerified: true, isActive: true };
      
      if (expertise) {
        query.expertise = { $in: [expertise] };
      }
      
      if (minRating) {
        query['ratings.averageRating'] = { $gte: parseFloat(minRating) };
      }
      
      const mentors = await Mentor.find(query)
        .select('firstName lastName profilePicture biography expertise ratings hourlyRate')
        .sort({ 'ratings.averageRating': -1 });
      
      res.json({ mentors });
    } catch (error) {
      console.error('Error fetching mentors:', error);
      res.status(500).json({ message: 'Server error while fetching mentors' });
    }
  },

  /**
   * Search for mentors with advanced filtering
   * @route GET /api/mentors/search
   */
  searchMentors: async (req, res) => {
    try {
      const {
        q,                  // text search query
        expertise,          // specific expertise area
        skills,             // specific skills
        minRating,          // minimum rating
        maxRating,          // maximum rating
        availability,       // day of week (0-6)
        minPrice,           // minimum hourly rate
        maxPrice,           // maximum hourly rate
        language,           // specific language
        sort,               // sort field
        order,              // asc or desc
        page = 1,
        limit = 10
      } = req.query;

      // Build query
      const query = {
        isVerified: true,
        isActive: true
      };

      // Text search
      if (q) {
        query.$text = { $search: q };
      }

      // Filter by expertise
      if (expertise) {
        query.expertise = { $in: expertise.split(',') };
      }

      // Filter by skills
      if (skills) {
        query['skills.name'] = { $in: skills.split(',') };
      }

      // Filter by rating range
      if (minRating || maxRating) {
        query['ratings.averageRating'] = {};
        if (minRating) query['ratings.averageRating'].$gte = parseFloat(minRating);
        if (maxPrice) query['ratings.averageRating'].$lte = parseFloat(maxRating);
      }

      // Filter by price range
      if (minPrice || maxPrice) {
        query.hourlyRate = {};
        if (minPrice) query.hourlyRate.$gte = parseFloat(minPrice);
        if (maxPrice) query.hourlyRate.$lte = parseFloat(maxPrice);
      }

      // Filter by availability
      if (availability) {
        const days = availability.split(',').map(day => parseInt(day));
        query['availability.dayOfWeek'] = { $in: days };
      }

      // Filter by language
      if (language) {
        query['languages.language'] = language;
      }

      // Determine sort options
      let sortOptions = {};
      if (sort) {
        const sortOrder = order === 'desc' ? -1 : 1;
        
        if (sort === 'rating') {
          sortOptions['ratings.averageRating'] = sortOrder;
        } else if (sort === 'price') {
          sortOptions.hourlyRate = sortOrder;
        } else if (sort === 'experience') {
          sortOptions.yearsOfExperience = sortOrder;
        } else if (sort === 'popularity') {
          sortOptions['ratings.totalRatings'] = sortOrder;
        } else if (sort === 'sessions') {
          sortOptions.sessionsCompleted = sortOrder;
        }
      } else {
        // Default sort by rating
        sortOptions = { 'ratings.averageRating': -1 };
      }

      // Calculate pagination values
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitVal = parseInt(limit);

      // Execute query with projection for search results
      const mentors = await Mentor.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitVal)
        .select('firstName lastName profilePicture biography expertise skills ratings hourlyRate sessionsCompleted yearsOfExperience');

      // Count total results for pagination
      const totalMentors = await Mentor.countDocuments(query);
      
      res.json({
        mentors,
        pagination: {
          totalMentors,
          totalPages: Math.ceil(totalMentors / limitVal),
          currentPage: parseInt(page),
          hasMore: skip + mentors.length < totalMentors
        }
      });
    } catch (error) {
      console.error('Error searching mentors:', error);
      res.status(500).json({ message: 'Server error while searching mentors' });
    }
  }
};

module.exports = mentorController;
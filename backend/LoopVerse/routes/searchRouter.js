const express = require('express');
const router = express.Router();
const Mentor = require('../Models/mentor');
const Session = require('../Models/session');

/**
 * Search Routes
 * Handles search functionality across the platform
 */

/**
 * @route GET /api/search/mentors
 * @desc Search for mentors with advanced filtering
 * @access Public
 */
router.get('/mentors', async (req, res) => {
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
      sort = 'rating',    // sort field
      order = 'desc',     // asc or desc
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
      query.$or = [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { biography: { $regex: q, $options: 'i' } },
        { expertise: { $in: [new RegExp(q, 'i')] } },
        { 'skills.name': { $in: [new RegExp(q, 'i')] } }
      ];
    }

    // Expertise filter
    if (expertise) {
      const expertiseArray = Array.isArray(expertise) ? expertise : [expertise];
      query.expertise = { $in: expertiseArray };
    }

    // Skills filter
    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      query['skills.name'] = { $in: skillsArray };
    }

    // Rating filters
    if (minRating) {
      query['ratings.averageRating'] = { $gte: parseFloat(minRating) };
    }
    if (maxRating) {
      if (query['ratings.averageRating']) {
        query['ratings.averageRating'].$lte = parseFloat(maxRating);
      } else {
        query['ratings.averageRating'] = { $lte: parseFloat(maxRating) };
      }
    }

    // Price filters
    if (minPrice) {
      query.hourlyRate = { $gte: parseFloat(minPrice) };
    }
    if (maxPrice) {
      if (query.hourlyRate) {
        query.hourlyRate.$lte = parseFloat(maxPrice);
      } else {
        query.hourlyRate = { $lte: parseFloat(maxPrice) };
      }
    }

    // Language filter
    if (language) {
      query['languages.language'] = language;
    }

    // Availability filter (simplified - check if mentor has any slots on that day)
    if (availability) {
      query['availability.dayOfWeek'] = parseInt(availability);
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'rating':
        sortObj['ratings.averageRating'] = order === 'asc' ? 1 : -1;
        break;
      case 'price':
        sortObj.hourlyRate = order === 'asc' ? 1 : -1;
        break;
      case 'experience':
        sortObj.yearsOfExperience = order === 'asc' ? 1 : -1;
        break;
      case 'name':
        sortObj.firstName = order === 'asc' ? 1 : -1;
        break;
      default:
        sortObj['ratings.averageRating'] = -1;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const mentors = await Mentor.find(query)
      .select('firstName lastName profilePicture biography expertise skills ratings hourlyRate timezone yearsOfExperience languages')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Mentor.countDocuments(query);

    // Transform mentors for frontend
    const transformedMentors = mentors.map(mentor => ({
      id: mentor._id,
      name: `${mentor.firstName} ${mentor.lastName}`,
      firstName: mentor.firstName,
      lastName: mentor.lastName,
      profilePicture: mentor.profilePicture,
      biography: mentor.biography,
      expertise: mentor.expertise,
      skills: mentor.skills,
      rating: mentor.ratings.averageRating,
      totalRatings: mentor.ratings.totalRatings,
      hourlyRate: mentor.hourlyRate,
      timezone: mentor.timezone,
      yearsOfExperience: mentor.yearsOfExperience,
      languages: mentor.languages
    }));

    res.json({
      success: true,
      data: transformedMentors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
        hasNext: skip + parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      },
      message: 'Mentors search completed successfully'
    });

  } catch (error) {
    console.error('Error searching mentors:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while searching mentors'
    });
  }
});

/**
 * @route GET /api/search/sessions
 * @desc Search for sessions
 * @access Private
 */
router.get('/sessions', async (req, res) => {
  try {
    const {
      q,
      status,
      mentorId,
      learnerId,
      startDate,
      endDate,
      page = 1,
      limit = 10
    } = req.query;

    // Build query
    const query = {};

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    }

    if (mentorId) {
      query.mentorId = mentorId;
    }

    if (learnerId) {
      query.learnerId = learnerId;
    }

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) {
        query.startTime.$gte = new Date(startDate);
      }
      if (endDate) {
        query.startTime.$lte = new Date(endDate);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const sessions = await Session.find(query)
      .populate('mentorId', 'firstName lastName profilePicture')
      .populate('learnerId', 'firstName lastName profilePicture')
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Session.countDocuments(query);

    // Transform sessions for frontend
    const transformedSessions = sessions.map(session => ({
      id: session._id,
      title: session.title,
      description: session.description,
      mentor: {
        id: session.mentorId._id,
        name: `${session.mentorId.firstName} ${session.mentorId.lastName}`,
        profilePicture: session.mentorId.profilePicture
      },
      learner: {
        id: session.learnerId._id,
        name: `${session.learnerId.firstName} ${session.learnerId.lastName}`,
        profilePicture: session.learnerId.profilePicture
      },
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.duration,
      status: session.status,
      price: session.price
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
        hasPrev: parseInt(page) > 1
      },
      message: 'Sessions search completed successfully'
    });

  } catch (error) {
    console.error('Error searching sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while searching sessions'
    });
  }
});

module.exports = router;

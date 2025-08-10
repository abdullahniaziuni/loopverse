const mongoose = require('mongoose');
const Analytics = require('../models/analytics');
const User = require('../Models/learner'); // Adjust the path if needed

// Helper function to calculate date range
const getDateRange = (timeRange) => {
  const now = new Date();
  let startDate = new Date();
  
  if (timeRange === '7d') {
    startDate.setDate(now.getDate() - 7);
  } else if (timeRange === '30d') {
    startDate.setDate(now.getDate() - 30);
  } else if (timeRange === '90d') {
    startDate.setDate(now.getDate() - 90);
  } else if (timeRange === '1y') {
    startDate.setFullYear(now.getFullYear() - 1);
  } else {
    // Default to 30 days
    startDate.setDate(now.getDate() - 30);
  }
  
  return { startDate, endDate: now };
};

// Get overall platform progress analytics
exports.getOverallProgress = async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    const { startDate, endDate } = getDateRange(timeRange);
    
    // For now, return sample data until we implement the full analytics

    return res.status(200).json({
      success: true,
      timeRange,
      data: {
        totalSessions: 120,
        activeUsers: 45,
        averageSessionDuration: 52, // minutes
        completionRate: 78, // percentage
        timeframe: {
          start: startDate,
          end: endDate
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching overall progress analytics',
      error: error.message
    });
  }
};

// Get user progress analytics
exports.getUserProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeRange = '30d' } = req.query;
    const { startDate, endDate } = getDateRange(timeRange);
    
    // For now, return sample data until we implement the full user analytics
    res.status(200).json({
      success: true,
      userId,
      timeRange,
      data: {
        sessionsCompleted: 8,
        totalHours: 12.5,
        skillsImproved: ['JavaScript', 'React', 'Node.js'],
        progressPercentage: 65,
        timeframe: {
          start: startDate,
          end: endDate
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user progress analytics',
      error: error.message
    });
  }
};

// Add analytics event
exports.addAnalyticsEvent = async (req, res) => {
  try {
    const { userId, eventType, data } = req.body;
    
    if (!userId || !eventType || !data) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, eventType, or data'
      });
    }
    
    // For now, just acknowledge the event
    // In a real implementation, you'd store this in your Analytics model
    res.status(201).json({
      success: true,
      message: 'Analytics event recorded',
      data: {
        userId,
        eventType,
        timestamp: new Date(),
        data
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding analytics event',
      error: error.message
    });
  }
};

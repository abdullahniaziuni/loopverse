const jwt = require('jsonwebtoken');
const Admin = require('../Models/admin');

/**
 * Admin Authentication Middleware
 * Verifies JWT token and ensures the user has admin privileges
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
module.exports = async function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user is an admin
    if (decoded.role !== 'Admin' && decoded.role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Access denied: Admin privileges required' });
    }

    // Get admin info to check if they're active and verify permissions
    const admin = await Admin.findById(decoded.id);
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    if (!admin.isActive) {
      return res.status(403).json({ message: 'Access denied: Admin account is inactive' });
    }

    // Check for force password reset requirement
    if (admin.resetPasswordRequired && req.path !== '/change-password') {
      return res.status(403).json({ 
        message: 'Password reset required before accessing admin features',
        resetRequired: true
      });
    }

    // Attach admin info to request
    req.user = {
      id: decoded.id,
      role: decoded.role,
      adminLevel: admin.adminLevel || 1,
      permissions: admin.permissions || {},
      moderationFlags: admin.moderationFlags || {}
    };
    
    // Log admin activity (optional)
    admin.lastActive = Date.now();
    await admin.save();
    
    next();
  } catch (err) {
    console.error('Admin authentication error:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};
const jwt = require("jsonwebtoken");

/**
 * Authentication Middleware
 * Verifies the JWT token in the request header and sets req.user
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
module.exports = function (req, res, next) {
  // Get token from header - support both x-auth-token and Authorization Bearer
  let token = req.header("x-auth-token");

  if (!token) {
    const authHeader = req.header("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  // Check if no token
  if (!token) {
    return res.status(401).json({
      success: false,
      error: "No token, authorization denied",
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Set user info in request
    req.user = decoded;

    next();
  } catch (err) {
    console.error("Authentication error:", err.message);
    res.status(401).json({
      success: false,
      error: "Token is not valid",
    });
  }
};

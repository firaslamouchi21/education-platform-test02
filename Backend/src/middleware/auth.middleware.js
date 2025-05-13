const { auth } = require('../config/firebase');
const { pool } = require('../config/database');

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify Firebase token
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;

    // Get user data from MySQL
    const [rows] = await pool.execute(
      'SELECT id, email, role FROM users WHERE firebase_uid = ?',
      [decodedToken.uid]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found in database'
      });
    }

    req.user.dbUser = rows[0];
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.dbUser) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.dbUser.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

module.exports = {
  verifyToken,
  requireRole
}; 
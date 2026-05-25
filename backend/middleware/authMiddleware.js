const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authenticateToken = async (req, res, next) => {
  console.log("Incoming Auth Header:", req.headers.authorization);
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const { rows } = await db.query('SELECT id, email FROM users WHERE id = $1::uuid', [decoded.id]);

      if (!rows[0]) {
        return res.status(401).json({ message: 'User not found' });
      }
      req.user = rows[0]; 
      
      return next(); // Use return here to stop execution
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // If we reach here, it means no token was provided
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// CRITICAL: This is what was missing!
module.exports = { authenticateToken };
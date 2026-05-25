const express = require('express');
const router = express.Router();
const { getOracleAdvice } = require('../controllers/oracleController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/consult', authenticateToken, getOracleAdvice);

module.exports = router;

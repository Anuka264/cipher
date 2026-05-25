const express = require('express');
const router = express.Router();
const { getMatches } = require('../controllers/matchController');
const { getSmartMatches } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, getMatches);
router.get('/recommendations', authenticateToken, getSmartMatches);

module.exports = router;
const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    completeOnboarding,
    getCurrentUser,
    updateProfile,
    updateAccountCredentials,
    getSmartMatches,
    sendConnectionRequest,
    getPendingRequests,
    respondToConnectionRequest,
    getConnections,
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead
} = require('../controllers/userController');
const {
    getConversations,
    getConversationMessages,
    sendMessage,
    translateMessage
} = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);

router.use(authenticateToken);
router.get('/me', getCurrentUser);
router.post('/onboarding', completeOnboarding);
router.patch('/profile', updateProfile);
router.patch('/account', updateAccountCredentials);
router.get('/matches', getSmartMatches);
router.post('/connections/request', sendConnectionRequest);
router.get('/connections/pending', getPendingRequests);
router.get('/connections', getConnections);
router.patch('/connections/:connectionId', respondToConnectionRequest);
router.get('/notifications', getNotifications);
router.patch('/notifications/read-all', markAllNotificationsRead);
router.patch('/notifications/:notificationId/read', markNotificationRead);
router.get('/messages/conversations', getConversations);
router.post('/messages/translate', translateMessage);
router.get('/messages/:userId', getConversationMessages);
router.post('/messages/:userId', sendMessage);

module.exports = router;

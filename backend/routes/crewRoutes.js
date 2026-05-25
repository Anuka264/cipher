const express = require('express');
const router = express.Router();
const {
    createCrew,
    joinCrew,
    getMyCrews,
    getCrewDashboard,
    addCrewMember,
    removeCrewMember,
    getJoinRequests,
    approveJoinRequest,
    rejectJoinRequest,
    createTask,
    updateTask,
    deleteTask,
    createEvent,
    deleteEvent,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    getCrewHistory
} = require('../controllers/crewController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/my-crews', authenticateToken, getMyCrews);
router.post('/', authenticateToken, createCrew);
router.post('/create', authenticateToken, createCrew);
router.post('/:crewId/join', authenticateToken, joinCrew);
router.post('/join/:crewId', authenticateToken, joinCrew);
router.get('/:crewId', authenticateToken, getCrewDashboard);
router.get('/:crewId/history', authenticateToken, getCrewHistory);
router.post('/:crewId/members', authenticateToken, addCrewMember);
router.delete('/:crewId/members/:memberUserId', authenticateToken, removeCrewMember);
router.get('/:crewId/join-requests', authenticateToken, getJoinRequests);
router.patch('/:crewId/join-requests/:requestId/approve', authenticateToken, approveJoinRequest);
router.patch('/:crewId/join-requests/:requestId/reject', authenticateToken, rejectJoinRequest);
router.post('/:crewId/tasks', authenticateToken, createTask);
router.patch('/:crewId/tasks/:taskId', authenticateToken, updateTask);
router.delete('/:crewId/tasks/:taskId', authenticateToken, deleteTask);
router.post('/:crewId/events', authenticateToken, createEvent);
router.delete('/:crewId/events/:eventId', authenticateToken, deleteEvent);
router.post('/:crewId/milestones', authenticateToken, createMilestone);
router.patch('/:crewId/milestones/:milestoneId', authenticateToken, updateMilestone);
router.delete('/:crewId/milestones/:milestoneId', authenticateToken, deleteMilestone);

module.exports = router;

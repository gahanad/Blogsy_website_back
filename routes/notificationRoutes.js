// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
} = require('../controllers/notificationController'); 
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getNotifications);

router.put('/:id/read', protect, markNotificationAsRead);

router.put('/read-all', protect, markAllNotificationsAsRead);

module.exports = router;
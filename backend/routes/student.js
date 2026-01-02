// Student routes
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateToken } = require('../middleware/auth');
const { requireStudent } = require('../middleware/roleAuth');

// All student routes require authentication and student role
router.use(authenticateToken);
router.use(requireStudent);

// Student endpoints
router.get('/profile', studentController.getProfile);
router.get('/grades', studentController.getGrades);
router.get('/timetable', studentController.getTimetable);
router.get('/payments', studentController.getPaymentHistory);

module.exports = router;